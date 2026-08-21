from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.trip import Trip, TripMember, ItineraryItem, Expense, Reservation, ChecklistItem, Place, TripPlace, Destination
from app.schemas.trip import TripCreate, TripUpdate, TripOut, TripDetailOut
from app.ml.cost_predictor import cost_predictor
from app.services.map_service import map_service

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("", response_model=None)
def create_trip(
    trip_in: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate route distance
    route_info = map_service.calculate_trip_route(trip_in.current_location, trip_in.destination)
    dist_km = route_info["distance_km"]

    # Calculate initial ML cost prediction
    cost_res = cost_predictor.predict(
        distance_km=dist_km,
        members=trip_in.members_count,
        days=trip_in.days_count,
        transport_mode=trip_in.transport_type,
        dining_tier=trip_in.food_budget_tier,
        current_location=trip_in.current_location,
        destination=trip_in.destination
    )

    new_trip = Trip(
        user_id=current_user.id,
        title=trip_in.title,
        destination=trip_in.destination,
        current_location=trip_in.current_location,
        start_date=trip_in.start_date,
        end_date=trip_in.end_date,
        days_count=trip_in.days_count,
        members_count=trip_in.members_count,
        budget=trip_in.budget,
        estimated_cost=cost_res["estimated_total"],
        transport_type=trip_in.transport_type,
        accommodation_type=trip_in.accommodation_type,
        food_budget_tier=trip_in.food_budget_tier,
        interests=json.dumps(trip_in.interests),
        status="active"
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    # Add Creator as Owner in TripMembers
    owner_member = TripMember(
        trip_id=new_trip.id,
        user_id=current_user.id,
        name=f"{current_user.name} (Owner)",
        email=current_user.email,
        role="OWNER",
        is_sharing_location=False
    )
    db.add(owner_member)

    # Smart Equal Time Distribution: Persist selected tourist places and build itinerary
    places_to_schedule = list(trip_in.selected_places or [])

    # If user did not manually pick tourist places, find top places exclusively for this destination
    if not places_to_schedule and trip_in.destination:
        dest_clean = trip_in.destination.strip().lower()
        from app.api.routers.places import CITY_ALIASES
        canonical_dest = CITY_ALIASES.get(dest_clean, trip_in.destination.strip())
        dest_obj = db.query(Destination).filter(Destination.name.ilike(canonical_dest)).first()
        if not dest_obj:
            dest_obj = db.query(Destination).filter(Destination.name.ilike(f"{canonical_dest}%")).first()
        if dest_obj:
            top_places = db.query(Place).filter(Place.destination_id == dest_obj.id).order_by(Place.popularity.desc()).limit(max(2, trip_in.days_count * 2)).all()
            for tp in top_places:
                places_to_schedule.append({
                    "id": tp.id,
                    "name": tp.name,
                    "latitude": tp.latitude,
                    "longitude": tp.longitude,
                    "category": tp.category,
                    "estimated_visit_hours": tp.estimated_visit_hours or 2.0
                })

    if places_to_schedule:
        num_places = len(places_to_schedule)
        num_days = max(1, trip_in.days_count)

        # Distribute places as evenly as possible across days
        days_buckets = [[] for _ in range(num_days)]
        for i, sp in enumerate(places_to_schedule):
            day_idx = i % num_days
            days_buckets[day_idx].append((i, sp))

        for day_idx, bucket in enumerate(days_buckets):
            day_num = day_idx + 1
            places_in_day = len(bucket)
            if places_in_day == 0:
                continue

            # Calculate smart equal time distribution for the day (09:00 AM to 06:00 PM sightseeing window)
            if places_in_day == 1:
                time_slots = ["10:00 AM"]
                durations = [3.0]
            elif places_in_day == 2:
                time_slots = ["09:30 AM", "02:30 PM"]
                durations = [2.5, 2.5]
            elif places_in_day == 3:
                time_slots = ["09:00 AM", "12:30 PM", "03:45 PM"]
                durations = [2.0, 2.0, 2.0]
            elif places_in_day == 4:
                time_slots = ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM"]
                durations = [1.5, 1.5, 1.5, 1.5]
            else:
                # 5 or more places in a single day -> tight schedule
                time_slots = []
                durations = []
                start_h = 8.5
                step = 8.5 / places_in_day
                for p_idx in range(places_in_day):
                    h_val = start_h + (p_idx * step)
                    h_int = int(h_val)
                    m_int = int((h_val - h_int) * 60)
                    slot_str = f"{(h_int % 12) or 12}:{m_int:02d} {'AM' if h_int < 12 else 'PM'}"
                    time_slots.append(slot_str)
                    durations.append(max(1.0, round(step * 0.7, 1)))

            prev_coords = None
            for p_order, (global_idx, sp) in enumerate(bucket):
                p_name = sp.get("name") or sp.get("place_name", "Tourist Attraction")
                p_lat = float(sp.get("latitude", 11.4102))
                p_lng = float(sp.get("longitude", 76.6950))
                p_id = sp.get("id") or sp.get("place_id")
                slot = time_slots[p_order] if p_order < len(time_slots) else "02:00 PM"
                dur = durations[p_order] if p_order < len(durations) else 2.0

                # Compute realistic transit distance and travel time from previous stop on that day
                if prev_coords:
                    dist_km = round(map_service.haversine_distance(prev_coords[0], prev_coords[1], p_lat, p_lng) * 1.25, 1)
                    transit_mins = max(10, int((dist_km / 40.0) * 60))
                else:
                    dist_km = 0.0
                    transit_mins = 0
                prev_coords = (p_lat, p_lng)

                # Add to trip_places
                tp = TripPlace(
                    trip_id=new_trip.id,
                    place_id=p_id if isinstance(p_id, int) and p_id < 1000 else None,
                    place_name=p_name,
                    latitude=p_lat,
                    longitude=p_lng,
                    visit_date=trip_in.start_date,
                    visit_time=slot,
                    notes=sp.get("category", "Selected Tourist Attraction")
                )
                db.add(tp)

                notes_text = f"Smart scheduled visit ({dur} hrs)"
                if places_in_day > 4:
                    notes_text += " • Tight schedule: keep visits focused"

                # Add corresponding itinerary item
                itin = ItineraryItem(
                    trip_id=new_trip.id,
                    day_number=day_num,
                    time_slot=slot,
                    place_id=p_id if isinstance(p_id, int) and p_id < 1000 else None,
                    custom_title=p_name,
                    activity_type="attraction",
                    duration_hours=dur,
                    distance_from_prev_km=dist_km,
                    travel_time_mins=transit_mins,
                    notes=notes_text,
                    sort_order=p_order + 1
                )
                db.add(itin)

    # Pre-populate default checklists
    default_checks = [
        ChecklistItem(trip_id=new_trip.id, category="Documents", item_text="ID cards / Passports & Tickets", is_completed=False),
        ChecklistItem(trip_id=new_trip.id, category="Packing", item_text="Warm clothing & comfortable shoes", is_completed=False),
        ChecklistItem(trip_id=new_trip.id, category="Packing", item_text="Power bank, camera & chargers", is_completed=False),
        ChecklistItem(trip_id=new_trip.id, category="To-Do", item_text="Confirm hotel check-in time", is_completed=False),
    ]
    db.add_all(default_checks)
    db.commit()


    trip_data = {
        "id": new_trip.id,
        "user_id": new_trip.user_id,
        "title": new_trip.title,
        "destination": new_trip.destination,
        "current_location": new_trip.current_location,
        "start_date": new_trip.start_date,
        "end_date": new_trip.end_date,
        "days_count": new_trip.days_count,
        "members_count": new_trip.members_count,
        "budget": new_trip.budget,
        "estimated_cost": new_trip.estimated_cost,
        "transport_type": new_trip.transport_type,
        "accommodation_type": new_trip.accommodation_type,
        "food_budget_tier": new_trip.food_budget_tier,
        "interests": json.loads(new_trip.interests or "[]"),
        "status": new_trip.status,
        "created_at": new_trip.created_at.isoformat()
    }

    return success_response(
        data=trip_data,
        message="Trip created successfully!",
        status_code=status.HTTP_201_CREATED
    )

@router.get("", response_model=None)
def get_user_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).all()
    results = []
    for t in trips:
        results.append({
            "id": t.id,
            "user_id": t.user_id,
            "title": t.title,
            "destination": t.destination,
            "current_location": t.current_location,
            "start_date": t.start_date,
            "end_date": t.end_date,
            "days_count": t.days_count,
            "members_count": t.members_count,
            "budget": t.budget,
            "estimated_cost": t.estimated_cost,
            "transport_type": t.transport_type,
            "accommodation_type": t.accommodation_type,
            "food_budget_tier": t.food_budget_tier,
            "interests": json.loads(t.interests or "[]"),
            "status": t.status,
            "created_at": t.created_at.isoformat()
        })
    return success_response(data=results, message="Trips retrieved successfully")

@router.get("/{trip_id}", response_model=None)
def get_trip_detail(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    # Permission check: User must be owner or a member of the trip
    is_owner = trip.user_id == current_user.id
    is_member = db.query(TripMember).filter(TripMember.trip_id == trip_id, TripMember.email == current_user.email).first() is not None
    if not (is_owner or is_member):
        return error_response(message="Access denied to this trip", status_code=status.HTTP_403_FORBIDDEN)

    # Load relations
    members = db.query(TripMember).filter(TripMember.trip_id == trip_id).all()
    itinerary = db.query(ItineraryItem).filter(ItineraryItem.trip_id == trip_id).order_by(ItineraryItem.day_number, ItineraryItem.sort_order).all()
    expenses = db.query(Expense).filter(Expense.trip_id == trip_id).order_by(Expense.created_at.desc()).all()
    reservations = db.query(Reservation).filter(Reservation.trip_id == trip_id).all()
    checklists = db.query(ChecklistItem).filter(ChecklistItem.trip_id == trip_id).all()

    itinerary_data = []
    for it in itinerary:
        place_obj = None
        if it.place_id:
            p = db.query(Place).filter(Place.id == it.place_id).first()
            if p:
                place_obj = {
                    "id": p.id,
                    "name": p.name,
                    "category": p.category,
                    "image_url": p.image_url,
                    "rating": p.rating,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "address": p.address
                }
        itinerary_data.append({
            "id": it.id,
            "trip_id": it.trip_id,
            "day_number": it.day_number,
            "time_slot": it.time_slot,
            "place_id": it.place_id,
            "custom_title": it.custom_title or (place_obj["name"] if place_obj else "Scheduled Stop"),
            "activity_type": it.activity_type,
            "duration_hours": it.duration_hours,
            "distance_from_prev_km": it.distance_from_prev_km,
            "travel_time_mins": it.travel_time_mins,
            "notes": it.notes,
            "sort_order": it.sort_order,
            "place": place_obj
        })

    members_data = [{
        "id": m.id,
        "trip_id": m.trip_id,
        "user_id": m.user_id,
        "name": m.name,
        "email": m.email,
        "role": m.role,
        "is_sharing_location": m.is_sharing_location,
        "last_latitude": m.last_latitude,
        "last_longitude": m.last_longitude,
        "last_location_time": m.last_location_time.isoformat() if m.last_location_time else None
    } for m in members]

    expenses_data = [{
        "id": e.id,
        "trip_id": e.trip_id,
        "user_id": e.user_id,
        "category": e.category,
        "amount": e.amount,
        "paid_by": e.paid_by,
        "date": e.date,
        "description": e.description,
        "created_at": e.created_at.isoformat()
    } for e in expenses]

    reservations_data = [{
        "id": r.id,
        "trip_id": r.trip_id,
        "type": r.type,
        "title": r.title,
        "provider": r.provider,
        "booking_reference": r.booking_reference,
        "date": r.date,
        "time": r.time,
        "address": r.address,
        "cost": r.cost,
        "notes": r.notes,
        "attachment_url": r.attachment_url,
        "created_at": r.created_at.isoformat()
    } for r in reservations]

    checklists_data = [{
        "id": c.id,
        "trip_id": c.trip_id,
        "category": c.category,
        "item_text": c.item_text,
        "is_completed": c.is_completed,
        "assigned_to": c.assigned_to,
        "created_at": c.created_at.isoformat()
    } for c in checklists]

    trip_places_rows = db.query(TripPlace).filter(TripPlace.trip_id == trip_id).all()
    trip_places_data = [{
        "id": tp.id,
        "trip_id": tp.trip_id,
        "place_id": tp.place_id,
        "place_name": tp.place_name,
        "latitude": tp.latitude,
        "longitude": tp.longitude,
        "visit_date": tp.visit_date,
        "visit_time": tp.visit_time,
        "notes": tp.notes
    } for tp in trip_places_rows]

    total_actual = sum(e.amount for e in expenses)
    data = {
        "id": trip.id,
        "user_id": trip.user_id,
        "title": trip.title,
        "destination": trip.destination,
        "current_location": trip.current_location,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "days_count": trip.days_count,
        "members_count": trip.members_count,
        "budget": trip.budget,
        "estimated_cost": trip.estimated_cost,
        "total_actual_spent": total_actual,
        "remaining_budget": trip.budget - total_actual,
        "transport_type": trip.transport_type,
        "accommodation_type": trip.accommodation_type,
        "food_budget_tier": trip.food_budget_tier,
        "interests": json.loads(trip.interests or "[]"),
        "status": trip.status,
        "created_at": trip.created_at.isoformat(),
        "members": members_data,
        "trip_places": trip_places_data,
        "itinerary_items": itinerary_data,
        "expenses": expenses_data,
        "reservations": reservations_data,
        "checklists": checklists_data
    }

    return success_response(data=data, message="Trip details retrieved")


@router.put("/{trip_id}", response_model=None)
def update_trip(
    trip_id: int,
    trip_in: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)
    if trip.user_id != current_user.id:
        return error_response(message="Only the trip owner can modify trip settings", status_code=status.HTTP_403_FORBIDDEN)

    update_dict = trip_in.model_dump(exclude_unset=True)
    if "interests" in update_dict:
        update_dict["interests"] = json.dumps(update_dict["interests"])

    for field, val in update_dict.items():
        setattr(trip, field, val)

    db.commit()
    db.refresh(trip)
    return success_response(data={"id": trip.id}, message="Trip updated successfully")

@router.delete("/{trip_id}", response_model=None)
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)
    if trip.user_id != current_user.id:
        return error_response(message="Only the owner can delete the trip", status_code=status.HTTP_403_FORBIDDEN)

    db.delete(trip)
    db.commit()
    return success_response(data={"id": trip_id}, message="Trip deleted successfully")

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.trip import Trip, ItineraryItem, Place
from app.schemas.trip import ItineraryItemCreate, ItineraryItemBase
from app.services.map_service import map_service

router = APIRouter(prefix="/itinerary", tags=["Itinerary"])

@router.post("", response_model=None)
def add_itinerary_item(
    item_in: ItineraryItemCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == item_in.trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    # Determine place title
    place_title = (item_in.custom_title or "").strip()
    place_obj = None
    if item_in.place_id:
        place_obj = db.query(Place).filter(Place.id == item_in.place_id).first()
        if place_obj and not place_title:
            place_title = place_obj.name

    # Check for duplicate entry on this trip
    existing_items = db.query(ItineraryItem).filter(ItineraryItem.trip_id == item_in.trip_id).all()
    for ex in existing_items:
        # Check by place_id
        if item_in.place_id and ex.place_id and ex.place_id == item_in.place_id:
            return error_response(
                message="This place is already in your itinerary.",
                status_code=status.HTTP_409_CONFLICT
            )
        # Check by title matching
        if place_title:
            ex_title = (ex.custom_title or "").strip().lower()
            if ex.place_id:
                ex_p = db.query(Place).filter(Place.id == ex.place_id).first()
                if ex_p and ex_p.name.strip().lower() == place_title.lower():
                    return error_response(
                        message="This place is already in your itinerary.",
                        status_code=status.HTTP_409_CONFLICT
                    )
            if ex_title and ex_title == place_title.lower():
                return error_response(
                    message="This place is already in your itinerary.",
                    status_code=status.HTTP_409_CONFLICT
                )

    # Validate day number
    day_num = item_in.day_number if item_in.day_number and item_in.day_number > 0 else 1
    if trip.days_count and day_num > trip.days_count:
        day_num = trip.days_count

    # Get max sort order for that day
    max_order = db.query(ItineraryItem).filter(
        ItineraryItem.trip_id == item_in.trip_id,
        ItineraryItem.day_number == day_num
    ).count()

    duration = item_in.duration_hours or (place_obj.estimated_visit_hours if place_obj else 2.0)

    new_item = ItineraryItem(
        trip_id=item_in.trip_id,
        day_number=day_num,
        time_slot=item_in.time_slot or "10:00 AM",
        place_id=item_in.place_id,
        custom_title=place_title or "Scheduled Attraction",
        activity_type=item_in.activity_type or "attraction",
        duration_hours=duration,
        distance_from_prev_km=item_in.distance_from_prev_km or 0.0,
        travel_time_mins=item_in.travel_time_mins or 0,
        notes=item_in.notes,
        sort_order=max_order + 1
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return success_response(
        data={
            "id": new_item.id,
            "trip_id": new_item.trip_id,
            "place_id": new_item.place_id,
            "day_number": new_item.day_number,
            "custom_title": new_item.custom_title,
            "duration_hours": new_item.duration_hours,
            "time_slot": new_item.time_slot
        },
        message=f"{place_title or 'Place'} added to your itinerary.",
        status_code=status.HTTP_201_CREATED
    )

@router.get("/{trip_id}", response_model=None)
def get_trip_itinerary(
    trip_id: int,
    db: Session = Depends(get_db)
):
    items = db.query(ItineraryItem).filter(ItineraryItem.trip_id == trip_id).order_by(
        ItineraryItem.day_number, ItineraryItem.sort_order
    ).all()

    results = []
    for it in items:
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
        results.append({
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

    return success_response(data=results, message="Itinerary items retrieved")

@router.delete("/{item_id}", response_model=None)
def delete_itinerary_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ItineraryItem).filter(ItineraryItem.id == item_id).first()
    if not item:
        return error_response(message="Item not found", status_code=status.HTTP_404_NOT_FOUND)

    db.delete(item)
    db.commit()
    return success_response(data={"id": item_id}, message="Activity removed from itinerary")

@router.post("/{trip_id}/optimize-day/{day_number}", response_model=None)
def optimize_day_route(
    trip_id: int,
    day_number: int,
    db: Session = Depends(get_db)
):
    """Geographically optimizes the stop sequence of a specific day to minimize driving time."""
    items = db.query(ItineraryItem).filter(
        ItineraryItem.trip_id == trip_id,
        ItineraryItem.day_number == day_number
    ).all()

    if not items or len(items) <= 1:
        return success_response(data=[], message="Not enough items to optimize")

    item_dicts = []
    for it in items:
        lat, lng = 11.4102, 76.6950
        if it.place_id:
            p = db.query(Place).filter(Place.id == it.place_id).first()
            if p:
                lat, lng = p.latitude, p.longitude
        item_dicts.append({
            "id": it.id,
            "activity_type": it.activity_type,
            "custom_title": it.custom_title,
            "latitude": lat,
            "longitude": lng,
            "obj": it
        })

    optimized = map_service.optimize_itinerary_sequence(item_dicts)
    for idx, o in enumerate(optimized):
        db_it = o["obj"]
        db_it.sort_order = idx + 1
        db_it.time_slot = o.get("time_slot", db_it.time_slot)
        db_it.distance_from_prev_km = o.get("distance_from_prev_km", 0.0)
        db_it.travel_time_mins = o.get("travel_time_mins", 0)

    db.commit()
    return success_response(data={"day_number": day_number}, message="Day itinerary sequence optimized geographically!")

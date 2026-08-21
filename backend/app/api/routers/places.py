from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import re

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.models.trip import Place, Destination, SavedPlace
from app.api.deps import get_optional_current_user, get_current_user
from app.models.user import User
from app.services.places_service import places_service
from app.services.map_service import map_service

router = APIRouter(prefix="/places", tags=["Places & Attractions"])

CITY_ALIASES = {
    "kanyakumari": "Kanyakumari",
    "kaniyakumari": "Kanyakumari",
    "cape comorin": "Kanyakumari",
    "mysuru": "Mysore",
    "mysore": "Mysore",
    "bengaluru": "Bangalore",
    "bangalore": "Bangalore",
    "trichy": "Tiruchirappalli",
    "tiruchirappalli": "Tiruchirappalli",
    "tiruchirapalli": "Tiruchirappalli",
    "kovai": "Coimbatore",
    "coimbatore": "Coimbatore",
    "ooty": "Ooty",
    "udhagamandalam": "Ooty",
    "ootacamund": "Ooty",
    "munnar": "Munnar",
    "trivandrum": "Thiruvananthapuram",
    "thiruvananthapuram": "Thiruvananthapuram",
    "calcutta": "Kolkata",
    "kolkata": "Kolkata",
    "bombay": "Mumbai",
    "mumbai": "Mumbai",
    "madras": "Chennai",
    "chennai": "Chennai",
    "jaipur": "Jaipur",
    "coorg": "Coorg",
    "madikeri": "Coorg",
    "kodagu": "Coorg",
    "salem": "Salem",
    "madurai": "Madurai",
    "thanjavur": "Thanjavur",
    "tanjore": "Thanjavur",
    "tirunelveli": "Tirunelveli",
    "kodaikanal": "Kodaikanal",
    "kodai": "Kodaikanal",
    "rameshwaram": "Ramanathapuram",
    "rameswaram": "Ramanathapuram",
    "ramanathapuram": "Ramanathapuram",
    "vellore": "Vellore",
    "mahabalipuram": "Mahabalipuram",
    "mamallapuram": "Mahabalipuram",
    "erode": "Erode",
    "dharmapuri": "Dharmapuri",
    "theni": "Theni",
    "dindigul": "Dindigul",
    "namakkal": "Namakkal",
    "krishnagiri": "Krishnagiri",
    "nagapattinam": "Nagapattinam",
    "pudukkottai": "Pudukkottai",
    "sivaganga": "Sivaganga",
    "tiruppur": "Tiruppur",
    "tirupur": "Tiruppur",
    "virudhunagar": "Virudhunagar",
    "thoothukudi": "Thoothukudi",
    "tuticorin": "Thoothukudi",
    "cuddalore": "Cuddalore",
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "paris": "Paris",
    "london": "London",
    "tokyo": "Tokyo",
    "dubai": "Dubai",
    "rome": "Rome",
    "new york": "New York",
    "manali": "Manali",
    "shimla": "Shimla",
    "dharamshala": "Dharamshala",
    "palakkad": "Palakkad",
    "valparai": "Valparai",
    "coonoor": "Coonoor"
}

def normalize_city_name(raw_city: str) -> str:
    """Normalizes input city name, strips punctuation/country suffixes, and maps aliases."""
    if not raw_city:
        return ""
    base = raw_city.split(',')[0].strip()
    norm_key = re.sub(r'[^a-z0-9 ]', '', base.lower()).strip()
    return CITY_ALIASES.get(norm_key, base)

@router.get("/autocomplete", response_model=None)
def autocomplete_places(
    q: Optional[str] = Query(None, description="Search query prefix or keyword"),
    query: Optional[str] = Query(None, description="Alternative query param"),
    limit: int = Query(10, description="Max suggestions to return"),
    db: Session = Depends(get_db)
):
    raw_query = (q or query or "").strip()
    if not raw_query:
        popular_dests = db.query(Destination).order_by(Destination.popularity.desc()).limit(limit).all()
        return success_response(data=[{
            "id": d.id,
            "title": d.name,
            "subtitle": f"{d.state}, {d.country} • Destination",
            "type": "city",
            "category": "Destination",
            "name": d.name,
            "state": d.state,
            "country": d.country,
            "latitude": d.latitude,
            "longitude": d.longitude
        } for d in popular_dests], message="Popular suggestions retrieved")

    term = raw_query.lower()
    results = []
    seen = set()

    SUGGESTION_SHORTCUTS = {
        "com": ["Coimbatore", "Coonoor"],
        "coi": ["Coimbatore"],
        "coo": ["Coonoor", "Coorg"],
        "cov": ["Coimbatore"],
        "kov": ["Coimbatore"],
        "oot": ["Ooty"],
        "kan": ["Kanyakumari"],
        "che": ["Chennai"],
        "mad": ["Madurai"],
        "tri": ["Tiruchirappalli", "Tirunelveli", "Tiruppur"],
        "kod": ["Kodaikanal"],
        "sal": ["Salem"],
        "tha": ["Thanjavur"],
        "vel": ["Vellore"],
        "ram": ["Ramanathapuram"],
        "mun": ["Munnar"],
        "pal": ["Palakkad"],
        "val": ["Valparai"]
    }

    # 0. Check suggestion shortcuts for common search prefixes
    shortcut_dests = []
    for k, dest_names in SUGGESTION_SHORTCUTS.items():
        if term == k or term.startswith(k) or k.startswith(term):
            for dn in dest_names:
                d_obj = db.query(Destination).filter(Destination.name.ilike(dn)).first()
                if d_obj:
                    shortcut_dests.append(d_obj)

    for d in shortcut_dests:
        key = ("city", d.name.lower())
        if key not in seen:
            seen.add(key)
            results.append({
                "id": d.id,
                "title": d.name,
                "subtitle": f"{d.state}, {d.country} • Destination",
                "type": "city",
                "category": "Destination",
                "name": d.name,
                "state": d.state,
                "country": d.country,
                "latitude": d.latitude,
                "longitude": d.longitude
            })

    # 1. Search Destinations (Prefix first, then contains)
    prefix_dests = db.query(Destination).filter(Destination.name.ilike(f"{term}%")).all()
    for d in prefix_dests:
        key = ("city", d.name.lower())
        if key not in seen:
            seen.add(key)
            results.append({
                "id": d.id,
                "title": d.name,
                "subtitle": f"{d.state}, {d.country} • Destination",
                "type": "city",
                "category": "Destination",
                "name": d.name,
                "state": d.state,
                "country": d.country,
                "latitude": d.latitude,
                "longitude": d.longitude
            })

    contains_dests = db.query(Destination).filter(
        (Destination.name.ilike(f"%{term}%")) |
        (Destination.state.ilike(f"%{term}%")) |
        (Destination.tags.ilike(f"%{term}%"))
    ).all()
    for d in contains_dests:
        key = ("city", d.name.lower())
        if key not in seen:
            seen.add(key)
            results.append({
                "id": d.id,
                "title": d.name,
                "subtitle": f"{d.state}, {d.country} • Destination",
                "type": "city",
                "category": "Destination",
                "name": d.name,
                "state": d.state,
                "country": d.country,
                "latitude": d.latitude,
                "longitude": d.longitude
            })

    # 2. Search Tourist Places (Prefix first, then contains)
    prefix_places = db.query(Place).filter(Place.name.ilike(f"{term}%")).limit(limit).all()
    for p in prefix_places:
        key = ("place", p.name.lower())
        if key not in seen:
            seen.add(key)
            dest = db.query(Destination).filter(Destination.id == p.destination_id).first()
            dest_name = dest.name if dest else "Tamil Nadu"
            results.append({
                "id": p.id,
                "title": p.name,
                "subtitle": f"{dest_name} • {p.category or 'Tourist Attraction'}",
                "type": "place",
                "category": p.category or "Attraction",
                "name": p.name,
                "destination_name": dest_name,
                "latitude": p.latitude,
                "longitude": p.longitude
            })

    contains_places = db.query(Place).filter(
        (Place.name.ilike(f"%{term}%")) |
        (Place.category.ilike(f"%{term}%"))
    ).limit(limit).all()
    for p in contains_places:
        key = ("place", p.name.lower())
        if key not in seen:
            seen.add(key)
            dest = db.query(Destination).filter(Destination.id == p.destination_id).first()
            dest_name = dest.name if dest else "Tamil Nadu"
            results.append({
                "id": p.id,
                "title": p.name,
                "subtitle": f"{dest_name} • {p.category or 'Tourist Attraction'}",
                "type": "place",
                "category": p.category or "Attraction",
                "name": p.name,
                "destination_name": dest_name,
                "latitude": p.latitude,
                "longitude": p.longitude
            })

    return success_response(data=results[:limit], message="Autocomplete suggestions retrieved")

@router.get("/search", response_model=None)
async def search_places(
    query: Optional[str] = None,
    destination: Optional[str] = None,
    destination_id: Optional[int] = None,
    category: Optional[str] = None,
    is_indoor: Optional[bool] = None,
    origin: Optional[str] = None,
    origin_lat: Optional[float] = None,
    origin_lng: Optional[float] = None,
    filter_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        results = []
        clean_query = query.strip() if isinstance(query, str) and query.strip() else None
        clean_dest = destination.strip() if isinstance(destination, str) and destination.strip() else None
        clean_cat = category.strip().lower() if isinstance(category, str) and category.strip() else None
        clean_orig = origin.strip() if isinstance(origin, str) and origin.strip() else None
        clean_filter = filter_type.strip().lower() if isinstance(filter_type, str) and filter_type.strip() else "all"

        # 1. Resolve destination matching if destination is specified
        if clean_dest:
            canonical_dest = normalize_city_name(clean_dest)
            dest_lower = canonical_dest.lower()

            # Search destination strictly in database
            dest_obj = db.query(Destination).filter(Destination.name.ilike(canonical_dest)).first()
            if not dest_obj:
                dest_obj = db.query(Destination).filter(Destination.name.ilike(f"{canonical_dest}%")).first()
            if not dest_obj:
                dest_obj = db.query(Destination).filter(Destination.name.ilike(f"%{canonical_dest}%")).first()

            if dest_obj:
                q = db.query(Place).filter(Place.destination_id == dest_obj.id)
                
                # Apply Category / Interest / Filter
                target_cat = clean_cat
                if clean_filter in ["nature", "history", "culture", "adventure", "indoor", "outdoor"]:
                    if clean_filter == "indoor":
                        q = q.filter(Place.is_indoor == True)
                    elif clean_filter == "outdoor":
                        q = q.filter(Place.is_indoor == False)
                    else:
                        target_cat = clean_filter

                if target_cat:
                    q = q.filter(Place.category.ilike(f"%{target_cat}%"))
                
                if isinstance(is_indoor, bool):
                    q = q.filter(Place.is_indoor == is_indoor)
                
                if clean_query:
                    term = f"%{clean_query}%"
                    q = q.filter(
                        (Place.name.ilike(term)) |
                        (Place.description.ilike(term)) |
                        (Place.category.ilike(term)) |
                        (Place.address.ilike(term))
                    )

                db_places = q.order_by(Place.popularity.desc()).all()
                seen_names = set()
                for p in db_places:
                    p_name_lower = p.name.strip().lower()
                    if p_name_lower in seen_names:
                        continue
                    seen_names.add(p_name_lower)

                    item = {
                        "id": p.id,
                        "destination_id": p.destination_id,
                        "destination_name": dest_obj.name,
                        "name": p.name,
                        "category": p.category,
                        "description": p.description,
                        "rating": p.rating,
                        "popularity": p.popularity,
                        "latitude": p.latitude,
                        "longitude": p.longitude,
                        "image_url": p.image_url,
                        "address": p.address,
                        "opening_hours": p.opening_hours,
                        "estimated_visit_hours": p.estimated_visit_hours,
                        "estimated_cost": p.estimated_cost,
                        "is_indoor": p.is_indoor,
                        "nature_score": p.nature_score,
                        "adventure_score": p.adventure_score,
                        "history_score": p.history_score,
                        "beach_score": p.beach_score,
                        "wildlife_score": p.wildlife_score,
                        "culture_score": p.culture_score,
                        "food_score": p.food_score,
                        "photography_score": p.photography_score,
                        "family_score": p.family_score,
                    }
                    results.append(item)
            else:
                # Destination specified but not yet in DB, try places_service strictly for that destination
                service_places = await places_service.fetch_places_for_destination(
                    destination=canonical_dest,
                    origin_lat=origin_lat if isinstance(origin_lat, (int, float)) else None,
                    origin_lng=origin_lng if isinstance(origin_lng, (int, float)) else None,
                    origin_name=clean_orig
                )
                for sp in service_places:
                    results.append(sp)

        elif destination_id and destination_id > 0:
            dest_obj = db.query(Destination).filter(Destination.id == destination_id).first()
            q = db.query(Place).filter(Place.destination_id == destination_id)
            if clean_cat:
                q = q.filter(Place.category.ilike(f"%{clean_cat}%"))
            if isinstance(is_indoor, bool):
                q = q.filter(Place.is_indoor == is_indoor)
            db_places = q.order_by(Place.popularity.desc()).all()
            seen_names = set()
            for p in db_places:
                p_name_lower = p.name.strip().lower()
                if p_name_lower in seen_names:
                    continue
                seen_names.add(p_name_lower)
                results.append({
                    "id": p.id,
                    "destination_id": p.destination_id,
                    "destination_name": dest_obj.name if dest_obj else "",
                    "name": p.name,
                    "category": p.category,
                    "description": p.description,
                    "rating": p.rating,
                    "popularity": p.popularity,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "image_url": p.image_url,
                    "address": p.address,
                    "opening_hours": p.opening_hours,
                    "estimated_visit_hours": p.estimated_visit_hours,
                    "estimated_cost": p.estimated_cost,
                    "is_indoor": p.is_indoor,
                    "nature_score": p.nature_score,
                    "adventure_score": p.adventure_score,
                    "history_score": p.history_score,
                    "beach_score": p.beach_score,
                    "wildlife_score": p.wildlife_score,
                    "culture_score": p.culture_score,
                    "food_score": p.food_score,
                    "photography_score": p.photography_score,
                    "family_score": p.family_score,
                })

        elif clean_query or clean_filter:
            # Global search across places when no destination is specified
            q = db.query(Place)
            if clean_query:
                term = f"%{clean_query}%"
                q = q.filter(
                    (Place.name.ilike(term)) |
                    (Place.description.ilike(term)) |
                    (Place.category.ilike(term)) |
                    (Place.address.ilike(term))
                )
            
            target_cat = clean_cat
            if clean_filter in ["nature", "history", "culture", "adventure", "indoor", "outdoor"]:
                if clean_filter == "indoor":
                    q = q.filter(Place.is_indoor == True)
                elif clean_filter == "outdoor":
                    q = q.filter(Place.is_indoor == False)
                else:
                    target_cat = clean_filter

            if target_cat:
                q = q.filter(Place.category.ilike(f"%{target_cat}%"))

            db_places = q.order_by(Place.popularity.desc()).limit(100).all()
            seen_names = set()
            for p in db_places:
                p_name_lower = p.name.strip().lower()
                if p_name_lower in seen_names:
                    continue
                seen_names.add(p_name_lower)
                dest_name = p.destination.name if p.destination else ""
                results.append({
                    "id": p.id,
                    "destination_id": p.destination_id,
                    "destination_name": dest_name,
                    "name": p.name,
                    "category": p.category,
                    "description": p.description,
                    "rating": p.rating,
                    "popularity": p.popularity,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "image_url": p.image_url,
                    "address": p.address,
                    "opening_hours": p.opening_hours,
                    "estimated_visit_hours": p.estimated_visit_hours,
                    "estimated_cost": p.estimated_cost,
                    "is_indoor": p.is_indoor,
                    "nature_score": p.nature_score,
                    "adventure_score": p.adventure_score,
                    "history_score": p.history_score,
                    "beach_score": p.beach_score,
                    "wildlife_score": p.wildlife_score,
                    "culture_score": p.culture_score,
                    "food_score": p.food_score,
                    "photography_score": p.photography_score,
                    "family_score": p.family_score,
                })

        # Calculate distance from origin if origin provided
        o_lat = origin_lat if isinstance(origin_lat, (int, float)) else None
        o_lng = origin_lng if isinstance(origin_lng, (int, float)) else None
        if (o_lat is None or o_lng is None) and clean_orig:
            c = map_service.get_city_coords(clean_orig)
            o_lat, o_lng = c[0], c[1]

        if o_lat is not None and o_lng is not None:
            for item in results:
                if "distance_from_origin_km" not in item and "latitude" in item and "longitude" in item:
                    dist = map_service.haversine_distance(o_lat, o_lng, item["latitude"], item["longitude"])
                    item["distance_from_origin_km"] = round(dist * 1.2, 1)

        msg = "Places retrieved successfully" if results else "No tourist places found for this destination."
        return success_response(data=results, message=msg)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(message="Unable to load tourist places right now.", status_code=500)

@router.get("/destination", response_model=None)
async def get_places_by_destination(
    destination: str = Query(..., description="Destination city name e.g. Kanyakumari, Ooty, Munnar, Paris"),
    origin: Optional[str] = None,
    origin_lat: Optional[float] = None,
    origin_lng: Optional[float] = None,
    filter_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Direct destination tourist attractions retrieval for Create Trip and Explore sights."""
    return await search_places(
        destination=destination,
        origin=origin,
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        filter_type=filter_type,
        db=db
    )

@router.get("/{place_id}/directions", response_model=None)
def get_place_directions(
    place_id: int,
    origin: Optional[str] = "Chennai",
    origin_lat: Optional[float] = None,
    origin_lng: Optional[float] = None,
    db: Session = Depends(get_db)
):
    try:
        place = db.query(Place).filter(Place.id == place_id).first()
        dest_name = place.name if place else f"Tourist Attraction #{place_id}"
        dest_lat = place.latitude if place else 11.4078
        dest_lng = place.longitude if place else 76.6883

        if isinstance(origin_lat, (int, float)) and isinstance(origin_lng, (int, float)):
            orig_c = (origin_lat, origin_lng)
            orig_name = origin if isinstance(origin, str) else f"{origin_lat:.4f}° N, {origin_lng:.4f}° E"
        else:
            orig_name = origin if isinstance(origin, str) and origin else "Current Location"
            orig_c = map_service.get_city_coords(orig_name)

        direct_dist = map_service.haversine_distance(orig_c[0], orig_c[1], dest_lat, dest_lng)
        road_distance = round(direct_dist * 1.25, 1)

        avg_speed = 50.0  # km/h
        hours = road_distance / avg_speed
        hrs_int = int(hours)
        mins_int = int((hours - hrs_int) * 60)

        mid_lat = (orig_c[0] + dest_lat) / 2.0
        mid_lng = (orig_c[1] + dest_lng) / 2.0

        waypoints = [
            {"name": orig_name.title(), "lat": orig_c[0], "lng": orig_c[1], "type": "origin"},
            {"name": "Transit Route Waypoint", "lat": mid_lat, "lng": mid_lng, "type": "waypoint"},
            {"name": dest_name, "lat": dest_lat, "lng": dest_lng, "type": "destination"}
        ]

        google_maps_url = f"https://www.google.com/maps/dir/?api=1&origin={orig_c[0]},{orig_c[1]}&destination={dest_lat},{dest_lng}&travelmode=driving"

        return success_response(
            data={
                "origin": orig_name.title(),
                "destination": dest_name,
                "origin_coords": {"lat": orig_c[0], "lng": orig_c[1]},
                "destination_coords": {"lat": dest_lat, "lng": dest_lng},
                "distance_km": road_distance,
                "duration_formatted": f"{hrs_int}h {mins_int}m" if hrs_int > 0 else f"{mins_int}m",
                "travel_mode": "Driving / Road Transit",
                "waypoints": waypoints,
                "google_maps_url": google_maps_url,
                "place": {
                    "id": place_id,
                    "name": dest_name,
                    "latitude": dest_lat,
                    "longitude": dest_lng,
                    "address": place.address if place else "",
                    "category": place.category if place else "Tourist Attraction"
                }
            },
            message="Directions calculated successfully"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return error_response(message="Unable to calculate route directions right now.", status_code=500)

@router.get("/{place_id}", response_model=None)
def get_place_detail(place_id: int, db: Session = Depends(get_db)):
    p = db.query(Place).filter(Place.id == place_id).first()
    if not p:
        return error_response(message="Place not found", status_code=status.HTTP_404_NOT_FOUND)

    dest_name = p.destination.name if p.destination else ""
    data = {
        "id": p.id,
        "destination_id": p.destination_id,
        "destination_name": dest_name,
        "name": p.name,
        "category": p.category,
        "description": p.description,
        "rating": p.rating,
        "popularity": p.popularity,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "image_url": p.image_url,
        "address": p.address,
        "opening_hours": p.opening_hours,
        "estimated_visit_hours": p.estimated_visit_hours,
        "estimated_cost": p.estimated_cost,
        "is_indoor": p.is_indoor,
        "nature_score": p.nature_score,
        "adventure_score": p.adventure_score,
        "history_score": p.history_score,
        "beach_score": p.beach_score,
        "wildlife_score": p.wildlife_score,
        "culture_score": p.culture_score,
        "food_score": p.food_score,
        "photography_score": p.photography_score,
        "family_score": p.family_score,
    }
    return success_response(data=data, message="Place details retrieved")

@router.post("/{place_id}/save", response_model=None)
def toggle_save_place(
    place_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved = db.query(SavedPlace).filter(SavedPlace.user_id == current_user.id, SavedPlace.place_id == place_id).first()
    if saved:
        db.delete(saved)
        db.commit()
        return success_response(data={"saved": False}, message="Place removed from saved collection")
    else:
        new_saved = SavedPlace(user_id=current_user.id, place_id=place_id)
        db.add(new_saved)
        db.commit()
        return success_response(data={"saved": True}, message="Place saved to your profile collection")

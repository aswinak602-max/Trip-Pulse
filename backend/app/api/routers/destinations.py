from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.models.trip import Destination, Place

router = APIRouter(prefix="/destinations", tags=["Destinations"])

@router.get("/autocomplete", response_model=None)
def autocomplete_destinations(
    q: Optional[str] = Query(None, description="Search query prefix or keyword"),
    query: Optional[str] = Query(None, description="Alternative query param"),
    limit: int = Query(10, description="Max suggestions to return"),
    db: Session = Depends(get_db)
):
    raw_query = (q or query or "").strip()
    term = raw_query.lower()
    results = []
    seen = set()

    if not term:
        dests = db.query(Destination).order_by(Destination.popularity.desc()).limit(limit).all()
        return success_response(data=[{
            "id": d.id,
            "title": d.name,
            "subtitle": f"{d.state}, {d.country} • Destination",
            "type": "city",
            "category": "Destination",
            "name": d.name,
            "state": d.state,
            "country": d.country
        } for d in dests], message="Popular destinations retrieved")

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

    # 1. Prefix matches on Destination
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

    # 2. Substring matches on Destination
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

    # 3. Places matches
    places = db.query(Place).filter(
        (Place.name.ilike(f"{term}%")) |
        (Place.name.ilike(f"%{term}%"))
    ).limit(limit).all()
    for p in places:
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

@router.get("", response_model=None)
@router.get("/", response_model=None)
@router.get("/search", response_model=None)
def search_destinations(
    query: Optional[str] = Query(None, description="Search by destination name, country, or tag"),
    search: Optional[str] = Query(None, description="Alternative parameter for search"),
    filter_type: Optional[str] = Query("all", alias="filter", description="Filter category: all, cities, places, attractions, famous"),
    db: Session = Depends(get_db)
):
    q = db.query(Destination)
    clean_filter = (filter_type or "all").strip().lower()
    effective_query = query or search

    if effective_query and effective_query.strip():
        term = f"%{effective_query.strip()}%"
        q = q.filter(
            (Destination.name.ilike(term)) |
            (Destination.country.ilike(term)) |
            (Destination.state.ilike(term)) |
            (Destination.tags.ilike(term))
        )
    destinations = q.all()
    results = []
    for d in destinations:
        p_count = db.query(Place).filter(Place.destination_id == d.id).count()
        results.append({
            "id": d.id,
            "name": d.name,
            "country": d.country,
            "state": d.state,
            "description": d.description,
            "hero_image": d.hero_image,
            "best_time": d.best_time,
            "latitude": d.latitude,
            "longitude": d.longitude,
            "popularity": d.popularity,
            "tags": d.tags,
            "places_count": p_count,
            "type": "city"
        })
    return success_response(data=results, message="Destinations retrieved successfully")

@router.get("/{destination_id}", response_model=None)
def get_destination_detail(
    destination_id: int,
    db: Session = Depends(get_db)
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        return error_response(message="Destination not found", status_code=status.HTTP_404_NOT_FOUND)

    places = db.query(Place).filter(Place.destination_id == dest.id).all()
    places_data = [{
        "id": p.id,
        "destination_id": p.destination_id,
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
    } for p in places]

    data = {
        "id": dest.id,
        "name": dest.name,
        "country": dest.country,
        "state": dest.state,
        "description": dest.description,
        "hero_image": dest.hero_image,
        "best_time": dest.best_time,
        "latitude": dest.latitude,
        "longitude": dest.longitude,
        "popularity": dest.popularity,
        "tags": dest.tags,
        "places": places_data
    }
    return success_response(data=data, message="Destination details retrieved")

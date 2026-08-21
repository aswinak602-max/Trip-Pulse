from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.services.weather_service import weather_service
from app.models.trip import Destination, Place

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("", response_model=None)
async def get_weather(
    city: str = Query("Ooty", description="Destination city name"),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        weather_data = await weather_service.get_weather(city=city, lat=lat, lon=lon)
        
        # Query indoor alternatives in case of bad weather or for weather engine
        dest = db.query(Destination).filter(Destination.name.ilike(f"%{city.strip()}%")).first()
        indoor_places = []
        if dest:
            places = db.query(Place).filter(Place.destination_id == dest.id, Place.is_indoor == True).all()
            indoor_places = [{
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "description": p.description,
                "rating": p.rating,
                "image_url": p.image_url,
                "opening_hours": p.opening_hours,
                "is_indoor": True
            } for p in places]

        weather_data["indoor_alternatives"] = indoor_places
        return success_response(data=weather_data, message="Weather data retrieved")
    except Exception as e:
        return error_response(
            message=f"Weather information is currently unavailable: {str(e)}",
            status_code=500
        )

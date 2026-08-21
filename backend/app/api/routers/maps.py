from fastapi import APIRouter, Query
from typing import Optional
from app.core.response import success_response, error_response
from app.services.map_service import map_service

router = APIRouter(prefix="/maps", tags=["Maps & Directions"])

@router.api_route("/directions", methods=["GET", "POST"], response_model=None)
def get_directions(
    origin: str = Query(..., description="Starting city or coordinates"),
    destination: str = Query(..., description="Destination city, attraction, or coordinates")
):
    try:
        route_info = map_service.calculate_trip_route(origin, destination)
        c1 = map_service.get_city_coords(origin)
        c2 = map_service.get_city_coords(destination)

        route_info["origin_coords"] = {"lat": c1[0], "lng": c1[1]}
        route_info["destination_coords"] = {"lat": c2[0], "lng": c2[1]}
        route_info["travel_mode"] = "Driving / Road Transit"
        if not route_info.get("google_maps_url"):
            route_info["google_maps_url"] = f"https://www.google.com/maps/dir/?api=1&origin={c1[0]},{c1[1]}&destination={c2[0]},{c2[1]}&travelmode=driving"

        return success_response(data=route_info, message="Route calculated successfully")
    except ValueError as ve:
        return error_response(message=str(ve), status_code=400)
    except Exception as e:
        return error_response(message=f"Unable to calculate route: {str(e)}", status_code=500)

@router.get("/nearby", response_model=None)
def get_nearby_facilities(
    lat: float = Query(11.4102),
    lng: float = Query(76.6950),
    category: str = Query("Restaurants", description="Restaurants, Hotels, Hospitals, Fuel Stations, ATMs")
):
    facilities = map_service.get_nearby_facilities(lat, lng, category)
    return success_response(
        data={"category": category, "facilities": facilities},
        message="Nearby facilities retrieved"
    )

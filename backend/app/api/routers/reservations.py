import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

from app.core.database import get_db
from app.core.config import settings
from app.core.response import success_response, error_response
from app.api.deps import get_current_user
from app.models.user import User
from app.models.trip import Trip, Reservation, Attachment
from app.schemas.trip import ReservationCreate

router = APIRouter(prefix="/reservations", tags=["Reservations & Booking Providers"])

# Verified Official Booking Providers Matrix for Worldwide Destinations
OFFICIAL_PROVIDERS: Dict[str, List[Dict[str, Any]]] = {
    "hotels": [
        {
            "name": "Booking.com",
            "type": "Hotels",
            "official_url": "https://www.booking.com",
            "description": "Global hotel and resort reservations with verified traveler reviews, flexible cancellation, and instant confirmation.",
            "rating": 4.8,
            "badge": "Verified Global Partner"
        },
        {
            "name": "Agoda",
            "type": "Hotels",
            "official_url": "https://www.agoda.com",
            "description": "Best price guarantee on boutique stays, mountain cottages, luxury resorts, and apartments worldwide.",
            "rating": 4.7,
            "badge": "Official Partner"
        },
        {
            "name": "MakeMyTrip Hotels",
            "type": "Hotels",
            "official_url": "https://www.makemytrip.com/hotels",
            "description": "Curated Indian and international hotel bookings with exclusive discounts, homestays, and 24/7 support.",
            "rating": 4.6,
            "badge": "Verified Partner"
        },
        {
            "name": "Expedia",
            "type": "Hotels",
            "official_url": "https://www.expedia.com",
            "description": "Comprehensive travel packages, hotel comparisons, and member price discounts.",
            "rating": 4.6,
            "badge": "Official Partner"
        }
    ],
    "dining": [
        {
            "name": "OpenTable",
            "type": "Dining",
            "official_url": "https://www.opentable.com",
            "description": "Global restaurant reservations, table bookings, chef tasting menus, and verified diner reviews.",
            "rating": 4.8,
            "badge": "Official Dining Network"
        },
        {
            "name": "Zomato Dining",
            "type": "Dining",
            "official_url": "https://www.zomato.com",
            "description": "Discover top-rated restaurants, book tables, view menus, and access exclusive dining privileges.",
            "rating": 4.7,
            "badge": "Official Partner"
        },
        {
            "name": "EazyDiner",
            "type": "Dining",
            "official_url": "https://www.eazydiner.com",
            "description": "Instant table reservations with guaranteed discounts at premium dining destinations and cafes.",
            "rating": 4.6,
            "badge": "Verified Network"
        },
        {
            "name": "TripAdvisor Restaurants",
            "type": "Dining",
            "official_url": "https://www.tripadvisor.com/Restaurants",
            "description": "Explore top culinary spots, authentic local cuisines, and direct table booking links worldwide.",
            "rating": 4.6,
            "badge": "Official Partner"
        }
    ],
    "flights": [
        {
            "name": "Google Flights",
            "type": "Flights",
            "official_url": "https://www.google.com/travel/flights",
            "description": "Real-time airline route comparison, fare tracking, carbon emission insights, and direct airline bookings.",
            "rating": 4.9,
            "badge": "Official Engine"
        },
        {
            "name": "Skyscanner",
            "type": "Flights",
            "official_url": "https://www.skyscanner.com",
            "description": "Compares millions of domestic and international flights from all airlines with zero hidden fees.",
            "rating": 4.8,
            "badge": "Verified Aggregator"
        },
        {
            "name": "MakeMyTrip Flights",
            "type": "Flights",
            "official_url": "https://www.makemytrip.com/flights",
            "description": "Instant domestic and international flight ticket bookings with web check-in support and baggage assistance.",
            "rating": 4.7,
            "badge": "Official Partner"
        }
    ],
    "trains": [
        {
            "name": "IRCTC Official Portal",
            "type": "Trains",
            "official_url": "https://www.irctc.co.in",
            "description": "Official Indian Railways ticket booking portal for Express, Vande Bharat, Shatabdi, and Nilgiri Mountain Railway (Toy Train).",
            "rating": 4.7,
            "badge": "Official Govt Portal"
        },
        {
            "name": "Trainline",
            "type": "Trains",
            "official_url": "https://www.thetrainline.com",
            "description": "Official rail bookings across the UK, Europe, and international high-speed rail networks.",
            "rating": 4.8,
            "badge": "Official European Rail"
        },
        {
            "name": "RailYatri",
            "type": "Trains",
            "official_url": "https://www.railyatri.in",
            "description": "Live train tracking, PNR status confirmation predictions, and Tatkal/AC ticket reservations.",
            "rating": 4.5,
            "badge": "Verified Service"
        },
        {
            "name": "Amtrak Official",
            "type": "Trains",
            "official_url": "https://www.amtrak.com",
            "description": "Official passenger rail service across the United States and Canada.",
            "rating": 4.6,
            "badge": "Official Provider"
        }
    ],
    "bus": [
        {
            "name": "RedBus",
            "type": "Bus",
            "official_url": "https://www.redbus.in",
            "description": "India's largest online bus ticketing platform with 3,500+ bus operators, sleeper AC coaches, and GPS tracking.",
            "rating": 4.8,
            "badge": "Official Bus Network"
        },
        {
            "name": "AbhiBus",
            "type": "Bus",
            "official_url": "https://www.abhibus.com",
            "description": "Fast bus ticket reservations for state road transport (KSRTC, SETC, APSRTC) and private luxury coaches.",
            "rating": 4.6,
            "badge": "Verified Partner"
        },
        {
            "name": "FlixBus",
            "type": "Bus",
            "official_url": "https://www.flixbus.com",
            "description": "Convenient and eco-friendly long-distance intercity bus travel across Europe, the US, and India.",
            "rating": 4.7,
            "badge": "Official Partner"
        }
    ],
    "rental cars": [
        {
            "name": "Zoomcar",
            "type": "Rental Cars",
            "official_url": "https://www.zoomcar.com",
            "description": "Self-drive car rentals with keyless access, 24/7 roadside assistance, and flexible hourly or daily packages.",
            "rating": 4.6,
            "badge": "Verified Self-Drive"
        },
        {
            "name": "Avis India & Global",
            "type": "Rental Cars",
            "official_url": "https://www.avis.com",
            "description": "Premium chauffeur-driven and self-drive cars, SUVs, and luxury fleet at airports and city centers.",
            "rating": 4.7,
            "badge": "Official Provider"
        },
        {
            "name": "Hertz Car Rental",
            "type": "Rental Cars",
            "official_url": "https://www.hertz.com",
            "description": "Worldwide car rental services with guaranteed vehicle availability and loyalty benefits.",
            "rating": 4.7,
            "badge": "Official Provider"
        },
        {
            "name": "Rentalcars.com",
            "type": "Rental Cars",
            "official_url": "https://www.rentalcars.com",
            "description": "Compares deals from top rental brands to find the best price on sedans, SUVs, and minivans.",
            "rating": 4.7,
            "badge": "Verified Aggregator"
        }
    ]
}

@router.get("/providers", response_model=None)
@router.get("/search", response_model=None)
def get_reservation_providers(
    destination: str = Query("Ooty", description="Destination city name e.g. Ooty, Paris, Tokyo, Chennai"),
    type: Optional[str] = Query(None, description="Hotels, Dining, Flights, Trains, Bus, Rental Cars")
):
    """Retrieve verified official booking providers for the selected destination and category."""
    dest_name = destination.strip()
    category_key = type.strip().lower() if type else "all"

    # Normalize category key
    norm_map = {
        "hotels": "hotels",
        "hotel": "hotels",
        "dining": "dining",
        "restaurant": "dining",
        "restaurants": "dining",
        "food": "dining",
        "flights": "flights",
        "flight": "flights",
        "trains": "trains",
        "train": "trains",
        "bus": "bus",
        "buses": "bus",
        "rental cars": "rental cars",
        "rental car": "rental cars",
        "rentals": "rental cars",
        "rental": "rental cars",
        "car": "rental cars"
    }
    resolved_cat = norm_map.get(category_key, category_key)

    results = []
    if resolved_cat in OFFICIAL_PROVIDERS:
        for p in OFFICIAL_PROVIDERS[resolved_cat]:
            item = dict(p)
            item["destination"] = dest_name.title()
            results.append(item)
    else:
        # Return all categories combined
        for cat, providers in OFFICIAL_PROVIDERS.items():
            for p in providers:
                item = dict(p)
                item["destination"] = dest_name.title()
                results.append(item)

    return success_response(
        data={
            "destination": dest_name.title(),
            "category": type or "All Categories",
            "providers": results
        },
        message=f"Official booking providers for {dest_name.title()} retrieved successfully"
    )

@router.post("", response_model=None)
def add_reservation(
    res_in: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == res_in.trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    new_res = Reservation(
        trip_id=res_in.trip_id,
        destination=trip.destination,
        service_type=res_in.type,
        provider_name=res_in.provider,
        official_url=res_in.attachment_url,
        type=res_in.type,
        title=res_in.title,
        provider=res_in.provider,
        booking_reference=res_in.booking_reference,
        date=res_in.date,
        time=res_in.time,
        address=res_in.address,
        cost=res_in.cost,
        notes=res_in.notes,
        attachment_url=res_in.attachment_url
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)

    return success_response(
        data={"id": new_res.id, "title": new_res.title},
        message="Reservation record saved",
        status_code=status.HTTP_201_CREATED
    )

@router.get("/{trip_id}", response_model=None)
def get_trip_reservations(trip_id: int, db: Session = Depends(get_db)):
    reservations = db.query(Reservation).filter(Reservation.trip_id == trip_id).order_by(Reservation.date).all()
    results = [{
        "id": r.id,
        "trip_id": r.trip_id,
        "destination": r.destination,
        "service_type": r.service_type or r.type,
        "provider_name": r.provider_name or r.provider,
        "official_url": r.official_url or r.attachment_url,
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
        "created_at": r.created_at.isoformat() if r.created_at else None
    } for r in reservations]
    return success_response(data=results, message="Reservations retrieved")

@router.delete("/{reservation_id}", response_model=None)
def delete_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    r = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not r:
        return error_response(message="Reservation not found", status_code=status.HTTP_404_NOT_FOUND)
    db.delete(r)
    db.commit()
    return success_response(data={"id": reservation_id}, message="Reservation removed")

@router.post("/upload", response_model=None)
async def upload_attachment(
    trip_id: int = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".jpg", ".jpeg", ".png"]:
        return error_response(message="Only PDF, JPG, and PNG files are accepted", status_code=status.HTTP_400_BAD_REQUEST)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"trip_{trip_id}_{int(os.times().elapsed)}_{file.filename.replace(' ', '_')}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(filepath)
    file_url = f"/uploads/{filename}"

    new_attach = Attachment(
        trip_id=trip_id,
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_url,
        file_type=ext.replace(".", "").upper(),
        file_size=file_size
    )
    db.add(new_attach)
    db.commit()
    db.refresh(new_attach)

    return success_response(
        data={"id": new_attach.id, "url": file_url, "file_name": file.filename},
        message="Attachment uploaded securely",
        status_code=status.HTTP_201_CREATED
    )

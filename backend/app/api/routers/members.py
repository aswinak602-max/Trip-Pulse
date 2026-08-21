from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

from app.core.database import get_db
from app.core.response import success_response, error_response
from app.api.deps import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.trip import Trip, TripMember

router = APIRouter(prefix="/members", tags=["Trip Members & Collaboration"])

class AddMemberRequest(BaseModel):
    trip_id: int
    name: str
    email: EmailStr
    role: str = "VIEW"  # VIEW, EDIT, OWNER

class JoinTripRequest(BaseModel):
    trip_id: int
    name: str
    email: Optional[str] = None
    role: str = "VIEW"
    is_sharing_location: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class ToggleLocationRequest(BaseModel):
    trip_id: int
    member_id: Optional[int] = None
    name: Optional[str] = None
    is_sharing: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None

@router.get("/invite-info/{trip_id}", response_model=None)
def get_trip_invite_info(trip_id: int, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        return error_response(message="Trip not found or invitation expired", status_code=status.HTTP_404_NOT_FOUND)

    inviter_name = "Trip Leader"
    if trip.user:
        inviter_name = trip.user.name or trip.user.email.split('@')[0]
    else:
        owner_member = db.query(TripMember).filter(TripMember.trip_id == trip_id, TripMember.role == "OWNER").first()
        if owner_member:
            inviter_name = owner_member.name

    return success_response(
        data={
            "trip_id": trip.id,
            "trip_title": trip.title,
            "destination": trip.destination,
            "current_location": trip.current_location,
            "start_date": trip.start_date,
            "end_date": trip.end_date,
            "days_count": trip.days_count,
            "members_count": trip.members_count,
            "budget": trip.budget,
            "inviter_name": inviter_name
        },
        message="Invitation details retrieved"
    )

@router.post("/join", response_model=None)
def join_trip_by_invite(
    req: JoinTripRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == req.trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    clean_name = req.name.strip()
    if not clean_name:
        return error_response(message="Please provide your name", status_code=status.HTTP_400_BAD_REQUEST)

    # Resolve email
    effective_email = ""
    if current_user and current_user.email:
        effective_email = current_user.email.lower()
        if not clean_name:
            clean_name = current_user.name
    elif req.email and "@" in req.email:
        effective_email = req.email.strip().lower()
    else:
        # Create a clean guest identifier
        slug = clean_name.lower().replace(" ", ".")
        effective_email = f"{slug}@trippulse.guest"

    # Check if member is already in this trip
    existing = db.query(TripMember).filter(
        TripMember.trip_id == req.trip_id,
        (TripMember.email == effective_email) | (TripMember.name.ilike(clean_name))
    ).first()

    if existing:
        # If already present, preserve their role and update location sharing if opted-in
        existing.is_sharing_location = req.is_sharing_location
        if req.is_sharing_location and req.latitude and req.longitude:
            existing.last_latitude = req.latitude
            existing.last_longitude = req.longitude
            existing.last_location_time = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return success_response(
            data={
                "id": existing.id,
                "trip_id": existing.trip_id,
                "name": existing.name,
                "email": existing.email,
                "role": existing.role,
                "is_sharing_location": existing.is_sharing_location,
                "trip": {
                    "id": trip.id,
                    "title": trip.title,
                    "destination": trip.destination,
                    "current_location": trip.current_location,
                    "days_count": trip.days_count
                }
            },
            message=f"Welcome back {existing.name} to {trip.title}!"
        )

    # Add as new member with default "VIEW" role
    new_member = TripMember(
        trip_id=trip.id,
        user_id=current_user.id if current_user else None,
        name=clean_name,
        email=effective_email,
        role=req.role.upper() if req.role in ["VIEW", "EDIT"] else "VIEW",
        is_sharing_location=req.is_sharing_location,
        last_latitude=req.latitude if req.is_sharing_location else None,
        last_longitude=req.longitude if req.is_sharing_location else None,
        last_location_time=datetime.utcnow() if req.is_sharing_location else None
    )
    db.add(new_member)
    trip.members_count = db.query(TripMember).filter(TripMember.trip_id == trip.id).count() + 1
    db.commit()
    db.refresh(new_member)

    return success_response(
        data={
            "id": new_member.id,
            "trip_id": new_member.trip_id,
            "name": new_member.name,
            "email": new_member.email,
            "role": new_member.role,
            "is_sharing_location": new_member.is_sharing_location,
            "trip": {
                "id": trip.id,
                "title": trip.title,
                "destination": trip.destination,
                "current_location": trip.current_location,
                "days_count": trip.days_count
            }
        },
        message=f"Successfully joined {trip.title} as {new_member.role} member",
        status_code=status.HTTP_201_CREATED
    )

@router.post("", response_model=None)
def add_trip_member(
    req: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == req.trip_id).first()
    if not trip:
        return error_response(message="Trip not found", status_code=status.HTTP_404_NOT_FOUND)

    # Check if already added
    existing = db.query(TripMember).filter(TripMember.trip_id == req.trip_id, TripMember.email == req.email.lower()).first()
    if existing:
        return error_response(message="Member is already part of this trip", status_code=status.HTTP_400_BAD_REQUEST)

    # Try to link with existing user if registered
    reg_user = db.query(User).filter(User.email == req.email.lower()).first()

    new_member = TripMember(
        trip_id=req.trip_id,
        user_id=reg_user.id if reg_user else None,
        name=req.name.strip(),
        email=req.email.lower().strip(),
        role=req.role.upper(),
        is_sharing_location=False
    )
    db.add(new_member)
    trip.members_count = db.query(TripMember).filter(TripMember.trip_id == req.trip_id).count() + 1
    db.commit()
    db.refresh(new_member)

    return success_response(
        data={"id": new_member.id, "name": new_member.name, "email": new_member.email, "role": new_member.role},
        message=f"Member {new_member.name} added to trip with {new_member.role} permission",
        status_code=status.HTTP_201_CREATED
    )

@router.get("/{trip_id}", response_model=None)
def get_trip_members(trip_id: int, db: Session = Depends(get_db)):
    members = db.query(TripMember).filter(TripMember.trip_id == trip_id).all()
    results = [{
        "id": m.id,
        "trip_id": m.trip_id,
        "name": m.name,
        "email": m.email,
        "role": m.role,
        "is_sharing_location": m.is_sharing_location,
        "last_latitude": m.last_latitude,
        "last_longitude": m.last_longitude,
        "last_location_time": m.last_location_time.isoformat() if m.last_location_time else None
    } for m in members]
    return success_response(data=results, message="Trip members retrieved")

@router.delete("/{member_id}", response_model=None)
def remove_trip_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(TripMember).filter(TripMember.id == member_id).first()
    if not member:
        return error_response(message="Member not found", status_code=status.HTTP_404_NOT_FOUND)

    trip = db.query(Trip).filter(Trip.id == member.trip_id).first()
    if trip and trip.user_id != current_user.id:
        return error_response(message="Only the trip owner can remove members", status_code=status.HTTP_403_FORBIDDEN)

    trip_id = member.trip_id
    db.delete(member)
    if trip:
        trip.members_count = max(1, db.query(TripMember).filter(TripMember.trip_id == trip_id).count() - 1)
    db.commit()
    return success_response(data={"id": member_id}, message="Member removed from trip")

@router.post("/location-toggle", response_model=None)
def toggle_member_location_sharing(
    req: ToggleLocationRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    member = None
    if req.member_id:
        member = db.query(TripMember).filter(TripMember.id == req.member_id, TripMember.trip_id == req.trip_id).first()

    if not member and current_user:
        member = db.query(TripMember).filter(
            TripMember.trip_id == req.trip_id,
            (TripMember.user_id == current_user.id) | (TripMember.email == current_user.email)
        ).first()

    if not member and req.name:
        member = db.query(TripMember).filter(
            TripMember.trip_id == req.trip_id,
            TripMember.name.ilike(req.name.strip())
        ).first()

    if not member:
        if current_user:
            member = TripMember(
                trip_id=req.trip_id,
                user_id=current_user.id,
                name=current_user.name,
                email=current_user.email,
                role="OWNER"
            )
            db.add(member)
        else:
            return error_response(message="Member not found to toggle location sharing", status_code=status.HTTP_404_NOT_FOUND)

    member.is_sharing_location = req.is_sharing
    if req.is_sharing and req.latitude and req.longitude:
        member.last_latitude = req.latitude
        member.last_longitude = req.longitude
        member.last_location_time = datetime.utcnow()

    db.commit()
    return success_response(
        data={
            "id": member.id,
            "is_sharing": member.is_sharing_location,
            "name": member.name,
            "last_latitude": member.last_latitude,
            "last_longitude": member.last_longitude,
            "last_location_time": member.last_location_time.isoformat() if member.last_location_time else None
        },
        message="Location sharing updated with privacy consent"
    )

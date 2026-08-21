import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.user import User

class Destination(Base):
    __tablename__ = "destinations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    country = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    hero_image = Column(String(500), nullable=False)
    best_time = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    popularity = Column(Float, default=4.5)
    tags = Column(String(255), default="")  # comma separated
    created_at = Column(DateTime, default=datetime.utcnow)

    places = relationship("Place", back_populates="destination", cascade="all, delete-orphan")

class Place(Base):
    __tablename__ = "places"

    id = Column(Integer, primary_key=True, index=True)
    destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=False)
    name = Column(String(200), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # Nature, History, Adventure, Beach, Wildlife, Culture, Food, Shopping, Family
    description = Column(Text, nullable=False)
    rating = Column(Float, default=4.5)
    popularity = Column(Float, default=85.0)  # 0 to 100
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=False)
    address = Column(String(300), nullable=True)
    opening_hours = Column(String(100), default="09:00 AM - 06:00 PM")
    estimated_visit_hours = Column(Float, default=2.0)
    estimated_cost = Column(Float, default=150.0)
    is_indoor = Column(Boolean, default=False)
    
    # 9-dimensional interest scores for K-Means clustering (0.0 to 1.0)
    nature_score = Column(Float, default=0.0)
    adventure_score = Column(Float, default=0.0)
    history_score = Column(Float, default=0.0)
    beach_score = Column(Float, default=0.0)
    wildlife_score = Column(Float, default=0.0)
    culture_score = Column(Float, default=0.0)
    food_score = Column(Float, default=0.0)
    photography_score = Column(Float, default=0.0)
    family_score = Column(Float, default=0.0)

    destination = relationship("Destination", back_populates="places")
    itinerary_items = relationship("ItineraryItem", back_populates="place")

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    destination = Column(String(150), nullable=False)
    current_location = Column(String(150), nullable=False)
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=False)
    days_count = Column(Integer, default=3)
    members_count = Column(Integer, default=1)
    budget = Column(Float, default=20000.0)
    estimated_cost = Column(Float, default=0.0)
    transport_type = Column(String(50), default="Car")  # Car, Bus, Train, Flight, Rental
    accommodation_type = Column(String(50), default="Standard")  # Budget, Standard, Luxury, Resort
    food_budget_tier = Column(String(50), default="Standard")  # Budget, Standard, Fine Dining
    interests = Column(Text, default="[]")  # JSON encoded list of strings
    status = Column(String(50), default="active")  # active, completed, planned
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    members = relationship("TripMember", back_populates="trip", cascade="all, delete-orphan")
    trip_places = relationship("TripPlace", back_populates="trip", cascade="all, delete-orphan")
    itinerary_items = relationship("ItineraryItem", back_populates="trip", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="trip", cascade="all, delete-orphan")
    reservations = relationship("Reservation", back_populates="trip", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="trip", cascade="all, delete-orphan")
    checklists = relationship("ChecklistItem", back_populates="trip", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="trip", cascade="all, delete-orphan")

class TripMember(Base):
    __tablename__ = "trip_members"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    role = Column(String(20), default="VIEW")  # OWNER, EDIT, VIEW
    is_sharing_location = Column(Boolean, default=False)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    last_location_time = Column(DateTime, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="members")
    user = relationship("User")

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    day_number = Column(Integer, nullable=False, default=1)
    time_slot = Column(String(20), nullable=False, default="09:00 AM")
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)
    custom_title = Column(String(200), nullable=True)
    activity_type = Column(String(50), default="attraction")  # attraction, restaurant, hotel, transport, leisure
    duration_hours = Column(Float, default=2.0)
    distance_from_prev_km = Column(Float, default=0.0)
    travel_time_mins = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    trip = relationship("Trip", back_populates="itinerary_items")
    place = relationship("Place", back_populates="itinerary_items")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    category = Column(String(50), nullable=False)  # Transport, Hotel, Food, Activities, Shopping, Rental, Other
    amount = Column(Float, nullable=False)
    paid_by = Column(String(100), nullable=False)
    date = Column(String(50), nullable=False)
    description = Column(String(300), nullable=False)
    split_type = Column(String(30), default="EQUAL")  # EQUAL, CUSTOM, PERCENTAGE, BY_SHARE
    notes = Column(Text, nullable=True)
    receipt_url = Column(String(500), nullable=True)
    split_details = Column(Text, nullable=True)  # JSON encoded custom splits
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="expenses")
    user = relationship("User")

class TripPlace(Base):
    __tablename__ = "trip_places"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=True)
    place_name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    visit_date = Column(String(50), nullable=True)
    visit_time = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="trip_places")

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    destination = Column(String(150), nullable=True)
    service_type = Column(String(50), nullable=True)  # Dining, Hotels, Flights, Trains, Bus, Rental Cars
    provider_name = Column(String(150), nullable=True)
    official_url = Column(String(500), nullable=True)
    type = Column(String(50), nullable=True, default="Hotels")
    title = Column(String(200), nullable=True)
    provider = Column(String(150), nullable=True)
    booking_reference = Column(String(100), nullable=True)
    date = Column(String(50), nullable=True)
    time = Column(String(20), nullable=True)
    address = Column(String(300), nullable=True)
    cost = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    attachment_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="reservations")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="attachments")

class ChecklistItem(Base):
    __tablename__ = "checklists"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False)
    category = Column(String(50), nullable=False)  # Packing, Documents, Shopping, To-Do, Custom
    item_text = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)
    assigned_to = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="checklists")

class SavedPlace(Base):
    __tablename__ = "saved_places"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    place_id = Column(Integer, ForeignKey("places.id"), nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    place = relationship("Place")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    action_type = Column(String(50), nullable=True)  # add_itinerary, reduce_budget, show_weather, etc.
    action_payload = Column(Text, nullable=True)  # JSON payload
    action_status = Column(String(20), default="pending")  # pending, accepted, dismissed
    created_at = Column(DateTime, default=datetime.utcnow)

    trip = relationship("Trip", back_populates="chat_messages")

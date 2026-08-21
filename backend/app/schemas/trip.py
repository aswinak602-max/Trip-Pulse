from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Destination & Place Schemas ---
class PlaceBase(BaseModel):
    name: str
    category: str
    description: str
    rating: float = 4.5
    popularity: float = 80.0
    latitude: float
    longitude: float
    image_url: str
    address: Optional[str] = None
    opening_hours: str = "09:00 AM - 06:00 PM"
    estimated_visit_hours: float = 2.0
    estimated_cost: float = 150.0
    is_indoor: bool = False
    nature_score: float = 0.0
    adventure_score: float = 0.0
    history_score: float = 0.0
    beach_score: float = 0.0
    wildlife_score: float = 0.0
    culture_score: float = 0.0
    food_score: float = 0.0
    photography_score: float = 0.0
    family_score: float = 0.0

class PlaceOut(PlaceBase):
    id: int
    destination_id: int

    class Config:
        from_attributes = True

class DestinationBase(BaseModel):
    name: str
    country: str
    state: Optional[str] = None
    description: str
    hero_image: str
    best_time: Optional[str] = None
    latitude: float
    longitude: float
    popularity: float = 4.5
    tags: Optional[str] = ""

class DestinationOut(DestinationBase):
    id: int
    places_count: Optional[int] = 0

    class Config:
        from_attributes = True

class DestinationDetailOut(DestinationBase):
    id: int
    places: List[PlaceOut] = []

    class Config:
        from_attributes = True

# --- Trip Schemas ---
class TripCreate(BaseModel):
    title: str
    destination: str
    current_location: str
    start_date: str
    end_date: str
    days_count: int = Field(default=3, ge=1, le=30)
    members_count: int = Field(default=1, ge=1, le=50)
    budget: float = Field(default=20000.0, ge=0)
    transport_type: str = "Car"  # Car, Bus, Train, Flight, Rental
    accommodation_type: str = "Standard"  # Budget, Standard, Luxury, Resort
    food_budget_tier: str = "Standard"
    interests: Optional[List[str]] = []
    selected_places: Optional[List[Dict[str, Any]]] = []


class TripPlaceBase(BaseModel):
    trip_id: int
    place_id: Optional[int] = None
    place_name: str
    latitude: float
    longitude: float
    visit_date: Optional[str] = None
    visit_time: Optional[str] = None
    notes: Optional[str] = None

class TripPlaceCreate(TripPlaceBase):
    pass

class TripPlaceOut(TripPlaceBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReservationProviderOut(BaseModel):
    name: str
    type: str
    destination: str
    official_url: str
    description: str
    rating: Optional[float] = 4.5
    price_level: Optional[str] = "$$"

class TripUpdate(BaseModel):

    title: Optional[str] = None
    destination: Optional[str] = None
    current_location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    days_count: Optional[int] = None
    members_count: Optional[int] = None
    budget: Optional[float] = None
    transport_type: Optional[str] = None
    accommodation_type: Optional[str] = None
    interests: Optional[List[str]] = None
    status: Optional[str] = None

class TripMemberOut(BaseModel):
    id: int
    trip_id: int
    user_id: Optional[int] = None
    name: str
    email: str
    role: str
    is_sharing_location: bool = False
    last_latitude: Optional[float] = None
    last_longitude: Optional[float] = None
    last_location_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class ItineraryItemBase(BaseModel):
    day_number: int = 1
    time_slot: str = "09:00 AM"
    place_id: Optional[int] = None
    custom_title: Optional[str] = None
    activity_type: str = "attraction"
    duration_hours: float = 2.0
    distance_from_prev_km: float = 0.0
    travel_time_mins: int = 0
    notes: Optional[str] = None
    sort_order: int = 0

class ItineraryItemCreate(ItineraryItemBase):
    trip_id: int

class ItineraryItemOut(ItineraryItemBase):
    id: int
    trip_id: int
    place: Optional[PlaceOut] = None

    class Config:
        from_attributes = True

class ExpenseBase(BaseModel):
    category: str
    amount: float
    paid_by: str
    date: str
    description: str
    split_type: Optional[str] = "EQUAL"  # EQUAL, CUSTOM, PERCENTAGE, BY_SHARE
    notes: Optional[str] = None
    receipt_url: Optional[str] = None
    split_details: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    trip_id: int

class ExpenseOut(ExpenseBase):
    id: int
    trip_id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReservationBase(BaseModel):
    type: str  # Flights, Hotels, Trains, Buses, Rental Cars, Restaurants, Activities, Other
    title: str
    provider: str
    booking_reference: Optional[str] = None
    date: str
    time: Optional[str] = None
    address: Optional[str] = None
    cost: float = 0.0
    notes: Optional[str] = None
    attachment_url: Optional[str] = None

class ReservationCreate(ReservationBase):
    trip_id: int

class ReservationOut(ReservationBase):
    id: int
    trip_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChecklistItemBase(BaseModel):
    category: str  # Packing, Documents, Shopping, To-Do, Custom
    item_text: str
    is_completed: bool = False
    assigned_to: Optional[str] = None

class ChecklistItemCreate(ChecklistItemBase):
    trip_id: int

class ChecklistItemOut(ChecklistItemBase):
    id: int
    trip_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TripOut(BaseModel):
    id: int
    user_id: int
    title: str
    destination: str
    current_location: str
    start_date: str
    end_date: str
    days_count: int
    members_count: int
    budget: float
    estimated_cost: float
    transport_type: str
    accommodation_type: str
    food_budget_tier: str
    interests: List[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TripDetailOut(TripOut):
    members: List[TripMemberOut] = []
    itinerary_items: List[ItineraryItemOut] = []
    expenses: List[ExpenseOut] = []
    reservations: List[ReservationOut] = []
    checklists: List[ChecklistItemOut] = []

    class Config:
        from_attributes = True

# --- ML & AI Schemas ---
class PredictCostRequest(BaseModel):
    distance_km: Optional[float] = 550.0
    members: int = 3
    days: int = 3
    transport_mode: Optional[str] = "bus"
    dining_tier: Optional[str] = "budget"
    # Optional fields for backward compatibility
    current_location: Optional[str] = None
    destination: Optional[str] = None
    transport_type: Optional[str] = None
    accommodation_type: Optional[str] = None
    food_budget_tier: Optional[str] = None
    user_budget: Optional[float] = None
    seasonality: Optional[str] = None

class CostBreakdown(BaseModel):
    transportation: float
    accommodation: float
    food: float
    activities: float
    local_travel: float
    miscellaneous: float

class CostPredictionResult(BaseModel):
    distance_km: float
    members: int
    days: int
    transport_mode: str
    dining_tier: str
    estimated_min: float
    estimated_max: float
    estimated_total: float
    cost_per_person: float
    breakdown: CostBreakdown
    is_ml_model: bool = True

class CostEvaluationMetrics(BaseModel):
    model_name: str = "RandomForestRegressor (Scikit-Learn)"
    r2_score: float
    mae: float
    rmse: float
    dataset_size: int
    features_used: List[str]

class RecommendRequest(BaseModel):
    destination: str = "Ooty"
    interests: List[str] = ["Nature", "Photography"]
    limit: int = 6
    time_of_day: Optional[str] = "All"  # All, Morning, Afternoon, Evening, Sunset
    pacing: Optional[str] = "Balanced"  # Relaxed, Balanced, Intense

class RecommendedPlaceOut(BaseModel):
    place: PlaceOut
    match_score: float
    cluster_id: int
    reason: str

class RecommendationResult(BaseModel):
    destination: str
    selected_interests: List[str]
    recommendations: List[RecommendedPlaceOut]
    cluster_count: int
    algorithm: str = "K-Means Clustering"

# --- Weather Schemas ---
class WeatherForecastDay(BaseModel):
    date: str
    temp_min: float
    temp_max: float
    temp_day: float
    condition: str
    description: str
    icon: str
    rain_probability: int
    humidity: int
    wind_speed: float
    suitability: str  # GOOD, MODERATE, UNSUITABLE

class WeatherResponse(BaseModel):
    city: str
    country: str
    temperature: float
    feels_like: float
    condition: str
    description: str
    humidity: int
    wind_speed: float
    icon: str
    suitability: str  # GOOD, MODERATE, UNSUITABLE
    suitability_reason: str
    forecast: List[WeatherForecastDay] = []
    indoor_alternatives: List[PlaceOut] = []
    is_live_api: bool = False

# --- Chatbot / Assistant Schemas ---
class ChatRequest(BaseModel):
    trip_id: Optional[int] = None
    message: str
    context: Optional[Dict[str, Any]] = None

class ActionProposal(BaseModel):
    type: str  # add_to_itinerary, reduce_budget, show_weather, optimize_route
    title: str
    description: str
    payload: Dict[str, Any]

class ChatResponse(BaseModel):
    reply: str
    structured_context: Optional[Dict[str, Any]] = None
    suggested_actions: List[ActionProposal] = []
    source: str = "AI Tourist Assistant Engine"

class LocationSharePayload(BaseModel):
    trip_id: int
    user_id: int
    user_name: str
    latitude: float
    longitude: float
    is_sharing: bool

from fastapi import APIRouter, Depends, HTTPException, status
from app.core.response import success_response, error_response
from app.schemas.trip import PredictCostRequest
from app.ml.cost_predictor import cost_predictor
from app.services.map_service import map_service

router = APIRouter(prefix="/cost", tags=["Cost Prediction ML"])

@router.post("/predict", response_model=None)
def predict_trip_cost(req: PredictCostRequest):
    try:
        # Determine distance if not manually supplied
        dist_km = req.distance_km
        if (dist_km is None or dist_km <= 0) and req.current_location and req.destination:
            route_info = map_service.calculate_trip_route(req.current_location, req.destination)
            dist_km = route_info.get("distance_km", 550.0)
        elif dist_km is None or dist_km <= 0:
            dist_km = 550.0

        transport = req.transport_mode or req.transport_type or "bus"
        dining = req.dining_tier or req.food_budget_tier or "budget"

        result = cost_predictor.predict(
            distance_km=dist_km,
            members=req.members,
            days=req.days,
            transport_mode=transport,
            dining_tier=dining,
            current_location=req.current_location,
            destination=req.destination,
            transport_type=req.transport_type,
            accommodation_type=req.accommodation_type,
            food_budget_tier=req.food_budget_tier,
            user_budget=req.user_budget,
            seasonality=req.seasonality
        )
        return success_response(
            data=result,
            message="Cost predicted using ML RandomForestRegressor model"
        )
    except Exception as e:
        return error_response(
            message="Unable to calculate the estimated cost. Please check your inputs.",
            status_code=500
        )

@router.get("/metrics", response_model=None)
def get_ml_cost_metrics():
    """Returns Machine Learning evaluation metrics for academic viva and project presentation."""
    return success_response(
        data=cost_predictor.metrics,
        message="Academic Demonstration: ML Model Evaluation Metrics"
    )

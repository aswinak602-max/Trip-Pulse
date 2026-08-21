import sys
import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

client = TestClient(app)

# Helper to get auth header for test user
def get_auth_headers():
    with SessionLocal() as db:
        user = db.query(User).first()
        if not user:
            from app.core.security import get_password_hash
            user = User(
                name="Demo Explorer",
                email="explorer@trippulse.ai",
                hashed_password=get_password_hash("password123"),
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        token = create_access_token(user.id)
        return {"Authorization": f"Bearer {token}"}

def run_tests():
    print("=== STARTING TRIPPULSE API VERIFICATION TESTS ===\n")
    headers = get_auth_headers()

    # 1. Health check
    res = client.get("/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Health check passed:", res.json().get("message"))

    # 2. Tourist Places Discovery (Ooty)
    res = client.get("/api/v1/places/destination?destination=Ooty&origin=Chennai")
    assert res.status_code == 200, f"Places search failed: {res.text}"
    places = res.json().get("data", [])
    assert len(places) > 0, "No places returned for Ooty"
    print(f"[PASS] 2. Ooty Places Discovery passed: Retrieved {len(places)} attractions:")
    for p in places[:3]:
        print(f"   - {p.get('name')} ({p.get('category')}) | Lat: {p.get('latitude')}, Lng: {p.get('longitude')} | Dist: {p.get('distance_from_origin_km')} km")

    # 3. Worldwide Destination (Paris)
    res = client.get("/api/v1/places/destination?destination=Paris&origin=London")
    assert res.status_code == 200, f"Paris places failed: {res.text}"
    p_places = res.json().get("data", [])
    assert len(p_places) > 0, "No places returned for Paris"
    print(f"[PASS] 3. Worldwide Places Discovery (Paris) passed: Retrieved {len(p_places)} attractions:")
    for p in p_places[:2]:
        print(f"   - {p.get('name')} ({p.get('category')}) | Dist: {p.get('distance_from_origin_km')} km")

    # 4. Directions to Tourist Place (Ooty Lake)
    res = client.get("/api/v1/places/101/directions?origin=Chennai")
    assert res.status_code == 200, f"Directions failed: {res.text}"
    d_data = res.json().get("data", {})
    assert "distance_km" in d_data and "duration_formatted" in d_data, "Missing distance or duration"
    print(f"[PASS] 4. Directions from Chennai to Ooty Lake passed: {d_data.get('distance_km')} km, {d_data.get('duration_formatted')}, Map URL: {d_data.get('google_maps_url')}")

    # 5. ML Cost Prediction (5 features)
    cost_payload = {
        "distance_km": 550,
        "members": 3,
        "days": 3,
        "transport_mode": "bus",
        "dining_tier": "budget"
    }
    res = client.post("/api/v1/cost/predict", json=cost_payload)
    assert res.status_code == 200, f"Cost prediction failed: {res.text}"
    cost_data = res.json().get("data", {})
    assert "estimated_total" in cost_data and "breakdown" in cost_data, "Invalid cost data structure"
    print(f"[PASS] 5. ML Cost Prediction passed:")
    print(f"   - Estimated Total: INR {cost_data.get('estimated_total')}")
    print(f"   - Range: INR {cost_data.get('estimated_min')} - INR {cost_data.get('estimated_max')}")
    print(f"   - Cost per person: INR {cost_data.get('cost_per_person')}")
    print(f"   - Itemized Breakdown: {cost_data.get('breakdown')}")

    # 6. ML Model Evaluation Metrics
    res = client.get("/api/v1/cost/metrics")
    assert res.status_code == 200, f"Metrics failed: {res.text}"
    met_data = res.json().get("data", {})
    assert "r2_score" in met_data and "mae" in met_data and "rmse" in met_data, "Missing ML metrics"
    print(f"[PASS] 6. ML Model Evaluation Metrics passed: R2={met_data.get('r2_score')}, MAE=INR {met_data.get('mae')}, RMSE=INR {met_data.get('rmse')}, Dataset={met_data.get('dataset_size')}")


    # 7. Destination Booking Providers (Hotels, Trains, Bus, Rental Cars)
    res = client.get("/api/v1/reservations/providers?destination=Ooty&type=Hotels")
    assert res.status_code == 200, f"Hotel providers failed: {res.text}"
    h_provs = res.json().get("data", {}).get("providers", [])
    assert len(h_provs) > 0, "No hotel providers returned"
    print(f"[PASS] 7. Reservation Providers for Ooty Hotels passed: Retrieved {len(h_provs)} verified providers ({h_provs[0].get('name')} -> {h_provs[0].get('official_url')})")

    res = client.get("/api/v1/reservations/providers?destination=Ooty&type=Trains")
    assert res.status_code == 200
    t_provs = res.json().get("data", {}).get("providers", [])
    print(f"[PASS] 8. Reservation Providers for Ooty Trains passed: {t_provs[0].get('name')} -> {t_provs[0].get('official_url')}")

    # 8. Create Trip with selected attractions
    trip_payload = {
        "title": "Automated Test: Ooty & Nilgiris Expedition",
        "current_location": "Chennai",
        "destination": "Ooty",
        "start_date": "2026-10-05",
        "end_date": "2026-10-07",
        "days_count": 3,
        "members_count": 3,
        "budget": 20000,
        "transport_type": "Bus",
        "accommodation_type": "Budget",
        "food_budget_tier": "Budget",
        "interests": ["Nature", "Photography"],
        "selected_places": [
            {
                "id": 101,
                "name": "Ooty Lake & Boat House",
                "latitude": 11.4078,
                "longitude": 76.6883,
                "category": "Nature / Tourist Attraction"
            },
            {
                "id": 102,
                "name": "Doddabetta Peak",
                "latitude": 11.4011,
                "longitude": 76.7369,
                "category": "Adventure / Mountain Peak"
            }
        ]
    }
    res = client.post("/api/v1/trips", json=trip_payload, headers=headers)
    assert res.status_code in [200, 201], f"Trip creation failed: {res.text}"
    created_trip = res.json().get("data", {})

    trip_id = created_trip.get("id")
    print(f"[PASS] 9. Create Trip with selected places passed: Trip ID #{trip_id} ('{created_trip.get('title')}')")

    # 9. Verify trip details contains persisted trip_places and itinerary
    res = client.get(f"/api/v1/trips/{trip_id}", headers=headers)
    assert res.status_code == 200, f"Get trip detail failed: {res.text}"
    t_detail = res.json().get("data", {})
    assert len(t_detail.get("trip_places", [])) == 2, "Selected places were not persisted in trip_places"
    assert len(t_detail.get("itinerary_items", [])) >= 2, "Itinerary items were not created for selected places"
    print(f"[PASS] 10. Trip Details verification passed: {len(t_detail.get('trip_places'))} trip places and {len(t_detail.get('itinerary_items'))} itinerary items persisted.")

    # 10. Save and Retrieve Reservation record
    res_payload = {
        "trip_id": trip_id,
        "type": "Trains",
        "title": "IRCTC Nilgiri Mountain Railway Booking",
        "provider": "IRCTC Official Portal",
        "booking_reference": "PNR-88294110",
        "date": "2026-10-05",
        "time": "07:10 AM",
        "address": "Mettupalayam Station",
        "cost": 650.0,
        "notes": "Toy train mountain heritage journey",
        "attachment_url": "https://www.irctc.co.in"
    }
    res = client.post("/api/v1/reservations", json=res_payload, headers=headers)
    assert res.status_code == 201, f"Save reservation failed: {res.text}"
    print("[PASS] 11. Save Reservation Record to database passed")

    res = client.get(f"/api/v1/reservations/{trip_id}")
    assert res.status_code == 200
    saved_res_list = res.json().get("data", [])
    assert len(saved_res_list) >= 1, "Reservation was not retrieved"
    print(f"[PASS] 12. Retrieve Saved Reservations passed: {len(saved_res_list)} records retrieved (Title: '{saved_res_list[0].get('title')}')")

    print("\n=== ALL 12 API & FUNCTIONAL TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()

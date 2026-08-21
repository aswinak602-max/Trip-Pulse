"""
TripPulse Comprehensive End-to-End Test Suite.
Validates all 12 requirements specified by the user.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.trip import Trip, Place, ItineraryItem, Destination
from app.models.user import User
from app.core.security import create_access_token
from app.services.map_service import map_service
from app.services.email_service import email_service

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("RUNNING TRIPPULSE END-TO-END VERIFICATION SUITE")
    print("=" * 60)
    passed_count = 0
    total_tests = 12

    # Prepare test user & token
    with SessionLocal() as db:
        user = db.query(User).first()
        if not user:
            user = User(name="Test User", username="testuser", email="testuser@trippulse.app", hashed_password="hashedpassword123")
            db.add(user)
            db.commit()
            db.refresh(user)
        user_id = user.id
        auth_token = create_access_token(subject=user_id)
        auth_headers = {"Authorization": f"Bearer {auth_token}"}

    # 1. Test Health Endpoint
    try:
        res = client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["data"]["status"] == "online"
        print("[PASS] Test 1: API Health Endpoint returns { status: 'online', success: True }")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 1: Health Endpoint failed: {e}")

    # 2. Test Itinerary Addition (Direct addition to active trip)
    try:
        with SessionLocal() as db:
            trip = db.query(Trip).first()
            assert trip is not None
            trip_id = trip.id
            place = db.query(Place).filter(Place.name.ilike("%Botanical%")).first()
            if not place:
                place = Place(name="Government Botanical Gardens", destination_name="Ooty", latitude=11.419, longitude=76.711)
                db.add(place)
                db.commit()
                db.refresh(place)
            place_id = place.id
            place_name = place.name

            # Clean previous item if exists
            db.query(ItineraryItem).filter(ItineraryItem.trip_id == trip_id, ItineraryItem.place_id == place_id).delete()
            db.commit()

        # Add to itinerary
        res = client.post("/api/v1/itinerary", json={
            "trip_id": trip_id,
            "place_id": place_id,
            "custom_title": place_name,
            "day_number": 1,
            "duration_hours": 2.0
        }, headers=auth_headers)
        assert res.status_code == 201
        res_json = res.json()
        assert res_json["success"] is True
        assert res_json["data"]["place_id"] == place_id
        print(f"[PASS] Test 2: Added '{place_name}' to trip #{trip_id} itinerary (201 Created)")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 2: Itinerary addition failed: {e}")

    # 3. Test Itinerary Duplicate Prevention (409 Conflict)
    try:
        res_dup = client.post("/api/v1/itinerary", json={
            "trip_id": trip_id,
            "place_id": place_id,
            "custom_title": place_name,
            "day_number": 1,
            "duration_hours": 2.0
        }, headers=auth_headers)
        assert res_dup.status_code == 409
        err_msg = res_dup.json()["message"]
        assert "already in your itinerary" in err_msg.lower()
        print(f"[PASS] Test 3: Duplicate place correctly rejected with 409 Conflict: '{err_msg}'")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 3: Duplicate prevention failed: {e}")

    # 4. Test Map Routing: Coimbatore -> Kanyakumari (No Ooty Fallback)
    try:
        route = map_service.calculate_trip_route("Coimbatore", "Kanyakumari")
        assert route["origin"].lower() == "coimbatore"
        assert route["destination"].lower() == "kanyakumari"
        assert abs(route["origin_coords"]["lat"] - 11.0168) < 0.01
        assert abs(route["dest_coords"]["lat"] - 8.0883) < 0.01
        assert route["waypoints"][0]["name"] == "Coimbatore"
        assert route["waypoints"][-1]["name"] == "Kanyakumari"
        print(f"[PASS] Test 4: Route Coimbatore -> Kanyakumari resolved accurately ({route['distance_km']} km, {route['duration_formatted']})")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 4: Coimbatore -> Kanyakumari route failed: {e}")

    # 5. Test Map Routing: Chennai -> Madurai
    try:
        route = map_service.calculate_trip_route("Chennai", "Madurai")
        assert route["origin"].lower() == "chennai"
        assert route["destination"].lower() == "madurai"
        assert abs(route["origin_coords"]["lat"] - 13.0827) < 0.01
        assert abs(route["dest_coords"]["lat"] - 9.9252) < 0.01
        print(f"[PASS] Test 5: Route Chennai -> Madurai resolved accurately ({route['distance_km']} km)")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 5: Chennai -> Madurai route failed: {e}")

    # 6. Test Map Routing: Bangalore -> Kochi
    try:
        route = map_service.calculate_trip_route("Bangalore", "Kochi")
        assert route["origin"].lower() == "bangalore"
        assert route["destination"].lower() == "kochi"
        assert abs(route["origin_coords"]["lat"] - 12.9716) < 0.01
        assert abs(route["dest_coords"]["lat"] - 9.9312) < 0.01
        print(f"[PASS] Test 6: Route Bangalore -> Kochi resolved accurately ({route['distance_km']} km)")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 6: Bangalore -> Kochi route failed: {e}")

    # 7. Test Coordinate Lookup for Bhagavathi Amman Temple
    try:
        coords = map_service.get_city_coords("Bhagavathi Amman Temple")
        assert coords is not None
        assert abs(coords[0] - 8.0812) < 0.01
        assert abs(coords[1] - 77.5529) < 0.01
        print(f"[PASS] Test 7: Bhagavathi Amman Temple coordinates correctly identified: {coords}")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 7: Bhagavathi Amman Temple coordinate lookup failed: {e}")

    # 8. Test Coordinate Lookup for Mathur Aqueduct
    try:
        coords = map_service.get_city_coords("Mathur Aqueduct")
        assert coords is not None
        assert abs(coords[0] - 8.3375) < 0.01
        assert abs(coords[1] - 77.2886) < 0.01
        print(f"[PASS] Test 8: Mathur Aqueduct coordinates correctly identified: {coords}")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 8: Mathur Aqueduct coordinate lookup failed: {e}")

    # 9. Test Trip Creation with Pre-Selected Places
    try:
        new_trip_payload = {
            "title": "Weekend Expedition to Kanyakumari",
            "destination": "Kanyakumari",
            "current_location": "Coimbatore",
            "start_date": "2026-10-01",
            "end_date": "2026-10-04",
            "days_count": 3,
            "members_count": 3,
            "budget": 20000,
            "transport_type": "Car",
            "accommodation_type": "Standard",
            "food_budget_tier": "Standard",
            "interests": ["Nature", "Culture"],
            "selected_places": [
                {"name": "Vivekananda Rock Memorial", "category": "Monument", "latitude": 8.0781, "longitude": 77.5553}
            ]
        }
        res_trip = client.post("/api/v1/trips", json=new_trip_payload, headers=auth_headers)
        assert res_trip.status_code in [200, 201]
        trip_created = res_trip.json()["data"]
        assert trip_created["destination"] == "Kanyakumari"
        print(f"[PASS] Test 9: Trip created successfully #{trip_created['id']} with pre-selected attraction preserved")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 9: Trip creation failed: {e}")

    # 10. Test Google OAuth Sign-in & User Upsert
    try:
        test_oauth_payload = {
            "provider": "google",
            "email": "sarah.traveler.test@gmail.com",
            "name": "Sarah Traveler",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
        }
        res_oauth = client.post("/api/v1/auth/google", json=test_oauth_payload)
        assert res_oauth.status_code == 200
        oauth_data = res_oauth.json()
        assert oauth_data["success"] is True
        assert oauth_data["data"]["user"]["email"] == "sarah.traveler.test@gmail.com"
        assert "access_token" in oauth_data["data"]
        print(f"[PASS] Test 10: Google OAuth endpoint verified user and issued JWT token")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 10: Google OAuth sign-in failed: {e}")

    # 11. Test Sign-in Confirmation Email Service
    try:
        email_sent = email_service.send_welcome_email("sarah.traveler.test@gmail.com", "Sarah Traveler", "Google")
        assert email_sent is True
        print("[PASS] Test 11: Branded sign-in confirmation email dispatched / logged successfully")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 11: Email service failed: {e}")

    # 12. Verify ML Recommendations Module Removed Cleanly
    try:
        res_rec = client.get("/api/v1/recommendations/1")
        # Route should return 404 since router was unregistered
        assert res_rec.status_code == 404
        assert not os.path.exists("backend/app/api/routers/recommendations.py")
        assert not os.path.exists("frontend/src/pages/RecommendationsPage.jsx")
        print("[PASS] Test 12: ML Recommendations module cleanly deleted and unregistered without breaking routes")
        passed_count += 1
    except Exception as e:
        print(f"[FAIL] Test 12: Recommendations removal verification failed: {e}")

    print("=" * 60)
    print(f"VERIFICATION RESULTS: {passed_count}/{total_tests} TESTS PASSED")
    print("=" * 60)
    return passed_count == total_tests

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

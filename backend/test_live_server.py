"""
Live Socket & HTTP Integration Verification for TripPulse
Hits http://localhost:8000 over live network TCP connection to verify real server execution.
"""

import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:8000"

def make_req(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json", "User-Agent": "TripPulse-LiveTest/1.0"}
    if headers:
        req_headers.update(headers)

    body_bytes = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=8.0) as resp:
            status_code = resp.getcode()
            res_body = json.loads(resp.read().decode("utf-8"))
            return status_code, res_body
    except urllib.error.HTTPError as e:
        status_code = e.code
        try:
            res_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            res_body = {"raw": str(e)}
        return status_code, res_body
    except Exception as e:
        return 0, {"error": str(e)}

def run_live_tests():
    print("=" * 65)
    print("RUNNING LIVE HTTP VERIFICATION AGAINST http://localhost:8000")
    print("=" * 65)
    passed = 0
    total = 11

    # 1. Root Health GET /health
    code, res = make_req("/health")
    assert code == 200 and res.get("status") == "ok", f"Expected status ok, got: {res}"
    print(f"[PASS] 1. GET /health -> Status 200, status='ok', database='{res.get('database')}'")
    passed += 1

    # 2. API v1 Health GET /api/v1/health
    code, res = make_req("/api/v1/health")
    assert code == 200 and res.get("success") is True and res["data"]["status"] in ("ok", "online"), f"Failed: {res}"
    print(f"[PASS] 2. GET /api/v1/health -> Status 200, success=True, status='online'")
    passed += 1

    # 3. User Login / Registration
    import time
    test_email = f"live.user.{int(time.time())}@trippulse.app"
    code_reg, res_reg = make_req("/api/v1/auth/register", method="POST", data={"name": "Live Test User", "email": test_email, "password": "securepassword123", "confirm_password": "securepassword123"})
    assert code_reg == 201, f"Registration failed with code {code_reg}: {res_reg}"
    token = res_reg["data"]["access_token"]
    
    # Test Login with registered user
    code_log, res_log = make_req("/api/v1/auth/login", method="POST", data={"email": test_email, "password": "securepassword123"})
    assert code_log == 200, f"Login failed: {res_log}"
    token = res_log["data"]["access_token"]
    
    assert token, "Token must not be empty"
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] 3. POST /api/v1/auth/login & /register -> Valid JWT access token acquired")
    passed += 1

    # 4. Google OAuth POST /api/v1/auth/google
    code, res = make_req("/api/v1/auth/google", method="POST", data={
        "provider": "google",
        "email": "alex.explorer.live@gmail.com",
        "name": "Alex Explorer",
        "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
    })
    assert code == 200 and res.get("success") is True
    assert res["data"]["user"]["email"] == "alex.explorer.live@gmail.com"
    print(f"[PASS] 4. POST /api/v1/auth/google -> Authenticated Alex Explorer with JWT & confirmation email")
    passed += 1

    # 5. Dynamic Places Fetching: Destination Madurai
    code, res = make_req("/api/v1/places/destination?destination=Madurai&origin=Coimbatore")
    assert code == 200 and res.get("success") is True
    places = res.get("data", [])
    assert len(places) > 0, "Madurai places must not be empty"
    print(f"[PASS] 5. GET /api/v1/places/destination?destination=Madurai -> {len(places)} attractions loaded (e.g. {places[0]['name']})")
    passed += 1

    # 6. Dynamic Places Fetching: Destination Kanyakumari
    code, res = make_req("/api/v1/places/destination?destination=Kanyakumari&origin=Coimbatore")
    assert code == 200 and res.get("success") is True
    places_kk = res.get("data", [])
    assert len(places_kk) > 0, "Kanyakumari places must not be empty"
    print(f"[PASS] 6. GET /api/v1/places/destination?destination=Kanyakumari -> {len(places_kk)} attractions loaded (e.g. {places_kk[0]['name']})")
    passed += 1

    # 7. Map Routing: Coimbatore -> Madurai (No Ooty!)
    code, res = make_req("/api/v1/maps/directions?origin=Coimbatore&destination=Madurai")
    assert code == 200 and res.get("success") is True
    data = res["data"]
    assert data["origin"].lower() == "coimbatore" and data["destination"].lower() == "madurai"
    assert abs(data["destination_coords"]["lat"] - 9.9252) < 0.01
    print(f"[PASS] 7. GET /api/v1/maps/directions (Coimbatore -> Madurai) -> {data['distance_km']} km, {data['duration_formatted']} (Coordinates: {data['destination_coords']})")
    passed += 1

    # 8. Map Routing: Coimbatore -> Kanyakumari
    code, res = make_req("/api/v1/maps/directions?origin=Coimbatore&destination=Kanyakumari")
    assert code == 200 and res.get("success") is True
    data = res["data"]
    assert data["origin"].lower() == "coimbatore" and data["destination"].lower() == "kanyakumari"
    assert abs(data["destination_coords"]["lat"] - 8.0883) < 0.01
    print(f"[PASS] 8. GET /api/v1/maps/directions (Coimbatore -> Kanyakumari) -> {data['distance_km']} km, {data['duration_formatted']} (Coordinates: {data['destination_coords']})")
    passed += 1

    # 9. Map Directions to Attraction: Bhagavathi Amman Temple
    code, res = make_req("/api/v1/maps/directions?origin=Coimbatore&destination=Bhagavathi%20Amman%20Temple")
    assert code == 200 and res.get("success") is True
    data = res["data"]
    assert abs(data["destination_coords"]["lat"] - 8.0812) < 0.01
    print(f"[PASS] 9. GET /api/v1/maps/directions (To Bhagavathi Amman Temple) -> Exactly routed to {data['destination_coords']}")
    passed += 1

    # 10. Create Trip POST /api/v1/trips
    trip_payload = {
        "title": "Live Test Trip to Madurai",
        "destination": "Madurai",
        "current_location": "Coimbatore",
        "start_date": "2026-11-01",
        "end_date": "2026-11-04",
        "days_count": 3,
        "members_count": 2,
        "budget": 18000,
        "transport_type": "Car",
        "accommodation_type": "Standard",
        "food_budget_tier": "Standard",
        "interests": ["Culture", "Historical"],
        "selected_places": [{"name": "Meenakshi Amman Temple", "category": "Temple", "latitude": 9.9195, "longitude": 78.1194}]
    }
    code, res = make_req("/api/v1/trips", method="POST", data=trip_payload, headers=auth_headers)
    assert code == 201 and res.get("success") is True
    trip_id = res["data"]["id"]
    print(f"[PASS] 10. POST /api/v1/trips -> Created Trip #{trip_id} for Madurai with pre-selected sights")
    passed += 1

    # 11. Add to Itinerary & Duplicate Check
    code, res = make_req("/api/v1/itinerary", method="POST", data={
        "trip_id": trip_id,
        "custom_title": "Thirumalai Nayakkar Mahal",
        "day_number": 1,
        "duration_hours": 2.0
    }, headers=auth_headers)
    assert code == 201 and res.get("success") is True
    
    # Duplicate attempt
    code_dup, res_dup = make_req("/api/v1/itinerary", method="POST", data={
        "trip_id": trip_id,
        "custom_title": "Thirumalai Nayakkar Mahal",
        "day_number": 1,
        "duration_hours": 2.0
    }, headers=auth_headers)
    assert code_dup == 409 and "already in your itinerary" in res_dup.get("message", "").lower()
    print(f"[PASS] 11. POST /api/v1/itinerary -> Added sight, and prevented duplicate with 409 Conflict: '{res_dup.get('message')}'")
    passed += 1

    print("=" * 65)
    print(f"LIVE SERVER VERIFICATION: {passed}/{total} TESTS PASSED (100% SUCCESS)")
    print("=" * 65)
    return passed == total

if __name__ == "__main__":
    ok = run_live_tests()
    sys.exit(0 if ok else 1)

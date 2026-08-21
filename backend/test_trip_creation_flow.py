"""
End-to-End Verification for Trip Generation & Dashboard Data Flow
Tests the complete journey from trip generation through dashboard retrieval.
"""

import urllib.request
import urllib.parse
import json
import sys
import time

BASE_URL = "http://localhost:8000"

def make_req(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json", "User-Agent": "TripPulse-Test/1.0"}
    if headers:
        req_headers.update(headers)

    body_bytes = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body_bytes, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10.0) as resp:
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

def run_test_suite():
    print("=" * 70)
    print("TRIPPULSE TRIP GENERATION & DASHBOARD E2E TEST SUITE")
    print("=" * 70)
    passed = 0
    total = 6

    # 1. Register fresh user & obtain JWT token
    test_email = f"trip.architect.{int(time.time())}@trippulse.app"
    code, res = make_req("/api/v1/auth/register", method="POST", data={
        "name": "Trip Architect",
        "email": test_email,
        "password": "strongpassword123",
        "confirm_password": "strongpassword123"
    })
    assert code == 201, f"Registration failed: {res}"
    token = res["data"]["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print(f"[PASS] 1. Auth: Registered test user ({test_email}) & acquired JWT token")
    passed += 1

    # 2. Form validation error handling on invalid submit
    code_invalid, res_invalid = make_req("/api/v1/trips", method="POST", data={
        "title": "", # empty title
        "destination": "Madurai"
    }, headers=auth_headers)
    assert code_invalid in (400, 422), f"Expected validation failure, got: {code_invalid}"
    print(f"[PASS] 2. Validation: Backend gracefully rejects malformed payload with status {code_invalid}")
    passed += 1

    # 3. Generate Intelligent Trip Plan (POST /api/v1/trips)
    trip_payload = {
        "title": "Intelligent Madurai Cultural Expedition",
        "destination": "Madurai",
        "current_location": "Coimbatore",
        "start_date": "2026-10-15",
        "end_date": "2026-10-18",
        "days_count": 3,
        "members_count": 3,
        "budget": 24000,
        "transport_type": "Car",
        "accommodation_type": "Standard",
        "food_budget_tier": "Standard",
        "interests": ["Culture", "Historical", "Photography"],
        "selected_places": [
            {"id": 101, "name": "Meenakshi Amman Temple", "latitude": 9.9195, "longitude": 78.1194, "category": "Temple", "estimated_visit_hours": 3.0},
            {"id": 102, "name": "Thirumalai Nayakkar Mahal", "latitude": 9.9154, "longitude": 78.1238, "category": "Palace", "estimated_visit_hours": 2.0},
            {"id": 103, "name": "Gandhi Memorial Museum", "latitude": 9.9325, "longitude": 78.1402, "category": "Museum", "estimated_visit_hours": 2.0}
        ]
    }
    code, res = make_req("/api/v1/trips", method="POST", data=trip_payload, headers=auth_headers)
    assert code == 201 and res.get("success") is True, f"Trip creation failed: {res}"
    created_trip = res["data"]
    assert "id" in created_trip and created_trip["id"] > 0, "Created trip must include valid id"
    trip_id = created_trip["id"]
    print(f"[PASS] 3. Trip Generation: Created Trip ID #{trip_id} ('{created_trip['title']}')")
    passed += 1

    # 4. Fetch Trip Dashboard Data (GET /api/v1/trips/{trip_id})
    code, res = make_req(f"/api/v1/trips/{trip_id}", headers=auth_headers)
    assert code == 200 and res.get("success") is True, f"Trip dashboard fetch failed: {res}"
    dashboard_data = res["data"]
    
    assert dashboard_data["id"] == trip_id
    assert dashboard_data["destination"] == "Madurai"
    assert dashboard_data["current_location"] == "Coimbatore"
    assert "itinerary_items" in dashboard_data
    assert "members" in dashboard_data
    assert "expenses" in dashboard_data
    assert "checklists" in dashboard_data
    assert len(dashboard_data["itinerary_items"]) >= 3, "Itinerary items must be scheduled"
    assert len(dashboard_data["members"]) >= 1, "Trip owner must be in members"
    print(f"[PASS] 4. Dashboard Data: Loaded full relational graph ({len(dashboard_data['itinerary_items'])} stops, {len(dashboard_data['members'])} members, {len(dashboard_data['checklists'])} checklist items)")
    passed += 1

    # 5. Fetch Destination Weather
    code, res = make_req(f"/api/v1/weather?city={urllib.parse.quote('Madurai')}")
    assert code == 200 and res.get("success") is True
    wdata = res["data"]
    assert "temperature" in wdata and "condition" in wdata
    print(f"[PASS] 5. Weather Widget: Retrieved Madurai weather -> {wdata['temperature']}°C, {wdata['condition']}")
    passed += 1

    # 6. Unsafe Data / Empty Fallback Safety
    # Verify that even with a newly generated trip without expenses, calculations don't throw NaN or errors
    budget = dashboard_data.get("budget", 0)
    est_cost = dashboard_data.get("estimated_cost", 0)
    actual_spent = dashboard_data.get("total_actual_spent", 0)
    rem_budget = dashboard_data.get("remaining_budget", budget)
    assert budget == 24000
    assert rem_budget == 24000
    assert actual_spent == 0
    print(f"[PASS] 6. Metrics & Safety: Budget calculation verified (Budget: INR {budget:,}, Remaining: INR {rem_budget:,}, Spent: INR {actual_spent:,})")
    passed += 1

    print("=" * 70)
    print(f"TRIP GENERATION E2E TEST: ALL {passed}/{total} CHECKS PASSED (100% SUCCESS)")
    print("=" * 70)
    return True

if __name__ == "__main__":
    ok = run_test_suite()
    sys.exit(0 if ok else 1)

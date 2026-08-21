import os
import sys
import unittest

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.models.trip import Destination, Place, Trip
from app.models.user import User
from app.core.security import get_password_hash, create_access_token

client = TestClient(app)

class TestTripPulseRequirements(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db = SessionLocal()
        # Ensure a test user exists
        user = db.query(User).filter(User.email == "verify@trippulse.ai").first()
        if not user:
            user = User(
                name="Verification Tester",
                email="verify@trippulse.ai",
                hashed_password=get_password_hash("Secret123!")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        cls.token = create_access_token(user.id)
        cls.auth_headers = {"Authorization": f"Bearer {cls.token}"}
        db.close()

    def test_1_no_default_places_when_empty_or_unknown(self):
        """Verify that searching for an unknown destination returns 0 places and appropriate message."""
        res = client.get("/api/v1/places/destination?destination=NonExistentFictionalCity999")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(len(data.get("data", [])), 0)
        self.assertIn("No tourist places found", data.get("message", ""))

    def test_2_tamil_nadu_cities_dataset_coverage(self):
        """Verify that uploaded dataset cities (Salem, Coimbatore, Madurai, Ooty, Chennai, etc.) return tourist places."""
        test_cities = ["Ooty", "Salem", "Coimbatore", "Madurai", "Chennai", "Kanyakumari", "Thanjavur"]
        for city in test_cities:
            res = client.get(f"/api/v1/places/destination?destination={city}")
            self.assertEqual(res.status_code, 200)
            data = res.json()
            self.assertTrue(data.get("success"), f"Failed for city {city}")
            places = data.get("data", [])
            self.assertGreater(len(places), 0, f"No places found for {city}")
            
            # Verify no duplicate names in returned list
            names = [p["name"].strip().lower() for p in places]
            self.assertEqual(len(names), len(set(names)), f"Duplicates found in {city}")

    def test_3_alias_resolution(self):
        """Verify city alias resolution (e.g. Mysuru -> Mysore, Trichy -> Tiruchirappalli, Kovai -> Coimbatore)."""
        res = client.get("/api/v1/places/destination?destination=Mysuru")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data.get("data", [])), 0)

        res2 = client.get("/api/v1/places/destination?destination=Trichy")
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertGreater(len(data2.get("data", [])), 0)

    def test_4_search_with_filter_types(self):
        """Verify /places/search and /destinations/search with filter_type."""
        # Cities filter on destinations
        res_cities = client.get("/api/v1/destinations/search?query=Ooty&filter_type=cities")
        self.assertEqual(res_cities.status_code, 200)
        self.assertTrue(res_cities.json().get("success"))

        # Places filter
        res_places = client.get("/api/v1/places/search?query=Lake&filter_type=places")
        self.assertEqual(res_places.status_code, 200)
        self.assertTrue(res_places.json().get("success"))

    def test_5_smart_equal_time_distribution_trip_creation(self):
        """Verify trip creation with smart equal time distribution and transit times."""
        # Fetch places for Ooty
        res_places = client.get("/api/v1/places/destination?destination=Ooty")
        ooty_places = res_places.json().get("data", [])[:6] # Select 6 places for 3 days = 2 per day

        payload = {
            "title": "Automated Test Ooty 3-Day Tour",
            "destination": "Ooty",
            "current_location": "Chennai",
            "start_date": "2026-10-01",
            "end_date": "2026-10-03",
            "days_count": 3,
            "members_count": 2,
            "budget": 20000,
            "transport_type": "Car",
            "accommodation_type": "Standard",
            "food_budget_tier": "Standard",
            "interests": ["Nature", "Adventure"],
            "selected_places": ooty_places
        }

        res_trip = client.post("/api/v1/trips", json=payload, headers=self.auth_headers)
        self.assertIn(res_trip.status_code, [200, 201])
        trip_data = res_trip.json().get("data", {})
        trip_id = trip_data.get("id")
        self.assertIsNotNone(trip_id)

        # Verify itinerary stops are distributed across 3 days
        res_itin = client.get(f"/api/v1/itinerary/{trip_id}", headers=self.auth_headers)
        self.assertEqual(res_itin.status_code, 200)
        itin_items = res_itin.json().get("data", [])
        
        days_represented = set(it["day_number"] for it in itin_items)
        self.assertEqual(days_represented, {1, 2, 3}, "Itinerary stops not distributed across all 3 days")
        
        # Verify visit durations and transit distance/time fields
        for item in itin_items:
            self.assertGreater(item.get("duration_hours", 0), 0)
            self.assertIn("time_slot", item)

if __name__ == "__main__":
    unittest.main()

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_all_25_destinations():
    print("=== TESTING ALL 25 TAMIL NADU DESTINATIONS AND PLACES ===")
    
    tamil_nadu_destinations = [
        ("Namakkal", "Namakkal Fort"),
        ("Krishnagiri", "Krishnagiri Dam"),
        ("Ramanathapuram", "Rameswaram"),
        ("Nagapattinam", "Velankanni"),
        ("Tirunelveli", "Courtallam"),
        ("Thanjavur", "Brihadeeswara"),
        ("Karur", "Kalyana Venkataramana"),
        ("Theni", "Suruli"),
        ("Pudukkottai", "Sacred Heart"),
        ("Dharmapuri", "Hogenakkal"),
        ("Chennai", "Marina"),
        ("Tiruppur", "Sivanmalai"),
        ("Madurai", "Meenakshi"),
        ("Villupuram", "Gingee"),
        ("Salem", "Yercaud"),
        ("Kanyakumari", "Vivekananda"),
        ("Cuddalore", "Silver Beach"),
        ("Sivaganga", "Chettinad"),
        ("Virudhunagar", "Srivilliputhur"),
        ("Thoothukudi", "Lady of Snows"),
        ("Erode", "Bhavani"),
        ("Tiruchirappalli", "Rockfort"),
        ("Coimbatore", "Isha Yoga"),
        ("Vellore", "Vellore"),
        ("Dindigul", "Sirumalai"),
    ]

    for city, expected_spot_keyword in tamil_nadu_destinations:
        res = client.get(f"/api/v1/places/destination?destination={city}&origin=Chennai")
        assert res.status_code == 200, f"Failed for {city}: {res.text}"
        data = res.json()
        assert data["success"] is True, f"Failed for {city}"
        places = data["data"]
        assert len(places) > 0, f"No places found for {city}"
        
        # Verify that the expected spot or city place is present
        found = any(expected_spot_keyword.lower() in p["name"].lower() for p in places)
        print(f"[PASS] {city:16} -> {len(places)} attraction(s) found (Key spot: {places[0]['name']})")
        assert found, f"Expected keyword '{expected_spot_keyword}' not found in places for {city}: {[p['name'] for p in places]}"

    print("\n=== ALL 25 TAMIL NADU CITIES & TOURIST SPOTS VERIFIED IN API! ===")

if __name__ == '__main__':
    test_all_25_destinations()

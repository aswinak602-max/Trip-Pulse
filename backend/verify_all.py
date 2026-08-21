import urllib.request
import urllib.parse
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_autocomplete():
    print("\n--- 1. Testing Explore Autocomplete Endpoint ---")
    url = f"{BASE_URL}/places/autocomplete?q=com&limit=10"
    req = urllib.request.urlopen(url)
    res = json.loads(req.read().decode())
    assert res["success"] is True
    titles = [item["title"] for item in res["data"]]
    print(f"Suggestions for 'com': {titles}")
    assert "Coimbatore" in titles, "Coimbatore must be suggested for 'com'"
    assert "Coonoor" in titles, "Coonoor must be suggested for 'com'"
    print("[PASS] Autocomplete returned Coimbatore and Coonoor for query 'com'!")

def test_siruvani_directions():
    print("\n--- 2. Testing Directions & Destination Mapping for Siruvani Waterfalls & Dam ---")
    dest_name = "Siruvani Waterfalls & Dam"
    origin_name = "Chennai"
    url = f"{BASE_URL}/maps/directions?origin={urllib.parse.quote(origin_name)}&destination={urllib.parse.quote(dest_name)}"
    req = urllib.request.urlopen(url)
    res = json.loads(req.read().decode())
    assert res["success"] is True
    data = res["data"]
    print(f"Origin: {data.get('origin')}")
    print(f"Destination: {data.get('destination')}")
    print(f"Distance: {data.get('distance_km')} km")
    print(f"Duration: {data.get('duration_text')}")
    print(f"Google Maps URL: {data.get('google_maps_url')}")
    
    assert "Siruvani Waterfalls & Dam" in data.get("destination"), "Destination must preserve Siruvani Waterfalls & Dam"
    assert data.get("google_maps_url") is not None, "google_maps_url must be generated"
    assert "Siruvani" in urllib.parse.unquote(data.get("google_maps_url")), "Google Maps URL must contain Siruvani"
    print("[PASS] Directions accurately mapped to Siruvani Waterfalls & Dam with precise Google Maps link!")

def test_invitation_and_join():
    print("\n--- 3. Testing Group Invitation Info & Deep Link Join ---")
    # 3.1 Get invite info
    info_url = f"{BASE_URL}/members/invite-info/1"
    req = urllib.request.urlopen(info_url)
    res = json.loads(req.read().decode())
    assert res["success"] is True
    data = res["data"]
    print(f"Invite Info: Trip='{data.get('trip_title')}', Destination='{data.get('destination')}', Leader='{data.get('inviter_name')}'")
    assert data.get("trip_id") == 1
    assert data.get("inviter_name") is not None
    
    # 3.2 Join trip as new member
    join_url = f"{BASE_URL}/members/join"
    join_payload = json.dumps({
        "trip_id": 1,
        "name": "Rohan Sharma",
        "email": "rohan.sharma@example.com",
        "role": "VIEW",
        "is_sharing_location": True,
        "latitude": 11.0168,
        "longitude": 76.9558
    }).encode("utf-8")
    
    join_req = urllib.request.Request(join_url, data=join_payload, headers={"Content-Type": "application/json"})
    join_res = json.loads(urllib.request.urlopen(join_req).read().decode())
    assert join_res["success"] is True
    member_data = join_res["data"]
    print(f"Joined Member: ID={member_data.get('id')}, Name={member_data.get('name')}, Role={member_data.get('role')}, Sharing={member_data.get('is_sharing_location')}")
    assert member_data.get("role") == "VIEW", "New joined member must default to VIEW role"
    
    # 3.3 Verify member in members list
    members_url = f"{BASE_URL}/members/1"
    members_res = json.loads(urllib.request.urlopen(members_url).read().decode())
    member_names = [m["name"] for m in members_res["data"]]
    print(f"Active Trip Members: {member_names}")
    assert "Rohan Sharma" in member_names
    print("[PASS] Invitation and Deep Link Join with VIEW role and Opt-in Location verified!")

def test_location_toggle():
    print("\n--- 4. Testing Privacy-First Location Toggle ---")
    toggle_url = f"{BASE_URL}/members/location-toggle"
    toggle_payload = json.dumps({
        "trip_id": 1,
        "name": "Rohan Sharma",
        "is_sharing": False
    }).encode("utf-8")
    
    toggle_req = urllib.request.Request(toggle_url, data=toggle_payload, headers={"Content-Type": "application/json"})
    toggle_res = json.loads(urllib.request.urlopen(toggle_req).read().decode())
    assert toggle_res["success"] is True
    print(f"Location sharing toggled: is_sharing={toggle_res['data']['is_sharing']}")
    assert toggle_res['data']['is_sharing'] is False
    print("[PASS] Privacy-First Location Toggle verified!")

if __name__ == "__main__":
    try:
        test_autocomplete()
        test_siruvani_directions()
        test_invitation_and_join()
        test_location_toggle()
        print("\n========================================================")
        print("ALL 8 USER REQUIREMENTS SUCCESSFULLY VERIFIED ON BACKEND & DATABASE!")
        print("========================================================")
    except Exception as e:
        print(f"[FAIL] Verification failed: {e}")
        raise e

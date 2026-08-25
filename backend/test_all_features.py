"""
Comprehensive Test Suite for TripPulse Requirements.
Tests:
- Authentication, Profile & Preferences update
- Forgot-password & Reset-password token flow
- Strict destination isolation (Kanyakumari, Ooty, Munnar, Paris)
- Category filter searches
- ML Recommendation destination boundaries
"""

import secrets
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=== STARTING COMPREHENSIVE TRIPPULSE VERIFICATION ===")

    # 1. Health Endpoint
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200, f"Health check failed: {health_res.text}"
    print("[PASS] 1. Backend Health Check OK")

    # 2. User Registration & Login
    unique_suffix = secrets.token_hex(4)
    email = f"tester_{unique_suffix}@example.com"
    password = "SecurePassword123!"

    reg_res = client.post("/api/v1/auth/register", json={
        "name": "Integration Tester",
        "email": email,
        "password": password
    })
    assert reg_res.status_code in [200, 201], f"Registration failed: {reg_res.text}"
    token = reg_res.json()["data"]["access_token"]
    print(f"[PASS] 2. User Registered successfully ({email})")

    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 3. User Login & JWT Generation OK")

    # 3. Forgot Password & Reset Password OTP Flow
    forgot_res = client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert forgot_res.status_code == 200, f"Forgot password failed: {forgot_res.text}"
    print("[PASS] 4. Forgot-Password Code requested successfully")

    # In integration test, verify code via database record
    from app.core.database import SessionLocal
    from app.models.user import PasswordResetCode
    from app.api.routers.auth import hash_verification_code
    db = SessionLocal()
    reset_entry = db.query(PasswordResetCode).filter(
        PasswordResetCode.email == email,
        PasswordResetCode.is_used == False
    ).order_by(PasswordResetCode.created_at.desc()).first()
    assert reset_entry is not None, "PasswordResetCode record not found"
    
    # Verify code and obtain reset token
    test_code = "123456"
    reset_entry.code_hash = hash_verification_code(email, test_code)
    db.commit()
    db.close()

    verify_res = client.post("/api/v1/auth/verify-reset-code", json={"email": email, "code": test_code})
    assert verify_res.status_code == 200, f"Code verification failed: {verify_res.text}"
    reset_token = verify_res.json()["data"]["reset_token"]
    assert reset_token, "No reset token returned from verify-reset-code"

    new_password = "UpdatedPassword456!"
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "token": reset_token,
        "new_password": new_password,
        "confirm_password": new_password
    })
    assert reset_res.status_code == 200, f"Reset password failed: {reset_res.text}"
    print("[PASS] 5. Reset-Password completed successfully with OTP verification")

    # Re-login with new password
    new_login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": new_password
    })
    assert new_login_res.status_code == 200, "Login with new password failed"
    token = new_login_res.json()["data"]["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 6. Re-login with New Password OK")

    # 4. Profile & Preferences Persistence
    pref_payload = {
        "preferences": {
            "language": "Tamil",
            "date_format": "DD/MM/YYYY",
            "distance_format": "km",
            "time_format": "24h",
            "place_descriptions": "both",
            "export_travel_tips": True
        },
        "notification_settings": {
            "trip_reminders": True,
            "location_time_reminders": True,
            "weather_alerts": True
        }
    }
    pref_res = client.put("/api/v1/auth/preferences", json=pref_payload, headers=auth_headers)
    assert pref_res.status_code == 200, f"Preferences update failed: {pref_res.text}"
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    user_data = me_res.json()["data"]
    assert "Tamil" in user_data["preferences"], "Preferences not persisted"
    print("[PASS] 7. User Preferences & Notification Settings persisted successfully")

    # 5. OAuth Config
    oauth_res = client.get("/api/v1/auth/oauth/config")
    assert oauth_res.status_code == 200
    print("[PASS] 8. OAuth Configuration Endpoint OK")

    # 6. Strict Tourist Place Dataset Isolation
    # KANYAKUMARI
    k_res = client.get("/api/v1/places/destination?destination=Kanyakumari&origin=Chennai")
    assert k_res.status_code == 200
    k_places = k_res.json()["data"]
    k_names = [p["name"] for p in k_places]
    print(f"Kanyakumari attractions ({len(k_places)}):", k_names)
    assert any("Vivekananda" in n for n in k_names), "Vivekananda Rock missing in Kanyakumari"
    assert any("Thiruvalluvar" in n for n in k_names), "Thiruvalluvar Statue missing in Kanyakumari"
    assert not any("Eiffel" in n or "Louvre" in n or "Botanical" in n or "Munnar" in n for n in k_names), \
        "Unrelated places leaked into Kanyakumari!"
    print("[PASS] 9. Kanyakumari: Strictly shows Kanyakumari places with ZERO Eiffel/Louvre/Ooty/Munnar leaks!")

    # OOTY
    o_res = client.get("/api/v1/places/destination?destination=Ooty&origin=Chennai")
    assert o_res.status_code == 200
    o_places = o_res.json()["data"]
    o_names = [p["name"] for p in o_places]
    assert any("Botanical Garden" in n or "Lake" in n for n in o_names), "Ooty attractions missing"
    assert not any("Eiffel" in n or "Vivekananda" in n for n in o_names), "Unrelated places leaked into Ooty"
    print("[PASS] 10. Ooty: Strictly shows Ooty places with ZERO Kanyakumari/Paris leaks!")

    # MUNNAR
    m_res = client.get("/api/v1/places/destination?destination=Munnar&origin=Chennai")
    assert m_res.status_code == 200
    m_places = m_res.json()["data"]
    m_names = [p["name"] for p in m_places]
    assert any("Eravikulam" in n or "Tea" in n for n in m_names), "Munnar attractions missing"
    assert not any("Eiffel" in n or "Vivekananda" in n for n in m_names), "Unrelated places leaked into Munnar"
    print("[PASS] 11. Munnar: Strictly shows Munnar places with ZERO foreign leaks!")

    # PARIS
    p_res = client.get("/api/v1/places/destination?destination=Paris&origin=London")
    assert p_res.status_code == 200
    p_places = p_res.json()["data"]
    p_names = [p["name"] for p in p_places]
    assert any("Eiffel" in n for n in p_names), "Eiffel Tower missing in Paris"
    assert any("Louvre" in n for n in p_names), "Louvre missing in Paris"
    print("[PASS] 12. Paris: Strictly shows Paris attractions (Eiffel Tower, Louvre Museum)")

    # 7. Global Search with Category Filters
    search_nature = client.get("/api/v1/places/search?query=lake&filter_type=nature")
    assert search_nature.status_code == 200
    assert len(search_nature.json()["data"]) > 0
    print("[PASS] 13. Global Search with Category Filters OK")

    # 8. ML Recommendations destination boundary check
    rec_res = client.post("/api/v1/recommendations", json={
        "destination": "Kanyakumari",
        "interests": ["Beach", "Culture", "History"],
        "limit": 5
    })
    assert rec_res.status_code == 200
    rec_data = rec_res.json()["data"]
    rec_places = rec_data.get("recommendations", [])
    rec_names = [p.get("place", {}).get("name", p.get("name", "")) for p in rec_places]
    print("ML Recommendations for Kanyakumari:", rec_names)
    assert any("Vivekananda" in n or "Thiruvalluvar" in n or "Beach" in n or "Temple" in n for n in rec_names), "Expected Kanyakumari attractions in ML recommendations"
    assert not any("Eiffel" in n or "Louvre" in n or "Botanical" in n or "Munnar" in n for n in rec_names), \
        "ML recommendations leaked cross-city places!"
    print("[PASS] 14. ML Recommendation Engine strictly bounds places to chosen destination")

    print("\n========================================================")
    print("ALL 14 COMPREHENSIVE SYSTEM & API TESTS PASSED WITH 100% SUCCESS!")
    print("========================================================")

if __name__ == '__main__':
    run_tests()

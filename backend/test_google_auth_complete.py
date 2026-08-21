"""
Comprehensive verification test script for TripPulse Google OAuth & Authentication System.
Tests:
1. Database schema compatibility & google_id column.
2. /auth/oauth/config endpoint.
3. Standard email & password registration and login.
4. Proper rejection of unverified/invalid Google credentials.
5. User creation on Google Sign-In with verified data.
6. User linking when Google user logs in again or with existing email.
7. JWT token session creation & /auth/me authentication.
8. Account cleanup.
"""

import sys
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal, ensure_schema_compatibility, engine
from app.models.user import User
from app.core.security import get_password_hash

client = TestClient(app)

class TestGoogleAuthFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure schema compatibility has run
        ensure_schema_compatibility()

    def setUp(self):
        self.db = SessionLocal()
        # Clean up test users if existing
        self.db.query(User).filter(User.email.in_([
            "standard.testuser@trippulse.app",
            "google.newuser@trippulse.app",
            "google.linkuser@trippulse.app"
        ])).delete(synchronize_session=False)
        self.db.commit()

    def tearDown(self):
        self.db.query(User).filter(User.email.in_([
            "standard.testuser@trippulse.app",
            "google.newuser@trippulse.app",
            "google.linkuser@trippulse.app"
        ])).delete(synchronize_session=False)
        self.db.commit()
        self.db.close()

    def test_01_schema_has_google_id(self):
        """Verify the database schema contains the google_id column."""
        from sqlalchemy import text
        with engine.connect() as conn:
            res = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            col_names = [row[1] for row in res]
            self.assertIn("google_id", col_names, "google_id column should exist on users table")
            self.assertIn("email", col_names)
            self.assertIn("hashed_password", col_names)
            print("[PASS] Schema contains google_id and all required columns.")

    def test_02_oauth_config_endpoint(self):
        """Verify the /auth/oauth/config endpoint returns proper structure."""
        resp = client.get("/api/v1/auth/oauth/config")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        config_data = data.get("data", {})
        self.assertIn("google_enabled", config_data)
        self.assertIn("google_client_id", config_data)
        self.assertIn("google_redirect_uri", config_data)
        print(f"[PASS] OAuth config endpoint response verified: {config_data}")

    def test_03_standard_email_password_login_works(self):
        """Verify standard email/password registration and login remain 100% functional."""
        # 1. Register
        reg_payload = {
            "name": "Standard Test Traveler",
            "email": "standard.testuser@trippulse.app",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!"
        }
        reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
        self.assertEqual(reg_resp.status_code, 201)
        reg_data = reg_resp.json()
        self.assertTrue(reg_data.get("success"))
        self.assertIn("access_token", reg_data["data"])
        
        # 2. Login
        login_payload = {
            "email": "standard.testuser@trippulse.app",
            "password": "SecurePassword123!"
        }
        login_resp = client.post("/api/v1/auth/login", json=login_payload)
        self.assertEqual(login_resp.status_code, 200)
        login_data = login_resp.json()
        self.assertTrue(login_data.get("success"))
        token = login_data["data"]["access_token"]
        
        # 3. Test /auth/me with JWT
        me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["data"]["email"], "standard.testuser@trippulse.app")
        print("[PASS] Standard email/password registration and login working seamlessly.")

    def test_04_rejects_invalid_or_fake_google_tokens(self):
        """Verify server rejects fake or malformed Google tokens and does not trust plain text email."""
        # Request with bogus credential
        resp = client.post("/api/v1/auth/google", json={
            "provider": "google",
            "credential": "bogus.invalid.jwt.token"
        })
        self.assertEqual(resp.status_code, 401)
        self.assertFalse(resp.json().get("success"))

        # Request with empty payload
        resp_empty = client.post("/api/v1/auth/google", json={
            "provider": "google"
        })
        self.assertEqual(resp_empty.status_code, 401)
        print("[PASS] Server securely rejects invalid credentials and unauthenticated requests.")

    @patch("app.api.routers.auth.verify_google_id_token")
    def test_05_google_login_creates_new_user_and_session(self, mock_verify):
        """Verify Google Sign-In automatically creates new user, sets google_id, and issues JWT."""
        mock_verify.return_value = {
            "sub": "google-sub-1092384756",
            "email": "google.newuser@trippulse.app",
            "name": "Google Explorer",
            "picture": "https://lh3.googleusercontent.com/a/test-avatar"
        }

        resp = client.post("/api/v1/auth/google", json={
            "provider": "google",
            "credential": "valid_mocked_google_id_token"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertIn("access_token", data["data"])
        user_info = data["data"]["user"]
        self.assertEqual(user_info["email"], "google.newuser@trippulse.app")
        self.assertEqual(user_info["name"], "Google Explorer")
        self.assertEqual(user_info["avatar_url"], "https://lh3.googleusercontent.com/a/test-avatar")

        # Verify in database
        db_user = self.db.query(User).filter(User.email == "google.newuser@trippulse.app").first()
        self.assertIsNotNone(db_user)
        self.assertEqual(db_user.google_id, "google-sub-1092384756")
        self.assertTrue(db_user.is_verified)
        print("[PASS] Google Sign-In automatically creates verified user and returns valid session.")

    @patch("app.api.routers.auth.verify_google_id_token")
    def test_06_google_login_links_existing_account(self, mock_verify):
        """Verify Google Sign-In links to existing account with same email without creating duplicate."""
        # Pre-create user with email/password
        existing_user = User(
            name="Existing TripPulse User",
            username="linkuser",
            email="google.linkuser@trippulse.app",
            hashed_password=get_password_hash("OldPassword123!"),
            is_verified=True
        )
        self.db.add(existing_user)
        self.db.commit()
        self.db.refresh(existing_user)
        original_id = existing_user.id

        # Now authenticate with Google having the same email
        mock_verify.return_value = {
            "sub": "google-sub-linked-998877",
            "email": "google.linkuser@trippulse.app",
            "name": "Existing TripPulse User",
            "picture": "https://lh3.googleusercontent.com/a/linked-avatar"
        }

        resp = client.post("/api/v1/auth/google", json={
            "provider": "google",
            "credential": "valid_mocked_google_id_token"
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["data"]["user"]["id"], original_id)

        # Expire local DB session cache to fetch updated committed data
        self.db.expire_all()

        # Verify no duplicate was created and google_id was linked
        all_users = self.db.query(User).filter(User.email == "google.linkuser@trippulse.app").all()
        self.assertEqual(len(all_users), 1, "Duplicate user should NOT be created")
        self.assertEqual(all_users[0].google_id, "google-sub-linked-998877")
        print("[PASS] Google Sign-In safely links existing accounts without creating duplicate entries.")

    def test_07_oauth_initiation_endpoint_generates_correct_redirect(self):
        """Verify GET /api/v1/auth/google redirects to Google with exact client_id and redirect_uri."""
        resp = client.get("/api/v1/auth/google", follow_redirects=False)
        self.assertEqual(resp.status_code, 307)
        location = resp.headers.get("location", "")
        self.assertIn("accounts.google.com/o/oauth2/v2/auth", location)
        self.assertIn("client_id=1085952608505-s9le2citfoihqa7cq78pkik29qin0vdb.apps.googleusercontent.com", location)
        self.assertIn("redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fv1%2Fauth%2Fgoogle%2Fcallback", location)
        self.assertIn("response_type=code", location)
        self.assertIn("prompt=select_account", location)
        print("[PASS] GET /api/v1/auth/google initiates Google OAuth with exact parameters.")

    def test_08_oauth_callback_handles_google_error(self):
        """Verify GET /api/v1/auth/google/callback redirects to frontend with error param when Google errors."""
        resp = client.get("/api/v1/auth/google/callback?error=access_denied", follow_redirects=False)
        self.assertEqual(resp.status_code, 307)
        location = resp.headers.get("location", "")
        self.assertTrue(location.startswith("http://localhost:5174/login"))
        self.assertIn("error=access_denied", location)
        print("[PASS] GET /api/v1/auth/google/callback handles Google errors cleanly.")

    def test_09_oauth_callback_handles_missing_code(self):
        """Verify GET /api/v1/auth/google/callback redirects with missing_authorization_code when code is absent."""
        resp = client.get("/api/v1/auth/google/callback", follow_redirects=False)
        self.assertEqual(resp.status_code, 307)
        location = resp.headers.get("location", "")
        self.assertIn("error=missing_authorization_code", location)
        print("[PASS] GET /api/v1/auth/google/callback handles missing authorization code.")

    @patch("app.api.routers.auth.exchange_google_auth_code")
    def test_10_oauth_callback_successful_flow_redirects_with_token(self, mock_exchange):
        """Verify GET /api/v1/auth/google/callback creates user, JWT session, and redirects to frontend with token."""
        mock_exchange.return_value = {
            "sub": "google-sub-callback-flow-12345",
            "email": "google.callbackuser@trippulse.app",
            "name": "Callback User",
            "picture": "https://lh3.googleusercontent.com/a/cb-avatar"
        }

        resp = client.get("/api/v1/auth/google/callback?code=mock_valid_auth_code_123", follow_redirects=False)
        self.assertEqual(resp.status_code, 307)
        location = resp.headers.get("location", "")
        self.assertTrue(location.startswith("http://localhost:5174/trip-dashboard") or location.startswith("http://localhost:5174/login"))
        self.assertIn("token=", location)
        self.assertIn("oauth_token=", location)
        self.assertIn("success=true", location)

        # Cleanup created user
        self.db.query(User).filter(User.email == "google.callbackuser@trippulse.app").delete()
        self.db.commit()
        print("[PASS] GET /api/v1/auth/google/callback full flow issues JWT and redirects to frontend successfully.")

if __name__ == "__main__":
    unittest.main(verbosity=2)

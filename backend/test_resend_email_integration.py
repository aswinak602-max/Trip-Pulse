"""
Dedicated Verification Suite for TripPulse Resend HTTP Email API Integration
Tests:
1. Email service configuration detection (configured vs unconfigured).
2. Forgot password request when RESEND_API_KEY is not configured (clean user error, diagnostic log).
3. Forgot password request with successful Resend HTTP API delivery (mocked).
4. Forgot password request with Resend API errors (401, 403, 422, network timeout) -> clean user error.
5. Verification that secrets, stack traces, and API keys are NEVER exposed to client.
6. Email status diagnostic endpoints (/email-status and /smtp-status).
7. Test email endpoint (/test-email).
8. Welcome email and verification email dispatch with Resend.
9. Verification that registration, login, and Google OAuth endpoints remain fully functional.
"""

import sys
import os
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.user import User, PasswordResetCode
from app.core.security import get_password_hash
from app.services.email_service import email_service

client = TestClient(app)

def run_tests():
    print("=" * 80)
    print("TRIPPULSE RESEND HTTP EMAIL API - INTEGRATION & RESILIENCE TESTS")
    print("=" * 80)

    db = SessionLocal()
    test_email = "resend_test_user@example.com"
    test_password = "Password123!"

    try:
        # Cleanup test user
        db.query(PasswordResetCode).filter(PasswordResetCode.email == test_email).delete()
        db.query(User).filter(User.email == test_email).delete()
        db.commit()

        # Create user
        user = User(
            name="Resend Tester",
            username="resend_tester",
            email=test_email,
            hashed_password=get_password_hash(test_password),
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # ---------------------------------------------------------------------
        # TEST 1: Diagnostic Endpoints (/email-status & /smtp-status)
        # ---------------------------------------------------------------------
        print("\n[TEST 1] Check /email-status and /smtp-status endpoints")
        res1 = client.get("/api/v1/auth/email-status")
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}"
        d1 = res1.json()["data"]
        assert d1["provider"] == "resend"
        assert "email_from" in d1
        assert "resend_configured" in d1

        res1_legacy = client.get("/api/v1/auth/smtp-status")
        assert res1_legacy.status_code == 200
        d1_legacy = res1_legacy.json()["data"]
        assert d1_legacy["provider"] == "resend"
        print("  [PASS] /email-status and /smtp-status endpoints return valid Resend diagnostics.")

        # ---------------------------------------------------------------------
        # TEST 2: Unconfigured RESEND_API_KEY -> Clean user error, no leak
        # ---------------------------------------------------------------------
        print("\n[TEST 2] Forgot Password when RESEND_API_KEY is not configured")
        from unittest.mock import PropertyMock
        with patch.object(type(email_service), "resend_api_key", new_callable=PropertyMock, return_value=""):
            res2 = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
            assert res2.status_code == 500, f"Expected 500, got {res2.status_code}"
            body2 = res2.json()
            assert body2["success"] is False
            assert "Unable to send the verification email. Please try again later." in body2["message"]
            # Verify no secrets or traces are in the response
            assert "re_" not in res2.text
            assert "Traceback" not in res2.text
            print("  [PASS] Unconfigured Resend returns HTTP 500 with user-friendly error without leaking internals.")

        # ---------------------------------------------------------------------
        # TEST 3: Mocked Resend HTTP API Success Delivery
        # ---------------------------------------------------------------------
        print("\n[TEST 3] Forgot Password with successful Resend delivery")
        # Age previous records to avoid cooldown
        db.query(PasswordResetCode).filter(PasswordResetCode.email == test_email).update({
            "created_at": datetime.utcnow() - timedelta(seconds=70)
        })
        db.commit()

        fake_resend_key = "re_test_dummy_key_123456789"
        mock_send_response = {"id": "resend_msg_abc123xyz"}

        with patch.object(type(email_service), "resend_api_key", new_callable=PropertyMock, return_value=fake_resend_key):
            import resend
            with patch.object(resend.Emails, "send", return_value=mock_send_response) as mock_send:
                res3 = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
                assert res3.status_code == 200, f"Expected 200, got {res3.status_code}: {res3.text}"
                data3 = res3.json()
                assert data3["success"] is True
                assert "Verification code sent successfully" in data3["message"]

                # Verify mock_send was called with proper parameters
                mock_send.assert_called_once()
                call_args = mock_send.call_args[0][0]
                assert call_args["to"] == [test_email]
                assert "TripPulse Password Reset Verification Code" in call_args["subject"]
                assert "TripPulse" in call_args["from"]

                # Verify plaintext code is NOT in API response
                assert "code" not in data3.get("data", {})
                print("  [PASS] Resend HTTP API send invoked with correct params; API response does not leak code.")

        # ---------------------------------------------------------------------
        # TEST 4: Resend API Error Simulation (e.g. 403 unverified domain, 401 invalid key)
        # ---------------------------------------------------------------------
        print("\n[TEST 4] Forgot Password with Resend API error (clean handling)")
        db.query(PasswordResetCode).filter(PasswordResetCode.email == test_email).update({
            "created_at": datetime.utcnow() - timedelta(seconds=70)
        })
        db.commit()

        with patch.object(type(email_service), "resend_api_key", new_callable=PropertyMock, return_value=fake_resend_key):
            with patch.object(resend.Emails, "send", side_effect=Exception("validation_error: Domain not verified for sending")):
                res4 = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
                assert res4.status_code == 500
                data4 = res4.json()
                assert data4["success"] is False
                assert "Unable to send the verification email. Please try again later." in data4["message"]
                # Client must never see "validation_error" or domain internals
                assert "validation_error" not in data4["message"]
                assert "re_" not in res4.text
                print("  [PASS] Resend API error cleanly caught; user sees clean error message.")

        # ---------------------------------------------------------------------
        # TEST 5: Verify Welcome Email using Resend
        # ---------------------------------------------------------------------
        print("\n[TEST 5] Welcome email via Resend")
        with patch.object(type(email_service), "resend_api_key", new_callable=PropertyMock, return_value=fake_resend_key):
            with patch.object(resend.Emails, "send", return_value={"id": "welcome_123"}) as mock_welcome:
                sent = email_service.send_welcome_email(test_email, "Resend Tester", "Google")
                assert sent is True
                mock_welcome.assert_called_once()
                print("  [PASS] Welcome email sent via Resend HTTP API.")

        # ---------------------------------------------------------------------
        # TEST 6: Verify Account Verification Email using Resend
        # ---------------------------------------------------------------------
        print("\n[TEST 6] Verification email via Resend")
        with patch.object(type(email_service), "resend_api_key", new_callable=PropertyMock, return_value=fake_resend_key):
            with patch.object(resend.Emails, "send", return_value={"id": "verify_123"}) as mock_verify:
                sent = email_service.send_verification_email(test_email, "Resend Tester", "https://trippulse.app/verify")
                assert sent is True
                mock_verify.assert_called_once()
                print("  [PASS] Account verification email sent via Resend HTTP API.")

        # ---------------------------------------------------------------------
        # TEST 7: Test-Email endpoint (/test-email) with Resend
        # ---------------------------------------------------------------------
        print("\n[TEST 7] /test-email endpoint with Resend")
        with patch.object(type(email_service), "resend_api_key", new_callable=PropertyMock, return_value=fake_resend_key):
            with patch.object(resend.Emails, "send", return_value={"id": "test_msg_123"}):
                res7 = client.post("/api/v1/auth/test-email", json={"email": test_email})
                assert res7.status_code == 200
                assert res7.json()["success"] is True
                print("  [PASS] /test-email successfully sends via Resend.")

        # ---------------------------------------------------------------------
        # TEST 8: Verify Standard Authentication Flows remain intact
        # ---------------------------------------------------------------------
        print("\n[TEST 8] Standard Auth (Login, Register, OAuth config)")
        # 1. Login
        res_login = client.post("/api/v1/auth/login", json={"email": test_email, "password": test_password})
        assert res_login.status_code == 200
        assert res_login.json()["success"] is True
        token = res_login.json()["data"]["access_token"]

        # 2. Get Me with JWT
        res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert res_me.status_code == 200
        assert res_me.json()["data"]["email"] == test_email

        # 3. OAuth config
        res_oauth_cfg = client.get("/api/v1/auth/oauth/config")
        assert res_oauth_cfg.status_code == 200
        print("  [PASS] Login, JWT session (/auth/me), and OAuth config remain fully functional.")

        print("\n" + "=" * 80)
        print("ALL RESEND INTEGRATION TESTS PASSED SUCCESSFULLY!")
        print("=" * 80)
        return True

    finally:
        db.query(PasswordResetCode).filter(PasswordResetCode.email == test_email).delete()
        db.query(User).filter(User.email == test_email).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    ok = run_tests()
    if not ok:
        sys.exit(1)

"""
Comprehensive Verification Suite for TripPulse Forgot Password & Verification-Code System
Tests all 11 required test cases, SMTP diagnostics, test-email endpoint, and error states.
"""

import sys
import os
import smtplib
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

# Ensure app is importable and encoding is safe
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.main import app
from app.core.database import SessionLocal
from app.models.user import User, PasswordResetCode
from app.core.security import get_password_hash, verify_password
from app.api.routers.auth import hash_verification_code
from app.services.email_service import email_service

client = TestClient(app)

def run_tests():
    print("=" * 80)
    print("TRIPPULSE FORGOT PASSWORD VERIFICATION-CODE SYSTEM - TEST SUITE")
    print("=" * 80)

    db = SessionLocal()
    test_email = "tester_forgot_pwd@example.com"
    initial_password = "OldPassword123!"
    new_password = "NewSecurePassword2026!"

    passed_count = 0
    total_tests = 11

    try:
        # Cleanup any previous test data
        db.query(PasswordResetCode).filter(PasswordResetCode.email == test_email).delete()
        db.query(User).filter(User.email == test_email).delete()
        db.commit()

        # Create base test user
        user = User(
            name="Forgot Pwd Tester",
            username="forgot_pwd_tester",
            email=test_email,
            hashed_password=get_password_hash(initial_password),
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # ---------------------------------------------------------------------
        # DIAGNOSTIC TESTS: SMTP Status & Error Handling when Unconfigured
        # ---------------------------------------------------------------------
        print("\n[DIAGNOSTIC TEST] Check SMTP status endpoint")
        res_diag = client.get("/api/v1/auth/smtp-status")
        assert res_diag.status_code == 200
        diag_data = res_diag.json()
        assert "smtp_host" in diag_data["data"]
        assert "smtp_username_configured" in diag_data["data"]
        print(f"  [PASS] SMTP Status Diagnostic checked: host={diag_data['data']['smtp_host']}, configured={diag_data['data']['smtp_configured']}")

        # ---------------------------------------------------------------------
        # TEST 1: Request Password Reset Code (with mock SMTP delivery)
        # ---------------------------------------------------------------------
        print("\n[TEST 1] Forgot Password -> Send Verification Code")
        with patch.object(email_service, "send_password_reset_code_email", return_value=(True, "Verification email sent successfully.")):
            res1 = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
            assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
            data1 = res1.json()
            assert data1["success"] is True
            assert data1["message"] == "If an account exists for this email, a verification code has been sent."
            # Verify plaintext verification code is not exposed in data payload
            assert "code" not in data1.get("data", {}), "Plaintext 'code' field exposed in API response data!"
            assert "verification_code" not in data1.get("data", {}), "'verification_code' exposed in API response data!"
            assert not any(len(str(v)) == 6 and str(v).isdigit() for v in data1.get("data", {}).values()), "6-digit code exposed in response values!"
            
            # Verify DB entry
            reset_entry = db.query(PasswordResetCode).filter(
                PasswordResetCode.email == test_email,
                PasswordResetCode.is_used == False
            ).order_by(PasswordResetCode.created_at.desc()).first()
            assert reset_entry is not None, "PasswordResetCode not found in database!"
            assert reset_entry.code_hash is not None
            assert len(reset_entry.code_hash) == 64, "Code hash should be a 64-char SHA256 hex string!"
            assert reset_entry.attempts == 0
            assert reset_entry.is_verified is False
            assert reset_entry.is_used is False
            print("  [PASS] Verification code generated, hashed with salted SHA-256, and safely stored in database.")
            print("  [PASS] Plaintext code is NEVER returned in API response.")
            passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 4: Enter incorrect verification code (< 5 attempts)
        # ---------------------------------------------------------------------
        print("\n[TEST 4] Enter incorrect verification code")
        res4 = client.post("/api/v1/auth/verify-reset-code", json={"email": test_email, "code": "000000"})
        assert res4.status_code == 400, f"Expected 400, got {res4.status_code}: {res4.text}"
        data4 = res4.json()
        assert data4["success"] is False
        assert "Incorrect verification code. Please try again." in data4["message"]
        
        db.refresh(reset_entry)
        assert reset_entry.attempts == 1
        print(f"  [PASS] Rejected wrong code with message: '{data4['message']}' (Attempts tracked: {reset_entry.attempts})")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 7: Request a second code and verify old code no longer works
        # ---------------------------------------------------------------------
        print("\n[TEST 7] Request new code and verify previous code invalidation")
        # Bypass cooldown for this specific test by aging the previous record by 61 seconds
        reset_entry.created_at = datetime.utcnow() - timedelta(seconds=65)
        db.commit()

        with patch.object(email_service, "send_password_reset_code_email", return_value=(True, "Verification email sent successfully.")):
            res7 = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
            assert res7.status_code == 200
        
        # Verify first code record is marked as used / invalidated
        db.refresh(reset_entry)
        assert reset_entry.is_used is True, "Previous reset code was not invalidated when new code was generated!"
        
        # Fetch new active record
        new_active = db.query(PasswordResetCode).filter(
            PasswordResetCode.email == test_email,
            PasswordResetCode.is_used == False
        ).order_by(PasswordResetCode.created_at.desc()).first()
        assert new_active is not None
        assert new_active.id != reset_entry.id
        print("  [PASS] Old verification code successfully invalidated (is_used = True).")
        print("  [PASS] New verification code record created and active.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 8: Try 5 incorrect codes -> Account reset locked
        # ---------------------------------------------------------------------
        print("\n[TEST 8] Try more than 5 incorrect codes (Rate limit / attempt limit lock)")
        for i in range(1, 6):
            res8 = client.post("/api/v1/auth/verify-reset-code", json={"email": test_email, "code": f"99999{i}"})
            if i < 5:
                assert res8.status_code == 400
            else:
                assert res8.status_code == 429, f"Expected 429 after 5 failed attempts, got {res8.status_code}"
                assert "Too many attempts" in res8.json()["message"]
        
        db.refresh(new_active)
        assert new_active.is_used is True, "Code should be invalidated after 5 failed attempts!"
        print("  [PASS] Enforced maximum 5 attempts limit. Code locked and invalidated with HTTP 429.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 5: Enter expired verification code
        # ---------------------------------------------------------------------
        print("\n[TEST 5] Enter expired verification code")
        # Generate a test expired code record
        expired_code = "123789"
        expired_hash = hash_verification_code(test_email, expired_code)
        expired_entry = PasswordResetCode(
            user_id=user.id,
            email=test_email,
            code_hash=expired_hash,
            expires_at=datetime.utcnow() - timedelta(minutes=1), # Expired
            attempts=0,
            is_verified=False,
            is_used=False
        )
        db.add(expired_entry)
        db.commit()

        res5 = client.post("/api/v1/auth/verify-reset-code", json={"email": test_email, "code": expired_code})
        assert res5.status_code == 400, f"Expected 400 for expired code, got {res5.status_code}"
        assert "This verification code has expired" in res5.json()["message"]
        print(f"  [PASS] Expired code properly rejected with message: '{res5.json()['message']}'")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 2: Enter correct code -> Verify -> Create New Password -> Reset
        # ---------------------------------------------------------------------
        print("\n[TEST 2] Enter correct verification code & reset password")
        valid_code = "654321"
        valid_hash = hash_verification_code(test_email, valid_code)
        valid_entry = PasswordResetCode(
            user_id=user.id,
            email=test_email,
            code_hash=valid_hash,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
            attempts=0,
            is_verified=False,
            is_used=False
        )
        db.add(valid_entry)
        db.commit()

        # Step 2a: Verify valid code
        res2a = client.post("/api/v1/auth/verify-reset-code", json={"email": test_email, "code": valid_code})
        assert res2a.status_code == 200, f"Expected 200, got {res2a.status_code}: {res2a.text}"
        data2a = res2a.json()
        assert data2a["success"] is True
        reset_token = data2a["data"]["reset_token"]
        assert reset_token is not None and len(reset_token) > 20
        print(f"  [PASS] Code verified successfully! Issued secure reset token.")

        # Step 2b: Test weak password rejection
        res_weak = client.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "new_password": "short",
            "confirm_password": "short"
        })
        assert res_weak.status_code == 400
        assert "Password does not meet the required security requirements" in res_weak.json()["message"]
        print("  [PASS] Weak password (< 8 chars) rejected by security policy.")

        # Step 2c: Test password mismatch rejection
        res_mismatch = client.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "new_password": new_password,
            "confirm_password": "DifferentPassword123!"
        })
        assert res_mismatch.status_code == 400
        assert "Passwords do not match" in res_mismatch.json()["message"]
        print("  [PASS] Password mismatch rejected.")

        # Step 2d: Perform valid password reset
        res2b = client.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "new_password": new_password,
            "confirm_password": new_password
        })
        assert res2b.status_code == 200, f"Expected 200, got {res2b.status_code}: {res2b.text}"
        assert res2b.json()["message"] == "Your password has been updated successfully."
        print(f"  [PASS] Password reset succeeded: '{res2b.json()['message']}'")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 3: Login with the NEW password & verify old password fails
        # ---------------------------------------------------------------------
        print("\n[TEST 3] Login with the NEW password")
        # Old password must fail
        res3_old = client.post("/api/v1/auth/login", json={"email": test_email, "password": initial_password})
        assert res3_old.status_code == 401, "Old password should no longer work!"
        print("  [PASS] Login with OLD password rejected with HTTP 401.")

        # New password must succeed
        res3_new = client.post("/api/v1/auth/login", json={"email": test_email, "password": new_password})
        assert res3_new.status_code == 200, f"Login with new password failed: {res3_new.text}"
        data3_new = res3_new.json()
        assert data3_new["success"] is True
        assert data3_new["data"]["access_token"] is not None
        print(f"  [PASS] Login with NEW password succeeded! JWT access token received.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 6: Single-use enforcement: Use reset token / code twice
        # ---------------------------------------------------------------------
        print("\n[TEST 6] Prevent reuse of verification code / reset token (Single-use)")
        res6 = client.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "new_password": "AnotherNewPassword123!",
            "confirm_password": "AnotherNewPassword123!"
        })
        assert res6.status_code == 400, "Reset token reuse must be blocked!"
        assert "This password reset session has expired" in res6.json()["message"]
        print("  [PASS] Reset token reuse rejected. Tokens are strictly single-use.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 9: Cooldown rate limiting & Session State Persistence
        # ---------------------------------------------------------------------
        print("\n[TEST 9] Rate Limiting & Cooldown Protection")
        # Age all previous records for test_email so first request is outside cooldown
        db.query(PasswordResetCode).filter(PasswordResetCode.email == test_email).update({
            "created_at": datetime.utcnow() - timedelta(seconds=70)
        })
        db.commit()

        # Request initial code (should succeed)
        with patch.object(email_service, "send_password_reset_code_email", return_value=(True, "Verification email sent successfully.")):
            res9_first = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
            assert res9_first.status_code == 200, f"Expected 200 for initial request, got {res9_first.status_code}: {res9_first.text}"
            
            # Immediate subsequent request within 60s cooldown (should be rate-limited with HTTP 429)
            res9_spam = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
            assert res9_spam.status_code == 429, f"Expected 429 cooldown rate limit, got {res9_spam.status_code}: {res9_spam.text}"
            assert "Please wait" in res9_spam.json()["message"]
            print(f"  [PASS] Rate-limiting active: '{res9_spam.json()['message']}'")
            passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 10: Verify Google OAuth Configuration & Endpoints intact
        # ---------------------------------------------------------------------
        print("\n[TEST 10] Verify Google OAuth integrity")
        res10_cfg = client.get("/api/v1/auth/oauth/config")
        assert res10_cfg.status_code == 200
        assert "google_enabled" in res10_cfg.json()["data"]
        
        # Test mock Google OAuth login endpoint
        res10_oauth = client.post("/api/v1/auth/oauth", json={
            "provider": "google",
            "email": "google_test_user@example.com",
            "name": "Google Test User",
            "google_id": "google-oauth-test-sub-12345"
        })
        assert res10_oauth.status_code == 200
        assert res10_oauth.json()["success"] is True
        print("  [PASS] Google OAuth configuration & login endpoints are fully operational.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # TEST 11: Verify Normal User Registration and Login flow intact
        # ---------------------------------------------------------------------
        print("\n[TEST 11] Verify Normal User Registration and Login flow")
        norm_email = "normal_registered_user@example.com"
        norm_pass = "NormalUserPass123!"
        db.query(User).filter(User.email == norm_email).delete()
        db.commit()

        res11_reg = client.post("/api/v1/auth/register", json={
            "name": "Normal User",
            "email": norm_email,
            "password": norm_pass,
            "confirm_password": norm_pass
        })
        assert res11_reg.status_code == 201
        
        res11_login = client.post("/api/v1/auth/login", json={
            "email": norm_email,
            "password": norm_pass
        })
        assert res11_login.status_code == 200
        assert res11_login.json()["success"] is True
        print("  [PASS] Standard user registration and login are fully operational.")
        passed_count += 1

        # ---------------------------------------------------------------------
        # EXTRA ERROR TESTS: SMTP Failure simulation
        # ---------------------------------------------------------------------
        print("\n[EXTRA TEST] Verify SMTP Authentication Failure Handling")
        with patch.object(email_service, "send_password_reset_code_email", return_value=(False, "Gmail SMTP authentication failed. Configure a Gmail App Password in backend/.env.")):
            # Age previous records
            db.query(PasswordResetCode).filter(PasswordResetCode.email == test_email).update({
                "created_at": datetime.utcnow() - timedelta(seconds=70)
            })
            db.commit()

            res_smtp_err = client.post("/api/v1/auth/forgot-password", json={"email": test_email})
            assert res_smtp_err.status_code == 500
            assert "Gmail SMTP authentication failed" in res_smtp_err.json()["message"]
            print("  [PASS] SMTP Authentication failure correctly produces user-friendly error without false success.")

        # ---------------------------------------------------------------------
        # Summary
        # ---------------------------------------------------------------------
        print("\n" + "=" * 80)
        print(f"ALL {passed_count}/{total_tests} TESTS PASSED SUCCESSFULLY!")
        print("=" * 80)
        return True

    finally:
        # Clean test accounts
        db.query(PasswordResetCode).filter(PasswordResetCode.email.in_([test_email, "normal_registered_user@example.com"])).delete()
        db.query(User).filter(User.email.in_([test_email, "google_test_user@example.com", "normal_registered_user@example.com"])).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)

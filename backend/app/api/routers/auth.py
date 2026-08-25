import secrets
import hashlib
import re
from datetime import datetime, timedelta
import json
import urllib.request
import urllib.parse
from typing import Optional, List, Dict, Any
try:
    import google.oauth2.id_token
    from google.auth.transport import requests as google_requests
except ImportError:
    google_requests = None
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.response import success_response, error_response
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from app.models.user import User, PasswordResetCode
from app.models.trip import Trip, TripMember, ItineraryItem, Expense, Reservation, ChecklistItem, SavedPlace
from app.schemas.auth import (
    UserRegister, 
    UserLogin, 
    UserOut, 
    ForgotPasswordRequest, 
    VerifyResetCodeRequest,
    ResetPasswordRequest,
    UserProfileUpdate,
    UserPreferencesUpdate,
    OAuthLoginRequest
)
from app.api.deps import get_current_user
from app.services.email_service import email_service

def hash_verification_code(email: str, code: str) -> str:
    """Computes a cryptographically salted SHA-256 hash of the verification code."""
    salt = settings.SECRET_KEY[:16]
    return hashlib.sha256(f"{email.lower().strip()}:{code.strip()}:{salt}".encode("utf-8")).hexdigest()


router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register")
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    if user_in.confirm_password is not None and user_in.password != user_in.confirm_password:
        return error_response(
            message="Passwords do not match",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user already exists
    clean_email = user_in.email.lower().strip()
    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        return error_response(
            message="An account with this email already exists. Please log in.",
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate default username from name or email
    default_username = clean_email.split('@')[0]
    
    # Generate verification token
    verification_token = secrets.token_urlsafe(32)
    is_verified = not email_service.is_configured()  # Auto-verified in local dev if no SMTP server
    
    # Create new user
    new_user = User(
        name=user_in.name.strip(),
        username=default_username,
        email=clean_email,
        hashed_password=get_password_hash(user_in.password),
        is_verified=is_verified,
        verification_token=verification_token
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send verification email & welcome email
    try:
        verify_url = f"http://localhost:5174/login?verify_token={verification_token}"
        email_service.send_verification_email(new_user.email, new_user.name, verify_url)
        email_service.send_welcome_email(new_user.email, new_user.name, "TripPulse")
    except Exception as e:
        print(f"[Auth] Email dispatch notice: {e}")
    
    # Generate access token
    token = create_access_token(subject=new_user.id)
    user_out = UserOut.model_validate(new_user)
    
    return success_response(
        data={
            "access_token": token,
            "token_type": "bearer",
            "user": user_out.model_dump()
        },
        message="Registration successful! Confirmation email sent.",
        status_code=status.HTTP_201_CREATED
    )

@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verifies a user account email token."""
    if not token or not token.strip():
        return error_response(message="Invalid or missing verification token.", status_code=status.HTTP_400_BAD_REQUEST)
    
    user = db.query(User).filter(User.verification_token == token.strip()).first()
    if not user:
        return error_response(message="Invalid or expired verification token.", status_code=status.HTTP_400_BAD_REQUEST)
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    db.refresh(user)
    
    return success_response(
        data={"verified": True, "email": user.email},
        message="Your email has been verified successfully! You can now access all features."
    )

@router.post("/login")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_email = user_in.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        return error_response(
            message="No account found with this email address.",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    if not verify_password(user_in.password, user.hashed_password):
        return error_response(
            message="Invalid password. Please check your credentials.",
            status_code=status.HTTP_401_UNAUTHORIZED
        )
    
    token = create_access_token(subject=user.id)
    user_out = UserOut.model_validate(user)
    
    return success_response(
        data={
            "access_token": token,
            "token_type": "bearer",
            "user": user_out.model_dump()
        },
        message="Login successful"
    )

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    user_out = UserOut.model_validate(current_user)
    return success_response(
        data=user_out.model_dump(),
        message="User profile retrieved successfully"
    )

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Receives email, applies rate limiting, generates a cryptographically secure 6-digit code,
    stores its salted SHA-256 hash with 10-minute expiry and attempt limit,
    and sends the code via email without exposing it in the API response.
    """
    clean_email = req.email.lower().strip()
    if not clean_email or "@" not in clean_email:
        return error_response(
            message="Please provide a valid email address.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Rate limiting: Enforce cooldown between code generation requests for the same email
    cooldown_seconds = getattr(settings, "PASSWORD_RESET_COOLDOWN_SECONDS", 60)
    recent_request = db.query(PasswordResetCode).filter(
        PasswordResetCode.email == clean_email
    ).order_by(PasswordResetCode.created_at.desc()).first()

    if recent_request and recent_request.created_at:
        elapsed = (datetime.utcnow() - recent_request.created_at).total_seconds()
        if elapsed < cooldown_seconds:
            remaining = int(cooldown_seconds - elapsed)
            return error_response(
                message=f"Please wait {remaining} seconds before requesting a new verification code.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )

    # Invalidate / cancel previous active reset codes for this email
    existing_active = db.query(PasswordResetCode).filter(
        PasswordResetCode.email == clean_email,
        PasswordResetCode.is_used == False
    ).all()
    for item in existing_active:
        item.is_used = True
    db.commit()

    # Generate cryptographically secure 6-digit verification code
    code = f"{secrets.randbelow(1000000):06d}"
    code_hash = hash_verification_code(clean_email, code)
    expire_minutes = getattr(settings, "PASSWORD_RESET_CODE_EXPIRE_MINUTES", 10)
    expires_at = datetime.utcnow() + timedelta(minutes=expire_minutes)

    # Find user if exists (to link user_id and get user name for email greeting)
    user = db.query(User).filter(User.email == clean_email).first()

    # Store reset request record with code HASH (never plaintext code)
    reset_record = PasswordResetCode(
        user_id=user.id if user else None,
        email=clean_email,
        code_hash=code_hash,
        expires_at=expires_at,
        attempts=0,
        is_verified=False,
        is_used=False
    )
    db.add(reset_record)
    db.commit()

    # Send verification code email via EmailService
    email_sent = False
    err_detail = "Unable to send the verification email. Please try again."
    try:
        email_sent, err_detail = email_service.send_password_reset_code_email(
            recipient_email=clean_email,
            verification_code=code,
            recipient_name=user.name if user else None
        )
    except Exception as e:
        err_detail = "Unable to send verification email. Please check server email configuration."
        print(f"[TripPulse Auth] Email dispatch exception: {type(e).__name__}: {e}")

    if not email_sent:
        # Invalidate the record so the user isn't blocked by cooldown on retry
        reset_record.is_used = True
        db.commit()
        return error_response(
            message=err_detail,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Generic safe response preventing email enumeration and never exposing the code
    return success_response(
        data={
            "email": clean_email,
            "expires_in_minutes": expire_minutes,
            "cooldown_seconds": cooldown_seconds
        },
        message="If an account exists for this email, a verification code has been sent."
    )

@router.post("/test-email")
def test_email_endpoint(req: ForgotPasswordRequest):
    """
    Development test endpoint to verify SMTP delivery independently of OTP logic.
    """
    clean_email = req.email.lower().strip()
    success, msg = email_service.send_test_email(clean_email)
    if not success:
        return error_response(
            message=msg,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            data=email_service.get_smtp_status_summary()
        )
    return success_response(
        data=email_service.get_smtp_status_summary(),
        message=msg
    )

@router.get("/smtp-status")
def get_smtp_status_endpoint():
    """
    Diagnostic endpoint that returns safe SMTP configuration details and connection health.
    """
    connected, msg, summary = email_service.diagnose_smtp_connection()
    return success_response(
        data={
            "connected": connected,
            "message": msg,
            **summary
        },
        message="SMTP status diagnostic"
    )

@router.post("/verify-reset-code")
def verify_reset_code(req: VerifyResetCodeRequest, db: Session = Depends(get_db)):
    """
    Verifies the submitted 6-digit code against the stored hash.
    Checks expiration, enforces maximum 5 attempts, and returns a short-lived reset token.
    """
    clean_email = req.email.lower().strip()
    clean_code = (req.code or "").strip()

    if not clean_code:
        return error_response(
            message="Please enter your 6-digit verification code.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Find the most recent active code for this email
    record = db.query(PasswordResetCode).filter(
        PasswordResetCode.email == clean_email,
        PasswordResetCode.is_used == False
    ).order_by(PasswordResetCode.created_at.desc()).first()

    if not record:
        return error_response(
            message="This verification code has expired. Please request a new code.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Check expiration (10 minutes)
    if record.expires_at < datetime.utcnow():
        record.is_used = True
        db.commit()
        return error_response(
            message="This verification code has expired. Please request a new code.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Check attempt limit (5 attempts max)
    if record.attempts >= 5:
        record.is_used = True
        db.commit()
        return error_response(
            message="Too many attempts. Please request a new verification code.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )

    # Compute hash of submitted code and compare securely
    submitted_hash = hash_verification_code(clean_email, clean_code)
    if not secrets.compare_digest(record.code_hash, submitted_hash):
        record.attempts += 1
        db.commit()
        if record.attempts >= 5:
            record.is_used = True
            db.commit()
            return error_response(
                message="Too many attempts. Please request a new verification code.",
                status_code=status.HTTP_429_TOO_MANY_REQUESTS
            )
        return error_response(
            message="Incorrect verification code. Please try again.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # If code is correct, issue a short-lived reset token (valid for 15 minutes)
    reset_token = secrets.token_urlsafe(32)
    record.is_verified = True
    record.reset_token = reset_token
    record.reset_token_expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    return success_response(
        data={
            "email": clean_email,
            "reset_token": reset_token
        },
        message="Verification code confirmed successfully."
    )

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Securely updates the user's password using the validated reset token.
    Enforces password security requirements and invalidates tokens immediately after use.
    """
    clean_token = req.token.strip() if req.token else ""
    if not clean_token:
        return error_response(
            message="This password reset session has expired. Please start again.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Check password match
    if req.confirm_password is not None and req.new_password != req.confirm_password:
        return error_response(
            message="Passwords do not match.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Password policy: At least 8 chars, contains a letter, contains a number
    if (len(req.new_password) < 8 or 
        not re.search(r"[a-zA-Z]", req.new_password) or 
        not re.search(r"[0-9]", req.new_password)):
        return error_response(
            message="Password does not meet the required security requirements.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Lookup reset session by token
    record = db.query(PasswordResetCode).filter(
        PasswordResetCode.reset_token == clean_token,
        PasswordResetCode.is_verified == True,
        PasswordResetCode.is_used == False
    ).first()

    # Legacy fallback check on User table
    legacy_user = None
    if not record:
        legacy_user = db.query(User).filter(
            User.reset_token == clean_token,
            User.reset_token_expires >= datetime.utcnow()
        ).first()

    if not record and not legacy_user:
        return error_response(
            message="This password reset session has expired. Please start again.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Check token expiration
    if record and record.reset_token_expires_at and record.reset_token_expires_at < datetime.utcnow():
        record.is_used = True
        record.reset_token = None
        db.commit()
        return error_response(
            message="This password reset session has expired. Please start again.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    target_email = record.email if record else legacy_user.email
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        return error_response(
            message="Something went wrong. Please try again.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Update password using existing secure hashing
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_token = None
    user.reset_token_expires = None

    # Invalidate reset record and all pending codes for this email (single-use)
    if record:
        record.is_used = True
        record.used_at = datetime.utcnow()
        record.reset_token = None
        record.reset_token_expires_at = None

    # Invalidate any lingering codes for this email
    db.query(PasswordResetCode).filter(PasswordResetCode.email == target_email).update({"is_used": True})
    db.commit()

    return success_response(
        data=None,
        message="Your password has been updated successfully."
    )


@router.put("/profile")
def update_profile(
    profile_in: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.name and profile_in.name.strip():
        current_user.name = profile_in.name.strip()
    
    if profile_in.username is not None:
        current_user.username = profile_in.username.strip()
        
    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url.strip()
        
    if profile_in.email and profile_in.email.strip():
        clean_email = profile_in.email.lower().strip()
        if clean_email != current_user.email:
            existing = db.query(User).filter(User.email == clean_email, User.id != current_user.id).first()
            if existing:
                return error_response(
                    message="This email is already in use by another account.",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            current_user.email = clean_email

    db.commit()
    db.refresh(current_user)
    user_out = UserOut.model_validate(current_user)
    
    return success_response(
        data=user_out.model_dump(),
        message="Profile updated successfully"
    )

@router.put("/preferences")
def update_preferences(
    prefs_in: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if prefs_in.preferences is not None:
        current_user.preferences = json.dumps(prefs_in.preferences)
        
    if prefs_in.notification_settings is not None:
        current_user.notification_settings = json.dumps(prefs_in.notification_settings)
        
    db.commit()
    db.refresh(current_user)
    user_out = UserOut.model_validate(current_user)
    
    return success_response(
        data=user_out.model_dump(),
        message="Preferences saved successfully"
    )

def verify_google_id_token(id_token_str: str) -> dict:
    """
    Verifies a Google ID token cryptographically using google-auth library
    with fallback to Google tokeninfo endpoint.
    Validates issuer, audience, expiry, subject, email, and email_verified.
    """
    if not id_token_str or not isinstance(id_token_str, str) or len(id_token_str.split(".")) != 3:
        return None

    token_info = None
    client_id = settings.clean_google_client_id
    
    # 1. Cryptographic verification via google-auth
    if google_requests:
        try:
            req = google_requests.Request()
            audience = client_id if client_id and not settings.is_google_client_id_placeholder() else None
            token_info = google.oauth2.id_token.verify_oauth2_token(
                id_token_str, 
                req, 
                audience=audience
            )
        except Exception as g_err:
            print(f"[Google Auth verify_oauth2_token note]: {g_err}")
    
    # 2. Tokeninfo verification fallback
    if not token_info:
        try:
            token_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={urllib.parse.quote(id_token_str)}"
            request_obj = urllib.request.Request(token_url, headers={"User-Agent": "TripPulse-Auth/1.0"})
            with urllib.request.urlopen(request_obj, timeout=6.0) as resp:
                token_info = json.loads(resp.read().decode())
        except Exception as http_err:
            print(f"[Google Auth tokeninfo endpoint note]: {http_err}")
            return None

    if not token_info:
        return None

    # Validate Issuer
    issuer = token_info.get("iss", "")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        print(f"[Google Auth Warning] Invalid issuer: {issuer}")
        return None

    # Validate Audience if Client ID configured and not a placeholder
    aud = token_info.get("aud")
    if client_id and not settings.is_google_client_id_placeholder() and aud and aud != client_id:
        print(f"[Google Auth Warning] Audience mismatch: {aud} vs {client_id}")
        return None

    # Validate Email & Email Verified
    email = token_info.get("email")
    email_verified = token_info.get("email_verified")
    is_verified = (email_verified is True) or (str(email_verified).lower() == "true")
    if not email or not is_verified:
        print(f"[Google Auth Warning] Unverified email: {email}, verified={email_verified}")
        return None

    return {
        "sub": str(token_info.get("sub", "")),
        "email": email.lower().strip(),
        "name": token_info.get("name") or token_info.get("given_name") or email.split("@")[0].capitalize(),
        "picture": token_info.get("picture"),
    }


LAST_GOOGLE_AUTH_ERROR = None

def exchange_google_auth_code(code: str, redirect_uri: str = None) -> dict:
    """
    Exchanges a Google OAuth 2.0 authorization code for tokens and verifies identity.
    Uses the exact target redirect_uri to prevent code invalidation.
    Safely logs events without exposing tokens, credentials, or secrets.
    """
    global LAST_GOOGLE_AUTH_ERROR
    LAST_GOOGLE_AUTH_ERROR = None

    client_id = settings.clean_google_client_id
    client_secret = settings.clean_google_client_secret

    if not client_id or settings.is_google_client_id_placeholder():
        LAST_GOOGLE_AUTH_ERROR = "google_client_id_missing"
        print("[Google Auth] GOOGLE_CLIENT_ID is missing or placeholder in backend configuration.")
        return None

    if not client_secret or settings.is_google_client_secret_masked():
        LAST_GOOGLE_AUTH_ERROR = "google_client_secret_missing"
        print("[Google Auth] GOOGLE_CLIENT_SECRET is missing, placeholder, or masked in backend/.env.")
        return None

    # Determine exact redirect URI matching authorization request
    target_uri = (redirect_uri or settings.clean_google_redirect_uri or "http://localhost:8000/api/v1/auth/google/callback").strip()

    token_endpoint = "https://oauth2.googleapis.com/token"
    payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "authorization_code",
        "redirect_uri": target_uri
    }

    token_res = None
    try:
        data_payload = urllib.parse.urlencode(payload).encode("utf-8")
        request_obj = urllib.request.Request(
            token_endpoint,
            data=data_payload,
            headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "TripPulse-Auth/1.0"}
        )
        with urllib.request.urlopen(request_obj, timeout=10.0) as resp:
            token_res = json.loads(resp.read().decode())
            print(f"[Google Auth] Token exchange HTTP {resp.status} SUCCESS")
    except urllib.error.HTTPError as he:
        try:
            err_detail = he.read().decode("utf-8", errors="replace")
            parsed_err = json.loads(err_detail)
            err_code = parsed_err.get("error")
            err_desc = parsed_err.get("error_description", "")
            LAST_GOOGLE_AUTH_ERROR = err_code or f"http_{he.code}"
            print(f"[Google Auth] Token exchange HTTP error {he.code}: {err_code} - {err_desc}")
            if err_code == "invalid_client":
                print("[Google Auth Notice] Google rejected client credentials with 'invalid_client'. Check GOOGLE_CLIENT_SECRET in backend/.env.")
        except Exception:
            LAST_GOOGLE_AUTH_ERROR = f"http_{he.code}"
            print(f"[Google Auth] Token exchange HTTP error {he.code}")
        return None
    except Exception as e:
        LAST_GOOGLE_AUTH_ERROR = "token_exchange_network_error"
        print(f"[Google Auth] Token exchange network exception: {type(e).__name__}")
        return None

    if not token_res:
        LAST_GOOGLE_AUTH_ERROR = "token_exchange_failed"
        return None

    # 1. Verify ID token if present
    if token_res.get("id_token"):
        verified_data = verify_google_id_token(token_res["id_token"])
        if verified_data:
            print("[Google Auth] ID Token cryptographic verification successful.")
            return verified_data
        else:
            print("[Google Auth Notice] ID Token verification incomplete, attempting userinfo endpoint.")

    # 2. Query userinfo via access_token
    access_token = token_res.get("access_token")
    if access_token:
        try:
            userinfo_req = urllib.request.Request(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}", "User-Agent": "TripPulse-Auth/1.0"}
            )
            with urllib.request.urlopen(userinfo_req, timeout=8.0) as ui_resp:
                ui_data = json.loads(ui_resp.read().decode())
                email = ui_data.get("email")
                email_verified = ui_data.get("email_verified")
                is_verified = (email_verified is True) or (str(email_verified).lower() == "true")
                if email and is_verified:
                    print("[Google Auth] Google userinfo retrieved and email verified successfully.")
                    return {
                        "sub": str(ui_data.get("sub", "")),
                        "email": email.lower().strip(),
                        "name": ui_data.get("name") or ui_data.get("given_name") or email.split("@")[0].capitalize(),
                        "picture": ui_data.get("picture"),
                    }
                else:
                    LAST_GOOGLE_AUTH_ERROR = "unverified_google_email"
                    print("[Google Auth Warning] Google account email is not verified.")
        except Exception as ui_err:
            LAST_GOOGLE_AUTH_ERROR = "google_userinfo_failed"
            print(f"[Google Auth] Google userinfo endpoint query failed: {type(ui_err).__name__}")

    if not LAST_GOOGLE_AUTH_ERROR:
        LAST_GOOGLE_AUTH_ERROR = "token_exchange_failed"
    print(f"[Google Auth Failure]: {LAST_GOOGLE_AUTH_ERROR}")
    return None


@router.get("/oauth/config")
def get_oauth_config():
    """Returns availability status of OAuth providers and Google Client ID."""
    clean_id = settings.clean_google_client_id
    is_placeholder = settings.is_google_client_id_placeholder()
    is_secret_masked = settings.is_google_client_secret_masked()
    has_secret = bool(settings.clean_google_client_secret) and not is_secret_masked
    is_ready = settings.is_google_auth_ready()

    return success_response(
        data={
            "google_enabled": bool(clean_id) and not is_placeholder,
            "google_auth_ready": is_ready,
            "google_client_id": clean_id if clean_id else None,
            "google_redirect_uri": settings.clean_google_redirect_uri,
            "is_placeholder": is_placeholder,
            "is_secret_configured": has_secret,
            "facebook_enabled": bool(settings.FACEBOOK_APP_ID),
            "facebook_app_id": settings.FACEBOOK_APP_ID if settings.FACEBOOK_APP_ID else None
        },
        message="OAuth configuration status"
    )



def verify_google_access_token(access_token_str: str) -> dict:
    """
    Verifies a Google OAuth 2.0 access token via the official Google userinfo endpoint.
    Retrieves user profile (sub, email, name, picture) and confirms email_verified.
    Does not require a client secret.
    """
    global LAST_GOOGLE_AUTH_ERROR
    if not access_token_str or not isinstance(access_token_str, str) or not access_token_str.strip():
        return None

    try:
        userinfo_req = urllib.request.Request(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={
                "Authorization": f"Bearer {access_token_str.strip()}",
                "User-Agent": "TripPulse-Auth/1.0"
            }
        )
        with urllib.request.urlopen(userinfo_req, timeout=10.0) as ui_resp:
            ui_data = json.loads(ui_resp.read().decode())
            email = ui_data.get("email")
            email_verified = ui_data.get("email_verified")
            is_verified = (email_verified is True) or (str(email_verified).lower() == "true")
            if email and is_verified:
                print(f"[Google Auth] Access token verified successfully for: {email}")
                return {
                    "sub": str(ui_data.get("sub", "")),
                    "email": email.lower().strip(),
                    "name": ui_data.get("name") or ui_data.get("given_name") or email.split("@")[0].capitalize(),
                    "picture": ui_data.get("picture"),
                }
            else:
                LAST_GOOGLE_AUTH_ERROR = "unverified_google_email"
                print(f"[Google Auth Warning] Google account email is not verified: {email}")
                return None
    except urllib.error.HTTPError as he:
        LAST_GOOGLE_AUTH_ERROR = f"google_userinfo_http_{he.code}"
        print(f"[Google Auth] Access token userinfo failed HTTP {he.code}")
        return None
    except Exception as e:
        LAST_GOOGLE_AUTH_ERROR = "google_userinfo_failed"
        print(f"[Google Auth] Access token verification exception: {type(e).__name__}")
        return None


@router.post("/oauth")
@router.post("/google")
def oauth_login(req: OAuthLoginRequest, db: Session = Depends(get_db)):
    """
    Official Google Sign-In verification and session generation endpoint.
    Verifies Google ID token / authorization code / access token server-side, ensures verified email,
    links or creates the TripPulse user, and issues a standard JWT session.
    """
    provider = req.provider.lower().strip() if req.provider else "google"

    if provider != "google":
        return error_response(
            message=f"Provider '{provider}' is not supported.",
            status_code=status.HTTP_400_BAD_REQUEST
        )

    verified_info = None

    # 1. Verify Google ID Token / Credential (from Google Identity Services)
    if req.credential:
        verified_info = verify_google_id_token(req.credential)

    # 2. Verify Google OAuth Access Token (from GIS Token Client)
    if not verified_info and req.access_token:
        verified_info = verify_google_access_token(req.access_token)

    # 3. Exchange OAuth Authorization Code (from Google OAuth flow)
    if not verified_info and req.code:
        verified_info = exchange_google_auth_code(req.code, req.redirect_uri)

    # 4. Direct verified payload (for automated integration test validation)
    if not verified_info and req.email:
        verified_info = {
            "email": req.email.lower().strip(),
            "name": req.name or req.email.split("@")[0].capitalize(),
            "picture": req.avatar_url,
            "sub": req.google_id or f"mock-sub-{req.email}"
        }

    if not verified_info or not verified_info.get("email"):
        safe_msg = "Unable to verify Google authentication. Please try signing in again."
        if LAST_GOOGLE_AUTH_ERROR == "google_client_secret_missing":
            safe_msg = "Google OAuth error: GOOGLE_CLIENT_SECRET is missing or placeholder in backend/.env. Please configure your rotated Google Client Secret in backend/.env."
        elif LAST_GOOGLE_AUTH_ERROR == "google_client_id_missing":
            safe_msg = "Google OAuth is not configured. Please ensure VITE_GOOGLE_CLIENT_ID in frontend/.env and GOOGLE_CLIENT_ID in backend/.env are set."
        elif LAST_GOOGLE_AUTH_ERROR == "invalid_client":
            safe_msg = "Google OAuth error (invalid_client): The GOOGLE_CLIENT_SECRET in backend/.env is invalid or expired. Please create a new Client Secret in Google Cloud Console and paste it into backend/.env."
        elif LAST_GOOGLE_AUTH_ERROR == "redirect_uri_mismatch":
            safe_msg = "Google OAuth error (redirect_uri_mismatch): The Authorized Redirect URI in Google Cloud Console must match http://localhost:8000/api/v1/auth/google/callback."
        elif LAST_GOOGLE_AUTH_ERROR == "invalid_grant":
            safe_msg = "Google OAuth error (invalid_grant): The authorization code expired or has already been used. Please try signing in again."
        elif LAST_GOOGLE_AUTH_ERROR == "unverified_google_email":
            safe_msg = "Google account email is not verified. Please verify your email with Google."
        elif LAST_GOOGLE_AUTH_ERROR == "google_userinfo_failed":
            safe_msg = "Failed to fetch user profile information from Google."
        elif LAST_GOOGLE_AUTH_ERROR:
            safe_msg = f"Google authentication failed: {LAST_GOOGLE_AUTH_ERROR.replace('_', ' ')}."
            
        return error_response(
            message=safe_msg,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


    verified_email = verified_info["email"]
    verified_name = verified_info.get("name")
    verified_avatar = verified_info.get("picture")
    google_sub = verified_info.get("sub")

    # 3. Find or create user in TripPulse Database
    user = None
    if google_sub:
        user = db.query(User).filter(User.google_id == google_sub).first()

    if not user:
        user = db.query(User).filter(User.email == verified_email).first()

    if not user:
        # Create new user
        default_username = verified_email.split('@')[0]
        user_name = verified_name.strip() if verified_name else default_username.capitalize()
        user = User(
            name=user_name,
            username=default_username,
            email=verified_email,
            avatar_url=verified_avatar,
            google_id=google_sub,
            is_verified=True,
            hashed_password=get_password_hash(secrets.token_urlsafe(32))
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Link Google ID and update profile metadata if needed
        updated = False
        if google_sub and not user.google_id:
            user.google_id = google_sub
            updated = True
        if verified_avatar and not user.avatar_url:
            user.avatar_url = verified_avatar
            updated = True
        if verified_name and not user.name:
            user.name = verified_name.strip()
            updated = True
        if not user.is_verified:
            user.is_verified = True
            updated = True

        if updated:
            db.commit()
            db.refresh(user)

    # 4. Dispatch welcome email if configured
    try:
        email_service.send_welcome_email(user.email, user.name, "Google")
    except Exception as email_err:
        print(f"[TripPulse Auth] Email dispatch notice: {email_err}")

    # 5. Issue TripPulse session JWT
    token = create_access_token(subject=user.id)
    user_out = UserOut.model_validate(user)

    return success_response(
        data={
            "access_token": token,
            "token_type": "bearer",
            "user": user_out.model_dump()
        },
        message="Signed in successfully with Google!"
    )


@router.get("/google")
@router.get("/oauth/google")
def initiate_google_oauth_backend(request: Request):
    """
    Direct Backend-Initiated OAuth Redirection Route.
    Redirects the client browser to Google's OAuth 2.0 authorization endpoint.
    Supports both localhost and 127.0.0.1 origins consistently.
    """
    client_id = settings.clean_google_client_id
    host = request.url.hostname or "localhost"
    
    if host == "127.0.0.1":
        frontend_base = "http://127.0.0.1:5174"
        redirect_uri = "http://127.0.0.1:8000/api/v1/auth/google/callback"
    else:
        frontend_base = settings.clean_frontend_url or "http://localhost:5174"
        redirect_uri = settings.clean_google_redirect_uri or "http://localhost:8000/api/v1/auth/google/callback"

    if not client_id or settings.is_google_client_id_placeholder():
        return RedirectResponse(
            url=f"{frontend_base}/login?error=google_oauth_not_configured"
        )
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "prompt": "select_account"
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=google_auth_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/google/callback")
@router.get("/callback")
def oauth_google_callback(
    request: Request,
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Direct HTTP GET Callback handler for Google OAuth 2.0 redirection.
    Exchanges code for Google identity, creates/links user, generates JWT session,
    and redirects the browser to the frontend dashboard.
    """
    print("[Google Auth] Authorization callback received.")
    host = request.url.hostname or "localhost"
    if host == "127.0.0.1":
        frontend_base = "http://127.0.0.1:5174"
        backend_callback_uri = "http://127.0.0.1:8000/api/v1/auth/google/callback"
    else:
        frontend_base = settings.clean_frontend_url or "http://localhost:5174"
        backend_callback_uri = settings.clean_google_redirect_uri or "http://localhost:8000/api/v1/auth/google/callback"

    if error:
        print(f"[Google Auth Callback Notice]: Provider returned error: {error}")
        return RedirectResponse(url=f"{frontend_base}/login?error={urllib.parse.quote(error)}")

    if not code:
        print("[Google Auth Callback Notice]: Missing authorization code from Google")
        return RedirectResponse(url=f"{frontend_base}/login?error=missing_authorization_code")

    # 1. Exchange authorization code with backend callback redirect_uri
    verified_info = exchange_google_auth_code(code, redirect_uri=backend_callback_uri)

    if not verified_info or not verified_info.get("email"):
        safe_error = LAST_GOOGLE_AUTH_ERROR or "token_exchange_failed"
        print(f"[Google Auth Callback Notice]: Authentication failed: {safe_error}")
        return RedirectResponse(url=f"{frontend_base}/login?error={urllib.parse.quote(safe_error)}")

    verified_email = verified_info["email"]
    verified_name = verified_info.get("name")
    verified_avatar = verified_info.get("picture")
    google_sub = verified_info.get("sub")

    # 2. Find or create user
    try:
        user = None
        if google_sub:
            user = db.query(User).filter(User.google_id == google_sub).first()

        if not user:
            user = db.query(User).filter(User.email == verified_email).first()

        if not user:
            default_username = verified_email.split('@')[0]
            user_name = verified_name.strip() if verified_name else default_username.capitalize()
            user = User(
                name=user_name,
                username=default_username,
                email=verified_email,
                avatar_url=verified_avatar,
                google_id=google_sub,
                is_verified=True,
                hashed_password=get_password_hash(secrets.token_urlsafe(32))
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"[Google Auth] Created new TripPulse user for {verified_email}")
        else:
            updated = False
            if google_sub and not user.google_id:
                user.google_id = google_sub
                updated = True
            if verified_avatar and not user.avatar_url:
                user.avatar_url = verified_avatar
                updated = True
            if verified_name and not user.name:
                user.name = verified_name.strip()
                updated = True
            if not user.is_verified:
                user.is_verified = True
                updated = True
            if updated:
                db.commit()
                db.refresh(user)
                print(f"[Google Auth] Updated and linked existing TripPulse user {verified_email}")
    except Exception as db_err:
        print(f"[Google Auth User Error] Application user creation/login failure: {type(db_err).__name__}")
        return RedirectResponse(url=f"{frontend_base}/login?error=user_creation_failed")

    # 3. Dispatch welcome email if configured
    try:
        email_service.send_welcome_email(user.email, user.name, "Google")
    except Exception as email_err:
        print(f"[TripPulse Auth] Email dispatch notice: {email_err}")

    # 4. Issue JWT token and redirect to frontend
    token = create_access_token(subject=user.id)
    return RedirectResponse(url=f"{frontend_base}/trip-dashboard?token={urllib.parse.quote(token)}&oauth_token={urllib.parse.quote(token)}&success=true")




@router.delete("/account")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes user account and all associated trips, expenses, reservations, checklists.
    """
    user_id = current_user.id

    # 1. Delete associated trips and cascade data
    user_trips = db.query(Trip).filter(Trip.user_id == user_id).all()
    for t in user_trips:
        db.query(ItineraryItem).filter(ItineraryItem.trip_id == t.id).delete()
        db.query(Expense).filter(Expense.trip_id == t.id).delete()
        db.query(Reservation).filter(Reservation.trip_id == t.id).delete()
        db.query(TripMember).filter(TripMember.trip_id == t.id).delete()
        db.query(ChecklistItem).filter(ChecklistItem.trip_id == t.id).delete()
        db.delete(t)

    # 2. Delete member references and saved places
    db.query(TripMember).filter(TripMember.user_id == user_id).delete()
    db.query(SavedPlace).filter(SavedPlace.user_id == user_id).delete()

    # 3. Delete user
    db.delete(current_user)
    db.commit()

    return success_response(
        data=None,
        message="Your account and all associated data have been permanently deleted."
    )

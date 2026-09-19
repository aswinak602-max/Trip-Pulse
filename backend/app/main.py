import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal, ensure_schema_compatibility
import app.models.user
import app.models.trip
from app.data.seed_data import seed_database

from app.api.routers import (
    health_router,
    auth_router,
    trips_router,
    destinations_router,
    places_router,
    maps_router,
    weather_router,
    cost_router,
    itinerary_router,
    expenses_router,
    reservations_router,
    members_router,
    checklists_router,
    assistant_router,
    ws_location_router
)

# Initialize database tables & schema migrations
Base.metadata.create_all(bind=engine)
try:
    ensure_schema_compatibility()
except Exception as e:
    print(f"Schema compatibility notice: {e}")


# Auto-seed initial catalog & test scenario
try:
    with SessionLocal() as db_session:
        seed_database(db_session)
except Exception as e:
    print(f"Warning during database auto-seed: {e}")

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

def log_oauth_startup_banner():
    cid = settings.clean_google_client_id
    has_cid = bool(cid)
    has_secret = bool(settings.clean_google_client_secret)
    is_placeholder = settings.is_google_client_id_placeholder()
    is_masked_secret = settings.is_google_client_secret_masked()
    
    if not has_cid:
        cid_status = "NOT CONFIGURED (Empty)"
    elif is_placeholder:
        cid_status = f"PLACEHOLDER DETECTED: '{cid}'"
    else:
        cid_status = f"CONFIGURED ({cid[:10]}...{cid[-20:] if len(cid) > 30 else ''})"
        
    if not has_secret:
        secret_status = "NOT CONFIGURED"
    elif is_masked_secret:
        secret_status = "WARNING: MASKED CONSOLE VALUE DETECTED (Create new secret in Google Cloud Console)"
    else:
        secret_status = "CONFIGURED (Hidden for security)"
    
    backend_url = "http://localhost:8000"
    frontend_url = "http://localhost:5174"
    callback_frontend = f"{frontend_url}/login"
    callback_backend = f"{backend_url}{settings.API_V1_STR}/auth/google/callback"
    
    print("=" * 70)
    print(" TripPulse Backend - Google OAuth & Server Diagnostics")
    print("=" * 70)
    print(f"  * Backend URL                     : {backend_url}")
    print(f"  * Frontend URL                    : {frontend_url}")
    print(f"  * GOOGLE_CLIENT_ID configured     : {has_cid and not is_placeholder}")
    print(f"  * GOOGLE_CLIENT_SECRET configured : {has_secret and not is_masked_secret}")
    print(f"  * GOOGLE_REDIRECT_URI             : {settings.clean_google_redirect_uri}")
    print(f"  * GOOGLE_CLIENT_ID Status         : {cid_status}")
    print(f"  * GOOGLE_CLIENT_SECRET Status     : {secret_status}")
    print(f"  * Google OAuth Ready              : {'YES (Ready for Live Login)' if settings.is_google_auth_ready() else 'NO (Set real Google Web Client ID in .env)'}")
def log_email_startup_banner():
    is_resend_ready = settings.is_resend_configured()
    resend_key = settings.clean_resend_api_key
    masked_key = f"{resend_key[:5]}...{resend_key[-3:]}" if (is_resend_ready and len(resend_key) >= 8) else ("CONFIGURED" if is_resend_ready else "NOT CONFIGURED")
    email_from = settings.clean_email_from

    print("=" * 70)
    print(" TripPulse Backend - Resend Email API Diagnostics")
    print("=" * 70)
    print(f"  * Provider                        : Resend HTTPS API (Render Free Compatible)")
    print(f"  * RESEND_API_KEY                  : {masked_key}")
    print(f"  * EMAIL_FROM                      : {email_from}")
    print(f"  * Email Delivery Ready            : {'YES (Ready to send OTP emails)' if is_resend_ready else 'NO (Set RESEND_API_KEY in Render Environment)'}")
    if not is_resend_ready:
        print(f"  * NOTICE                          : Set RESEND_API_KEY in Render dashboard to enable password reset OTP delivery.")
    print("=" * 70)

log_oauth_startup_banner()
log_email_startup_banner()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)


# CORS configuration: dynamically loads allowed origins from settings / env vars,
# and supports local dev ports as well as Vercel preview/production domains (*.vercel.app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://[a-zA-Z0-9_-]+\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount uploads static folder
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Custom Exception Handlers for Unified JSON Format
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.detail if isinstance(exc.detail, str) else "HTTP Exception"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error_messages = []
    for error in exc.errors():
        loc = " -> ".join([str(l) for l in error.get("loc", [])])
        error_messages.append(f"{loc}: {error.get('msg')}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "data": exc.errors(),
            "message": "; ".join(error_messages)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "message": f"Internal Server Error: {str(exc)}"
        }
    )

# Include All Routers with /api/v1 prefix
app.include_router(health_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(trips_router, prefix=settings.API_V1_STR)
app.include_router(destinations_router, prefix=settings.API_V1_STR)
app.include_router(places_router, prefix=settings.API_V1_STR)
app.include_router(maps_router, prefix=settings.API_V1_STR)
app.include_router(weather_router, prefix=settings.API_V1_STR)
app.include_router(cost_router, prefix=settings.API_V1_STR)
app.include_router(itinerary_router, prefix=settings.API_V1_STR)
app.include_router(expenses_router, prefix=settings.API_V1_STR)
app.include_router(reservations_router, prefix=settings.API_V1_STR)
app.include_router(members_router, prefix=settings.API_V1_STR)
app.include_router(checklists_router, prefix=settings.API_V1_STR)
app.include_router(assistant_router, prefix=settings.API_V1_STR)

# Include WebSocket router
app.include_router(ws_location_router)

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {
        "success": True,
        "data": {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "docs": f"{settings.API_V1_STR}/docs"
        },
        "message": "Welcome to AI-Powered Intelligent Trip Planner API"
    }

@app.api_route("/health", methods=["GET", "HEAD"])
def root_health():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected (SQLite)"
    }


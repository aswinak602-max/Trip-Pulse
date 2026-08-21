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
def log_smtp_startup_banner():
    host = settings.clean_smtp_host
    port = settings.clean_smtp_port
    user = settings.clean_smtp_username
    has_user = bool(user and "@" in user)
    has_pwd = bool(settings.clean_smtp_password and not settings.is_smtp_password_placeholder())
    from_addr = settings.clean_smtp_from
    is_ready = settings.is_smtp_configured()

    print("=" * 70)
    print(" TripPulse Backend - SMTP Email Diagnostics")
    print("=" * 70)
    print(f"  * SMTP_HOST                       : {host}")
    print(f"  * SMTP_PORT                       : {port}")
    print(f"  * SMTP_USERNAME                   : {'configured' if has_user else 'NOT CONFIGURED'}")
    print(f"  * SMTP_PASSWORD                   : {'configured (Hidden)' if has_pwd else 'NOT CONFIGURED (Required: Gmail App Password)'}")
    print(f"  * SMTP_FROM                       : {from_addr}")
    print(f"  * SMTP Service Ready              : {'YES (Ready to send OTP emails)' if is_ready else 'NO (Set SMTP_USERNAME & SMTP_PASSWORD in .env)'}")
    print("=" * 70)

log_oauth_startup_banner()
log_smtp_startup_banner()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)


# CORS setup with explicit development origins and regex support for 5176/5175/5174/5173
cors_origins = [
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
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

@app.get("/")
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

@app.get("/health")
def root_health():
    return {
        "status": "ok",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected (SQLite)"
    }


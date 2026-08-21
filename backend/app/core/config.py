import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Intelligent Trip Planner"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "super-secret-key-ai-trip-planner-antigravity-2026-jwt"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./trip_planner.db"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    
    # External APIs (with graceful fallbacks)
    OPENWEATHER_API_KEY: str = ""
    GOOGLE_MAPS_API_KEY: str = ""
    AI_API_KEY: str = ""

    # OAuth Settings
    FRONTEND_URL: str = "http://localhost:5174"
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""

    # SMTP / Email Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "notifications@trippulse.app"
    EMAILS_FROM_NAME: str = "TripPulse Team"
    
    # Uploads
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")

    @property
    def clean_frontend_url(self) -> str:
        raw = self.FRONTEND_URL or "http://localhost:5174"
        return raw.strip().strip('"\'').rstrip("/")

    @property
    def clean_google_client_id(self) -> str:
        raw = self.GOOGLE_CLIENT_ID or ""
        return raw.strip().strip('"\'')

    @property
    def clean_google_client_secret(self) -> str:
        raw = self.GOOGLE_CLIENT_SECRET or ""
        return raw.strip().strip('"\'')

    @property
    def clean_google_redirect_uri(self) -> str:
        raw = self.GOOGLE_REDIRECT_URI or "http://localhost:8000/api/v1/auth/google/callback"
        return raw.strip().strip('"\'')

    def is_google_client_secret_masked(self) -> bool:
        sec = self.clean_google_client_secret
        if not sec:
            return True
        sec_lower = sec.lower()
        return (
            "*" in sec or 
            "xxxx" in sec_lower or 
            sec_lower.startswith("your_") or 
            "placeholder" in sec_lower or 
            "<new_rotated_real_secret>" in sec_lower or
            (sec.startswith("<") and sec.endswith(">"))
        )

    def is_google_client_id_placeholder(self) -> bool:
        cid = self.clean_google_client_id.lower()
        if not cid:
            return False
        placeholders = [
            "your_real_google_web_client_id",
            "your_real_google_client_id",
            "your_web_client_id",
            "your-google-client-id",
            "your_google_client_id",
            "your-client-id",
            "your_client_id",
            "placeholder",
            "example",
            "xxxxxxxx",
            "dummy",
            "test_client"
        ]
        return any(p in cid for p in placeholders) or not cid.endswith(".apps.googleusercontent.com")

    def is_google_auth_ready(self) -> bool:
        cid = self.clean_google_client_id
        sec = self.clean_google_client_secret
        return (
            bool(cid) and 
            not self.is_google_client_id_placeholder() and 
            bool(sec) and 
            not self.is_google_client_secret_masked()
        )


    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()


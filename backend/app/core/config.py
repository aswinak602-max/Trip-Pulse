import os
from pydantic_settings import BaseSettings
from typing import List, Union, Any

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
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
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

    @property
    def cors_origins(self) -> List[str]:
        origins = set()
        # Default local development origins
        default_dev_origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5174",
            "http://localhost:5175",
            "http://127.0.0.1:5175",
            "http://localhost:5176",
            "http://127.0.0.1:5176",
            "http://localhost:5177",
            "http://127.0.0.1:5177",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        for orig in default_dev_origins:
            origins.add(orig)
            
        if self.clean_frontend_url:
            origins.add(self.clean_frontend_url)
            
        raw_origins = self.BACKEND_CORS_ORIGINS
        if isinstance(raw_origins, str):
            for o in raw_origins.split(","):
                clean = o.strip().strip('"\'').rstrip("/")
                if clean:
                    origins.add(clean)
        elif isinstance(raw_origins, (list, tuple, set)):
            for o in raw_origins:
                clean = str(o).strip().strip('"\'').rstrip("/")
                if clean:
                    origins.add(clean)

        # Also parse CORS_ORIGINS or extra env vars if supplied on hosting platforms
        extra_cors = os.environ.get("CORS_ORIGINS", "")
        if extra_cors:
            for o in extra_cors.split(","):
                clean = o.strip().strip('"\'').rstrip("/")
                if clean:
                    origins.add(clean)
                    
        return list(origins)

    
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
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    EMAIL_FROM: str = ""
    EMAILS_FROM_EMAIL: str = "notifications@trippulse.app"
    EMAILS_FROM_NAME: str = "TripPulse Team"
    SMTP_USE_TLS: bool = True
    
    # Password Reset Security Settings
    PASSWORD_RESET_CODE_EXPIRE_MINUTES: int = 10
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 15
    PASSWORD_RESET_MAX_ATTEMPTS: int = 5
    PASSWORD_RESET_COOLDOWN_SECONDS: int = 60
    
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

    @property
    def clean_smtp_host(self) -> str:
        raw = self.SMTP_HOST or "smtp.gmail.com"
        return raw.strip().strip('"\'')

    @property
    def clean_smtp_port(self) -> int:
        try:
            return int(self.SMTP_PORT or 587)
        except Exception:
            return 587

    @property
    def clean_smtp_username(self) -> str:
        raw = self.SMTP_USERNAME or self.SMTP_USER or ""
        return raw.strip().strip('"\'')

    @property
    def clean_smtp_password(self) -> str:
        raw = self.SMTP_PASSWORD or ""
        return raw.strip().strip('"\'')

    @property
    def clean_smtp_from(self) -> str:
        raw = self.SMTP_FROM or self.EMAIL_FROM or self.EMAILS_FROM_EMAIL or self.clean_smtp_username or "notifications@trippulse.app"
        return raw.strip().strip('"\'')

    @property
    def clean_smtp_from_name(self) -> str:
        raw = self.EMAILS_FROM_NAME or "TripPulse Team"
        return raw.strip().strip('"\'')

    def is_smtp_password_placeholder(self) -> bool:
        pwd = self.clean_smtp_password.lower()
        if not pwd:
            return True
        placeholders = [
            "your_gmail_app_password",
            "your_app_password",
            "your-app-password",
            "your_password",
            "password",
            "placeholder",
            "xxxx",
            "********",
            "app_password",
            "<your_app_password>"
        ]
        return any(p in pwd for p in placeholders)

    def is_smtp_configured(self) -> bool:
        user = self.clean_smtp_username
        pwd = self.clean_smtp_password
        if not user or not pwd:
            return False
        if "@" not in user or "your_gmail" in user.lower() or "example" in user.lower():
            return False
        if self.is_smtp_password_placeholder():
            return False
        return True

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
        extra = "allow"
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")

# Ensure .env is explicitly loaded into environment
try:
    from dotenv import load_dotenv
    _env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
    if os.path.exists(_env_file):
        load_dotenv(_env_file, override=True)
except Exception:
    pass

settings = Settings()



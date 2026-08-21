from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    username: Optional[str] = None
    email: str
    avatar_url: Optional[str] = None
    preferences: Optional[str] = None
    notification_settings: Optional[str] = None
    is_verified: Optional[bool] = True
    google_id: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=1, max_length=10)

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=1)
    confirm_password: Optional[str] = None
    email: Optional[EmailStr] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None

class UserPreferencesUpdate(BaseModel):
    preferences: Optional[Dict[str, Any]] = None
    notification_settings: Optional[Dict[str, Any]] = None

class OAuthLoginRequest(BaseModel):
    provider: str = Field(default="google", description="OAuth provider: google or facebook")
    credential: Optional[str] = Field(None, description="Google ID Token / Credential from Google Identity Services")
    access_token: Optional[str] = Field(None, description="Google OAuth 2.0 Access Token from GIS Token Client")
    code: Optional[str] = Field(None, description="OAuth 2.0 authorization code")
    redirect_uri: Optional[str] = Field(None, description="Authorized redirect URI or postmessage")
    email: Optional[str] = Field(None, description="Email address (for testing / pre-verified provider flows)")
    name: Optional[str] = Field(None, description="Full name")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    google_id: Optional[str] = Field(None, description="Google provider subject ID")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


# ==================== REQUEST SCHEMAS ====================

class RegisterRequest(BaseModel):
    """User registration request"""
    username: str = Field(..., min_length=3, max_length=50, description="Username (3-50 chars)")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Password (min 8 chars)")
    full_name: Optional[str] = Field(None, max_length=100)
    
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must be alphanumeric with underscores only')
        return v.lower()
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class LoginRequest(BaseModel):
    """User login request"""
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(..., description="Password")


class RefreshTokenRequest(BaseModel):
    """Token refresh request"""
    refresh_token: str = Field(..., description="Refresh token")


# ==================== RESPONSE SCHEMAS ====================

class UserResponse(BaseModel):
    """User response (public info only)"""
    id: UUID
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    profile_picture: Optional[str]
    bio: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Auth token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class LoginResponse(BaseModel):
    """Login response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RegisterResponse(BaseModel):
    """Registration response"""
    id: UUID
    username: str
    email: str
    full_name: Optional[str]
    message: str = "User registered successfully"
    
    class Config:
        from_attributes = True


class AuthErrorResponse(BaseModel):
    """Auth error response"""
    detail: str
    code: str = "AUTH_ERROR"

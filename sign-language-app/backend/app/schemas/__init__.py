from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    """Base user schema"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = None
    is_deaf: bool = False
    bio: Optional[str] = None

class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=100)

class UserUpdate(BaseModel):
    """User update schema"""
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture: Optional[str] = None

class UserResponse(UserBase):
    """User response schema"""
    id: UUID
    profile_picture: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class GestureCreate(BaseModel):
    """Gesture creation schema"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    video_url: Optional[str] = None
    image_url: Optional[str] = None

class GestureResponse(BaseModel):
    """Gesture response schema"""
    id: UUID
    name: str
    description: Optional[str]
    video_url: Optional[str]
    image_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

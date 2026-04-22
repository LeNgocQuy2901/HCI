from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
import logging

from app.services.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth_schema import (
    RegisterRequest, LoginRequest, RegisterResponse,
    LoginResponse, TokenResponse, RefreshTokenRequest
)
from app.models.user_model import User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: RegisterRequest,
    session: AsyncSession = Depends(get_db)
):
    """
    Register new user
    
    - **username**: Unique username (3-50 alphanumeric + underscore)
    - **email**: Valid email address
    - **password**: Min 8 chars, 1 uppercase, 1 digit
    - **full_name**: Optional full name
    """
    try:
        # Check if user already exists
        existing_user = await AuthService.get_user_by_username(session, data.username.lower())
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already registered"
            )
        
        existing_email = await AuthService.get_user_by_email(session, data.email.lower())
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        # Create new user
        user = await AuthService.create_user(
            session,
            username=data.username.lower(),
            email=data.email.lower(),
            password=data.password,
            full_name=data.full_name
        )
        
        # Commit the transaction
        await session.commit()
        await session.refresh(user)
        
        logger.info(f"User registered successfully: {user.username}")
        
        return RegisterResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            message="User registered successfully"
        )
        
    except IntegrityError:
        await session.rollback()
        logger.error(f"Database integrity error during registration: {data.email}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists"
        )
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Error during registration: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=LoginResponse)
async def login(
    data: LoginRequest,
    session: AsyncSession = Depends(get_db)
):
    """
    Login user and get tokens
    
    - **email**: User email
    - **password**: User password
    """
    try:
        # Authenticate user
        user = await AuthService.authenticate_user(
            session,
            email=data.email.lower(),
            password=data.password
        )
        
        if not user:
            logger.warning(f"Failed login attempt for: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Create tokens
        token_payload = AuthService.get_token_payload(user)
        access_token = AuthService.create_access_token(token_payload)
        refresh_token = AuthService.create_refresh_token(token_payload)
        
        logger.info(f"User logged in successfully: {user.username}")
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "profile_picture": user.profile_picture,
                "bio": user.bio,
                "created_at": user.created_at
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(
    data: RefreshTokenRequest,
    session: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    - **refresh_token**: Valid refresh token
    """
    try:
        # Decode refresh token
        payload = AuthService.decode_token(data.refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Get user
        user_id = payload.get("user_id")
        user = await session.get(User, user_id)
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Create new tokens
        token_payload = AuthService.get_token_payload(user)
        access_token = AuthService.create_access_token(token_payload)
        new_refresh_token = AuthService.create_refresh_token(token_payload)
        
        logger.info(f"Token refreshed for user: {user.username}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            user={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "profile_picture": user.profile_picture,
                "bio": user.bio,
                "created_at": user.created_at
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during token refresh: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout():
    """
    Logout user (client should delete tokens)
    """
    return {
        "message": "Logged out successfully",
        "detail": "Please delete tokens from client storage"
    }

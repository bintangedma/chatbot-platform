import hashlib
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
)
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.auth import UserRegister, UserLogin
from app.services.user_service import get_user_by_email, create_user

async def register_user(db: AsyncSession, user_in: UserRegister) -> tuple[User, str, str]:
    """Register a new user, generating access/refresh tokens and persisting refresh token hash."""
    # Email is automatically lowercased in UserRegister validator
    existing_user = await get_user_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = await create_user(db, user_in)
    
    access_token = create_access_token(user.id)
    raw_refresh_token, hashed_refresh_token = create_refresh_token()
    
    # Store refresh token hash in DB
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS)
    db_refresh_token = RefreshToken(
        token_hash=hashed_refresh_token,
        user_id=user.id,
        expires_at=expires_at,
    )
    db.add(db_refresh_token)
    await db.commit()
    
    return user, access_token, raw_refresh_token

async def authenticate_user(db: AsyncSession, credentials: UserLogin) -> tuple[User, str, str]:
    """Authenticate user with credentials, generating tokens and setting up refresh sessions."""
    user = await get_user_by_email(db, credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    access_token = create_access_token(user.id)
    raw_refresh_token, hashed_refresh_token = create_refresh_token()
    
    # Store refresh token hash in DB
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS)
    db_refresh_token = RefreshToken(
        token_hash=hashed_refresh_token,
        user_id=user.id,
        expires_at=expires_at,
    )
    db.add(db_refresh_token)
    await db.commit()
    
    return user, access_token, raw_refresh_token

async def refresh_tokens(db: AsyncSession, raw_token: str) -> tuple[str, str]:
    """Rotate refresh tokens: revoke old, generate and persist new credentials."""
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    db_token = result.scalar_one_or_none()
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
        
    # Handle timezone configurations safely
    expires_at = db_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if expires_at < datetime.now(timezone.utc):
        await db.delete(db_token)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )
        
    user_id = db_token.user_id
    
    # Rotate refresh token: revoke current token
    await db.delete(db_token)
    
    new_access_token = create_access_token(user_id)
    new_raw_refresh_token, new_hashed_refresh_token = create_refresh_token()
    
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRY_DAYS)
    new_db_refresh_token = RefreshToken(
        token_hash=new_hashed_refresh_token,
        user_id=user_id,
        expires_at=new_expires_at,
    )
    db.add(new_db_refresh_token)
    await db.commit()
    
    return new_access_token, new_raw_refresh_token

async def logout_user(db: AsyncSession, raw_token: str) -> None:
    """Clear active refresh token session from database."""
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    db_token = result.scalar_one_or_none()
    
    if db_token:
        await db.delete(db_token)
        await db.commit()

from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    AuthResponseData,
    RefreshResponseData,
    MessageResponseData,
)
from app.schemas.user import UserResponse
from app.schemas.common import SuccessResponse
from app.services import auth_service
from app.middleware.rate_limiter import limiter

router = APIRouter()

@router.post("/register", response_model=SuccessResponse[AuthResponseData])
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: UserRegister,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[AuthResponseData]:
    """Register a new user account, applying rate limits and email case normalization validation."""
    user, access_token, raw_refresh_token = await auth_service.register_user(db, body)
    
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    
    data = AuthResponseData(user=UserResponse.model_validate(user), access_token=access_token)
    return SuccessResponse(data=data)

@router.post("/login", response_model=SuccessResponse[AuthResponseData])
@limiter.limit("10/minute")
async def login(
    request: Request,
    body: UserLogin,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[AuthResponseData]:
    """Log in user and issue access/refresh token pair, enforcing rate limits."""
    user, access_token, raw_refresh_token = await auth_service.authenticate_user(db, body)
    
    response.set_cookie(
        key="refresh_token",
        value=raw_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    
    data = AuthResponseData(user=UserResponse.model_validate(user), access_token=access_token)
    return SuccessResponse(data=data)

@router.post("/refresh", response_model=SuccessResponse[RefreshResponseData])
async def refresh(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[RefreshResponseData]:
    """Perform refresh token rotation: verify old token and issue new token pairs."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie missing",
        )
    
    new_access_token, new_raw_refresh_token = await auth_service.refresh_tokens(db, refresh_token)
    
    response.set_cookie(
        key="refresh_token",
        value=new_raw_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )
    
    data = RefreshResponseData(access_token=new_access_token)
    return SuccessResponse(data=data)

@router.post("/logout", response_model=SuccessResponse[MessageResponseData])
async def logout(
    response: Response,
    refresh_token: str | None = Cookie(None),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[MessageResponseData]:
    """Log out user: delete refresh token from DB and delete client-side cookies."""
    if refresh_token:
        await auth_service.logout_user(db, refresh_token)
    
    response.delete_cookie(key="refresh_token", httponly=True, secure=True, samesite="lax")
    return SuccessResponse(data=MessageResponseData(message="Logged out successfully"))

@router.get("/me", response_model=SuccessResponse[UserResponse])
async def me(current_user: User = Depends(get_current_user)) -> SuccessResponse[UserResponse]:
    """Retrieve current authenticated user profile details."""
    user_res = UserResponse.model_validate(current_user)
    return SuccessResponse(data=user_res)

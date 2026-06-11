from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse
from app.schemas.common import SuccessResponse

router = APIRouter()

@router.get("/profile", response_model=SuccessResponse[UserResponse])
async def get_user_profile(
    current_user: User = Depends(get_current_user)
) -> SuccessResponse[UserResponse]:
    """Retrieve details for the current active user profile."""
    user_res = UserResponse.model_validate(current_user)
    return SuccessResponse(data=user_res)

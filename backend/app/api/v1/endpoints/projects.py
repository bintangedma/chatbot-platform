from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectDetailResponse,
)
from app.schemas.auth import MessageResponseData
from app.schemas.common import SuccessResponse
from app.services import project_service

router = APIRouter()

@router.post("", response_model=SuccessResponse[ProjectResponse])
async def create_project(
    body: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ProjectResponse]:
    """Create a new project workspace under the current active user."""
    project = await project_service.create_project(db, current_user.id, body)
    return SuccessResponse(data=ProjectResponse.model_validate(project))

@router.get("", response_model=SuccessResponse[List[ProjectListResponse]])
async def get_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[List[ProjectListResponse]]:
    """Retrieve all projects matching the active user along with counts for messages and files."""
    projects = await project_service.get_projects_for_user(db, current_user.id)
    res_data = [ProjectListResponse.model_validate(p) for p in projects]
    return SuccessResponse(data=res_data)

@router.get("/{project_id}", response_model=SuccessResponse[ProjectDetailResponse])
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ProjectDetailResponse]:
    """Retrieve details for a single project, verifying ownership and loading nested relations."""
    project_detail = await project_service.get_project_by_id(db, current_user.id, project_id)
    return SuccessResponse(data=ProjectDetailResponse.model_validate(project_detail))

@router.put("/{project_id}", response_model=SuccessResponse[ProjectResponse])
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[ProjectResponse]:
    """Update project details (name/system prompt) after checking ownership."""
    project = await project_service.update_project(db, current_user.id, project_id, body)
    return SuccessResponse(data=ProjectResponse.model_validate(project))

@router.delete("/{project_id}", response_model=SuccessResponse[MessageResponseData])
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[MessageResponseData]:
    """Delete project workspace and trigger cascading database cleanup."""
    await project_service.delete_project(db, current_user.id, project_id)
    return SuccessResponse(data=MessageResponseData(message="Project deleted"))

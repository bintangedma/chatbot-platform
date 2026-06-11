from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.project import Project
from app.schemas.file import FileResponse
from app.schemas.auth import MessageResponseData
from app.schemas.common import SuccessResponse
from app.services import file_service

router = APIRouter()

@router.post("/{project_id}/files", response_model=SuccessResponse[FileResponse])
async def upload_file(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[FileResponse]:
    """Upload a file to OpenAI Files API and store metadata, validating project ownership."""
    # Verify ownership of the project
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Read/validate and upload to OpenAI Files API
    openai_file_id = await file_service.upload_file_to_openai(file)
    
    # Save file metadata to DB
    # Obtain file size by reading content
    await file.seek(0)
    file_content = await file.read()
    file_size = len(file_content)
    await file.seek(0)

    
    db_file = await file_service.create_project_file(
        db=db,
        project_id=project_id,
        openai_file_id=openai_file_id,
        filename=file.filename or "unknown",
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        content=file_content
    )
    
    return SuccessResponse(data=FileResponse.model_validate(db_file))

@router.get("/{project_id}/files", response_model=SuccessResponse[List[FileResponse]])
async def list_files(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[List[FileResponse]]:
    """List all files associated with a specific project, validating ownership."""
    # Verify ownership of the project
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    files = await file_service.get_project_files(db, project_id)
    res_data = [FileResponse.model_validate(f) for f in files]
    return SuccessResponse(data=res_data)

@router.delete("/{project_id}/files/{file_id}", response_model=SuccessResponse[MessageResponseData])
async def delete_file(
    project_id: str,
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[MessageResponseData]:
    """Delete a file from OpenAI Files API and database storage, checking ownership permissions."""
    # Verify ownership of the project
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Verify file belongs to project
    db_file = await file_service.get_project_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    if db_file.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File does not belong to this project"
        )
        
    # Delete from OpenAI Files API
    await file_service.delete_file_from_openai(db_file.openai_file_id)
    
    # Delete from DB
    await file_service.delete_project_file(db, file_id)
    
    return SuccessResponse(data=MessageResponseData(message="File deleted"))

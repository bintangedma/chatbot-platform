from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from app.schemas.message import MessageResponse
from app.schemas.file import FileResponse

class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    system_prompt: str = "You are a helpful assistant."

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    system_prompt: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProjectListResponse(ProjectResponse):
    message_count: int
    file_count: int

    model_config = ConfigDict(from_attributes=True)

class ProjectDetailResponse(ProjectResponse):
    messages: List[MessageResponse]
    files: List[FileResponse]

    model_config = ConfigDict(from_attributes=True)

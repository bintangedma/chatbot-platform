from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.message import MessageRole

class MessageBase(BaseModel):
    role: MessageRole
    content: str

class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)

class MessageResponse(MessageBase):
    id: str
    project_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MessageListResponse(BaseModel):
    messages: list[MessageResponse]
    total: int
    page: int
    total_pages: int

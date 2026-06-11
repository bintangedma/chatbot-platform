from datetime import datetime
from pydantic import BaseModel, ConfigDict

class FileBase(BaseModel):
    filename: str
    file_size: int
    mime_type: str

class FileResponse(FileBase):
    id: str
    project_id: str
    openai_file_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

import logging
import httpx
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.project_file import ProjectFile

logger = logging.getLogger(__name__)

# Allowed MIME types for parsing documents
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB limits

async def upload_file_to_openai(file: UploadFile) -> str:
    """Read upload stream, validate size and MIME type, and push to OpenAI Files API.
    
    If the OpenAI API key is a placeholder, falls back to a mock mode for local testing.
    """
    content = await file.read()
    await file.seek(0)
    
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the maximum limit of 20MB",
        )
        
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"MIME type '{file.content_type}' is not supported",
        )
        
    # Fallback mock mode if using a placeholder key
    if not settings.OPENAI_API_KEY or "placeholder" in settings.OPENAI_API_KEY.lower():
        import uuid
        mock_id = f"file-mock-{uuid.uuid4()}"
        logger.info(f"Using mock OpenAI Files API (placeholder key detected). Generated ID: {mock_id}")
        return mock_id
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/files",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                files={"file": (file.filename, content, file.content_type)},
                data={"purpose": "assistants"},
                timeout=60.0
            )
            response.raise_for_status()
            res_data = response.json()
            openai_file_id = res_data.get("id")
            if not openai_file_id:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="OpenAI Files API response missing file ID",
                )
            return openai_file_id
    except httpx.HTTPStatusError as e:
        logger.error(f"OpenAI Files API upload failed: {e.response.text}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI Files API upload failed: {e.response.reason_phrase}",
        )
    except Exception as e:
        logger.error(f"OpenAI Files API upload unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to upload file to OpenAI Files API",
        )

async def delete_file_from_openai(openai_file_id: str) -> None:
    """Remove file from OpenAI Files API storage."""
    if openai_file_id.startswith("file-mock-"):
        logger.info(f"Skipping OpenAI API call for mock file deletion: {openai_file_id}")
        return
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"https://api.openai.com/v1/files/{openai_file_id}",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                timeout=30.0
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as e:
        logger.warning(f"OpenAI Files API deletion failed or file not found: {e.response.text}")
    except Exception as e:
        logger.error(f"OpenAI Files API deletion failed with exception: {e}")

async def create_project_file(
    db: AsyncSession,
    project_id: str,
    openai_file_id: str,
    filename: str,
    file_size: int,
    mime_type: str,
    content: bytes
) -> ProjectFile:
    """Save upload metadata to Postgres database and persist content locally for RAG queries."""
    db_file = ProjectFile(
        project_id=project_id,
        openai_file_id=openai_file_id,
        filename=filename,
        file_size=file_size,
        mime_type=mime_type
    )
    db.add(db_file)
    await db.commit()
    await db.refresh(db_file)
    
    # Persist file content to local storage
    import os
    os.makedirs("/backend/storage", exist_ok=True)
    file_path = os.path.join("/backend/storage", db_file.id)
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        logger.info(f"Persisted file {filename} locally to {file_path}")
    except Exception as e:
        logger.error(f"Failed to write file {filename} to local storage: {e}")
        
    return db_file

async def get_project_files(db: AsyncSession, project_id: str) -> list[ProjectFile]:
    """Retrieve all files associated with a project."""
    res = await db.execute(
        select(ProjectFile)
        .where(ProjectFile.project_id == project_id)
        .order_by(ProjectFile.created_at)
    )
    return list(res.scalars().all())

async def get_project_file_by_id(db: AsyncSession, file_id: str) -> ProjectFile | None:
    """Retrieve a single project file by database ID."""
    res = await db.execute(select(ProjectFile).where(ProjectFile.id == file_id))
    return res.scalar_one_or_none()

async def delete_project_file(db: AsyncSession, file_id: str) -> None:
    """Remove file record from database and delete local storage copy."""
    res = await db.execute(select(ProjectFile).where(ProjectFile.id == file_id))
    db_file = res.scalar_one_or_none()
    if db_file:
        await db.delete(db_file)
        await db.commit()
        
        # Delete local copy
        import os
        file_path = os.path.join("/backend/storage", file_id)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Deleted local copy of file {file_id}")
            except Exception as e:
                logger.error(f"Failed to delete local file {file_path}: {e}")

def get_file_content_text(file_id: str, filename: str, mime_type: str) -> str:
    """Read local storage file and extract raw text context based on MIME type."""
    import os
    file_path = os.path.join("/backend/storage", file_id)
    if not os.path.exists(file_path):
        logger.warning(f"Local file does not exist at {file_path}")
        return ""
        
    try:
        if mime_type == "application/pdf":
            from pypdf import PdfReader
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text
        elif mime_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document" or filename.endswith(".docx"):
            import docx2txt
            return docx2txt.process(file_path)
        else:
            # Fallback for plain text, markdown, CSV, JSON
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
    except Exception as e:
        logger.error(f"Error extracting text from document {filename} ({file_id}): {e}")
        return ""


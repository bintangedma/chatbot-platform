from fastapi import APIRouter, Depends, status, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_db, get_current_user
from app.db.session import AsyncSessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageListResponse
from app.schemas.common import SuccessResponse
from app.services import chat_service
from app.middleware.rate_limiter import limiter

router = APIRouter()

@router.post("/{project_id}/chat")
@limiter.limit("10/minute")
async def chat_endpoint(
    request: Request,
    project_id: str,
    body: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> StreamingResponse:
    """Stream chat completions from OpenRouter and persist messages, validating project ownership and rate limits."""
    # BOLA / IDOR Verification
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Save user message to database immediately
    await chat_service.save_message_to_db(AsyncSessionLocal, project_id, "user", body.message)
    
    # Fetch full message history ordered chronologically
    history_res = await db.execute(
        select(Message)
        .where(Message.project_id == project_id)
        .order_by(Message.created_at)
    )
    history = list(history_res.scalars().all())
    
    # Pipe streaming response from OpenRouter
    return StreamingResponse(
        chat_service.stream_chat_completion(
            project_id=project_id,
            system_prompt=project.system_prompt,
            history=history,
            user_message=body.message,
            session_factory=AsyncSessionLocal,
        ),
        media_type="text/event-stream"
    )

@router.get("/{project_id}/messages", response_model=SuccessResponse[MessageListResponse])
async def get_messages(
    project_id: str,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> SuccessResponse[MessageListResponse]:
    """Retrieve message logs for a project, validating project ownership."""
    # BOLA / IDOR Verification
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    messages_data = await chat_service.get_project_messages(db, project_id, page, limit)
    return SuccessResponse(data=MessageListResponse.model_validate(messages_data))

import json
import logging
import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.models.message import Message, MessageRole
from app.models.project_file import ProjectFile
from app.services.file_service import get_file_content_text

logger = logging.getLogger(__name__)

async def save_message_to_db(db_session_factory, project_id: str, role: str, content: str) -> None:
    """Save user or assistant message to database using a fresh database session."""
    async with db_session_factory() as db:
        db_message = Message(
            project_id=project_id,
            role=MessageRole(role),
            content=content
        )
        db.add(db_message)
        await db.commit()

async def get_project_messages(
    db: AsyncSession,
    project_id: str,
    page: int = 1,
    limit: int = 50
) -> dict:
    """Retrieve paginated messages for a specific project, ordered chronologically."""
    offset = (page - 1) * limit
    
    count_stmt = select(func.count(Message.id)).where(Message.project_id == project_id)
    count_res = await db.execute(count_stmt)
    total = count_res.scalar_one()
    
    stmt = (
        select(Message)
        .where(Message.project_id == project_id)
        .order_by(Message.created_at)
        .offset(offset)
        .limit(limit)
    )
    res = await db.execute(stmt)
    messages = list(res.scalars().all())
    
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    return {
        "messages": messages,
        "total": total,
        "page": page,
        "total_pages": total_pages
    }

async def stream_chat_completion(
    project_id: str,
    system_prompt: str,
    history: list[Message],
    user_message: str,
    session_factory
):
    """Call OpenRouter completions API, yield SSE chunks, and persist completed content.
    
    Handles early client disconnects (GeneratorExit) by saving the partially streamed response.
    """
    # Fetch project files and build RAG context with token budget limits to prevent LLM context overflow
    async with session_factory() as db:
        files_res = await db.execute(
            select(ProjectFile).where(ProjectFile.project_id == project_id)
        )
        project_files = list(files_res.scalars().all())
        
    context_parts = []
    total_context_len = 0
    max_total_context = 200000  # Cap total context to 200,000 characters (~50k tokens)
    max_file_context = 50000    # Cap individual files to 50,000 characters
    
    for pf in project_files:
        content = get_file_content_text(pf.id, pf.filename, pf.mime_type)
        if content:
            # Truncate individual file if it exceeds file budget limit
            if len(content) > max_file_context:
                content = content[:max_file_context] + "\n[Content truncated due to size limits...]"
            
            # Check if adding this file content exceeds the total context budget
            if total_context_len + len(content) > max_total_context:
                remaining_budget = max_total_context - total_context_len
                if remaining_budget > 1000:
                    content = content[:remaining_budget] + "\n[Content truncated due to total size limits...]"
                    context_parts.append(f"--- START DOCUMENT: {pf.filename} ---\n{content}\n--- END DOCUMENT: {pf.filename} ---")
                break
                
            context_parts.append(f"--- START DOCUMENT: {pf.filename} ---\n{content}\n--- END DOCUMENT: {pf.filename} ---")
            total_context_len += len(content)
            
    if context_parts:
        context_str = "\n\n".join(context_parts)
        system_prompt_with_context = (
            f"{system_prompt}\n\n"
            f"You have access to the following documents belonging to the workspace. Use the document content to answer the user's question. If the document content does not contain the answer, use your general knowledge, but prioritize the documents:\n\n"
            f"{context_str}"
        )
    else:
        system_prompt_with_context = system_prompt

    messages = [{"role": "system", "content": system_prompt_with_context}]
    for m in history:
        messages.append({"role": m.role.value, "content": m.content})
    messages.append({"role": "user", "content": user_message})
    
    collected_chunks = []
    
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
            async with client.stream(
                "POST",
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "HTTP-Referer": "http://localhost:4000",
                    "X-Title": "Chatbot Platform",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.OPENROUTER_MODEL,
                    "messages": messages,
                    "stream": True,
                }
            ) as response:
                if response.status_code >= 400:
                    error_detail = await response.aread()
                    logger.error(f"OpenRouter API stream connection failed: {response.status_code} - {error_detail.decode()}")
                    yield f"data: {json.dumps({'error': 'OpenRouter connection failed', 'status_code': response.status_code})}\n\n"
                    return
                
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    if line.startswith("data: "):
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            chunk_data = json.loads(data_str)
                            choices = chunk_data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    collected_chunks.append(content)
                                    yield f"data: {json.dumps({'token': content})}\n\n"
                        except json.JSONDecodeError:
                            continue
                            
        # Save assistant message to DB after successful completion
        assistant_content = "".join(collected_chunks)
        if assistant_content:
            await save_message_to_db(session_factory, project_id, "assistant", assistant_content)
        yield "data: [DONE]\n\n"

    except GeneratorExit:
        # Client disconnected early (e.g. closed browser tab, clicked stop)
        logger.warning(f"Client disconnected early from chat stream for project {project_id}")
        assistant_content = "".join(collected_chunks)
        if assistant_content:
            # Save whatever content was generated up to the disconnection event
            await save_message_to_db(session_factory, project_id, "assistant", assistant_content)
        raise
        
    except Exception as e:
        logger.exception("Error streaming chat completion")
        yield f"data: {json.dumps({'error': 'Streaming completion interrupted'})}\n\n"

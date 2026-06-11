from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from fastapi import HTTPException, status
from app.models.project import Project
from app.models.message import Message
from app.models.project_file import ProjectFile
from app.schemas.project import ProjectCreate, ProjectUpdate

async def get_projects_for_user(db: AsyncSession, user_id: str) -> list[dict]:
    """Retrieve all projects for a user, including message and file count subqueries."""
    msg_sub = select(func.count(Message.id)).where(Message.project_id == Project.id).correlate(Project).scalar_subquery()
    file_sub = select(func.count(ProjectFile.id)).where(ProjectFile.project_id == Project.id).correlate(Project).scalar_subquery()
    
    stmt = select(
        Project,
        msg_sub.label("message_count"),
        file_sub.label("file_count")
    ).where(Project.user_id == user_id).order_by(desc(Project.updated_at))
    
    result = await db.execute(stmt)
    projects_list = []
    for row in result:
        proj, msg_cnt, file_cnt = row
        projects_list.append({
            "id": proj.id,
            "name": proj.name,
            "system_prompt": proj.system_prompt,
            "user_id": proj.user_id,
            "created_at": proj.created_at,
            "updated_at": proj.updated_at,
            "message_count": msg_cnt or 0,
            "file_count": file_cnt or 0
        })
    return projects_list

async def create_project(db: AsyncSession, user_id: str, project_in: ProjectCreate) -> Project:
    """Create a new project associated with the user ID."""
    project = Project(
        name=project_in.name,
        system_prompt=project_in.system_prompt,
        user_id=user_id
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project

async def get_project_by_id(db: AsyncSession, user_id: str, project_id: str) -> dict:
    """Get project details including the last 10 messages and all files, validating ownership."""
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if project.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    # Get last 10 messages chronologically
    msg_res = await db.execute(
        select(Message)
        .where(Message.project_id == project_id)
        .order_by(desc(Message.created_at))
        .limit(10)
    )
    messages = list(msg_res.scalars().all())
    messages.reverse()  # Oldest first for UI rendering
    
    # Get all project files
    file_res = await db.execute(
        select(ProjectFile)
        .where(ProjectFile.project_id == project_id)
        .order_by(ProjectFile.created_at)
    )
    files = list(file_res.scalars().all())
    
    return {
        "id": project.id,
        "name": project.name,
        "system_prompt": project.system_prompt,
        "user_id": project.user_id,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "messages": messages,
        "files": files
    }

async def update_project(db: AsyncSession, user_id: str, project_id: str, project_in: ProjectUpdate) -> Project:
    """Update project name and/or system prompt with ownership validation."""
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if project.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    if project_in.name is not None:
        project.name = project_in.name
    if project_in.system_prompt is not None:
        project.system_prompt = project_in.system_prompt
        
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project

async def delete_project(db: AsyncSession, user_id: str, project_id: str) -> None:
    """Delete project from database, triggering cascading deletes of messages and files."""
    res = await db.execute(select(Project).where(Project.id == project_id))
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
        
    if project.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    await db.delete(project)
    await db.commit()

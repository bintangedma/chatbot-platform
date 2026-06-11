from __future__ import annotations
from datetime import datetime
from uuid import uuid4
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.message import Message
    from app.models.project_file import ProjectFile

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, default="You are a helpful assistant.")
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped[User] = relationship("User", back_populates="projects")
    messages: Mapped[list[Message]] = relationship("Message", back_populates="project", cascade="all, delete-orphan")
    files: Mapped[list[ProjectFile]] = relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")

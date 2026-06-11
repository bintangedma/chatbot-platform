from __future__ import annotations
import enum
from datetime import datetime
from uuid import uuid4
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, ForeignKey, Text, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.project import Project

class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"
    system = "system"

class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped[Project] = relationship("Project", back_populates="messages")

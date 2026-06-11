from __future__ import annotations
from datetime import datetime
from uuid import uuid4
from typing import TYPE_CHECKING
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.refresh_token import RefreshToken

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    projects: Mapped[list[Project]] = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens: Mapped[list[RefreshToken]] = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

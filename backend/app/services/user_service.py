from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.schemas.auth import UserRegister
from app.core.security import hash_password

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Fetch user from database by email, applying casing normalization."""
    normalized_email = email.strip().lower()
    result = await db.execute(select(User).where(User.email == normalized_email))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    """Fetch user from database by unique ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, user_in: UserRegister) -> User:
    """Create a new user with a hashed password, enforcing lowercased email storage."""
    db_user = User(
        name=user_in.name.strip(),
        email=user_in.email.strip().lower(),
        password_hash=hash_password(user_in.password),
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

# apps/api/app/repositories/users_repo.py

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


async def get_user_by_telegram_id(db: AsyncSession, tg_id: int) -> User | None:
    q = await db.execute(select(User).where(User.telegram_id == tg_id))
    return q.scalar_one_or_none()


async def create_user(db: AsyncSession, tg_id: int, username: str) -> User:
    user = User(telegram_id=tg_id, username=username)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_or_create_user_by_telegram(db: AsyncSession, tg_id: int, tg_user: dict) -> User:
    user = await get_user_by_telegram_id(db, tg_id)
    if user:
        return user

    # username может отсутствовать
    username = tg_user.get("username") or tg_user.get("first_name") or "tg"
    return await create_user(db, tg_id, username)

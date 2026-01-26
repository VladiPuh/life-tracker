# apps/api/app/core/auth.py

from fastapi import Depends, HTTPException, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_telegram_init_data
from app.db import get_db
from app.models import User
from app.settings import settings


async def get_or_create_user_by_telegram(db: AsyncSession, tg_id: int, tg_user: dict) -> User:
    q = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = q.scalar_one_or_none()
    if user:
        return user

    # username может отсутствовать
    username = tg_user.get("username") or tg_user.get("first_name") or "tg"
    user = User(telegram_id=tg_id, username=username)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    x_telegram_init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
) -> User:
    mode = (settings.auth_mode or "DEV").upper()

    # DEV: один фиксированный пользователь
    if mode == "DEV":
        tid = settings.dev_user_telegram_id
        q = await db.execute(select(User).where(User.telegram_id == tid))
        user = q.scalar_one_or_none()
        if not user:
            user = User(telegram_id=tid, username="dev")
            db.add(user)
            await db.commit()
            await db.refresh(user)
        return user

    # PROD: Telegram initData
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=500, detail="telegram_bot_token not set")
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="Missing X-Telegram-Init-Data")

    payload = verify_telegram_init_data(x_telegram_init_data, settings.telegram_bot_token)
    tg_user = payload.get("user") or {}
    tg_id = tg_user.get("id")
    if not tg_id:
        raise HTTPException(status_code=401, detail="Missing telegram user id")

    return await get_or_create_user_by_telegram(db, int(tg_id), tg_user)

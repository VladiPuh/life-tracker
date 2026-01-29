from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.core.auth import get_current_user
from app.services.history_service import build_challenge_history, build_days_history, build_day_detail
from datetime import date

router = APIRouter()

@router.get("/history/days")
async def history_days(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Агрегированная история по дням.
    Возвращает только дни, где были логи.
    """
    return await build_days_history(db, user.id, days)

@router.get("/challenges/{challenge_id}/history")
async def challenge_history(
    challenge_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await build_challenge_history(db, user.id, challenge_id, days)

@router.get("/history/day/{day}")
async def history_day_detail(
    day: date,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await build_day_detail(db, user.id, day)

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.schemas import DailyFlagSet
from app.core.auth import get_current_user
from app.services.daily_log_service import upsert_daily_log

router = APIRouter()


@router.post("/daily-log/upsert")
async def upsert_daily(
    payload: DailyFlagSet,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ok = await upsert_daily_log(db, user.id, payload)
    if not ok:
        raise HTTPException(404, "Challenge not found")
    return {"ok": True}

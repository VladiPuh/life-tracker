from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date

from app.db import get_db
from app.models import User, Challenge, DailyLog
from app.schemas import DailyFlagSet
from app.core.auth import get_current_user
from app.services.status import apply_single_flag

router = APIRouter()

@router.post("/daily-log/upsert")
async def upsert_daily(
    payload: DailyFlagSet,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    d = payload.date or date.today()

    # проверка существования челенджа
    q = await db.execute(
        select(Challenge).where(
            and_(
                Challenge.id == payload.challenge_id,
                Challenge.user_id == user.id,
            )
        )
    )
    ch = q.scalar_one_or_none()
    if not ch:
        raise HTTPException(404, "Challenge not found")

    ql = await db.execute(
        select(DailyLog).where(
            and_(
                DailyLog.user_id == user.id,
                DailyLog.challenge_id == ch.id,
                DailyLog.date == d,
            )
        )
    )
    log = ql.scalar_one_or_none()
    if not log:
        log = DailyLog(user_id=user.id, challenge_id=ch.id, date=d)
        db.add(log)

    apply_single_flag(log, payload.flag)
    log.minutes_fact = payload.minutes_fact
    log.comment = payload.comment

    await db.commit()
    return {"ok": True}

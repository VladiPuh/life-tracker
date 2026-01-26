from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, timedelta

from app.db import get_db
from app.models import User, DailyLog
from app.core.auth import get_current_user
from app.services.status import compute_status_view

router = APIRouter()

@router.get("/challenges/{challenge_id}/history")
async def challenge_history(
    challenge_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    since = date.today() - timedelta(days=days - 1)

    q = await db.execute(
        select(DailyLog).where(
            and_(
                DailyLog.user_id == user.id,
                DailyLog.challenge_id == challenge_id,
                DailyLog.date >= since,
            )
        ).order_by(DailyLog.date.desc())
    )
    logs = q.scalars().all()

    out = []
    for log in logs:
        out.append({
            "date": str(log.date),
            "status_view": compute_status_view(log),
            "minutes_fact": log.minutes_fact,
            "comment": log.comment,
        })
    return {"challenge_id": challenge_id, "items": out}

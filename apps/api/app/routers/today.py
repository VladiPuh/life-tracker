from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date

from app.db import get_db
from app.models import User, Challenge, DailyLog
from app.schemas import TodayItem
from app.core.auth import get_current_user
from app.services.status import compute_status_view

router = APIRouter()

@router.get("/today", response_model=dict)
async def today(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today_d = date.today()

    q = await db.execute(
        select(Challenge)
        .where(
            and_(
                Challenge.user_id == user.id,
                Challenge.is_active == True,
                Challenge.is_template == False,
            )
        )
        .order_by(Challenge.id.asc())
    )
    challenges = q.scalars().all()

    items: list[TodayItem] = []
    first_waiting: TodayItem | None = None

    for ch in challenges:
        ql = await db.execute(
            select(DailyLog).where(
                and_(
                    DailyLog.user_id == user.id,
                    DailyLog.challenge_id == ch.id,
                    DailyLog.date == today_d,
                )
            )
        )
        log = ql.scalar_one_or_none()
        status_view = compute_status_view(log)
        item = TodayItem(challenge_id=ch.id, title=ch.title, status_view=status_view)
        items.append(item)
        if first_waiting is None and status_view == "WAITING":
            first_waiting = item

    return {
        "date": str(today_d),
        "first_uncompleted": first_waiting.model_dump() if first_waiting else None,
        "all": [i.model_dump() for i in items],
    }

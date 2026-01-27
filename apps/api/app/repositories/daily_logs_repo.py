# apps/api/app/repositories/daily_logs_repo.py

from datetime import date

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyLog


async def get_daily_log_for_date(
    db: AsyncSession,
    user_id: int,
    challenge_id: int,
    day: date,
) -> DailyLog | None:
    q = await db.execute(
        select(DailyLog).where(
            and_(
                DailyLog.user_id == user_id,
                DailyLog.challenge_id == challenge_id,
                DailyLog.date == day,
            )
        )
    )
    return q.scalar_one_or_none()

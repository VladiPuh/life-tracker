# apps/api/app/repositories/history_repo.py

from datetime import date

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyLog


async def get_challenge_logs_since(
    db: AsyncSession,
    user_id: int,
    challenge_id: int,
    since: date,
) -> list[DailyLog]:
    q = await db.execute(
        select(DailyLog)
        .where(
            and_(
                DailyLog.user_id == user_id,
                DailyLog.challenge_id == challenge_id,
                DailyLog.date >= since,
            )
        )
        .order_by(DailyLog.date.desc())
    )
    return q.scalars().all()

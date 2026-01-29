from datetime import date

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyLog, Challenge

async def get_day_logs(db: AsyncSession, user_id: int, day: date):
    q = await db.execute(
        select(DailyLog, Challenge.title)
        .join(Challenge, Challenge.id == DailyLog.challenge_id)
        .where(DailyLog.user_id == user_id)
        .where(DailyLog.date == day)
        .order_by(Challenge.title.asc())
    )
    return q.all()  # list[tuple[DailyLog, str]]

async def get_challenge_logs_since(
    db: AsyncSession,
    user_id: int,
    challenge_id: int | None,
    since: date,
) -> list[DailyLog]:
    conditions = [
        DailyLog.user_id == user_id,
        DailyLog.date >= since,
    ]
    if challenge_id is not None:
        conditions.append(DailyLog.challenge_id == challenge_id)

    q = await db.execute(
        select(DailyLog)
        .where(and_(*conditions))
        .order_by(DailyLog.date.desc())
    )


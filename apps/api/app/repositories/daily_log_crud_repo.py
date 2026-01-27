from datetime import date
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Challenge, DailyLog


async def get_user_challenge(
    db: AsyncSession, challenge_id: int, user_id: int
) -> Challenge | None:
    q = await db.execute(
        select(Challenge).where(
            and_(Challenge.id == challenge_id, Challenge.user_id == user_id)
        )
    )
    return q.scalar_one_or_none()


async def get_daily_log(
    db: AsyncSession,
    user_id: int,
    challenge_id: int,
    d: date,
) -> DailyLog | None:
    q = await db.execute(
        select(DailyLog).where(
            and_(
                DailyLog.user_id == user_id,
                DailyLog.challenge_id == challenge_id,
                DailyLog.date == d,
            )
        )
    )
    return q.scalar_one_or_none()


async def create_daily_log(db: AsyncSession, log: DailyLog) -> None:
    db.add(log)

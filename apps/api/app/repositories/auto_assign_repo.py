# apps/api/app/repositories/auto_assign_repo.py

from datetime import date
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Challenge, DailyLog


async def get_all_users(db: AsyncSession) -> list[User]:
    q = await db.execute(select(User))
    return q.scalars().all()


async def get_active_user_challenges(db: AsyncSession, user_id: int) -> list[Challenge]:
    q = await db.execute(
        select(Challenge).where(
            and_(
                Challenge.user_id == user_id,
                Challenge.is_active == True,
                Challenge.is_template == False,
            )
        )
    )
    return q.scalars().all()


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


async def create_daily_log(db: AsyncSession, log: DailyLog) -> None:
    db.add(log)

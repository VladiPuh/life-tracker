# apps/api/app/repositories/challenges_repo.py

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Challenge


async def get_active_user_challenges(db: AsyncSession, user_id: int) -> list[Challenge]:
    q = await db.execute(
        select(Challenge)
        .where(
            and_(
                Challenge.user_id == user_id,
                Challenge.is_active == True,
                Challenge.is_template == False,
                Challenge.deleted_at.is_(None),
            )
        )
        .order_by(Challenge.id.asc())
    )
    return q.scalars().all()

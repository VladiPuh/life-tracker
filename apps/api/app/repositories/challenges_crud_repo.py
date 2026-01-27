from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Challenge


async def create_challenge(db: AsyncSession, ch: Challenge) -> None:
    db.add(ch)


async def get_user_challenge(
    db: AsyncSession, challenge_id: int, user_id: int
) -> Challenge | None:
    q = await db.execute(
        select(Challenge).where(
            and_(Challenge.id == challenge_id, Challenge.user_id == user_id)
        )
    )
    return q.scalar_one_or_none()

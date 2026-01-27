from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Challenge
from app.schemas import ChallengeCreate, ChallengePatch
from app.repositories.challenges_crud_repo import (
    create_challenge,
    get_user_challenge,
)


async def create_user_challenge(
    db: AsyncSession, user_id: int, payload: ChallengeCreate
) -> int:
    ch = Challenge(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        miss_policy=payload.miss_policy,
    )
    await create_challenge(db, ch)
    await db.commit()
    await db.refresh(ch)
    return ch.id


async def patch_user_challenge(
    db: AsyncSession, user_id: int, challenge_id: int, payload: ChallengePatch
) -> bool:
    ch = await get_user_challenge(db, challenge_id, user_id)
    if not ch:
        return False

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(ch, k, v)

    await db.commit()
    return True


async def get_user_challenge_view(
    db: AsyncSession, user_id: int, challenge_id: int
) -> dict | None:
    ch = await get_user_challenge(db, challenge_id, user_id)
    if not ch:
        return None

    return {
        "id": ch.id,
        "title": ch.title,
        "description": ch.description,
        "miss_policy": ch.miss_policy,
        "is_active": ch.is_active,
        "goal": ch.goal,
        "checkpoints": ch.checkpoints,
        "min_activity_text": ch.min_activity_text,
        "min_minutes": ch.min_minutes,
        "bonus_text": ch.bonus_text,
        "constraints": ch.constraints,
        "success_metrics": ch.success_metrics,
        "notes": ch.notes,
        "created_at": ch.created_at.isoformat() if ch.created_at else None,
        "updated_at": ch.updated_at.isoformat() if ch.updated_at else None,
    }

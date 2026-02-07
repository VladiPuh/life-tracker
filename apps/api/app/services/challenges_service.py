from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Challenge
from app.schemas import ChallengeCreate, ChallengePatch
from app.repositories.challenges_crud_repo import (
    create_challenge,
    get_user_challenge,
)


async def create_user_challenge(
    db: AsyncSession, user_id: int, payload: ChallengeCreate
) -> int:
    miss_policy = payload.miss_policy
    if payload.type == "NO_DO":
        miss_policy = "MIN"

    ch = Challenge(
        user_id=user_id,
        title=payload.title,
        description=payload.description,
        type=payload.type,
        miss_policy=miss_policy,
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
        "type": ch.type,
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

async def list_user_challenges(db: AsyncSession, user_id: int) -> list[dict]:
    q = await db.execute(
        select(Challenge)
        .where(Challenge.user_id == user_id)
        .where(Challenge.deleted_at.is_(None))
        .order_by(Challenge.id.desc())
    )
    items = q.scalars().all()

    return [
        {
            "id": ch.id,
            "type": ch.type,
            "title": ch.title,
            "description": ch.description,
            "miss_policy": ch.miss_policy,
            "is_active": ch.is_active,
            "created_at": ch.created_at.isoformat() if ch.created_at else None,
            "updated_at": ch.updated_at.isoformat() if ch.updated_at else None,
        }
        for ch in items
    ]

from datetime import datetime, timezone

async def soft_delete_user_challenge(db: AsyncSession, user_id: int, challenge_id: int) -> bool:
    ch = await get_user_challenge(db, challenge_id, user_id)
    if not ch:
        return False

    ch.is_active = False
    ch.deleted_at = datetime.now(timezone.utc)

    await db.commit()
    return True

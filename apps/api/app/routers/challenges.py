from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db import get_db
from app.models import User, Challenge
from app.schemas import ChallengeCreate, ChallengePatch
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/challenges")
async def create_challenge(
    payload: ChallengeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch = Challenge(
        user_id=user.id,
        title=payload.title,
        description=payload.description,
        miss_policy=payload.miss_policy,
    )
    db.add(ch)
    return {"id": ch.id}


@router.patch("/challenges/{challenge_id}")
async def patch_challenge(
    challenge_id: int,
    payload: ChallengePatch,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(Challenge).where(and_(Challenge.id == challenge_id, Challenge.user_id == user.id))
    )

    ch = q.scalar_one_or_none()
    if not ch:
        raise HTTPException(404, "Challenge not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(ch, k, v)

    return {"ok": True}


@router.get("/challenges/{challenge_id}")
async def get_challenge(
    challenge_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(Challenge).where(and_(Challenge.id == challenge_id, Challenge.user_id == user.id))
    )

    ch = q.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")

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

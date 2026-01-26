from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db import get_db
from app.models import ChallengeTemplate, Challenge, User
from app.core.auth import get_current_user


router = APIRouter()

@router.get("/templates")
async def get_templates(db: AsyncSession = Depends(get_db)):
    q = await db.execute(
        select(ChallengeTemplate)
        .where(ChallengeTemplate.is_active == True)
        .order_by(ChallengeTemplate.id.asc())
    )
    templates = q.scalars().all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "miss_policy": t.miss_policy,
        }
        for t in templates
    ]

@router.post("/templates/{template_id}/add")
async def add_template_to_user(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.execute(select(ChallengeTemplate).where(ChallengeTemplate.id == template_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    ch = Challenge(
        user_id=user.id,
        title=t.title,
        description=t.description,
        miss_policy=t.miss_policy,
        is_active=True,
        goal=t.goal,
        checkpoints=t.checkpoints,
        min_activity_text=t.min_activity_text,
        min_minutes=t.min_minutes,
        bonus_text=t.bonus_text,
        constraints=t.constraints,
        success_metrics=t.success_metrics,
        notes=t.notes,
    )
    db.add(ch)
    await db.commit()
    await db.refresh(ch)

    return {"challenge_id": ch.id}


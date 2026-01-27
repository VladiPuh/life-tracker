# apps/api/app/repositories/templates_repo.py

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ChallengeTemplate, Challenge


async def get_active_templates(db: AsyncSession) -> list[ChallengeTemplate]:
    q = await db.execute(
        select(ChallengeTemplate)
        .where(ChallengeTemplate.is_active == True)
        .order_by(ChallengeTemplate.id.asc())
    )
    return q.scalars().all()


async def get_template_by_id(db: AsyncSession, template_id: int) -> ChallengeTemplate | None:
    q = await db.execute(
        select(ChallengeTemplate).where(ChallengeTemplate.id == template_id)
    )
    return q.scalar_one_or_none()


async def create_challenge_from_template(
    db: AsyncSession,
    user_id: int,
    t: ChallengeTemplate,
) -> Challenge:
    ch = Challenge(
        user_id=user_id,
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
    return ch

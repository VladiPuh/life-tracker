from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import ChallengeTemplate

async def list_templates(db: AsyncSession) -> list[dict]:
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

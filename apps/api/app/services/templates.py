# apps/api/app/services/templates.py

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.templates_repo import (
    get_active_templates,
    get_template_by_id,
    create_challenge_from_template,
)


async def list_templates(db: AsyncSession) -> list[dict]:
    templates = await get_active_templates(db)
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "miss_policy": t.miss_policy,
        }
        for t in templates
    ]


async def add_template_to_user(
    db: AsyncSession,
    user_id: int,
    template_id: int,
) -> int:
    t = await get_template_by_id(db, template_id)
    if not t:
        return 0
    ch = await create_challenge_from_template(db, user_id, t)
    return ch.id

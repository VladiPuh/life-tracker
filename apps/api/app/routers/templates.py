from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.core.auth import get_current_user
from app.services.templates import list_templates, add_template_to_user

router = APIRouter()


@router.get("/templates")
async def get_templates(db: AsyncSession = Depends(get_db)):
    return await list_templates(db)


@router.post("/templates/{template_id}/add")
async def add_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch_id = await add_template_to_user(db, user.id, template_id)
    if not ch_id:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"challenge_id": ch_id}

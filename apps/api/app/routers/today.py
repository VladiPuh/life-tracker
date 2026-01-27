from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from app.db import get_db
from app.models import User
from app.core.auth import get_current_user
from app.services.today_service import build_today_view

router = APIRouter()


@router.get("/today", response_model=dict)
async def today(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today_d = date.today()
    return await build_today_view(db, user.id, today_d)


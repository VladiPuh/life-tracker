from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.core.auth import get_current_user
from app.services.history_service import build_challenge_history

router = APIRouter()


@router.get("/challenges/{challenge_id}/history")
async def challenge_history(
    challenge_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await build_challenge_history(db, user.id, challenge_id, days)

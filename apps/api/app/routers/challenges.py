from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models import User
from app.schemas import ChallengeCreate, ChallengePatch
from app.core.auth import get_current_user
from app.services.challenges_service import (
    create_user_challenge,
    patch_user_challenge,
    get_user_challenge_view,
    list_user_challenges,
    soft_delete_user_challenge,
)

router = APIRouter()


@router.post("/challenges")
async def create_challenge(
    payload: ChallengeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch_id = await create_user_challenge(db, user.id, payload)
    return {"id": ch_id}


@router.patch("/challenges/{challenge_id}")
async def patch_challenge(
    challenge_id: int,
    payload: ChallengePatch,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ok = await patch_user_challenge(db, user.id, challenge_id, payload)
    if not ok:
        raise HTTPException(404, "Challenge not found")
    return {"ok": True}


@router.get("/challenges")
async def list_challenges(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await list_user_challenges(db, user.id)


@router.get("/challenges/{challenge_id}")
async def get_challenge(
    challenge_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    out = await get_user_challenge_view(db, user.id, challenge_id)
    if not out:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return out


@router.delete("/challenges/{challenge_id}")
async def delete_challenge(
    challenge_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ok = await soft_delete_user_challenge(db, user.id, challenge_id)
    if not ok:
        raise HTTPException(404, "Challenge not found")
    return {"ok": True}

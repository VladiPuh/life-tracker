from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.services.auto_assign import auto_assign_missed
from app.db import SessionLocal
from app.models import User
from app.services.daily_log_service import upsert_daily_log

class TzTestPayload(BaseModel):
    user_id: int = 2
    challenge_id: int = 5
    status_view: str = "MIN"
    minutes_fact: int | None = 3
    comment: str | None = "tz test"

router = APIRouter()

@router.post("/dev/tz-test-upsert")
async def tz_test_upsert(payload: TzTestPayload):
    async with SessionLocal() as db:
        res = await db.execute(select(User).where(User.id == payload.user_id))
        user = res.scalars().first()
        if not user:
            return {"ok": False, "error": "user not found"}

        user_now = datetime.now(ZoneInfo(user.timezone))
        user_today = user_now.date()

        # имитируем UI: date отсутствует
        svc_payload = type("P", (), {
            "date": None,
            "challenge_id": payload.challenge_id,
            "status_view": payload.status_view,
            "minutes_fact": payload.minutes_fact,
            "comment": payload.comment,
        })()

        ok = await upsert_daily_log(db, user, svc_payload)
        await db.commit()

        return {
            "ok": ok,
            "server_now": datetime.now().isoformat(),
            "user_now": user_now.isoformat(),
            "computed_date": str(user_today),
        }

@router.post("/dev/run-auto-assign")
async def dev_run_auto_assign():
    await auto_assign_missed()
    return {"ok": True}

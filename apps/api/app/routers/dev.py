from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.services.auto_assign import auto_assign_missed
from app.db import SessionLocal
from app.models import User
from app.services.daily_log_service import upsert_daily_log

router = APIRouter()

@router.post("/dev/run-auto-assign")
async def dev_run_auto_assign():
    await auto_assign_missed()
    return {"ok": True}

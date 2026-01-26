# apps/api/app/routers/dev.py

from fastapi import APIRouter
from app.services.auto_assign import auto_assign_missed

router = APIRouter()

@router.post("/dev/run-auto-assign")
async def dev_run_auto_assign():
    await auto_assign_missed()
    return {"ok": True}

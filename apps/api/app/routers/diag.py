# apps/api/app/routers/diag.py

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.settings import settings
from app.services.diag_service import build_diag_payload

router = APIRouter()

@router.get("/diag")
async def diag(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_diag_token: str | None = Header(default=None, alias="X-Diag-Token"),
    x_telegram_init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
):
    # Security model:
    # - DEV: allowed without token (local dev/tests)
    # - PROD: requires X-Diag-Token == settings.diag_token
    mode = (settings.auth_mode or "DEV").upper()
    if mode == "PROD":
        if not settings.diag_token:
            raise HTTPException(status_code=500, detail="diag_token not set")
        if not x_diag_token or x_diag_token != settings.diag_token:
            raise HTTPException(status_code=401, detail="Invalid X-Diag-Token")

    scheduler = getattr(request.app.state, "scheduler", None)

    result = await build_diag_payload(
        db=db,
        telegram_init_data_header=x_telegram_init_data,
        admin_telegram_id=settings.admin_telegram_id,
        scheduler=scheduler,
    )

    return result.payload

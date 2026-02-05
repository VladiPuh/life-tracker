from __future__ import annotations

import asyncio
import time
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User


@dataclass(frozen=True)
class DiagResult:
    status: str  # OK | DEGRADED | FAIL
    payload: dict


async def build_diag_payload(
    *,
    db: AsyncSession,
    telegram_init_data_header: str | None,
    admin_telegram_id: int | None,
    scheduler: object | None,
) -> DiagResult:
    """Build a minimal but canonical diagnostic snapshot.

    Safe to call frequently. Must not mutate DB state.
    """
    timestamp_utc = (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )

    # --- backend ---
    backend_alive = True

    # --- auth context ---
    tg_state = "ABSENT" if telegram_init_data_header is None else "PRESENT"

    # --- database ---
    db_connected = False
    db_error: str | None = None
    admin_timezone = "Europe/Vilnius"
    admin_today: str | None = None

    try:
        if admin_telegram_id is not None:
            q = await db.execute(select(User).where(User.telegram_id == admin_telegram_id))
            admin_user = q.scalar_one_or_none()
            if admin_user and admin_user.timezone:
                admin_timezone = admin_user.timezone
        else:
            q = await db.execute(select(User).limit(1))
            u = q.scalar_one_or_none()
            if u and u.timezone:
                admin_timezone = u.timezone

        db_connected = True
    except Exception as e:
        db_error = f"{type(e).__name__}: {e}"

    # --- time ---
    try:
        admin_today = datetime.now(ZoneInfo(admin_timezone)).date().isoformat()
    except Exception:
        admin_timezone = "Europe/Vilnius"
        admin_today = datetime.now(ZoneInfo(admin_timezone)).date().isoformat()

    # --- scheduler ---
    scheduler_running = False
    job_ids: list[str] = []
    try:
        if scheduler is not None:
            scheduler_running = bool(getattr(scheduler, "running", False))
            jobs = getattr(scheduler, "get_jobs", lambda: [])()
            job_ids = [getattr(j, "id", "unknown") for j in jobs]
    except Exception:
        scheduler_running = False
        job_ids = []

    # --- public api health (stdlib only) ---
    public_api_url = "https://api.lifetracker.site/api/health"
    public_ok = False
    public_latency_ms: int | None = None
    public_error: str | None = None

    def _probe(url: str) -> int:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return int(getattr(resp, "status", 0) or 0)

    try:
        start = time.perf_counter()
        status_code = await asyncio.to_thread(_probe, public_api_url)
        public_latency_ms = int((time.perf_counter() - start) * 1000)

        public_ok = status_code == 200
        if not public_ok:
            public_error = f"HTTP {status_code}"
    except Exception as e:
        public_error = f"{type(e).__name__}: {e}"

    # --- overall status ---
    if not backend_alive or not db_connected:
        overall = "FAIL"
    elif not scheduler_running or not public_ok:
        overall = "DEGRADED"
    else:
        overall = "OK"

    payload = {
        "status": overall,
        "timestamp_utc": timestamp_utc,
        "backend": {"alive": backend_alive},
        "database": {"connected": db_connected, "error": db_error},
        "time": {
            "server_utc": timestamp_utc,
            "admin_timezone": admin_timezone,
            "admin_today": admin_today,
        },
        "scheduler": {"running": scheduler_running, "jobs": job_ids},
        "public": {
            "api_health_url": public_api_url,
            "ok": public_ok,
            "latency_ms": public_latency_ms,
            "error": public_error,
        },
        "auth": {"telegram_init_data": tg_state},
    }

    return DiagResult(status=overall, payload=payload)

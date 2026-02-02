from app.core.logging import setup_logging
setup_logging()

from fastapi import FastAPI
from sqlalchemy import select
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine, SessionLocal 
from .models import ChallengeTemplate
from .settings import settings

from app.services.auto_assign import auto_assign_missed

from app.routers.health import router as health_router
from app.routers.dev import router as dev_router
from app.routers.templates import router as templates_router
from app.routers.today import router as today_router
from app.routers.daily_log import router as daily_log_router
from app.routers.history import router as history_router
from app.routers.challenges import router as challenges_router

import logging
log = logging.getLogger("lifetracker.auth")

app = FastAPI(title=settings.app_name)
app.include_router(health_router)
app.include_router(dev_router)
app.include_router(templates_router)
app.include_router(today_router)
app.include_router(daily_log_router)
app.include_router(history_router)
app.include_router(challenges_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def _log_initdata_header(request, call_next):
    if request.url.path in ("/today", "/templates"):
        init_data = request.headers.get("x-telegram-init-data")  # None если нет
        ua = request.headers.get("user-agent", "")
        state = (
            "ABSENT" if init_data is None else
            "EMPTY" if init_data == "" else
            f"len={len(init_data)} head={init_data[:60]!r}"
        )
        log.warning("UA=%r | X-Telegram-Init-Data %s", ua[:120], state)
    return await call_next(request)

@app.on_event("startup")
async def on_startup():
    # 1) Таблицы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2) Инициализация 3 шаблонов (добавляем только недостающие)
    async with SessionLocal() as db:
        need = {
            "Fit": dict(
                title="Fit",
                description="Домашняя тренировка каждый день (минимум — короткая сессия).",
                miss_policy="FAIL",
                min_minutes=10,
                min_activity_text="Минимум 10 минут движения/упражнений дома",
                bonus_text="Бонус: 30+ минут или более сложная тренировка",
            ),
            "Reading": dict(
                title="Reading",
                description="Читать каждый день (книга/статья).",
                miss_policy="FAIL",
                min_minutes=10,
                min_activity_text="Минимум 10 минут чтения",
                bonus_text="Бонус: 30+ минут или конспект",
            ),
            "Python": dict(
                title="Python",
                description="Учить Python каждый день (практика/разбор кода).",
                miss_policy="FAIL",
                min_minutes=20,
                min_activity_text="Минимум 20 минут практики/разбора",
                bonus_text="Бонус: решить 1 задачу или сделать мини-правку",
            ),
        }

        q = await db.execute(select(ChallengeTemplate))
        existing = {t.title for t in q.scalars().all()}

        to_add = []
        for title, data in need.items():
            if title not in existing:
                to_add.append(ChallengeTemplate(**data))

        if to_add:
            db.add_all(to_add)
            await db.commit()

    # 3) Планировщик (один экземпляр)
    if not getattr(app.state, "scheduler", None):
        scheduler = AsyncIOScheduler(timezone="UTC")
        scheduler.add_job(
            auto_assign_missed,
            trigger="interval",
            minutes=1,
            id="auto_assign_missed",
            replace_existing=True,
            coalesce=True,
            max_instances=1,
        )
        scheduler.start()
        app.state.scheduler = scheduler


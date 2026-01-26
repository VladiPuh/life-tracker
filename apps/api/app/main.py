from fastapi import FastAPI, Depends, HTTPException, Header
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .db import Base, engine, get_db, SessionLocal 
from .models import User, Challenge, DailyLog, ChallengeTemplate
from .schemas import ChallengeCreate, ChallengePatch, DailyFlagSet, TodayItem
from .settings import settings
from fastapi.middleware.cors import CORSMiddleware

import hmac, hashlib
from urllib.parse import parse_qsl

# где-то рядом с созданием app / роутами (не важно где, главное один раз)
import logging
log = logging.getLogger("lifetracker.auth")

app = FastAPI(title=settings.app_name)
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

def verify_telegram_init_data(init_data: str, bot_token: str) -> dict:
    # init_data: "query_id=...&user=...&auth_date=...&hash=..."
    data = dict(parse_qsl(init_data, keep_blank_values=True))
    their_hash = data.pop("hash", None)
    if not their_hash:
        raise HTTPException(status_code=401, detail="Missing hash")

    pairs = [f"{k}={v}" for k, v in sorted(data.items())]
    check_string = "\n".join(pairs)

    secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
    our_hash = hmac.new(secret_key, check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(our_hash, their_hash):
        raise HTTPException(status_code=401, detail="Bad initData hash")

    # user приходит JSON строкой
    # вернём распарсенное как dict (дальше используем id)
    import json
    if "user" in data:
        data["user"] = json.loads(data["user"])
    return data

def compute_status_view(log: DailyLog | None) -> str:
    if log is None:
        return "WAITING"
    if log.flag_bonus: return "BONUS"
    if log.flag_min: return "MIN"
    if log.flag_skip: return "SKIP"
    if log.flag_fail: return "FAIL"
    return "WAITING"

def apply_single_flag(log: DailyLog, flag: str):
    # сброс всех
    log.flag_min = log.flag_bonus = log.flag_skip = log.flag_fail = False
    # установка одного
    if flag == "MIN": log.flag_min = True
    elif flag == "BONUS": log.flag_bonus = True
    elif flag == "SKIP": log.flag_skip = True
    elif flag == "FAIL": log.flag_fail = True
    else: raise ValueError("Bad flag")

async def get_or_create_user_by_telegram(db: AsyncSession, tg_id: int, tg_user: dict) -> User:
    q = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = q.scalar_one_or_none()
    if user:
        return user

    # username может отсутствовать
    username = tg_user.get("username") or tg_user.get("first_name") or "tg"
    user = User(telegram_id=tg_id, username=username)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    x_telegram_init_data: str | None = Header(default=None, alias="X-Telegram-Init-Data"),
) -> User:
    mode = (settings.auth_mode or "DEV").upper()

    # DEV: один фиксированный пользователь
    if mode == "DEV":
        tid = settings.dev_user_telegram_id
        q = await db.execute(select(User).where(User.telegram_id == tid))
        user = q.scalar_one_or_none()
        if not user:
            user = User(telegram_id=tid, username="dev")
            db.add(user)
            await db.commit()
            await db.refresh(user)
        return user

    # PROD: Telegram initData
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=500, detail="telegram_bot_token not set")
    if not x_telegram_init_data:
        raise HTTPException(status_code=401, detail="Missing X-Telegram-Init-Data")

    payload = verify_telegram_init_data(x_telegram_init_data, settings.telegram_bot_token)
    tg_user = payload.get("user") or {}
    tg_id = tg_user.get("id")
    if not tg_id:
        raise HTTPException(status_code=401, detail="Missing telegram user id")

    return await get_or_create_user_by_telegram(db, int(tg_id), tg_user)


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
        scheduler = AsyncIOScheduler(timezone="Europe/Vilnius")
        scheduler.add_job(auto_assign_missed, "cron", hour=23, minute=59)
        scheduler.start()
        app.state.scheduler = scheduler

@app.get("/health")
async def health():
    return {"ok": True}

@app.post("/challenges")
async def create_challenge(
    payload: ChallengeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ch = Challenge(user_id=user.id, title=payload.title, description=payload.description, miss_policy=payload.miss_policy)
    db.add(ch)
    return {"id": ch.id}

@app.patch("/challenges/{challenge_id}")
async def patch_challenge(
    challenge_id: int,
    payload: ChallengePatch,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(Challenge).where(and_(Challenge.id == challenge_id, Challenge.user_id == user.id))
    )

    ch = q.scalar_one_or_none()
    if not ch:
        raise HTTPException(404, "Challenge not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(ch, k, v)

    return {"ok": True}

@app.get("/challenges/{challenge_id}")
async def get_challenge(
    challenge_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.execute(
        select(Challenge).where(and_(Challenge.id == challenge_id, Challenge.user_id == user.id))
    )

    ch = q.scalar_one_or_none()
    if not ch:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return {
        "id": ch.id,
        "title": ch.title,
        "description": ch.description,
        "miss_policy": ch.miss_policy,
        "is_active": ch.is_active,
        "goal": ch.goal,
        "checkpoints": ch.checkpoints,
        "min_activity_text": ch.min_activity_text,
        "min_minutes": ch.min_minutes,
        "bonus_text": ch.bonus_text,
        "constraints": ch.constraints,
        "success_metrics": ch.success_metrics,
        "notes": ch.notes,
        "created_at": ch.created_at.isoformat() if ch.created_at else None,
        "updated_at": ch.updated_at.isoformat() if ch.updated_at else None,
    }

@app.get("/today", response_model=dict)
async def today(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    today_d = date.today()

    q = await db.execute(select(Challenge).where(and_(Challenge.user_id == user.id, Challenge.is_active == True, Challenge.is_template == False)).order_by(Challenge.id.asc()))
    challenges = q.scalars().all()

    items: list[TodayItem] = []
    first_waiting: TodayItem | None = None

    for ch in challenges:
        ql = await db.execute(select(DailyLog).where(and_(DailyLog.user_id == user.id, DailyLog.challenge_id == ch.id, DailyLog.date == today_d)))
        log = ql.scalar_one_or_none()
        status_view = compute_status_view(log)
        item = TodayItem(challenge_id=ch.id, title=ch.title, status_view=status_view)
        items.append(item)
        if first_waiting is None and status_view == "WAITING":
            first_waiting = item

    return {
        "date": str(today_d),
        "first_uncompleted": first_waiting.model_dump() if first_waiting else None,
        "all": [i.model_dump() for i in items],
    }

@app.post("/daily-log/upsert")
async def upsert_daily(
    payload: DailyFlagSet,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    d = payload.date or date.today()

    # проверка существования челенджа
    q = await db.execute(select(Challenge).where(and_(Challenge.id == payload.challenge_id, Challenge.user_id == user.id)))
    ch = q.scalar_one_or_none()
    if not ch:
        raise HTTPException(404, "Challenge not found")

    ql = await db.execute(select(DailyLog).where(and_(DailyLog.user_id == user.id, DailyLog.challenge_id == ch.id, DailyLog.date == d)))
    log = ql.scalar_one_or_none()
    if not log:
        log = DailyLog(user_id=user.id, challenge_id=ch.id, date=d)
        db.add(log)

    apply_single_flag(log, payload.flag)
    log.minutes_fact = payload.minutes_fact
    log.comment = payload.comment

    await db.commit()
    return {"ok": True}

@app.get("/challenges/{challenge_id}/history")
async def challenge_history(
    challenge_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    since = date.today() - timedelta(days=days - 1)


    q = await db.execute(
        select(DailyLog).where(
            and_(
                DailyLog.user_id == user.id,
                DailyLog.challenge_id == challenge_id,
                DailyLog.date >= since
            )
        ).order_by(DailyLog.date.desc())
    )
    logs = q.scalars().all()

    out = []
    for log in logs:
        out.append({
            "date": str(log.date),
            "status_view": compute_status_view(log),
            "minutes_fact": log.minutes_fact,
            "comment": log.comment,
        })
    return {"challenge_id": challenge_id, "items": out}

@app.get("/templates")
async def get_templates(db: AsyncSession = Depends(get_db)):
    q = await db.execute(
        select(ChallengeTemplate)
        .where(ChallengeTemplate.is_active == True)
        .order_by(ChallengeTemplate.id.asc())
    )
    templates = q.scalars().all()

    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "miss_policy": t.miss_policy,
        }
        for t in templates
    ]

@app.post("/templates/{template_id}/add")
async def add_template_to_user(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    q = await db.execute(select(ChallengeTemplate).where(ChallengeTemplate.id == template_id))
    t = q.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")

    ch = Challenge(
        user_id=user.id,
        title=t.title,
        description=t.description,
        miss_policy=t.miss_policy,
        goal=t.goal,
        checkpoints=t.checkpoints,
        min_activity_text=t.min_activity_text,
        min_minutes=t.min_minutes,
        bonus_text=t.bonus_text,
        constraints=t.constraints,
        success_metrics=t.success_metrics,
        notes=t.notes,
    )
    db.add(ch)
    await db.commit()
    await db.refresh(ch)

    return {"challenge_id": ch.id}

async def auto_assign_missed():
    """
    В 23:59 по Europe/Vilnius:
    - для каждого активного челенджа пользователя
    - если на сегодня нет записи в daily_log
    - создаём запись с флагом по miss_policy (по умолчанию FAIL)
    """
    today_d = date.today()

    async with SessionLocal() as db:
        # 1) Берём всех пользователей
        q_users = await db.execute(select(User))
        users = q_users.scalars().all()

        for user in users:
            # 2) Берём активные не-шаблонные челенджи
            q_ch = await db.execute(
                select(Challenge).where(
                    and_(
                        Challenge.user_id == user.id,
                        Challenge.is_active == True,
                        Challenge.is_template == False,
                    )
                )
            )
            challenges = q_ch.scalars().all()

            for ch in challenges:
                # 3) Есть ли уже лог на сегодня?
                q_log = await db.execute(
                    select(DailyLog).where(
                        and_(
                            DailyLog.user_id == user.id,
                            DailyLog.challenge_id == ch.id,
                            DailyLog.date == today_d,
                        )
                    )
                )
                existing = q_log.scalar_one_or_none()
                if existing:
                    continue  # пользователь уже отметил — не трогаем

                # 4) Создаём лог по политике пропуска
                policy = (ch.miss_policy or "FAIL").upper()

                log = DailyLog(user_id=user.id, challenge_id=ch.id, date=today_d)
                try:
                    apply_single_flag(log, policy)  # MIN/BONUS/SKIP/FAIL
                except Exception:
                    apply_single_flag(log, "FAIL")  # страховка

                db.add(log)

        await db.commit()
        
@app.post("/dev/run-auto-assign")
async def dev_run_auto_assign():
    await auto_assign_missed()
    return {"ok": True}

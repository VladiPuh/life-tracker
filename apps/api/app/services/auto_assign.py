# apps/api/app/services/auto_assign.py

from datetime import date

from app.db import SessionLocal
from app.models import DailyLog
from app.services.status import apply_single_flag
from app.repositories.auto_assign_repo import (
    get_all_users,
    get_active_user_challenges,
    get_daily_log_for_date,
    create_daily_log,
)


async def auto_assign_missed():
    """
    В 23:59 Europe/Vilnius:
    - для каждого пользователя
    - для каждого активного не-шаблонного челенджа
    - если за сегодня нет записи в daily_log
    - создаём запись по miss_policy (по умолчанию FAIL)
    """
    today_d = date.today()

    async with SessionLocal() as db:
        users = await get_all_users(db)

        for user in users:
            challenges = await get_active_user_challenges(db, user.id)

            for ch in challenges:
                existing = await get_daily_log_for_date(
                    db, user.id, ch.id, today_d
                )
                if existing:
                    continue

                policy = (ch.miss_policy or "FAIL").upper()
                log = DailyLog(
                    user_id=user.id,
                    challenge_id=ch.id,
                    date=today_d,
                )
                try:
                    apply_single_flag(log, policy)
                except Exception:
                    apply_single_flag(log, "FAIL")

                await create_daily_log(db, log)

        await db.commit()

from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

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
    now_utc = datetime.now(timezone.utc)

    async with SessionLocal() as db:
        users = await get_all_users(db)

        for user in users:
            local_now = now_utc.astimezone(ZoneInfo(user.timezone))
            local_today = local_now.date()
            yesterday = local_today - timedelta(days=1)
            # Закрываем "вчера" только после наступления нового дня (первые 10 минут)
            if not (local_now.hour == 0 and local_now.minute < 10):
                continue

            # уже закрывали вчера — пропускаем
            if user.last_closed_date == yesterday:
                continue

            challenges = await get_active_user_challenges(db, user.id)

            for ch in challenges:
                existing = await get_daily_log_for_date(db, user.id, ch.id, yesterday)

                if existing:
                    # auto-assign никогда не трогает MANUAL-факт
                    if (existing.origin or "MANUAL").upper() == "MANUAL":
                        continue
                    # если вдруг есть AUTO-запись — тоже не трогаем в этой версии
                    continue

                policy = (ch.miss_policy or "FAIL").upper()
                if policy not in ("MIN", "FAIL"):
                    policy = "FAIL"

                log = DailyLog(
                    user_id=user.id,
                    challenge_id=ch.id,
                    date=yesterday,
                    origin="AUTO",
                )

                try:
                    apply_single_flag(log, policy)
                except Exception:
                    apply_single_flag(log, "FAIL")

                await create_daily_log(db, log)

            # помечаем, что вчера закрыто (даже если челленджей 0)
            user.last_closed_date = yesterday
            db.add(user)

        await db.commit()

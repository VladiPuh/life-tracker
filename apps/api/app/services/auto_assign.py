# apps/api/app/services/auto_assign.py

from datetime import date
from sqlalchemy import select, and_

from app.db import SessionLocal
from app.models import User, Challenge, DailyLog
from app.services.status import apply_single_flag


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

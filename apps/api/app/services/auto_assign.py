from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession

from app.db import SessionLocal
from app.models import User, Challenge, DailyLog
from app.repositories.auto_assign_repo import (
    get_daily_log_for_date,
    create_daily_log,
)


async def auto_assign_missed() -> None:
    async with SessionLocal() as db:
        users = (await db.execute(
            User.__table__.select()
        )).fetchall()

        for user_row in users:
            user = User(**user_row)

            # текущее время пользователя
            now_utc = datetime.now(timezone.utc)
            local_now = now_utc.astimezone(ZoneInfo(user.timezone))
            user_today = local_now.date()

            last_closed = user.last_closed_date

            # если вчера уже закрыт — делать нечего
            if last_closed is not None and last_closed >= user_today - timedelta(days=1):
                continue

            # день, который разрешено закрывать
            day_to_close = (
                last_closed + timedelta(days=1)
                if last_closed is not None
                else user_today - timedelta(days=1)
            )

            challenges = (await db.execute(
                Challenge.__table__.select()
            )).fetchall()

            for ch_row in challenges:
                ch = Challenge(**ch_row)

                existing = await get_daily_log_for_date(
                    db, user.id, ch.id, day_to_close
                )
                if existing:
                    continue

                log = DailyLog(
                    user_id=user.id,
                    challenge_id=ch.id,
                    date=day_to_close,
                    flag_fail=True,
                    origin="AUTO",
                )
                await create_daily_log(db, log)

            user.last_closed_date = day_to_close
            db.add(user)

        await db.commit()

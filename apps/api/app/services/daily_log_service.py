from datetime import date, datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DailyLog
from app.schemas import DailyFlagSet
from app.services.status import apply_single_flag
from app.repositories.daily_log_crud_repo import (
    get_user_challenge,
    get_daily_log,
    create_daily_log,
)


async def upsert_daily_log(
    db: AsyncSession,
    user_id: int,
    payload: DailyFlagSet,
) -> bool:
    d = payload.date or date.today()

    ch = await get_user_challenge(db, payload.challenge_id, user_id)
    if not ch:
        return False

    log = await get_daily_log(db, user_id, ch.id, d)
    is_new = log is None

    if is_new:
        log = DailyLog(user_id=user_id, challenge_id=ch.id, date=d)
        await create_daily_log(db, log)

    apply_single_flag(log, payload.flag)
    log.minutes_fact = payload.minutes_fact
    log.comment = payload.comment

    # Любая ручная фиксация/правка = MANUAL, и если это не новая запись — фиксируем след правки
    log.origin = "MANUAL"
    if not is_new:
        log.edited_at = datetime.now(timezone.utc)
        log.edited_origin = "MANUAL"

    await db.commit()
    return True

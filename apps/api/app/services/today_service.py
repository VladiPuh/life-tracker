# apps/api/app/services/today_service.py

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import TodayItem
from app.services.status import compute_status_view
from app.repositories.challenges_repo import get_active_user_challenges
from app.repositories.daily_logs_repo import get_daily_log_for_date


async def build_today_view(db: AsyncSession, user_id: int, day: date) -> dict:
    challenges = await get_active_user_challenges(db, user_id)

    items: list[TodayItem] = []
    first_waiting: TodayItem | None = None

    for ch in challenges:
        log = await get_daily_log_for_date(db, user_id, ch.id, day)
        status_view = compute_status_view(log)
        item = TodayItem(challenge_id=ch.id, title=ch.title, status_view=status_view)
        items.append(item)
        if first_waiting is None and status_view == "WAITING":
            first_waiting = item

    return {
        "date": str(day),
        "first_uncompleted": first_waiting.model_dump() if first_waiting else None,
        "all": [i.model_dump() for i in items],
    }

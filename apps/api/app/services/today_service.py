# apps/api/app/services/today_service.py

from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas import TodayItem
from app.services.status import compute_status_view
from app.repositories.challenges_repo import get_active_user_challenges
from app.repositories.daily_logs_repo import get_daily_log_for_date


async def build_today_view(db, user, day: date):
    is_day_closed = user.last_closed_date == day
    challenges = await get_active_user_challenges(db, user.id)

    items: list[dict] = []
    first_uncompleted: dict | None = None

    for ch in challenges:
        log = await get_daily_log_for_date(db, user.id, ch.id, day)
        status_view = compute_status_view(log)

        item = {
            "challenge_id": ch.id,
            "title": ch.title,
            "status_view": status_view,
        }
        items.append(item)

        if first_uncompleted is None and status_view is None:
            first_uncompleted = item


    return {
        "date": day.isoformat(),
        "is_day_closed": is_day_closed,
        "first_uncompleted": first_uncompleted,
        "all": items,
    }

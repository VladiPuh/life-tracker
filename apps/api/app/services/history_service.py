# apps/api/app/services/history_service.py

from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.history_repo import get_challenge_logs_since
from app.services.status import compute_status_view


async def build_challenge_history(
    db: AsyncSession,
    user_id: int,
    challenge_id: int,
    days: int = 30,
) -> dict:
    since = date.today() - timedelta(days=days - 1)

    logs = await get_challenge_logs_since(db, user_id, challenge_id, since)

    out = []
    for log in logs:
        out.append(
            {
                "date": str(log.date),
                "status_view": compute_status_view(log),
                "minutes_fact": log.minutes_fact,
                "comment": log.comment,
            }
        )

    return {"challenge_id": challenge_id, "items": out}

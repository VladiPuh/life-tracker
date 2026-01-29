from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession


from app.repositories.history_repo import get_challenge_logs_since, get_day_logs
from app.services.status import compute_status_view


async def build_challenge_history(
    db: AsyncSession,
    user_id: int,
    challenge_id: int,
    days: int = 30,
) -> dict:
    since = date.today() - timedelta(days=days - 1)

    logs = await get_challenge_logs_since(db, user_id, challenge_id, since)
    logs = logs or []

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

from collections import defaultdict
from app.repositories.history_repo import get_challenge_logs_since


async def build_days_history(
    db: AsyncSession,
    user_id: int,
    days: int = 30,
) -> list[dict]:
    """
    Агрегированная история по дням.
    Возвращает только дни, где были логи.
    """
    from sqlalchemy import select
    from app.models import DailyLog

    q = await db.execute(
        select(DailyLog)
        .where(DailyLog.user_id == user_id)
        .order_by(DailyLog.date.desc())
    )
    logs = q.scalars().all()


    by_day: dict[str, list] = defaultdict(list)

    for log in logs:
        by_day[str(log.date)].append(log)

    result = []

    for day, items in sorted(by_day.items(), reverse=True):
        total = len(items)

        min_cnt = 0
        bonus_cnt = 0
        skip_cnt = 0
        fail_cnt = 0

        for log in items:
            view = compute_status_view(log)

            if view == "MIN":
                min_cnt += 1
            elif view == "BONUS":
                bonus_cnt += 1
            elif view == "SKIP":
                skip_cnt += 1
            elif view == "FAIL":
                fail_cnt += 1

        result.append(
            {
                "date": day,
                "total": total,
                "min": min_cnt,
                "bonus": bonus_cnt,
                "skip": skip_cnt,
                "fail": fail_cnt,
            }
        )

    return result

async def build_day_detail(db: AsyncSession, user_id: int, day: date) -> dict:
    rows = await get_day_logs(db, user_id, day)

    items = []
    for log, title in rows:
        items.append(
            {
                "challenge_id": log.challenge_id,
                "title": title,
                "status_view": compute_status_view(log),
                "minutes_fact": log.minutes_fact,
                "comment": log.comment,
            }
        )

    return {"date": str(day), "items": items}

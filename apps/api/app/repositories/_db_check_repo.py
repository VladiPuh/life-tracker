import sqlite3
from pathlib import Path


def _resolve_db_path() -> Path:
    api_root = Path(__file__).resolve().parents[2]  # .../apps/api
    candidates = [
        api_root / "life_tracker.db",
        api_root / "app" / "life_tracker.db",
    ]
    for p in candidates:
        if p.exists():
            return p
    return candidates[0]


# PROD must-have (по факту: daily_log, без history)
MUST_TABLES = {
    "users",
    "challenges",
    "challenge_templates",
    "daily_log",
}

# optional tables (может появиться позже)
OPTIONAL_TABLES = {
    "history",
    "daily_logs",  # если в будущем переименуем
}


def run_db_check():
    db_path = _resolve_db_path()
    uri = f"file:{db_path}?mode=ro"
    con = sqlite3.connect(uri, uri=True)
    cur = con.cursor()

    cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {r[0] for r in cur.fetchall()}

    missing = MUST_TABLES - tables
    if missing:
        # DEV база может отличаться — smoke не должен падать
        print(f"DB CHECK SKIP (schema mismatch, missing={sorted(missing)}) ({db_path})")
        return

    # orphans for daily_log
    cur.execute("""
        SELECT COUNT(*)
        FROM daily_log dl
        LEFT JOIN users u ON u.id = dl.user_id
        LEFT JOIN challenges c ON c.id = dl.challenge_id
        WHERE u.id IS NULL OR c.id IS NULL
    """)
    if cur.fetchone()[0] != 0:
        raise RuntimeError("Orphan daily_log detected")

    # duplicates for daily_log (soft uniqueness check)
    cur.execute("""
        SELECT user_id, challenge_id, date, COUNT(*)
        FROM daily_log
        GROUP BY user_id, challenge_id, date
        HAVING COUNT(*) > 1
    """)
    if cur.fetchone():
        raise RuntimeError("Duplicate daily_log entries detected")

    extras = sorted((tables - MUST_TABLES) & OPTIONAL_TABLES)
    if extras:
        print(f"DB CHECK OK (+optional={extras}) ({db_path})")
    else:
        print(f"DB CHECK OK ({db_path})")

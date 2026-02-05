import os
import json
import httpx
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv("/opt/lifetracker/api/.env")

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
ADMIN_TELEGRAM_ID = int(os.getenv("ADMIN_TELEGRAM_ID", "0") or "0")
DIAG_TOKEN = os.getenv("DIAG_TOKEN")

# On server we will call backend locally (no nginx/ssl dependency)
DIAG_URL = os.getenv("DIAG_URL", "http://127.0.0.1:8000/diag")

if not BOT_TOKEN:
    raise RuntimeError("TELEGRAM_BOT_TOKEN is not set")
if not DIAG_TOKEN:
    raise RuntimeError("DIAG_TOKEN is not set")
if not ADMIN_TELEGRAM_ID:
    raise RuntimeError("ADMIN_TELEGRAM_ID is not set or invalid")


def _badge(ok: bool) -> str:
    return "✅" if ok else "❌"

def _format_diag(payload: dict) -> str:
    status = payload.get("status", "UNKNOWN")
    ts = payload.get("timestamp_utc", "?")

    db = payload.get("database", {}) or {}
    timeb = payload.get("time", {}) or {}
    sch = payload.get("scheduler", {}) or {}
    pub = payload.get("public", {}) or {}
    build = payload.get("build", {}) or {}

    db_ok = bool(db.get("connected"))
    sch_ok = bool(sch.get("running"))
    pub_ok = bool(pub.get("ok"))

    latency = pub.get("latency_ms")
    latency_s = f"{latency}ms" if isinstance(latency, int) else "—"

    build_s = build.get("app_build") or "unknown"

    lines = []
    lines.append(f"🩺 Life-Tracker DIAG — {status}")
    lines.append(f"🕒 {ts}")
    lines.append(f"🏷️ build: {build_s}")
    lines.append("")
    lines.append(f"🗄️ DB: {_badge(db_ok)}")
    if db.get("error"):
        lines.append(f"   error: {db.get('error')}")
    lines.append(f"⏱️ today({timeb.get('admin_timezone','?')}): {timeb.get('admin_today','?')}")
    lines.append(f"🧩 scheduler: {_badge(sch_ok)}")
    jobs = sch.get("jobs") or []
    if jobs:
        # keep short
        jobs_s = ", ".join(map(str, jobs[:6]))
        if len(jobs) > 6:
            jobs_s += f" (+{len(jobs)-6})"
        lines.append(f"   jobs: {jobs_s}")
    lines.append(f"🌐 public health: {_badge(pub_ok)}  {latency_s}")
    if pub.get("error"):
        lines.append(f"   error: {pub.get('error')}")
    return "\n".join(lines)


async def cmd_diag(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user or user.id != ADMIN_TELEGRAM_ID:
        # silently ignore for non-admin
        return

    headers = {"X-Diag-Token": DIAG_TOKEN}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.get(DIAG_URL, headers=headers)
            r.raise_for_status()
            payload = r.json()
    except Exception as e:
        await update.message.reply_text(f"🩺 DIAG FAIL\n\nBackend unreachable or error:\n{type(e).__name__}: {e}")
        return

    await update.message.reply_text(_format_diag(payload))


def main() -> None:
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("diag", cmd_diag))
    app.run_polling(close_loop=False)


if __name__ == "__main__":
    main()

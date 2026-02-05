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


def _format_diag(payload: dict) -> str:
    status = payload.get("status", "UNKNOWN")
    ts = payload.get("timestamp_utc", "?")

    db = payload.get("database", {})
    time = payload.get("time", {})
    sch = payload.get("scheduler", {})
    auth = payload.get("auth", {})

    lines = []
    lines.append(f"🩺 Life-Tracker DIAG — {status}")
    lines.append(f"🕒 {ts}")
    lines.append("")
    lines.append(f"🗄️ DB: {'OK' if db.get('connected') else 'FAIL'}")
    if db.get("error"):
        lines.append(f"   error: {db.get('error')}")
    lines.append(f"⏱️ today({time.get('admin_timezone','?')}): {time.get('admin_today','?')}")
    lines.append(f"🧩 scheduler: {'RUNNING' if sch.get('running') else 'STOPPED'}")
    jobs = sch.get("jobs") or []
    if jobs:
        lines.append("   jobs: " + ", ".join(map(str, jobs)))
    lines.append(f"🔐 tg_init_data: {auth.get('telegram_init_data','?')}")
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

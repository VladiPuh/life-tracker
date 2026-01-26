# apps/api/app/core/security.py

from fastapi import HTTPException
import hmac
import hashlib
from urllib.parse import parse_qsl


def verify_telegram_init_data(init_data: str, bot_token: str) -> dict:
    # init_data: "query_id=...&user=...&auth_date=...&hash=..."
    data = dict(parse_qsl(init_data, keep_blank_values=True))
    their_hash = data.pop("hash", None)
    if not their_hash:
        raise HTTPException(status_code=401, detail="Missing hash")

    pairs = [f"{k}={v}" for k, v in sorted(data.items())]
    check_string = "\n".join(pairs)

    secret_key = hmac.new(
        b"WebAppData",
        bot_token.encode("utf-8"),
        hashlib.sha256,
    ).digest()

    our_hash = hmac.new(
        secret_key,
        check_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(our_hash, their_hash):
        raise HTTPException(status_code=401, detail="Bad initData hash")

    # user приходит JSON строкой
    # вернём распарсенное как dict (дальше используем id)
    if "user" in data:
        import json
        data["user"] = json.loads(data["user"])

    return data

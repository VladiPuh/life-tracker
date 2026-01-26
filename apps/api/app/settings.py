from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Life-Tracker API"
    database_url: str = "sqlite+aiosqlite:///./life_tracker.db"

    # Режим авторизации
    auth_mode: str = "DEV"  # "DEV" | "PROD"

    # DEV user
    dev_user_telegram_id: int = 111111

    # PROD (Telegram)
    telegram_bot_token: str | None = None


settings = Settings()

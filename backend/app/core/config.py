from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AgentGuard"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./agentguard.db"

    # CORS – allowed frontend origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # ──────────────────────────────────────────────────
    # Policy thresholds  (0-100 risk scale)
    # These are the ONLY place in the codebase where
    # threshold numbers live.  Do not duplicate them.
    # ──────────────────────────────────────────────────
    ALLOW_THRESHOLD: int = 30       # 0  – 29  → ALLOW
    SANDBOX_THRESHOLD: int = 60     # 30 – 59  → SANDBOX
    APPROVAL_THRESHOLD: int = 85    # 60 – 84  → APPROVAL_REQUIRED
    # 85 – 100 → BLOCK

    model_config = {"env_file": ".env"}


settings = Settings()

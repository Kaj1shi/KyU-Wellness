import json
from functools import lru_cache
from typing import Any, List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Kyambogo Mental Health Support API"
    app_version: str = "1.0.0"
    debug: bool = False
    api_prefix: str = "/api"

    database_url: str = "postgresql://postgres:postgres@localhost:5432/mental_health_db"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    frontend_url: str = "http://localhost:5173"
    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # llm_provider: "openai" (cloud) or "ollama" (local OpenAI-compatible API)
    llm_provider: str = "openai"
    ollama_base_url: str = "http://127.0.0.1:11434/v1"
    ollama_api_key: str = "ollama"
    # Exact name from `ollama list` (or a local alias created with `ollama create`)
    ollama_model: str = "hf.co/empero-ai/Qwythos-9B-Claude-Mythos-5-1M-GGUF:Q4_K_M"

    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "noreply@kyu-mentalhealth.local"
    counselor_alert_emails: str = "counselor@kyu.ac.ug"

    # Optional bootstrap counselor (created on API startup if email not present)
    seed_counselor_email: str = ""
    seed_counselor_password: str = ""

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: Any) -> Any:
        """Supabase/Heroku often provide postgres:// — SQLAlchemy wants postgresql://."""
        if isinstance(value, str) and value.startswith("postgres://"):
            return "postgresql://" + value[len("postgres://") :]
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> Any:
        """Accept JSON array or comma-separated origins from host env dashboards."""
        if isinstance(value, str):
            text = value.strip()
            if not text:
                return []
            if text.startswith("["):
                return json.loads(text)
            return [part.strip() for part in text.split(",") if part.strip()]
        return value

    @property
    def counselor_emails_list(self) -> List[str]:
        return [e.strip() for e in self.counselor_alert_emails.split(",") if e.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

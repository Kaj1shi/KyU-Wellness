"""Settings parsing helpers used in deployment."""

from app.config.settings import Settings


def test_normalize_postgres_scheme():
    settings = Settings(
        database_url="postgres://user:pass@db.example.com:5432/postgres",
        jwt_secret_key="test-secret",
    )
    assert settings.database_url.startswith("postgresql://")
    assert "user:pass@db.example.com" in settings.database_url


def test_cors_origins_json_array():
    settings = Settings(
        cors_origins='["https://app.vercel.app","http://localhost:5173"]',
        jwt_secret_key="test-secret",
    )
    assert settings.cors_origins == [
        "https://app.vercel.app",
        "http://localhost:5173",
    ]


def test_cors_origins_comma_separated():
    settings = Settings(
        cors_origins="https://app.vercel.app, https://www.example.com",
        jwt_secret_key="test-secret",
    )
    assert settings.cors_origins == [
        "https://app.vercel.app",
        "https://www.example.com",
    ]


def test_ollama_provider_defaults():
    settings = Settings(
        llm_provider="ollama",
        jwt_secret_key="test-secret",
    )
    assert settings.llm_provider == "ollama"
    assert "11434" in settings.ollama_base_url
    assert "Qwythos" in settings.ollama_model

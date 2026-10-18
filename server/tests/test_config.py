import pytest
from pydantic import ValidationError
from sqlalchemy.engine import make_url

from app.config import Settings

DATABASE_ENV_NAMES = (
    "DATABASE_URL",
    "DATABASE_URI",
    "DB_URL",
    "POSTGRES_URL",
    "POSTGRESQL_URL",
    "SQLALCHEMY_DATABASE_URI",
    "PGHOST",
    "POSTGRES_HOST",
    "DB_HOST",
    "PGPORT",
    "POSTGRES_PORT",
    "DB_PORT",
    "PGDATABASE",
    "POSTGRES_DB",
    "POSTGRES_DATABASE",
    "DB_NAME",
    "PGUSER",
    "POSTGRES_USER",
    "DB_USER",
    "PGPASSWORD",
    "POSTGRES_PASSWORD",
    "DB_PASSWORD",
)


def clear_database_environment(monkeypatch) -> None:
    for name in DATABASE_ENV_NAMES:
        monkeypatch.delenv(name, raising=False)


def test_nexus_max_upload_bytes_variable_does_not_override_app_setting(
    monkeypatch,
) -> None:
    monkeypatch.setenv("MAX_UPLOAD_BYTES", r"C:\Nexus\Storage\proveh-server\local")
    monkeypatch.setenv("PROVEH_MAX_UPLOAD_BYTES", "20971520")

    settings = Settings(_env_file=None)

    assert settings.max_upload_bytes == 10 * 1024 * 1024


def test_nexus_database_url_uses_async_driver(monkeypatch) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql://app:db-secret@127.0.0.1:43511/proveh",
    )

    settings = Settings(_env_file=None)

    assert settings.database_url.startswith("postgresql+asyncpg://")


def test_nexus_split_postgres_variables_build_database_url(monkeypatch) -> None:
    clear_database_environment(monkeypatch)
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("PGHOST", "127.0.0.1")
    monkeypatch.setenv("PGPORT", "43511")
    monkeypatch.setenv("PGDATABASE", "proveh")
    monkeypatch.setenv("PGUSER", "proveh_app")
    monkeypatch.setenv("PGPASSWORD", "db:p@ss/word")
    monkeypatch.setenv("ADMIN_PASSWORD", "portal-password")

    settings = Settings(_env_file=None)
    url = make_url(settings.database_url)

    assert url.drivername == "postgresql+asyncpg"
    assert url.host == "127.0.0.1"
    assert url.port == 43511
    assert url.database == "proveh"
    assert url.username == "proveh_app"
    assert url.password == "db:p@ss/word"


def test_complete_nexus_binding_wins_over_stale_manual_url(monkeypatch) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+asyncpg://proveh:stale@localhost:5432/proveh",
    )
    monkeypatch.setenv("PGHOST", "127.0.0.1")
    monkeypatch.setenv("PGPORT", "43511")
    monkeypatch.setenv("PGDATABASE", "proveh")
    monkeypatch.setenv("PGUSER", "proveh_app")
    monkeypatch.setenv("PGPASSWORD", "current-nexus-password")

    url = make_url(Settings(_env_file=None).database_url)

    assert url.port == 43511
    assert url.username == "proveh_app"
    assert url.password == "current-nexus-password"


def test_production_rejects_missing_nexus_database_binding(monkeypatch) -> None:
    clear_database_environment(monkeypatch)
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("ADMIN_PASSWORD", "portal-password")

    with pytest.raises(ValidationError, match="Nexus did not inject"):
        Settings(_env_file=None)


def test_production_derives_stable_session_secret_when_not_configured(
    monkeypatch,
) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://app:db-secret@db/proveh")
    monkeypatch.setenv("ADMIN_PASSWORD", "portal-password")
    monkeypatch.delenv("ADMIN_SESSION_SECRET", raising=False)

    first = Settings(_env_file=None).admin_session_secret.get_secret_value()
    second = Settings(_env_file=None).admin_session_secret.get_secret_value()

    assert first == second
    assert len(first) == 64
    assert not first.startswith("development-only")


def test_production_honors_explicit_session_secret(monkeypatch) -> None:
    explicit_secret = "s" * 32
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://app:db-secret@db/proveh")
    monkeypatch.setenv("ADMIN_PASSWORD", "portal-password")
    monkeypatch.setenv("ADMIN_SESSION_SECRET", explicit_secret)

    settings = Settings(_env_file=None)

    assert settings.admin_session_secret.get_secret_value() == explicit_secret


def test_production_requires_admin_password_for_session_fallback(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://app:db-secret@db/proveh")
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    monkeypatch.delenv("ADMIN_SESSION_SECRET", raising=False)

    with pytest.raises(ValidationError, match="ADMIN_PASSWORD is required"):
        Settings(_env_file=None)

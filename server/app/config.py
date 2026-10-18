from functools import lru_cache
from hashlib import sha256

from pydantic import AliasChoices, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Proveh Server"
    environment: str = "development"
    log_level: str = "info"
    public_base_url: str = "https://proveh.server.oldalexhub.com"
    database_url: str = Field(
        default="",
        validation_alias=AliasChoices(
            "DATABASE_URL",
            "DATABASE_URI",
            "DB_URL",
            "POSTGRES_URL",
            "POSTGRESQL_URL",
            "SQLALCHEMY_DATABASE_URI",
        ),
    )
    database_host: str | None = Field(
        default=None,
        validation_alias=AliasChoices("PGHOST", "POSTGRES_HOST", "DB_HOST"),
        exclude=True,
    )
    database_port: int | None = Field(
        default=None,
        validation_alias=AliasChoices("PGPORT", "POSTGRES_PORT", "DB_PORT"),
        exclude=True,
    )
    database_name: str | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "PGDATABASE",
            "POSTGRES_DB",
            "POSTGRES_DATABASE",
            "DB_NAME",
        ),
        exclude=True,
    )
    database_user: str | None = Field(
        default=None,
        validation_alias=AliasChoices("PGUSER", "POSTGRES_USER", "DB_USER"),
        exclude=True,
    )
    database_password: SecretStr | None = Field(
        default=None,
        validation_alias=AliasChoices(
            "PGPASSWORD",
            "POSTGRES_PASSWORD",
            "DB_PASSWORD",
        ),
        exclude=True,
    )
    auto_create_schema: bool = False
    cors_origins: str = ""
    nhtsa_timeout_seconds: float = 12.0
    vin_cache_days: int = 30
    analytics_retention_days: int = 365
    dataset_retention_days: int = 1825
    admin_username: str | None = None
    admin_password: SecretStr | None = None
    admin_session_secret: SecretStr = SecretStr(
        "development-only-change-this-session-secret"
    )
    admin_session_hours: int = 12

    @property
    def max_upload_bytes(self) -> int:
        return 10 * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def resolve_database_connection(self) -> "Settings":
        if (
            self.database_host
            and self.database_port
            and self.database_name
            and self.database_user
            and self.database_password
        ):
            self.database_url = self._database_url_from_parts()
            return self

        if self.database_url:
            scheme, separator, remainder = self.database_url.partition("://")
            if separator and scheme.lower() in {"postgres", "postgresql"}:
                self.database_url = f"postgresql+asyncpg://{remainder}"
            return self

        if self.database_name and self.database_user and self.database_password:
            self.database_url = self._database_url_from_parts()
            return self

        if self.environment.lower() == "production":
            raise ValueError(
                "Nexus did not inject a database connection. Connect a Nexus database "
                "so DATABASE_URL or the standard PGHOST/PGPORT/PGDATABASE/PGUSER/"
                "PGPASSWORD variables are available."
            )

        self.database_url = "postgresql+asyncpg://proveh:proveh@localhost:5432/proveh"
        return self

    def _database_url_from_parts(self) -> str:
        assert self.database_name is not None
        assert self.database_user is not None
        assert self.database_password is not None
        return URL.create(
            "postgresql+asyncpg",
            username=self.database_user,
            password=self.database_password.get_secret_value(),
            host=self.database_host or "127.0.0.1",
            port=self.database_port or 5432,
            database=self.database_name,
        ).render_as_string(hide_password=False)

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment.lower() != "production":
            return self
        session_secret = self.admin_session_secret.get_secret_value()
        if len(session_secret) < 32 or session_secret.startswith(
            ("development-only", "replace-with-")
        ):
            if self.admin_password is None:
                raise ValueError(
                    "ADMIN_PASSWORD is required when ADMIN_SESSION_SECRET is not configured"
                )
            admin_password = self.admin_password.get_secret_value()
            if admin_password.startswith("replace-with-"):
                raise ValueError("ADMIN_PASSWORD is still a placeholder")
            seed = f"proveh-admin-session-v1\0{admin_password}\0{self.database_url}"
            self.admin_session_secret = SecretStr(sha256(seed.encode()).hexdigest())
        if "replace-with-" in self.database_url:
            raise ValueError("The production database password is still a placeholder")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


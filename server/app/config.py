from functools import lru_cache

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Proveh Server"
    environment: str = "development"
    log_level: str = "info"
    public_base_url: str = "https://proveh.server.oldalexhub.com"
    database_url: str = "postgresql+asyncpg://proveh:proveh@localhost:5432/proveh"
    auto_create_schema: bool = False
    cors_origins: str = ""
    # Nexus uses MAX_UPLOAD_BYTES for its own storage configuration. Keep this
    # app setting namespaced so a Nexus-managed path cannot be parsed as a size.
    max_upload_bytes: int = Field(
        default=10 * 1024 * 1024,
        validation_alias="PROVEH_MAX_UPLOAD_BYTES",
        ge=1,
    )
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

    @field_validator("max_upload_bytes", mode="before")
    @classmethod
    def use_safe_upload_default_for_non_numeric_values(cls, value: object) -> object:
        """Do not let a Nexus storage-path injection block server startup."""
        if value is None:
            return 10 * 1024 * 1024
        try:
            return int(value)
        except (TypeError, ValueError):
            return 10 * 1024 * 1024

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.environment.lower() != "production":
            return self
        session_secret = self.admin_session_secret.get_secret_value()
        if len(session_secret) < 32 or session_secret.startswith(
            ("development-only", "replace-with-")
        ):
            raise ValueError("ADMIN_SESSION_SECRET must be a unique 32+ character value")
        if "replace-with-" in self.database_url:
            raise ValueError("The production database password is still a placeholder")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


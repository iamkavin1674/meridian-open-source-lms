from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "LMS Backend"
    environment: str = "local"
    database_url: str = Field(
        default="postgresql+psycopg2://lms:lms@localhost:5432/lms_db",
        alias="DATABASE_URL",
    )
    keycloak_server_url: str = Field(default="http://localhost:8080", alias="KEYCLOAK_SERVER_URL")
    keycloak_realm: str = Field(default="lms", alias="KEYCLOAK_REALM")
    keycloak_client_id: str = Field(default="lms-backend", alias="KEYCLOAK_CLIENT_ID")
    keycloak_audience: str | None = Field(default=None, alias="KEYCLOAK_AUDIENCE")
    keycloak_verify_signature: bool = Field(default=True, alias="KEYCLOAK_VERIFY_SIGNATURE")
    cors_origins: list[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"], alias="CORS_ORIGINS"
    )
    celery_broker_url: str = Field(default="redis://localhost:6379/0", alias="CELERY_BROKER_URL")
    celery_result_backend: str = Field(
        default="redis://localhost:6379/0", alias="CELERY_RESULT_BACKEND"
    )
    supabase_url: str | None = Field(default=None, alias="SUPABASE_URL")

    @property
    def keycloak_issuer(self) -> str:
        return f"{self.keycloak_server_url.rstrip('/')}/realms/{self.keycloak_realm}"

    @property
    def keycloak_jwks_url(self) -> str:
        return f"{self.keycloak_issuer}/protocol/openid-connect/certs"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

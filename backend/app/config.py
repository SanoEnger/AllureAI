from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "DevTuls Backend"
    APP_VERSION: str = "0.1.0"

    LLM_API_KEY: str
    LLM_BASE_URL: str
    LLM_TIMEOUT_SECONDS: int = 30
    LLM_MAX_RETRIES: int = 3
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 2048


@lru_cache
def get_settings() -> Settings:
    return Settings()

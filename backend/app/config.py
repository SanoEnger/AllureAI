from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "DevTuls Backend"
    APP_VERSION: str = "0.1.0"

    # Cloud.ru GigaChat настройки
    LLM_API_KEY: str
    LLM_BASE_URL: str = "https://foundation-models.api.cloud.ru/v1"
    
    # Модель GigaChat
    LLM_MODEL: str = "ai-sage/GigaChat3-10B-A1.8B"
    
    # Настройки запросов
    LLM_TIMEOUT_SECONDS: int = 60
    LLM_MAX_RETRIES: int = 3
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 2048
    
    # Логирование
    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
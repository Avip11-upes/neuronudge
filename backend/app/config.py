from functools import lru_cache
from pathlib import Path
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_FILE = (BACKEND_DIR / "storage" / "neuronudge.db").resolve()


class Settings(BaseSettings):
    app_name: str = "NeuroNudge Backend"
    environment: str = "development"
    debug: bool = True
    host: str = "127.0.0.1"
    port: int = 8000

    # Frontend CORS origins
    cors_origins: Union[str, List[str]] = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
    ]

    # Database configuration (configurable for local and Droplet deployment)
    database_url: str = f"sqlite:///{DEFAULT_DB_FILE}"

    # Gemma 4 LLM Service placeholders for Assessment/Reporting modules
    gemma_model_name: str = "gemma-4"
    gemma_api_base_url: str = "http://localhost:11434"
    gemini_api_key: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("cors_origins", mode="after")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()

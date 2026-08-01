from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "InvoiceGuard AI"
    debug: bool = True
    api_prefix: str = "/api/v1"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-pro"

    database_url: str = "sqlite:///./database.db"
    upload_dir: str = "./uploads"
    max_file_size: int = 10 * 1024 * 1024
    allowed_mime_types: list[str] = [
        "application/pdf",
        "image/jpeg",
        "image/png",
    ]

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mime type to extension mapping
ALLOWED_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "TETRA015"
    UPLOAD_DIR: str = "uploads"
    
    # Define both uppercase and lowercase aliases to avoid attribute errors
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    @property
    def gemini_api_key(self) -> str:
        return self.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
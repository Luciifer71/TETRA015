import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "TETRA015"
    UPLOAD_DIR: str = "uploads"
    
    # Define both uppercase and lowercase aliases to avoid attribute errors
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "openai/gpt-4o"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GEMINI_MODEL: str = "gemini-2.0-flash"
    ACTIVE_LLM_PROVIDER: str = "gemini"
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    @property
    def gemini_api_key(self) -> str:
        return self.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")

    @property
    def groq_api_key(self) -> str:
        return self.GROQ_API_KEY or os.getenv("GROQ_API_KEY", "")

    @property
    def openrouter_api_key(self) -> str:
        return self.OPENROUTER_API_KEY or os.getenv("OPENROUTER_API_KEY", "")

    @property
    def active_llm_provider(self) -> str:
        return (self.ACTIVE_LLM_PROVIDER or os.getenv("ACTIVE_LLM_PROVIDER", "gemini")).lower()

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

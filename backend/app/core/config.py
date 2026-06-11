from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_ACCESS_SECRET: str
    JWT_REFRESH_SECRET: str
    JWT_ACCESS_EXPIRY_MINUTES: int = 15
    JWT_REFRESH_EXPIRY_DAYS: int = 7
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str = "openai/gpt-4o-mini"
    OPENAI_API_KEY: str
    FRONTEND_URL: str = "http://localhost:5173"
    PORT: int = 4000
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

from functools import lru_cache

from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "E-Freight POP API"
    debug: bool = True

    # Example: mysql+pymysql://user:password@localhost:3306/e_freight_pop
    database_url: str = (
        "mysql+pymysql://user:password@localhost:3306/e_freight_pop"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = os.getenv("DATABASE_URL", "postgresql://localhost/fuelradar")
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Tankerkönig API
    tankerkoenig_api_key: str = os.getenv("TANKERKOENIG_API_KEY", "")
    tankerkoenig_base_url: str = "https://creativecommons.tankerkoenig.de/json"
    
    # Alert worker
    alert_check_minutes: int = int(os.getenv("ALERT_CHECK_MINUTES", "5"))
    
    # Cache TTL
    cache_ttl_seconds: int = int(os.getenv("CACHE_TTL_SECONDS", "60"))
    
    # App settings
    app_name: str = "FuelRadar API"
    app_version: str = "1.0.0"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # MongoDB (legacy support)
    mongo_url: Optional[str] = os.getenv("MONGO_URL")
    db_name: str = os.getenv("DB_NAME", "fuelradar")

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()

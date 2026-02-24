"""
AeroStream Command Center — Configuration
Pydantic settings with .env loading + two-key strategy
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Aviationstack API Keys (Two-Key Strategy)
    aviationstack_key_primary: str = ""
    aviationstack_key_secondary: str = ""
    
    # OpenWeatherMap API
    openweathermap_key: str = ""
    
    # Google Gemini API
    gemini_api_key: str = ""
    
    # Environment Toggle: "testing" or "deployment"
    active_env: str = "testing"
    
    # Mock Mode: Use fake data for demos (no API calls)
    mock_mode: bool = True
    
    # DuckDB path
    duckdb_path: str = "aerostream.duckdb"
    
    # Cache TTL in minutes
    cache_ttl_minutes: int = 15
    
    # XGBoost model path
    model_path: str = "models/xgboost_delay.json"
    
    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    def get_active_aviationstack_key(self) -> str:
        """Returns the active API key based on environment toggle."""
        if self.active_env == "deployment" and self.aviationstack_key_secondary:
            return self.aviationstack_key_secondary
        return self.aviationstack_key_primary

    def get_aviation_base_url(self) -> str:
        return "http://api.aviationstack.com/v1"
    
    def get_weather_base_url(self) -> str:
        return "https://api.openweathermap.org/data/2.5"


# Singleton
settings = Settings()

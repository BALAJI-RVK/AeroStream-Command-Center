from pydantic import BaseModel
from typing import Optional

class PredictRequest(BaseModel):
    flight_id: Optional[str] = None
    airline: Optional[str] = "IndiGo"
    airline_code: Optional[str] = "6E"
    origin: Optional[str] = "DEL"
    destination: Optional[str] = "BOM"
    distance: Optional[float] = 1150
    month: Optional[int] = 6
    day_of_week: Optional[int] = 3
    hour_of_day: Optional[int] = 14
    weather_delay: Optional[float] = 0
    carrier_delay: Optional[float] = 0
    nas_delay: Optional[float] = 0
    late_aircraft_delay: Optional[float] = 0
    security_delay: Optional[float] = 0
    velocity: Optional[float] = 0
    altitude: Optional[float] = 0

class MitigateRequest(BaseModel):
    flight_id: str
    flight_number: Optional[str] = "6E-205"
    airline: Optional[str] = "IndiGo"
    airline_code: Optional[str] = "6E"
    origin: Optional[str] = "DEL"
    destination: Optional[str] = "BOM"
    status: Optional[str] = "delayed"
    aircraft_type: Optional[str] = "A320neo"
    gate: Optional[str] = "B12"
    delay_probability: Optional[float] = 75

class SettingsUpdate(BaseModel):
    active_env: Optional[str] = None
    mock_mode: Optional[bool] = None

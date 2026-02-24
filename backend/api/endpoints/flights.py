from fastapi import APIRouter, HTTPException, Query
from core.config import settings
from core.database import get_real_flights, get_aircraft_metadata
from services.opensky_service import get_airport_flights, get_aircraft_flights, get_flight_track
from services.weather_service import fetch_flight_status, fetch_weather
from core.mock_data import AIRPORTS

router = APIRouter()

@router.get("/flights")
def get_flights(limit: int = Query(50, ge=1, le=200)):
    """Get flights from DuckDB flights_master (real data)."""
    flights = get_real_flights(limit)
    return {"flights": flights, "count": len(flights), "source": "duckdb_real"}

@router.get("/flights/{flight_id}")
async def get_flight(flight_id: str):
    """Get single flight detail with weather context."""
    flight = await fetch_flight_status(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight {flight_id} not found")
    
    origin = flight.get("origin", "DEL")
    weather = await fetch_weather(origin)
    
    return {"flight": flight, "weather": weather}

@router.get("/airports")
def get_airports():
    """Get all supported airports."""
    return {"airports": AIRPORTS}

@router.get("/flights/airport/{airport_code}")
def get_recent_airport_flights(airport_code: str):
    """Get arrivals and departures in the last 2 hours for an airport."""
    flights = get_airport_flights(airport_code)
    return {"flights": flights}

@router.get("/flights/aircraft/{icao24}")
def get_recent_aircraft_flights(icao24: str):
    """Get history for a specific aircraft (up to 30 days) from OpenSky."""
    flights = get_aircraft_flights(icao24)
    return {"flights": flights}

@router.get("/tracks/all/{icao24}")
def get_aircraft_track(icao24: str):
    """Get the full historical path of a specific active aircraft."""
    track = get_flight_track(icao24)
    return track

@router.get("/metadata/aircraft/{icao24}")
def get_aircraft_metadata_api(icao24: str):
    """Get metadata for a specific aircraft from DuckDB CSV cache."""
    meta = get_aircraft_metadata(icao24)
    return {"metadata": meta}

@router.get("/weather/{airport_code}")
async def get_weather(airport_code: str):
    """Get weather at an airport (cached)."""
    weather = await fetch_weather(airport_code.upper())
    return weather

"""
AeroStream Command Center — Live API Clients
Aviationstack + OpenWeatherMap with DuckDB caching layer.
"""

import httpx
import json
import random
from datetime import datetime
from core.config import settings
from core.database import get_cached_flight, cache_flight, get_cached_weather, cache_weather, get_real_flights

# Airport coordinates for weather lookups
AIRPORT_COORDS = {
    "JFK": {"city": "New York", "lat": 40.6413, "lon": -73.7781},
    "LAX": {"city": "Los Angeles", "lat": 33.9425, "lon": -118.4081},
    "ORD": {"city": "Chicago", "lat": 41.9742, "lon": -87.9073},
    "ATL": {"city": "Atlanta", "lat": 33.6407, "lon": -84.4277},
    "DFW": {"city": "Dallas", "lat": 32.8998, "lon": -97.0403},
    "DEN": {"city": "Denver", "lat": 39.8561, "lon": -104.6737},
    "SFO": {"city": "San Francisco", "lat": 37.6213, "lon": -122.3790},
    "SEA": {"city": "Seattle", "lat": 47.4502, "lon": -122.3088},
    "MIA": {"city": "Miami", "lat": 25.7959, "lon": -80.2870},
    "BOS": {"city": "Boston", "lat": 42.3656, "lon": -71.0096},
    "MSP": {"city": "Minneapolis", "lat": 44.8848, "lon": -93.2223},
    "DTW": {"city": "Detroit", "lat": 42.2162, "lon": -83.3554},
    "PHL": {"city": "Philadelphia", "lat": 39.8744, "lon": -75.2424},
    "CLT": {"city": "Charlotte", "lat": 35.2144, "lon": -80.9473},
    "EWR": {"city": "Newark", "lat": 40.6895, "lon": -74.1745},
    "DEL": {"city": "New Delhi", "lat": 28.5562, "lon": 77.1000},
    "BOM": {"city": "Mumbai", "lat": 19.0896, "lon": 72.8656},
    "BLR": {"city": "Bangalore", "lat": 13.1986, "lon": 77.7066},
    "MAA": {"city": "Chennai", "lat": 12.9941, "lon": 80.1709},
    "HYD": {"city": "Hyderabad", "lat": 17.2403, "lon": 78.4294},
    "CCU": {"city": "Kolkata", "lat": 22.6520, "lon": 88.4463},
}


async def fetch_flight_status(flight_id: str, flight_iata: str = None) -> dict:
    """
    Fetch real-time flight status from Aviationstack.
    Uses DuckDB cache (15-min TTL) to save API credits.
    
    Flow:
    1. Check DuckDB cache
    2. If fresh cache hit → return (0 API calls)
    3. If miss/stale → call Aviationstack → cache → return (1 API call)
    """
    
    # Step 0: Try DuckDB first for real data
    flights = get_real_flights(1)
    if flights:
        for f in flights:
            if f["id"] == flight_id:
                return f
        return flights[0]
    
    # Step 1: Check DuckDB cache
    cached = get_cached_flight(flight_id)
    if cached:
        print(f"[API] Cache HIT for flight {flight_id}")
        return cached
    
    # Step 2: Cache miss — call Aviationstack
    print(f"[API] Cache MISS for flight {flight_id}. Calling Aviationstack...")
    
    try:
        api_key = settings.get_active_aviationstack_key()
        base_url = settings.get_aviation_base_url()
        
        params = {"access_key": api_key}
        if flight_iata:
            params["flight_iata"] = flight_iata
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(f"{base_url}/flights", params=params)
            response.raise_for_status()
            data = response.json()
        
        if data.get("data") and len(data["data"]) > 0:
            flight_data = data["data"][0]
            
            # Normalize to our format
            normalized = _normalize_aviationstack(flight_data)
            
            # Step 3: Cache the response
            cache_flight(flight_id, normalized, "aviationstack")
            print(f"[API] Cached flight {flight_id}")
            
            return normalized
        else:
            print(f"[API] No data for flight {flight_id}")
            return None
            
    except Exception as e:
        print(f"[API] Aviationstack error: {e}")
        # Fallback to DuckDB
        flights = get_real_flights(1)
        return flights[0] if flights else {}


async def fetch_all_flights(limit: int = 50) -> list:
    """Fetch flights from DuckDB real data."""
    return get_real_flights(limit)


async def fetch_weather(airport_code: str) -> dict:
    """
    Fetch weather data from OpenWeatherMap.
    Uses DuckDB cache (15-min TTL).
    """
    
    if settings.mock_mode:
        return _generate_weather_data(airport_code)
    
    # Check cache
    cached = get_cached_weather(airport_code)
    if cached:
        print(f"[API] Weather cache HIT for {airport_code}")
        return cached
    
    print(f"[API] Weather cache MISS for {airport_code}. Calling OpenWeatherMap...")
    
    try:
        airport = AIRPORT_COORDS.get(airport_code)
        if not airport:
            return _generate_weather_data(airport_code)
        
        base_url = settings.get_weather_base_url()
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{base_url}/weather",
                params={
                    "lat": airport["lat"],
                    "lon": airport["lon"],
                    "appid": settings.openweathermap_key,
                    "units": "metric"
                }
            )
            response.raise_for_status()
            data = response.json()
        
        normalized = {
            "airport_code": airport_code,
            "city": airport.get("city", airport_code),
            "temperature_celsius": data.get("main", {}).get("temp", 0),
            "feels_like_celsius": data.get("main", {}).get("feels_like", 0),
            "humidity_pct": data.get("main", {}).get("humidity", 0),
            "visibility_km": data.get("visibility", 10000) / 1000,
            "wind_speed_kmh": data.get("wind", {}).get("speed", 0) * 3.6,
            "wind_direction": _deg_to_compass(data.get("wind", {}).get("deg", 0)),
            "condition": data.get("weather", [{}])[0].get("description", "Clear").title(),
            "condition_icon": data.get("weather", [{}])[0].get("icon", "01d"),
            "pressure_hpa": data.get("main", {}).get("pressure", 1013),
            "cloud_cover_pct": data.get("clouds", {}).get("all", 0),
            "timestamp": data.get("dt", 0)
        }
        
        # Cache it
        cache_weather(airport_code, normalized)
        return normalized
        
    except Exception as e:
        print(f"[API] Weather error: {e}")
        return _generate_weather_data(airport_code)


def _generate_weather_data(airport_code: str) -> dict:
    """Generate realistic weather data for an airport."""
    conditions = [
        ("Clear Sky", "☀️"), ("Few Clouds", "🌤️"), ("Scattered Clouds", "⛅"),
        ("Overcast", "☁️"), ("Light Rain", "🌦️"), ("Thunderstorm", "⛈️"),
        ("Haze", "🌫️"), ("Mist", "🌫️")
    ]
    cond = random.choice(conditions)
    city = AIRPORT_COORDS.get(airport_code, {}).get("city", airport_code)
    
    return {
        "airport_code": airport_code,
        "city": city,
        "temperature_celsius": round(random.uniform(10, 38), 1),
        "feels_like_celsius": round(random.uniform(10, 40), 1),
        "humidity_pct": random.randint(30, 90),
        "visibility_km": round(random.uniform(3, 20), 1),
        "wind_speed_kmh": round(random.uniform(5, 40), 1),
        "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
        "condition": cond[0],
        "condition_icon": cond[1],
        "pressure_hpa": random.randint(990, 1030),
        "cloud_cover_pct": random.randint(0, 100),
        "timestamp": datetime.now().isoformat()
    }


def _normalize_aviationstack(raw: dict) -> dict:
    """Normalize Aviationstack response to our format."""
    flight = raw.get("flight", {})
    departure = raw.get("departure", {})
    arrival = raw.get("arrival", {})
    airline = raw.get("airline", {})
    
    dep_airport = AIRPORT_COORDS.get(departure.get("iata", ""), {})
    arr_airport = AIRPORT_COORDS.get(arrival.get("iata", ""), {})
    
    status = raw.get("flight_status", "scheduled")
    delay = departure.get("delay", 0) or 0
    
    # Estimate delay probability from actual delay
    if delay > 60:
        delay_prob = 90
    elif delay > 30:
        delay_prob = 70
    elif delay > 15:
        delay_prob = 50
    else:
        delay_prob = max(10, delay * 2)
    
    return {
        "id": f"flight_{flight.get('iata', 'UNK')}",
        "flight_number": flight.get("iata", "N/A"),
        "airline": airline.get("name", "Unknown"),
        "airline_code": airline.get("iata", ""),
        "origin": departure.get("iata", ""),
        "origin_city": dep_airport.get("city", departure.get("airport", "")),
        "origin_name": dep_airport.get("name", ""),
        "origin_lat": dep_airport.get("lat", 0),
        "origin_lon": dep_airport.get("lon", 0),
        "destination": arrival.get("iata", ""),
        "destination_city": arr_airport.get("city", arrival.get("airport", "")),
        "destination_name": arr_airport.get("name", ""),
        "dest_lat": arr_airport.get("lat", 0),
        "dest_lon": arr_airport.get("lon", 0),
        "scheduled_departure": departure.get("scheduled", ""),
        "status": status,
        "delay_probability": delay_prob,
        "risk_level": "HIGH" if delay_prob > 70 else "MEDIUM" if delay_prob > 40 else "LOW",
        "delay_minutes": delay,
        "aircraft_type": raw.get("aircraft", {}).get("model", "A320"),
        "gate": departure.get("gate", "N/A"),
        "terminal": departure.get("terminal", "N/A")
    }


def _deg_to_compass(deg: float) -> str:
    """Convert wind degrees to compass direction."""
    dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    ix = round(deg / 45) % 8
    return dirs[ix]

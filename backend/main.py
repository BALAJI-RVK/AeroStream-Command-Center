"""
AeroStream Command Center — FastAPI Main Application
All REST API endpoints for the airline operations dashboard.
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json

# Ensure backend dir is in path
sys.path.insert(0, os.path.dirname(__file__))

from config import settings
from database import (
    get_connection, load_kaggle_data, get_cache_stats, 
    clear_cache, log_prediction, get_analytics_summary,
    get_real_flights, get_real_kpis, get_real_analytics_trends, get_real_ai_brief
)
from ml_engine import train_model, predict_delay, get_model_info, get_cuda_info
from api_client import fetch_flight_status, fetch_weather
from gemini_client import generate_mitigation_strategy
from mock_data import AIRPORTS


# ============== STARTUP ==============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DuckDB and load data on startup."""
    print("=" * 60)
    print("✈️  AEROSTREAM COMMAND CENTER — Starting Up")
    print("=" * 60)
    
    # Initialize DuckDB
    conn = get_connection()
    print(f"[STARTUP] DuckDB initialized: {settings.duckdb_path}")
    print(f"[STARTUP] Mock Mode: {settings.mock_mode}")
    print(f"[STARTUP] Active Environment: {settings.active_env}")
    
    # Check CUDA
    cuda = get_cuda_info()
    print(f"[STARTUP] CUDA Available: {cuda['cuda_available']}")
    print(f"[STARTUP] Device: {cuda['device']}")
    
    # Try to download and load Kaggle data
    try:
        from data_loader import download_and_locate_datasets
        datasets = download_and_locate_datasets()
        
        if datasets["flight_delay_2024"] or datasets["indian_domestic"]:
            loaded = load_kaggle_data(
                flight_delay_path=datasets.get("flight_delay_2024"),
                indian_flights_path=datasets.get("indian_domestic")
            )
            print(f"[STARTUP] Training data loaded: {loaded:,} rows")
            
            # Train XGBoost model
            if loaded > 0:
                print("[STARTUP] Training XGBoost model...")
                meta = train_model(conn)
                print(f"[STARTUP] Model trained: Accuracy={meta['accuracy']}%")
        else:
            print("[STARTUP] No CSV datasets found. Using synthetic data for demo.")
            # Train on synthetic data
            meta = train_model(conn)
            print(f"[STARTUP] Model trained on synthetic data: Accuracy={meta['accuracy']}%")
    except Exception as e:
        print(f"[STARTUP] Data loading error (non-fatal): {e}")
        print("[STARTUP] Continuing with mock data mode.")
    
    print("=" * 60)
    print("✅ AeroStream Command Center is READY!")
    print(f"📡 Mock Mode: {'ON (using demo data)' if settings.mock_mode else 'OFF (using live APIs)'}")
    print("=" * 60)
    
    yield
    
    print("[SHUTDOWN] AeroStream Command Center shutting down.")


# ============== APP ==============

app = FastAPI(
    title="AeroStream Command Center",
    description="Enterprise-grade Airline Operations Command Center API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== MODELS ==============

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


# ============== ENDPOINTS ==============

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AeroStream Command Center",
        "version": "1.0.0",
        "mock_mode": settings.mock_mode,
        "active_env": settings.active_env,
        "cuda": get_cuda_info()
    }


@app.get("/api/flights")
async def get_flights(limit: int = Query(50, ge=1, le=200)):
    """Get flights from DuckDB flights_master (real data)."""
    flights = get_real_flights(limit)
    return {"flights": flights, "count": len(flights), "source": "duckdb_real"}


@app.get("/api/flights/{flight_id}")
async def get_flight(flight_id: str):
    """Get single flight detail with weather context."""
    flight = await fetch_flight_status(flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail=f"Flight {flight_id} not found")
    
    # Fetch weather for origin
    origin = flight.get("origin", "DEL")
    weather = await fetch_weather(origin)
    
    return {"flight": flight, "weather": weather}


@app.post("/api/predict")
async def predict_flight_delay(req: PredictRequest):
    """Run XGBoost delay prediction for a flight."""
    prediction = predict_delay(req.model_dump())
    
    # Log the prediction
    log_prediction(
        flight_id=req.flight_id or f"{req.origin}-{req.destination}",
        delay_prob=prediction["delay_probability"],
        weather_risk=prediction["feature_importance"].get("weather_delay", 0),
        carrier_risk=prediction["feature_importance"].get("carrier_delay", 0)
    )
    
    return prediction


@app.post("/api/mitigate")
async def generate_mitigation(req: MitigateRequest):
    """Generate Gemini AI mitigation strategy for a flight."""
    flight_data = req.model_dump()
    
    # Get weather at origin
    weather = await fetch_weather(req.origin)
    
    strategy = await generate_mitigation_strategy(
        flight_data=flight_data,
        weather_data=weather,
        delay_probability=req.delay_probability
    )
    
    return strategy


@app.get("/api/weather/{airport_code}")
async def get_weather(airport_code: str):
    """Get weather at an airport (cached)."""
    weather = await fetch_weather(airport_code.upper())
    return weather


@app.get("/api/kpis")
async def get_kpis():
    """Get dashboard KPIs from real DuckDB data."""
    return get_real_kpis()


@app.get("/api/ai-brief")
async def get_ai_brief():
    """Get operations brief from real data analysis."""
    return {"brief": get_real_ai_brief()}


@app.get("/api/analytics/summary")
async def get_analytics():
    """Get analytics summary from DuckDB."""
    db_analytics = get_analytics_summary()
    mock_analytics = generate_mock_analytics()
    
    # Merge: use DB data if available, fall back to mock
    if db_analytics["total_flights"] > 0:
        return {**mock_analytics, **db_analytics, "source": "duckdb"}
    return {**mock_analytics, "source": "mock"}


@app.get("/api/analytics/trends")
async def get_analytics_trends():
    """Get detailed analytics trends from real DuckDB data."""
    return get_real_analytics_trends()


@app.get("/api/cache/stats")
async def cache_stats():
    """Get DuckDB cache statistics."""
    return get_cache_stats()


@app.post("/api/cache/clear")
async def clear_all_cache():
    """Clear all cached API responses."""
    return clear_cache()


@app.get("/api/model/info")
async def model_info():
    """Get XGBoost model metadata."""
    return get_model_info()


@app.post("/api/settings/env")
async def update_settings(update: SettingsUpdate):
    """Toggle environment or mock mode."""
    if update.active_env is not None:
        settings.active_env = update.active_env
    if update.mock_mode is not None:
        settings.mock_mode = update.mock_mode
    
    return {
        "active_env": settings.active_env,
        "mock_mode": settings.mock_mode,
        "message": "Settings updated"
    }


@app.get("/api/airports")
async def get_airports():
    """Get all supported airports."""
    return {"airports": AIRPORTS}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

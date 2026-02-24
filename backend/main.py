"""
AeroStream Command Center — FastAPI Main Application
Entrypoint for the Clean Architecture backend.
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend dir is in path
sys.path.insert(0, os.path.dirname(__file__))

from core.config import settings
from core.database import get_connection, load_kaggle_data
from services.ml_service import train_model, get_cuda_info
from api.router import api_router

# ============== STARTUP ==============

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DuckDB and load data on startup."""
    print("============================================================")
    print("   AEROSTREAM COMMAND CENTER -- Starting Up (Clean Arch)")
    print("============================================================")
    
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
        from core.mock_data import AIRPORTS
        # Just simple fallback since data_loader functionality remains
        try:
            from data_loader import download_and_locate_datasets
            datasets = download_and_locate_datasets()
            
            if datasets.get("flight_delay_2024") or datasets.get("indian_domestic"):
                loaded = load_kaggle_data(
                    flight_delay_path=datasets.get("flight_delay_2024"),
                    indian_flights_path=datasets.get("indian_domestic")
                )
                print(f"[STARTUP] Training data loaded: {loaded:,} rows")
                
                # Train XGBoost model
                model_path = "models/xgboost_delay.json"
                if os.path.exists(model_path):
                    print(f"[STARTUP] Model {model_path} already exists. Skipping training.")
                else:
                    if loaded > 0:
                        print("[STARTUP] Training XGBoost model...")
                        meta = train_model(conn)
                        print(f"[STARTUP] Model trained: Accuracy={meta.get('accuracy', 'UNK')}%")
                    else:
                        print("[STARTUP] No CSV datasets found. Using synthetic data for demo.")
                        meta = train_model(conn)
                        print(f"[STARTUP] Model trained on synthetic data: Accuracy={meta.get('accuracy', 'UNK')}%")
        except ImportError:
            pass # No data loader
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

# Connect Routers
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

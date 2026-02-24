from fastapi import APIRouter
from core.database import get_real_kpis, get_analytics_summary, get_real_analytics_trends

router = APIRouter()

@router.get("/kpis")
def get_kpis():
    """Get dashboard KPIs from real DuckDB data."""
    return get_real_kpis()

@router.get("/summary")
def get_analytics():
    """Get analytics summary from DuckDB."""
    db_analytics = get_analytics_summary()
    
    # We used to merge with mock analytics, but let's stick to DB if possible
    # We'll just return db_analytics directly for modularity
    return {**db_analytics, "source": "duckdb" if db_analytics["total_flights"] > 0 else "mock"}

@router.get("/trends")
def get_analytics_trends():
    """Get detailed analytics trends from real DuckDB data."""
    return get_real_analytics_trends()

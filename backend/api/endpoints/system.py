from fastapi import APIRouter
from core.config import settings
from core.database import get_cache_stats, clear_cache
from services.ml_service import get_cuda_info

router = APIRouter()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AeroStream Command Center",
        "version": "1.0.0",
        "mock_mode": settings.mock_mode,
        "active_env": settings.active_env,
        "cuda": get_cuda_info()
    }

@router.get("/cache/stats")
def cache_stats():
    """Get DuckDB cache statistics."""
    return get_cache_stats()

@router.post("/cache/clear")
def clear_all_cache():
    """Clear all cached API responses."""
    return clear_cache()

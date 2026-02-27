from fastapi import APIRouter
from .endpoints import system, flights, analytics, ai, websockets, auth

api_router = APIRouter()

# Include REST routes
api_router.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
api_router.include_router(system.router, tags=["System"], prefix="/api")
api_router.include_router(flights.router, tags=["Flights"], prefix="/api")
api_router.include_router(analytics.router, tags=["Analytics"], prefix="/api/analytics")
api_router.include_router(ai.router, tags=["AI"], prefix="/api")

# Include WebSocket routes (Notice: no /api prefix for ws)
api_router.include_router(websockets.router, tags=["WebSockets"])

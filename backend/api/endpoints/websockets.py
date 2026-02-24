from fastapi import APIRouter, WebSocket
import asyncio
from services.opensky_service import get_opensky_flights

router = APIRouter()

@router.websocket("/ws/flights")
async def websocket_flights(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            flights, status = await asyncio.to_thread(get_opensky_flights)
            await websocket.send_json({
                "type": "flights_update", 
                "flights": flights,
                "status": status
            })
            await asyncio.sleep(8)
        except Exception as e:
            print(f"WebSocket Error: {e}")
            break

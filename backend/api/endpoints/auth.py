from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import time

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(req: LoginRequest):
    # Simulate network delay for retro feel
    time.sleep(1.5)
    
    if req.username == "dispatcher" and req.password == "password123":
        return {"token": "mock-token-dispatcher-0042", "role": "dispatcher", "status": "ACCESS GRANTED"}
    elif req.username == "manager" and req.password == "password123":
        return {"token": "mock-token-manager-0042", "role": "manager", "status": "ACCESS GRANTED"}
    else:
        raise HTTPException(status_code=401, detail="ACCESS DENIED: INVALID CREDENTIALS")

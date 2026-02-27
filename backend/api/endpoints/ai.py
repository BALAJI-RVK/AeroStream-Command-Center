from fastapi import APIRouter
from core.database import log_prediction, get_real_ai_brief
from services.ml_service import predict_delay, get_model_info
from services.weather_service import fetch_weather
from services.gemini_service import generate_mitigation_strategy
from models.schemas import PredictRequest, MitigateRequest

router = APIRouter()

@router.post("/predict")
async def predict_flight_delay(req: PredictRequest):
    """Run XGBoost delay prediction for a flight, enriched with live weather and telemetry."""
    flight_data = req.model_dump()
    
    # Proactively fetch live weather
    weather = await fetch_weather(req.origin)
    flight_data["live_weather"] = weather
    
    prediction = predict_delay(flight_data)
    
    log_prediction(
        flight_id=req.flight_id or f"{req.origin}-{req.destination}",
        delay_prob=prediction["delay_probability"],
        weather_risk=prediction["feature_importance"].get("weather_delay", 0),
        carrier_risk=prediction["feature_importance"].get("carrier_delay", 0)
    )
    
    return prediction

@router.post("/mitigate")
async def generate_mitigation(req: MitigateRequest):
    """Generate Gemini AI mitigation strategy for a flight."""
    flight_data = req.model_dump()
    weather = await fetch_weather(req.origin)
    
    strategy = await generate_mitigation_strategy(
        flight_data=flight_data,
        weather_data=weather,
        delay_probability=req.delay_probability
    )
    return strategy

@router.get("/ai-brief")
def get_ai_brief():
    """Get operations brief from real data analysis."""
    return {"brief": get_real_ai_brief()}

@router.get("/model/info")
def model_info():
    """Get XGBoost model metadata."""
    return get_model_info()

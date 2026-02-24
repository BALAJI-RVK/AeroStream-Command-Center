"""
AeroStream Command Center — Gemini AI Client
Uses Gemini 2.0 Flash to generate 3-step mitigation strategies.
"""

import json
from core.config import settings
from core.mock_data import generate_mock_mitigation


async def generate_mitigation_strategy(flight_data: dict, weather_data: dict, delay_probability: float) -> dict:
    """
    Send flight context to Gemini 2.0 Flash and get a 3-step mitigation plan.
    Falls back to mock data if API fails or in mock mode.
    """
    
    if settings.mock_mode:
        return generate_mock_mitigation(flight_data, weather_data, delay_probability)
    
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""You are an expert Airline Operations Advisor. Analyze the following flight data and generate a precise 3-step operational mitigation strategy.

FLIGHT DATA:
- Flight: {flight_data.get('flight_number', 'N/A')}
- Airline: {flight_data.get('airline', 'N/A')}
- Route: {flight_data.get('origin', 'N/A')} → {flight_data.get('destination', 'N/A')}
- Delay Probability: {delay_probability}%
- Status: {flight_data.get('status', 'N/A')}
- Aircraft: {flight_data.get('aircraft_type', 'A320')}

WEATHER AT ORIGIN:
- Condition: {weather_data.get('condition', 'N/A')}
- Temperature: {weather_data.get('temperature_celsius', 'N/A')}°C
- Wind: {weather_data.get('wind_speed_kmh', 'N/A')} km/h {weather_data.get('wind_direction', '')}
- Visibility: {weather_data.get('visibility_km', 'N/A')} km
- Humidity: {weather_data.get('humidity_pct', 'N/A')}%

Generate a JSON response with EXACTLY this structure (respond ONLY with JSON, no markdown):
{{
    "strategies": [
        {{
            "category": "Fuel Strategy",
            "icon": "🛢️",
            "title": "<specific actionable title>",
            "description": "<2-3 sentence detailed operational recommendation>",
            "savings": "<estimated cost savings in INR>",
            "timeline": "<when to execute>",
            "risk_reduction": "<% reduction in delay probability>"
        }},
        {{
            "category": "Crew Management",
            "icon": "👨‍✈️",
            "title": "<specific actionable title>",
            "description": "<2-3 sentence detailed crew action>",
            "savings": "<estimated savings in INR>",
            "timeline": "<when to execute>",
            "risk_reduction": "<% reduction>"
        }},
        {{
            "category": "Passenger Logistics",
            "icon": "🧳",
            "title": "<specific actionable title>",
            "description": "<2-3 sentence passenger management action>",
            "savings": "<estimated savings in INR>",
            "timeline": "<when to execute>",
            "risk_reduction": "<impact description>"
        }}
    ],
    "cost_analysis": {{
        "without_mitigation": "<total cost if no action in INR Lakhs>",
        "with_mitigation": "<cost with action in INR Lakhs>",
        "total_savings": "<savings in INR Lakhs>"
    }},
    "ai_confidence": <number between 80-98>,
    "cheapest_diversion": {{
        "airport": "<3-letter IATA code>",
        "city": "<city name>",
        "reason": "<why this airport>"
    }}
}}

Be specific with Indian airport codes (DEL, BOM, BLR, MAA, HYD, CCU, PNQ, GOI, COK, AMD, JAI, LKO).
Include realistic INR cost figures. Think like a real airline operations manager."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up response (remove markdown code blocks if present)
        if response_text.startswith("```"):
            response_text = response_text.split("```")[1]
            if response_text.startswith("json"):
                response_text = response_text[4:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        result = json.loads(response_text.strip())
        
        # Add metadata
        result["flight_id"] = flight_data.get("id", "")
        result["flight_number"] = flight_data.get("flight_number", "")
        result["delay_probability"] = delay_probability
        result["generated_at"] = __import__("datetime").datetime.now().isoformat()
        result["model"] = "gemini-2.0-flash"
        
        return result
        
    except Exception as e:
        print(f"[GEMINI] Error: {e}")
        return generate_mock_mitigation(flight_data, weather_data, delay_probability)

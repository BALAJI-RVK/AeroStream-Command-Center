"""
AeroStream Command Center — Mock Data Provider
Generates realistic flight, weather, and mitigation data for demo mode.
No API calls needed — hackathon-safe.
"""

import random
from datetime import datetime, timedelta

# ============== AIRPORT DATABASE ==============

AIRPORTS = {
    # India
    "DEL": {"name": "Indira Gandhi International", "city": "New Delhi", "lat": 28.5562, "lon": 77.1000, "country": "India"},
    "BOM": {"name": "Chhatrapati Shivaji Maharaj", "city": "Mumbai", "lat": 19.0896, "lon": 72.8656, "country": "India"},
    "BLR": {"name": "Kempegowda International", "city": "Bangalore", "lat": 13.1986, "lon": 77.7066, "country": "India"},
    "MAA": {"name": "Chennai International", "city": "Chennai", "lat": 12.9941, "lon": 80.1709, "country": "India"},
    "HYD": {"name": "Rajiv Gandhi International", "city": "Hyderabad", "lat": 17.2403, "lon": 78.4294, "country": "India"},
    "CCU": {"name": "Netaji Subhas Chandra Bose", "city": "Kolkata", "lat": 22.6547, "lon": 88.4467, "country": "India"},
    "PNQ": {"name": "Pune Airport", "city": "Pune", "lat": 18.5822, "lon": 73.9197, "country": "India"},
    "GOI": {"name": "Goa International", "city": "Goa", "lat": 15.3809, "lon": 73.8314, "country": "India"},
    "COK": {"name": "Cochin International", "city": "Kochi", "lat": 10.1520, "lon": 76.4019, "country": "India"},
    "AMD": {"name": "Sardar Vallabhbhai Patel", "city": "Ahmedabad", "lat": 23.0772, "lon": 72.6347, "country": "India"},
    "JAI": {"name": "Jaipur International", "city": "Jaipur", "lat": 26.8242, "lon": 75.8122, "country": "India"},
    "LKO": {"name": "Chaudhary Charan Singh", "city": "Lucknow", "lat": 26.7606, "lon": 80.8893, "country": "India"},
    # Global
    "JFK": {"name": "John F. Kennedy International", "city": "New York", "lat": 40.6413, "lon": -73.7781, "country": "USA"},
    "LHR": {"name": "Heathrow Airport", "city": "London", "lat": 51.4700, "lon": -0.4543, "country": "UK"},
    "DXB": {"name": "Dubai International", "city": "Dubai", "lat": 25.2532, "lon": 55.3657, "country": "UAE"},
    "SIN": {"name": "Changi Airport", "city": "Singapore", "lat": 1.3644, "lon": 103.9915, "country": "Singapore"},
    "NRT": {"name": "Narita International", "city": "Tokyo", "lat": 35.7720, "lon": 140.3929, "country": "Japan"},
    "SYD": {"name": "Sydney Airport", "city": "Sydney", "lat": -33.9461, "lon": 151.1772, "country": "Australia"},
    "CDG": {"name": "Charles de Gaulle", "city": "Paris", "lat": 49.0097, "lon": 2.5479, "country": "France"},
    "FRA": {"name": "Frankfurt Airport", "city": "Frankfurt", "lat": 50.0379, "lon": 8.5622, "country": "Germany"},
}

AIRLINES = [
    {"name": "IndiGo", "code": "6E", "iata": "6E"},
    {"name": "Air India", "code": "AI", "iata": "AI"},
    {"name": "SpiceJet", "code": "SG", "iata": "SG"},
    {"name": "Vistara", "code": "UK", "iata": "UK"},
    {"name": "GoFirst", "code": "G8", "iata": "G8"},
    {"name": "AirAsia India", "code": "I5", "iata": "I5"},
    {"name": "Akasa Air", "code": "QP", "iata": "QP"},
    {"name": "Emirates", "code": "EK", "iata": "EK"},
    {"name": "Singapore Airlines", "code": "SQ", "iata": "SQ"},
    {"name": "British Airways", "code": "BA", "iata": "BA"},
]

INDIAN_ROUTES = [
    ("DEL", "BOM"), ("DEL", "BLR"), ("DEL", "MAA"), ("DEL", "HYD"), ("DEL", "CCU"),
    ("BOM", "DEL"), ("BOM", "BLR"), ("BOM", "MAA"), ("BOM", "GOI"), ("BOM", "PNQ"),
    ("BLR", "DEL"), ("BLR", "BOM"), ("BLR", "MAA"), ("BLR", "HYD"), ("BLR", "GOI"),
    ("MAA", "DEL"), ("MAA", "BOM"), ("MAA", "BLR"), ("MAA", "HYD"), ("MAA", "COK"),
    ("HYD", "DEL"), ("HYD", "BOM"), ("HYD", "BLR"), ("HYD", "MAA"), ("HYD", "CCU"),
    ("CCU", "DEL"), ("CCU", "BOM"), ("CCU", "BLR"),
]

GLOBAL_ROUTES = [
    ("DEL", "DXB"), ("DEL", "LHR"), ("DEL", "SIN"), ("BOM", "JFK"), ("BOM", "LHR"),
    ("BLR", "SIN"), ("DEL", "NRT"), ("BOM", "FRA"), ("DEL", "CDG"), ("BOM", "SYD"),
]


def generate_mock_flights(count: int = 50) -> list:
    """Generate realistic mock flight data."""
    random.seed(42)
    flights = []
    
    all_routes = INDIAN_ROUTES + GLOBAL_ROUTES
    now = datetime.now()
    
    for i in range(count):
        route = random.choice(all_routes)
        airline = random.choice(AIRLINES[:7] if route[0] in ["DEL","BOM","BLR","MAA","HYD","CCU","PNQ","GOI","COK","AMD"] else AIRLINES)
        
        flight_num = f"{airline['code']}-{random.randint(100, 999)}"
        
        # Scheduled time within ±6 hours of now
        dep_offset = random.randint(-360, 360)
        scheduled_dep = now + timedelta(minutes=dep_offset)
        
        origin_info = AIRPORTS.get(route[0], {})
        dest_info = AIRPORTS.get(route[1], {})
        
        # Generate delay probability with some flights being high risk
        base_prob = random.gauss(35, 25)
        delay_prob = max(5, min(95, base_prob))
        
        # Status based on time and delay
        if dep_offset < -120:
            status = "landed"
        elif dep_offset < -30:
            status = "airborne"
        elif delay_prob > 70:
            status = "delayed"
        elif dep_offset < 0:
            status = "airborne"
        else:
            status = "scheduled"
        
        if delay_prob > 70:
            risk_level = "HIGH"
        elif delay_prob > 40:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        flight = {
            "id": f"flight_{i+1}",
            "flight_number": flight_num,
            "airline": airline["name"],
            "airline_code": airline["code"],
            "origin": route[0],
            "origin_city": origin_info.get("city", route[0]),
            "origin_name": origin_info.get("name", ""),
            "origin_lat": origin_info.get("lat", 20),
            "origin_lon": origin_info.get("lon", 78),
            "destination": route[1],
            "destination_city": dest_info.get("city", route[1]),
            "destination_name": dest_info.get("name", ""),
            "dest_lat": dest_info.get("lat", 20),
            "dest_lon": dest_info.get("lon", 78),
            "scheduled_departure": scheduled_dep.isoformat(),
            "status": status,
            "delay_probability": round(delay_prob, 1),
            "risk_level": risk_level,
            "delay_minutes": max(0, int(delay_prob * 0.8)) if delay_prob > 30 else 0,
            "aircraft_type": random.choice(["A320neo", "B737-800", "A321", "B787-9", "ATR 72"]),
            "gate": f"{random.choice('ABCDEFG')}{random.randint(1,30)}",
            "terminal": f"T{random.randint(1,3)}"
        }
        flights.append(flight)
    
    # Ensure some high-risk flights for demo
    for f in flights[:5]:
        f["delay_probability"] = round(random.uniform(65, 95), 1)
        f["risk_level"] = "HIGH"
        f["status"] = "delayed"
    
    return flights


def generate_mock_weather(airport_code: str) -> dict:
    """Generate realistic mock weather data for an airport."""
    random.seed(hash(airport_code) % 1000)
    
    airport = AIRPORTS.get(airport_code, {"city": airport_code, "lat": 20, "lon": 78})
    
    # Weather varies by location
    is_tropical = airport.get("lat", 20) < 25
    
    temp = random.uniform(28, 38) if is_tropical else random.uniform(5, 25)
    humidity = random.randint(40, 90)
    visibility = random.choice([2, 5, 8, 10, 10, 10, 15, 20])
    wind_speed = random.uniform(5, 35)
    
    conditions = ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Thunderstorm", "Haze", "Fog"]
    weights = [20, 25, 15, 15, 10, 10, 5]
    condition = random.choices(conditions, weights=weights)[0]
    
    # Severe weather for demo effect
    if airport_code in ["DEL", "CCU"] and random.random() > 0.5:
        condition = random.choice(["Thunderstorm", "Heavy Rain", "Dense Fog"])
        visibility = random.choice([1, 2, 3])
        wind_speed = random.uniform(25, 50)
    
    return {
        "airport_code": airport_code,
        "city": airport.get("city", airport_code),
        "temperature_celsius": round(temp, 1),
        "feels_like_celsius": round(temp + random.uniform(-3, 3), 1),
        "humidity_pct": humidity,
        "visibility_km": visibility,
        "wind_speed_kmh": round(wind_speed, 1),
        "wind_direction": random.choice(["N", "NE", "E", "SE", "S", "SW", "W", "NW"]),
        "condition": condition,
        "condition_icon": _get_weather_icon(condition),
        "pressure_hpa": random.randint(1005, 1025),
        "cloud_cover_pct": random.randint(0, 100),
        "timestamp": datetime.now().isoformat()
    }


def _get_weather_icon(condition: str) -> str:
    icons = {
        "Clear": "☀️", "Partly Cloudy": "⛅", "Cloudy": "☁️",
        "Light Rain": "🌧️", "Heavy Rain": "🌧️", "Thunderstorm": "⛈️",
        "Haze": "🌫️", "Fog": "🌫️", "Dense Fog": "🌫️"
    }
    return icons.get(condition, "🌤️")


def generate_mock_mitigation(flight_data: dict, weather: dict, delay_prob: float) -> dict:
    """Generate a realistic 3-step AI mitigation strategy."""
    
    origin = flight_data.get("origin", "DEL")
    dest = flight_data.get("destination", "BOM")
    airline = flight_data.get("airline", "IndiGo")
    flight_num = flight_data.get("flight_number", "6E-205")
    
    # Cost calculations 
    base_delay_cost = random.randint(800000, 1500000)  # ₹8L - 15L
    mitigation_cost = int(base_delay_cost * random.uniform(0.15, 0.25))
    savings = base_delay_cost - mitigation_cost
    
    # Diversion airports
    diversions = {
        "DEL": ["JAI", "LKO", "AMD"],
        "BOM": ["PNQ", "GOI", "AMD"],
        "BLR": ["MAA", "COK", "HYD"],
        "MAA": ["BLR", "HYD", "COK"],
        "HYD": ["BLR", "MAA", "PNQ"],
        "CCU": ["DEL", "HYD", "BLR"]
    }
    
    alt_airports = diversions.get(dest, ["DEL", "BOM", "BLR"])
    cheapest_alt = random.choice(alt_airports)
    
    fuel_savings = random.randint(12000, 25000)
    extra_fuel = random.randint(1800, 3200)
    crew_swap_time = random.randint(15, 35)
    affected_pax = random.randint(12, 68)
    alt_flight = f"{flight_data.get('airline_code', '6E')}-{random.randint(200, 900)}"
    
    return {
        "flight_id": flight_data.get("id", "flight_1"),
        "flight_number": flight_num,
        "delay_probability": delay_prob,
        "ai_confidence": round(random.uniform(85, 96), 1),
        "strategies": [
            {
                "category": "Fuel Strategy",
                "icon": "🛢️",
                "title": f"Tanker Extra {extra_fuel:,} lbs from {origin}",
                "description": f"Fuel at {origin} is ₹{random.uniform(70, 85):.1f}/liter vs ₹{random.uniform(88, 102):.1f}/liter at {dest}. Pre-loading additional fuel eliminates need for refueling at congested {dest}, saving turnaround time.",
                "savings": f"₹{fuel_savings:,}",
                "timeline": f"{random.randint(15, 30)} minutes before departure",
                "risk_reduction": f"-{random.randint(8, 18)}% delay probability"
            },
            {
                "category": "Crew Management",
                "icon": "👨‍✈️",
                "title": f"Alert Standby Crew {flight_data.get('airline_code', '6E')}-CREW-{random.randint(10, 99)}",
                "description": f"Pre-position relief crew at Gate {flight_data.get('gate', 'B12')} at {dest}. Current duty-hour window for primary crew closes in {random.randint(2, 5)} hours. Estimated crew swap time: {crew_swap_time} minutes.",
                "savings": f"₹{random.randint(30000, 75000):,} (avoided overtime + hotel costs)",
                "timeline": f"Alert crew {random.randint(45, 90)} minutes ahead",
                "risk_reduction": f"-{random.randint(5, 15)}% delay probability"
            },
            {
                "category": "Passenger Logistics",
                "icon": "🧳",
                "title": f"Auto-Rebook {affected_pax} Connecting Passengers",
                "description": f"Rebook {affected_pax} passengers with tight connections to {alt_flight} (next available, departs +{random.randint(1, 3)}hr). Push gate change notifications via SMS/App. Offer ₹{random.randint(500, 1500)} meal vouchers for passengers with >2hr wait.",
                "savings": f"₹{random.randint(50000, 120000):,} (avoided compensation claims)",
                "timeline": "Immediate automated action",
                "risk_reduction": "Eliminates cascade delays"
            }
        ],
        "cost_analysis": {
            "without_mitigation": f"₹{base_delay_cost / 100000:.1f}L",
            "with_mitigation": f"₹{mitigation_cost / 100000:.1f}L",
            "total_savings": f"₹{savings / 100000:.1f}L",
            "roi_percentage": round(savings / mitigation_cost * 100, 0) if mitigation_cost > 0 else 0
        },
        "cheapest_diversion": {
            "airport": cheapest_alt,
            "city": AIRPORTS.get(cheapest_alt, {}).get("city", cheapest_alt),
            "reason": f"Lower landing fees + available gate capacity",
            "tax_comparison": f"₹{random.randint(2000, 5000)} vs ₹{random.randint(6000, 12000)} at {dest}"
        },
        "generated_at": datetime.now().isoformat(),
        "model": "gemini-2.0-flash"
    }


def generate_mock_kpis() -> dict:
    """Generate dashboard KPI data."""
    return {
        "active_flights": random.randint(1100, 1400),
        "delay_rate_pct": round(random.uniform(8, 18), 1),
        "high_risk_routes": random.randint(15, 35),
        "ai_mitigations": random.randint(100, 250),
        "on_time_pct": round(random.uniform(78, 92), 1),
        "total_passengers_affected": random.randint(2000, 8000),
        "total_savings_today": f"₹{random.randint(50, 120)}L"
    }


def generate_mock_ai_brief() -> str:
    """Generate a Gemini-style AI operations brief."""
    briefs = [
        "**Current Operations Summary**: 3 flights at elevated risk due to developing thunderstorm cells over DEL/NCR region. Wind shear advisory active at BOM runway 27. Recommending pre-emptive fuel tankering for all DEL departures in the next 2 hours. 23 flights successfully mitigated today with cumulative savings of ₹78.5L.",
        "**Weather Alert Active**: Dense fog advisory at DEL (visibility < 200m) affecting 12 scheduled departures. Cascading delay risk for BOM-DEL corridor. AI has auto-generated crew swap plans for 8 flights approaching duty-hour limits. Passenger rebooking initiated for 156 connecting passengers.",
        "**Operational Efficiency Report**: System is tracking 1,247 active flights across 8 Indian hubs and 12 international routes. XGBoost model confidence at 87.2%. Today's delay rate (11.3%) is 4.2% below the monthly average. Highest risk: DEL→CCU corridor due to seasonal monsoon patterns.",
    ]
    return random.choice(briefs)


def generate_mock_analytics() -> dict:
    """Generate analytics data for the Analytics page."""
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    return {
        "monthly_reliability": [
            {"month": m, "on_time_pct": round(random.uniform(75, 95), 1), 
             "flights": random.randint(8000, 15000)}
            for m in months
        ],
        "delay_distribution": [
            {"range": "0-15 min", "count": random.randint(5000, 8000), "pct": 45},
            {"range": "15-30 min", "count": random.randint(2000, 4000), "pct": 25},
            {"range": "30-60 min", "count": random.randint(1000, 2000), "pct": 18},
            {"range": "60+ min", "count": random.randint(500, 1500), "pct": 12},
        ],
        "carrier_comparison": [
            {"airline": a["name"], "code": a["code"],
             "on_time_pct": round(random.uniform(70, 95), 1),
             "avg_delay": round(random.uniform(5, 40), 1),
             "mitigation_success": round(random.uniform(60, 95), 1)}
            for a in AIRLINES[:7]
        ],
        "cost_savings_cumulative": [
            {"month": m, "savings_lakhs": round(random.uniform(30, 150), 1)}
            for m in months
        ],
        "top_delayed_routes": [
            {"route": f"{r[0]} → {r[1]}", "avg_delay": round(random.uniform(15, 60), 1), 
             "total_flights": random.randint(100, 500)}
            for r in random.sample(INDIAN_ROUTES, min(10, len(INDIAN_ROUTES)))
        ]
    }

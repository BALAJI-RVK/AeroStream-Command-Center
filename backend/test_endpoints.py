import httpx
import asyncio
import time

BASE_URL = "http://localhost:8000/api"

ENDPOINTS = [
    {"method": "GET", "url": f"{BASE_URL}/health"},
    {"method": "GET", "url": f"{BASE_URL}/cache/stats"},
    {"method": "GET", "url": f"{BASE_URL}/flights?limit=10"},
    {"method": "GET", "url": f"{BASE_URL}/airports"},
    {"method": "GET", "url": f"{BASE_URL}/flights/airport/DEL"},
    {"method": "GET", "url": f"{BASE_URL}/model/info"},
    {"method": "GET", "url": f"{BASE_URL}/analytics/kpis"},
    {"method": "GET", "url": f"{BASE_URL}/analytics/summary"},
    {"method": "GET", "url": f"{BASE_URL}/analytics/trends"},
    {"method": "GET", "url": f"{BASE_URL}/ai-brief"},
    # We will grab a valid flight_id to test specific aircraft / flight routes
]

async def test_endpoint(client, ep):
    start = time.perf_counter()
    try:
        if ep["method"] == "GET":
            response = await client.get(ep["url"], timeout=10.0)
        elif ep["method"] == "POST":
            response = await client.post(ep["url"], json=ep.get("payload", {}), timeout=15.0)
        
        latency = (time.perf_counter() - start) * 1000
        status = response.status_code
        length = len(response.content)
        
        return {
            "url": ep["url"],
            "status": status,
            "latency_ms": round(latency, 2),
            "size_bytes": length,
            "error": None
        }
    except Exception as e:
        return {
            "url": ep["url"],
            "status": "ERROR",
            "latency_ms": round((time.perf_counter() - start) * 1000, 2),
            "size_bytes": 0,
            "error": str(e)
        }

async def run_tests():
    print(f"{'ENDPOINT':<40} | {'STATUS':<6} | {'LATENCY':<10} | {'SIZE (B)':<10}")
    print("-" * 75)
    
    async with httpx.AsyncClient() as client:
        # First batch - static or simple GETs
        for ep in ENDPOINTS:
            print(f"Testing {ep['url']}...")
            r = await test_endpoint(client, ep)
            err_str = f" [{r['error']}]" if r['error'] else ""
            print(f"{r['url'].replace(BASE_URL, '') :<40} | {r['status']:<6} | {r['latency_ms']:>6.2f} ms | {r['size_bytes']:>8}{err_str}")
        
        # Test dynamic endpoints using data from initial flights
        try:
            r = await client.get(f"{BASE_URL}/flights?limit=1")
            data = r.json()
            if data and "flights" in data and data["flights"]:
                flight = data["flights"][0]
                flight_id = flight["id"]
                icao24 = "800B8F" # Example ICAO for metadata/track tests
                origin = flight.get("origin", "DEL")
                
                mitigate_payload = flight.copy()
                mitigate_payload["flight_id"] = flight.get("id", "UNK")
                mitigate_payload["delay_probability"] = flight.get("delay_probability", 80)
                
                dynamic_endpoints = [
                    {"method": "GET", "url": f"{BASE_URL}/flights/{flight_id}"},
                    {"method": "GET", "url": f"{BASE_URL}/weather/{origin}"},
                    {"method": "GET", "url": f"{BASE_URL}/flights/aircraft/{icao24}"},
                    {"method": "GET", "url": f"{BASE_URL}/tracks/all/{icao24}"},
                    {"method": "GET", "url": f"{BASE_URL}/metadata/aircraft/{icao24}"},
                    {"method": "POST", "url": f"{BASE_URL}/predict", "payload": flight},
                    {"method": "POST", "url": f"{BASE_URL}/mitigate", "payload": mitigate_payload},
                ]
                
                for ep in dynamic_endpoints:
                    print(f"Testing dynamic {ep['url']} (Pass 1)...")
                    r = await test_endpoint(client, ep)
                    err_str = f" [{r['error']}]" if r['error'] else ""
                    print(f"{r['url'].replace(BASE_URL, '') :<40} | {r['status']:<6} | {r['latency_ms']:>6.2f} ms | {r['size_bytes']:>8}{err_str}")
                
                print("\n--- RUNNING PASS 2 TO VERIFY CACHE ---")
                for ep in dynamic_endpoints:
                    print(f"Testing dynamic {ep['url']} (Pass 2)...")
                    r = await test_endpoint(client, ep)
                    err_str = f" [{r['error']}]" if r['error'] else ""
                    print(f"{r['url'].replace(BASE_URL, '') :<40} | {r['status']:<6} | {r['latency_ms']:>6.2f} ms | {r['size_bytes']:>8}{err_str}")

                
        except Exception as e:
            print(f"Error executing dynamic tests: {e}")

if __name__ == '__main__':
    asyncio.run(run_tests())

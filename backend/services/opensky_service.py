import requests
import random
import asyncio
import time
from core.database import get_connection

def ttl_cache(ttl_seconds):
    def decorator(func):
        cache = {}
        def wrapper(*args):
            now = time.time()
            if args in cache:
                result, timestamp = cache[args]
                if now - timestamp < ttl_seconds:
                    return result
            result = func(*args)
            cache[args] = (result, now)
            return result
        return wrapper
    return decorator

# User provided mock 120-flight JSON
GLOBAL_FLIGHTS = [
  {
    "id": "FL000",
    "callsign": "UA850",
    "airline": "AF",
    "origin": "HND",
    "destination": "BOM",
    "lat": 49.38,
    "lon": -117.1292,
    "altitude": 37133,
    "velocity": 474,
    "heading": 200,
    "status": "AIRBORNE",
    "risk": 44.9
  },
  {
    "id": "FL001",
    "callsign": "QR887",
    "airline": "AA",
    "origin": "SIN",
    "destination": "HKG",
    "lat": -31.7705,
    "lon": 2.2896,
    "altitude": 35026,
    "velocity": 468,
    "heading": 76,
    "status": "CRUISING",
    "risk": 36.0
  },
  {
    "id": "FL000",
    "callsign": "DL829",
    "airline": "CX",
    "origin": "JFK",
    "destination": "SYD",
    "lat": -0.1827,
    "lon": 49.3561,
    "altitude": 29377,
    "velocity": 489,
    "heading": 108,
    "status": "AIRBORNE",
    "risk": 29.9
  },
  {
    "id": "FL001",
    "callsign": "CX934",
    "airline": "BA",
    "origin": "PEK",
    "destination": "SYD",
    "lat": 17.0176,
    "lon": 127.3747,
    "altitude": 28950,
    "velocity": 497,
    "heading": 154,
    "status": "DELAYED",
    "risk": 52.8
  },
  {
    "id": "FL002",
    "callsign": "AF638",
    "airline": "KL",
    "origin": "MIA",
    "destination": "HKG",
    "lat": 24.0161,
    "lon": 18.7388,
    "altitude": 40509,
    "velocity": 411,
    "heading": 91,
    "status": "CLIMBING",
    "risk": 19.0
  },
  {
    "id": "FL003",
    "callsign": "AF880",
    "airline": "AI",
    "origin": "SYD",
    "destination": "BOM",
    "lat": -17.7921,
    "lon": 127.3296,
    "altitude": 33156,
    "velocity": 385,
    "heading": 304,
    "status": "CLIMBING",
    "risk": 41.7
  },
  {
    "id": "FL004",
    "callsign": "6E873",
    "airline": "AI",
    "origin": "MEX",
    "destination": "SFO",
    "lat": 26.7057,
    "lon": -108.3891,
    "altitude": 25724,
    "velocity": 430,
    "heading": 307,
    "status": "DELAYED",
    "risk": 60.6
  },
  {
    "id": "FL005",
    "callsign": "BA761",
    "airline": "JL",
    "origin": "HKG",
    "destination": "GRU",
    "lat": -19.9018,
    "lon": -34.0828,
    "altitude": 25069,
    "velocity": 460,
    "heading": 254,
    "status": "CRUISING",
    "risk": 41.7
  },
  {
    "id": "FL006",
    "callsign": "6E659",
    "airline": "TK",
    "origin": "NRT",
    "destination": "LAX",
    "lat": 35.4043,
    "lon": 89.2276,
    "altitude": 40758,
    "velocity": 414,
    "heading": 269,
    "status": "DELAYED",
    "risk": 53.5
  },
  {
    "id": "FL007",
    "callsign": "QR487",
    "airline": "CX",
    "origin": "CDG",
    "destination": "DEL",
    "lat": 38.567,
    "lon": 40.6111,
    "altitude": 30616,
    "velocity": 409,
    "heading": 105,
    "status": "CLIMBING",
    "risk": 64.3
  },
  {
    "id": "FL008",
    "callsign": "AF650",
    "airline": "TK",
    "origin": "AMS",
    "destination": "HKG",
    "lat": 25.9604,
    "lon": 100.628,
    "altitude": 40204,
    "velocity": 388,
    "heading": 105,
    "status": "DESCENDING",
    "risk": 80.8
  },
  {
    "id": "FL009",
    "callsign": "AF668",
    "airline": "AI",
    "origin": "DXB",
    "destination": "DEL",
    "lat": 25.5881,
    "lon": 57.5696,
    "altitude": 25320,
    "velocity": 445,
    "heading": 81,
    "status": "CLIMBING",
    "risk": 38.0
  },
  {
    "id": "FL010",
    "callsign": "TK335",
    "airline": "CX",
    "origin": "PEK",
    "destination": "DEL",
    "lat": 32.0182,
    "lon": 88.9677,
    "altitude": 37621,
    "velocity": 430,
    "heading": 253,
    "status": "AIRBORNE",
    "risk": 30.0
  },
  {
    "id": "FL011",
    "callsign": "CX186",
    "airline": "UA",
    "origin": "JFK",
    "destination": "NRT",
    "lat": 36.7894,
    "lon": 95.3865,
    "altitude": 32096,
    "velocity": 462,
    "heading": 91,
    "status": "AIRBORNE",
    "risk": 27.1
  },
  {
    "id": "FL012",
    "callsign": "6E865",
    "airline": "AI",
    "origin": "AMS",
    "destination": "LAX",
    "lat": 39.3683,
    "lon": -82.0189,
    "altitude": 31401,
    "velocity": 419,
    "heading": 261,
    "status": "CLIMBING",
    "risk": 14.5
  },
  {
    "id": "FL013",
    "callsign": "LH929",
    "airline": "AF",
    "origin": "HKG",
    "destination": "BOM",
    "lat": 20.0348,
    "lon": 84.9207,
    "altitude": 36857,
    "velocity": 505,
    "heading": 265,
    "status": "CLIMBING",
    "risk": 18.0
  },
  {
    "id": "FL014",
    "callsign": "6E915",
    "airline": "LH",
    "origin": "DXB",
    "destination": "CDG",
    "lat": 47.085,
    "lon": 6.8271,
    "altitude": 37981,
    "velocity": 400,
    "heading": 294,
    "status": "DELAYED",
    "risk": 36.4
  },
  {
    "id": "FL015",
    "callsign": "TK130",
    "airline": "TK",
    "origin": "LHR",
    "destination": "NRT",
    "lat": 38.6474,
    "lon": 114.5354,
    "altitude": 30119,
    "velocity": 384,
    "heading": 96,
    "status": "CRUISING",
    "risk": 46.9
  },
  {
    "id": "FL016",
    "callsign": "LH320",
    "airline": "KL",
    "origin": "SIN",
    "destination": "HKG",
    "lat": 19.4905,
    "lon": 112.58,
    "altitude": 28860,
    "velocity": 382,
    "heading": 25,
    "status": "CRUISING",
    "risk": 47.3
  },
  {
    "id": "FL017",
    "callsign": "JL576",
    "airline": "JL",
    "origin": "NRT",
    "destination": "DEL",
    "lat": 33.9193,
    "lon": 124.185,
    "altitude": 36610,
    "velocity": 489,
    "heading": 263,
    "status": "CLIMBING",
    "risk": 64.8
  },
  {
    "id": "FL018",
    "callsign": "EK480",
    "airline": "AF",
    "origin": "GRU",
    "destination": "DEL",
    "lat": 18.7816,
    "lon": 53.8679,
    "altitude": 36779,
    "velocity": 439,
    "heading": 67,
    "status": "CRUISING",
    "risk": 36.3
  },
  {
    "id": "FL019",
    "callsign": "AI779",
    "airline": "EK",
    "origin": "BOM",
    "destination": "JNB",
    "lat": -20.2845,
    "lon": 34.0218,
    "altitude": 31646,
    "velocity": 400,
    "heading": 224,
    "status": "DESCENDING",
    "risk": 31.4
  },
  {
    "id": "FL020",
    "callsign": "6E578",
    "airline": "JL",
    "origin": "CDG",
    "destination": "SFO",
    "lat": 39.4093,
    "lon": -102.7648,
    "altitude": 39785,
    "velocity": 437,
    "heading": 264,
    "status": "AIRBORNE",
    "risk": 74.6
  },
  {
    "id": "FL021",
    "callsign": "AA874",
    "airline": "AI",
    "origin": "DEL",
    "destination": "HKG",
    "lat": 25.0714,
    "lon": 97.6325,
    "altitude": 28546,
    "velocity": 477,
    "heading": 99,
    "status": "AIRBORNE",
    "risk": 57.7
  },
  {
    "id": "FL022",
    "callsign": "BA514",
    "airline": "AA",
    "origin": "JNB",
    "destination": "HKG",
    "lat": -3.265,
    "lon": 68.6944,
    "altitude": 32522,
    "velocity": 460,
    "heading": 60,
    "status": "CRUISING",
    "risk": 39.8
  },
  {
    "id": "FL023",
    "callsign": "AF355",
    "airline": "DL",
    "origin": "JFK",
    "destination": "GRU",
    "lat": 11.3378,
    "lon": -61.291,
    "altitude": 25486,
    "velocity": 455,
    "heading": 156,
    "status": "DESCENDING",
    "risk": 81.9
  },
  {
    "id": "FL024",
    "callsign": "CX808",
    "airline": "UA",
    "origin": "JNB",
    "destination": "DXB",
    "lat": -5.9165,
    "lon": 38.9175,
    "altitude": 33910,
    "velocity": 416,
    "heading": 27,
    "status": "CRUISING",
    "risk": 80.0
  },
  {
    "id": "FL025",
    "callsign": "KL289",
    "airline": "JL",
    "origin": "MIA",
    "destination": "HKG",
    "lat": 25.3689,
    "lon": -56.6413,
    "altitude": 27449,
    "velocity": 425,
    "heading": 91,
    "status": "CLIMBING",
    "risk": 49.6
  },
  {
    "id": "FL026",
    "callsign": "DL968",
    "airline": "DL",
    "origin": "DEL",
    "destination": "SFO",
    "lat": 33.8332,
    "lon": -39.0209,
    "altitude": 30425,
    "velocity": 474,
    "heading": 272,
    "status": "CLIMBING",
    "risk": 29.5
  },
  {
    "id": "FL027",
    "callsign": "6E927",
    "airline": "LH",
    "origin": "JFK",
    "destination": "AMS",
    "lat": 45.823,
    "lon": -38.8998,
    "altitude": 32684,
    "velocity": 511,
    "heading": 81,
    "status": "CLIMBING",
    "risk": 28.4
  },
  {
    "id": "FL028",
    "callsign": "JL903",
    "airline": "AI",
    "origin": "LHR",
    "destination": "PEK",
    "lat": 41.2256,
    "lon": 104.8284,
    "altitude": 39956,
    "velocity": 510,
    "heading": 95,
    "status": "CRUISING",
    "risk": 20.2
  },
  {
    "id": "FL029",
    "callsign": "CX290",
    "airline": "UA",
    "origin": "DXB",
    "destination": "JNB",
    "lat": -15.3452,
    "lon": 33.942,
    "altitude": 37006,
    "velocity": 471,
    "heading": 207,
    "status": "CRUISING",
    "risk": 75.1
  },
  {
    "id": "FL030",
    "callsign": "DL125",
    "airline": "AF",
    "origin": "SFO",
    "destination": "LAX",
    "lat": 36.9226,
    "lon": -121.6251,
    "altitude": 33514,
    "velocity": 408,
    "heading": 132,
    "status": "DESCENDING",
    "risk": 3.8
  },
  {
    "id": "FL031",
    "callsign": "AF585",
    "airline": "JL",
    "origin": "MIA",
    "destination": "DXB",
    "lat": 25.5783,
    "lon": -26.2914,
    "altitude": 26059,
    "velocity": 416,
    "heading": 90,
    "status": "AIRBORNE",
    "risk": 9.1
  },
  {
    "id": "FL032",
    "callsign": "KL769",
    "airline": "DL",
    "origin": "LHR",
    "destination": "NRT",
    "lat": 42.0059,
    "lon": 84.4172,
    "altitude": 30396,
    "velocity": 454,
    "heading": 96,
    "status": "CLIMBING",
    "risk": 9.3
  },
  {
    "id": "FL033",
    "callsign": "AF422",
    "airline": "SQ",
    "origin": "LAX",
    "destination": "SFO",
    "lat": 36.867,
    "lon": -121.5651,
    "altitude": 30002,
    "velocity": 415,
    "heading": 312,
    "status": "CLIMBING",
    "risk": 31.5
  },
  {
    "id": "FL034",
    "callsign": "UA695",
    "airline": "JL",
    "origin": "JFK",
    "destination": "GRU",
    "lat": 16.0933,
    "lon": -63.3175,
    "altitude": 28678,
    "velocity": 403,
    "heading": 156,
    "status": "DELAYED",
    "risk": 14.5
  },
  {
    "id": "FL035",
    "callsign": "6E675",
    "airline": "QR",
    "origin": "SFO",
    "destination": "PEK",
    "lat": 37.9554,
    "lon": -89.9073,
    "altitude": 36548,
    "velocity": 470,
    "heading": 89,
    "status": "AIRBORNE",
    "risk": 7.9
  },
  {
    "id": "FL036",
    "callsign": "QR336",
    "airline": "KL",
    "origin": "LAX",
    "destination": "JNB",
    "lat": 13.4223,
    "lon": -68.3219,
    "altitude": 32064,
    "velocity": 486,
    "heading": 112,
    "status": "CRUISING",
    "risk": 20.0
  },
  {
    "id": "FL037",
    "callsign": "KL339",
    "airline": "JL",
    "origin": "BOM",
    "destination": "LHR",
    "lat": 29.7922,
    "lon": 48.6314,
    "altitude": 39193,
    "velocity": 429,
    "heading": 293,
    "status": "CRUISING",
    "risk": 35.6
  },
  {
    "id": "FL038",
    "callsign": "CX352",
    "airline": "SQ",
    "origin": "DXB",
    "destination": "LAX",
    "lat": 32.4196,
    "lon": -87.9681,
    "altitude": 35190,
    "velocity": 501,
    "heading": 272,
    "status": "AIRBORNE",
    "risk": 52.6
  },
  {
    "id": "FL039",
    "callsign": "TK634",
    "airline": "LH",
    "origin": "SIN",
    "destination": "LHR",
    "lat": 41.7849,
    "lon": 19.7345,
    "altitude": 39979,
    "velocity": 423,
    "heading": 295,
    "status": "AIRBORNE",
    "risk": 11.7
  },
  {
    "id": "FL040",
    "callsign": "TK754",
    "airline": "EK",
    "origin": "LAX",
    "destination": "SIN",
    "lat": 14.3281,
    "lon": 15.4899,
    "altitude": 26398,
    "velocity": 441,
    "heading": 98,
    "status": "CRUISING",
    "risk": 64.0
  },
  {
    "id": "FL041",
    "callsign": "LH288",
    "airline": "JL",
    "origin": "CDG",
    "destination": "MIA",
    "lat": 40.3133,
    "lon": -28.4816,
    "altitude": 26281,
    "velocity": 416,
    "heading": 254,
    "status": "CRUISING",
    "risk": 14.2
  },
  {
    "id": "FL042",
    "callsign": "BA753",
    "airline": "AI",
    "origin": "SIN",
    "destination": "GRU",
    "lat": -7.1088,
    "lon": 52.5833,
    "altitude": 34214,
    "velocity": 450,
    "heading": 260,
    "status": "CRUISING",
    "risk": 45.9
  },
  {
    "id": "FL043",
    "callsign": "QR911",
    "airline": "UA",
    "origin": "MIA",
    "destination": "FRA",
    "lat": 40.2156,
    "lon": -27.435,
    "altitude": 39551,
    "velocity": 504,
    "heading": 74,
    "status": "CRUISING",
    "risk": 18.7
  },
  {
    "id": "FL044",
    "callsign": "DL631",
    "airline": "TK",
    "origin": "DEL",
    "destination": "SFO",
    "lat": 37.0909,
    "lon": -110.707,
    "altitude": 40332,
    "velocity": 422,
    "heading": 272,
    "status": "CRUISING",
    "risk": 46.0
  },
  {
    "id": "FL045",
    "callsign": "EK500",
    "airline": "AA",
    "origin": "BOM",
    "destination": "MEX",
    "lat": 19.3251,
    "lon": -43.9894,
    "altitude": 28058,
    "velocity": 410,
    "heading": 270,
    "status": "AIRBORNE",
    "risk": 75.7
  },
  {
    "id": "FL046",
    "callsign": "TK378",
    "airline": "AA",
    "origin": "IST",
    "destination": "JFK",
    "lat": 40.7167,
    "lon": -51.06,
    "altitude": 38907,
    "velocity": 511,
    "heading": 269,
    "status": "DESCENDING",
    "risk": 6.0
  },
  {
    "id": "FL047",
    "callsign": "DL847",
    "airline": "KL",
    "origin": "JNB",
    "destination": "NRT",
    "lat": 12.7614,
    "lon": 98.7153,
    "altitude": 38722,
    "velocity": 499,
    "heading": 61,
    "status": "AIRBORNE",
    "risk": 25.0
  },
  {
    "id": "FL048",
    "callsign": "LH301",
    "airline": "QR",
    "origin": "JNB",
    "destination": "SIN",
    "lat": -0.3457,
    "lon": 99.2819,
    "altitude": 31485,
    "velocity": 456,
    "heading": 70,
    "status": "DESCENDING",
    "risk": 20.5
  },
  {
    "id": "FL049",
    "callsign": "EK174",
    "airline": "LH",
    "origin": "MEX",
    "destination": "SYD",
    "lat": -6.3165,
    "lon": 21.6662,
    "altitude": 33016,
    "velocity": 451,
    "heading": 102,
    "status": "DELAYED",
    "risk": 61.1
  },
  {
    "id": "FL050",
    "callsign": "JL529",
    "airline": "AI",
    "origin": "AMS",
    "destination": "DEL",
    "lat": 47.2492,
    "lon": 20.18,
    "altitude": 35348,
    "velocity": 455,
    "heading": 108,
    "status": "CLIMBING",
    "risk": 25.3
  },
  {
    "id": "FL051",
    "callsign": "SQ318",
    "airline": "QR",
    "origin": "LHR",
    "destination": "MIA",
    "lat": 47.7031,
    "lon": -12.1667,
    "altitude": 40023,
    "velocity": 398,
    "heading": 252,
    "status": "AIRBORNE",
    "risk": 20.8
  },
  {
    "id": "FL052",
    "callsign": "AI596",
    "airline": "CX",
    "origin": "JNB",
    "destination": "LHR",
    "lat": 3.1597,
    "lon": 17.4111,
    "altitude": 38057,
    "velocity": 386,
    "heading": 339,
    "status": "CLIMBING",
    "risk": 65.5
  },
  {
    "id": "FL053",
    "callsign": "AA757",
    "airline": "AI",
    "origin": "JNB",
    "destination": "CDG",
    "lat": 15.356,
    "lon": 14.0562,
    "altitude": 25062,
    "velocity": 519,
    "heading": 341,
    "status": "AIRBORNE",
    "risk": 15.1
  },
  {
    "id": "FL054",
    "callsign": "SQ412",
    "airline": "LH",
    "origin": "LAX",
    "destination": "AMS",
    "lat": 39.4271,
    "lon": -81.6243,
    "altitude": 28876,
    "velocity": 382,
    "heading": 81,
    "status": "DESCENDING",
    "risk": 20.7
  },
  {
    "id": "FL055",
    "callsign": "CX340",
    "airline": "UA",
    "origin": "SFO",
    "destination": "LAX",
    "lat": 34.6366,
    "lon": -119.1585,
    "altitude": 28825,
    "velocity": 466,
    "heading": 132,
    "status": "CLIMBING",
    "risk": 79.5
  },
  {
    "id": "FL056",
    "callsign": "SQ230",
    "airline": "DL",
    "origin": "IST",
    "destination": "JNB",
    "lat": 23.1028,
    "lon": 28.6675,
    "altitude": 37922,
    "velocity": 455,
    "heading": 180,
    "status": "DESCENDING",
    "risk": 32.0
  },
  {
    "id": "FL057",
    "callsign": "DL355",
    "airline": "JL",
    "origin": "HKG",
    "destination": "IST",
    "lat": 24.3189,
    "lon": 104.7517,
    "altitude": 33279,
    "velocity": 437,
    "heading": 282,
    "status": "CRUISING",
    "risk": 42.5
  },
  {
    "id": "FL058",
    "callsign": "EK172",
    "airline": "AA",
    "origin": "NRT",
    "destination": "LHR",
    "lat": 39.6965,
    "lon": 105.1275,
    "altitude": 30746,
    "velocity": 401,
    "heading": 276,
    "status": "CLIMBING",
    "risk": 44.9
  },
  {
    "id": "FL059",
    "callsign": "AI937",
    "airline": "UA",
    "origin": "JFK",
    "destination": "LAX",
    "lat": 37.1799,
    "lon": -96.8367,
    "altitude": 32155,
    "velocity": 490,
    "heading": 261,
    "status": "DELAYED",
    "risk": 10.2
  },
  {
    "id": "FL060",
    "callsign": "BA567",
    "airline": "KL",
    "origin": "JFK",
    "destination": "GRU",
    "lat": 12.6248,
    "lon": -61.8395,
    "altitude": 28659,
    "velocity": 511,
    "heading": 156,
    "status": "CRUISING",
    "risk": 77.8
  },
  {
    "id": "FL061",
    "callsign": "6E649",
    "airline": "KL",
    "origin": "JNB",
    "destination": "CDG",
    "lat": 6.7791,
    "lon": 16.9892,
    "altitude": 26985,
    "velocity": 418,
    "heading": 341,
    "status": "DESCENDING",
    "risk": 18.3
  },
  {
    "id": "FL062",
    "callsign": "KL130",
    "airline": "EK",
    "origin": "JFK",
    "destination": "LHR",
    "lat": 46.4262,
    "lon": -34.6071,
    "altitude": 30221,
    "velocity": 429,
    "heading": 81,
    "status": "CLIMBING",
    "risk": 56.4
  },
  {
    "id": "FL063",
    "callsign": "AI545",
    "airline": "6E",
    "origin": "HKG",
    "destination": "LHR",
    "lat": 29.639,
    "lon": 85.1637,
    "altitude": 36363,
    "velocity": 473,
    "heading": 284,
    "status": "CLIMBING",
    "risk": 12.0
  },
  {
    "id": "FL064",
    "callsign": "UA220",
    "airline": "CX",
    "origin": "JFK",
    "destination": "PEK",
    "lat": 40.2096,
    "lon": 72.6327,
    "altitude": 39187,
    "velocity": 509,
    "heading": 90,
    "status": "AIRBORNE",
    "risk": 62.9
  },
  {
    "id": "FL065",
    "callsign": "CX304",
    "airline": "KL",
    "origin": "LHR",
    "destination": "IST",
    "lat": 49.009,
    "lon": 6.4152,
    "altitude": 31708,
    "velocity": 437,
    "heading": 109,
    "status": "DELAYED",
    "risk": 33.4
  },
  {
    "id": "FL066",
    "callsign": "QR207",
    "airline": "QR",
    "origin": "IST",
    "destination": "PEK",
    "lat": 40.832,
    "lon": 43.4166,
    "altitude": 27801,
    "velocity": 462,
    "heading": 90,
    "status": "CLIMBING",
    "risk": 54.3
  },
  {
    "id": "FL067",
    "callsign": "JL163",
    "airline": "KL",
    "origin": "FRA",
    "destination": "MEX",
    "lat": 38.4177,
    "lon": -32.3092,
    "altitude": 37709,
    "velocity": 495,
    "heading": 254,
    "status": "CRUISING",
    "risk": 74.5
  },
  {
    "id": "FL068",
    "callsign": "AF252",
    "airline": "AI",
    "origin": "GRU",
    "destination": "FRA",
    "lat": 42.0323,
    "lon": 2.5656,
    "altitude": 40758,
    "velocity": 467,
    "heading": 36,
    "status": "CRUISING",
    "risk": 75.8
  },
  {
    "id": "FL069",
    "callsign": "AI700",
    "airline": "DL",
    "origin": "SIN",
    "destination": "AMS",
    "lat": 20.6468,
    "lon": 66.4369,
    "altitude": 29599,
    "velocity": 422,
    "heading": 297,
    "status": "AIRBORNE",
    "risk": 61.7
  },
  {
    "id": "FL070",
    "callsign": "BA637",
    "airline": "QR",
    "origin": "SYD",
    "destination": "LAX",
    "lat": -0.5669,
    "lon": 18.6381,
    "altitude": 25575,
    "velocity": 503,
    "heading": 284,
    "status": "CLIMBING",
    "risk": 67.3
  },
  {
    "id": "FL071",
    "callsign": "AF197",
    "airline": "SQ",
    "origin": "CDG",
    "destination": "LHR",
    "lat": 50.5929,
    "lon": 0.616,
    "altitude": 35382,
    "velocity": 416,
    "heading": 309,
    "status": "DESCENDING",
    "risk": 37.0
  },
  {
    "id": "FL072",
    "callsign": "EK926",
    "airline": "6E",
    "origin": "AMS",
    "destination": "MEX",
    "lat": 40.4436,
    "lon": -32.7155,
    "altitude": 37182,
    "velocity": 383,
    "heading": 252,
    "status": "DESCENDING",
    "risk": 75.0
  },
  {
    "id": "FL073",
    "callsign": "AI324",
    "airline": "DL",
    "origin": "BOM",
    "destination": "NRT",
    "lat": 30.2797,
    "lon": 118.1765,
    "altitude": 35621,
    "velocity": 484,
    "heading": 76,
    "status": "CRUISING",
    "risk": 77.3
  },
  {
    "id": "FL074",
    "callsign": "LH836",
    "airline": "6E",
    "origin": "CDG",
    "destination": "AMS",
    "lat": 50.0202,
    "lon": 3.2277,
    "altitude": 29978,
    "velocity": 498,
    "heading": 33,
    "status": "CLIMBING",
    "risk": 48.8
  },
  {
    "id": "FL075",
    "callsign": "LH701",
    "airline": "AF",
    "origin": "MIA",
    "destination": "LAX",
    "lat": 28.0422,
    "lon": -90.8111,
    "altitude": 39915,
    "velocity": 416,
    "heading": 282,
    "status": "DESCENDING",
    "risk": 46.4
  },
  {
    "id": "FL076",
    "callsign": "KL306",
    "airline": "EK",
    "origin": "SFO",
    "destination": "SYD",
    "lat": -16.7306,
    "lon": 85.3901,
    "altitude": 31192,
    "velocity": 430,
    "heading": 104,
    "status": "AIRBORNE",
    "risk": 73.5
  },
  {
    "id": "FL077",
    "callsign": "AA613",
    "airline": "KL",
    "origin": "MIA",
    "destination": "MEX",
    "lat": 23.4521,
    "lon": -87.2075,
    "altitude": 25790,
    "velocity": 382,
    "heading": 251,
    "status": "CLIMBING",
    "risk": 6.0
  },
  {
    "id": "FL078",
    "callsign": "QR417",
    "airline": "QR",
    "origin": "SIN",
    "destination": "NRT",
    "lat": 19.5706,
    "lon": 123.2532,
    "altitude": 37025,
    "velocity": 391,
    "heading": 46,
    "status": "AIRBORNE",
    "risk": 51.9
  },
  {
    "id": "FL079",
    "callsign": "AF264",
    "airline": "JL",
    "origin": "JNB",
    "destination": "MEX",
    "lat": -19.1975,
    "lon": 8.8538,
    "altitude": 25909,
    "velocity": 427,
    "heading": 289,
    "status": "CRUISING",
    "risk": 76.8
  },
  {
    "id": "FL080",
    "callsign": "UA217",
    "airline": "JL",
    "origin": "JNB",
    "destination": "CDG",
    "lat": -4.838,
    "lon": 20.9618,
    "altitude": 28410,
    "velocity": 417,
    "heading": 341,
    "status": "CLIMBING",
    "risk": 43.8
  },
  {
    "id": "FL081",
    "callsign": "UA814",
    "airline": "6E",
    "origin": "NRT",
    "destination": "JFK",
    "lat": 36.3714,
    "lon": 113.7421,
    "altitude": 25576,
    "velocity": 490,
    "heading": 271,
    "status": "CRUISING",
    "risk": 26.4
  },
  {
    "id": "FL082",
    "callsign": "AI898",
    "airline": "LH",
    "origin": "SYD",
    "destination": "FRA",
    "lat": 10.2313,
    "lon": 76.1628,
    "altitude": 29970,
    "velocity": 432,
    "heading": 300,
    "status": "DELAYED",
    "risk": 9.8
  },
  {
    "id": "FL083",
    "callsign": "DL598",
    "airline": "JL",
    "origin": "JNB",
    "destination": "GRU",
    "lat": -25.6469,
    "lon": 14.6391,
    "altitude": 29063,
    "velocity": 412,
    "heading": 272,
    "status": "CRUISING",
    "risk": 30.0
  },
  {
    "id": "FL084",
    "callsign": "SQ704",
    "airline": "AF",
    "origin": "SYD",
    "destination": "AMS",
    "lat": 41.4714,
    "lon": 23.1673,
    "altitude": 38938,
    "velocity": 444,
    "heading": 300,
    "status": "DELAYED",
    "risk": 18.1
  },
  {
    "id": "FL085",
    "callsign": "TK954",
    "airline": "EK",
    "origin": "GRU",
    "destination": "NRT",
    "lat": -17.1563,
    "lon": -26.6532,
    "altitude": 40571,
    "velocity": 487,
    "heading": 72,
    "status": "CLIMBING",
    "risk": 22.4
  },
  {
    "id": "FL086",
    "callsign": "CX481",
    "airline": "AA",
    "origin": "CDG",
    "destination": "SYD",
    "lat": 31.8239,
    "lon": 33.3411,
    "altitude": 30033,
    "velocity": 404,
    "heading": 119,
    "status": "DESCENDING",
    "risk": 32.2
  },
  {
    "id": "FL087",
    "callsign": "EK987",
    "airline": "DL",
    "origin": "JFK",
    "destination": "NRT",
    "lat": 36.3819,
    "lon": 113.2798,
    "altitude": 25024,
    "velocity": 452,
    "heading": 91,
    "status": "AIRBORNE",
    "risk": 79.0
  },
  {
    "id": "FL088",
    "callsign": "LH132",
    "airline": "CX",
    "origin": "HKG",
    "destination": "LHR",
    "lat": 28.2416,
    "lon": 90.6442,
    "altitude": 30028,
    "velocity": 441,
    "heading": 284,
    "status": "CRUISING",
    "risk": 23.6
  },
  {
    "id": "FL089",
    "callsign": "EK760",
    "airline": "BA",
    "origin": "SIN",
    "destination": "DEL",
    "lat": 26.3322,
    "lon": 79.2995,
    "altitude": 33480,
    "velocity": 477,
    "heading": 315,
    "status": "CLIMBING",
    "risk": 56.1
  },
  {
    "id": "FL090",
    "callsign": "EK204",
    "airline": "AF",
    "origin": "JNB",
    "destination": "HKG",
    "lat": 10.0714,
    "lon": 92.2771,
    "altitude": 38537,
    "velocity": 459,
    "heading": 60,
    "status": "DELAYED",
    "risk": 16.5
  },
  {
    "id": "FL091",
    "callsign": "UA291",
    "airline": "QR",
    "origin": "DEL",
    "destination": "MEX",
    "lat": 26.7954,
    "lon": 43.0865,
    "altitude": 31496,
    "velocity": 387,
    "heading": 267,
    "status": "CRUISING",
    "risk": 47.0
  },
  {
    "id": "FL092",
    "callsign": "AI580",
    "airline": "DL",
    "origin": "JNB",
    "destination": "CDG",
    "lat": -13.7365,
    "lon": 24.0048,
    "altitude": 37243,
    "velocity": 496,
    "heading": 341,
    "status": "DESCENDING",
    "risk": 69.5
  },
  {
    "id": "FL093",
    "callsign": "EK819",
    "airline": "DL",
    "origin": "SIN",
    "destination": "FRA",
    "lat": 29.26,
    "lon": 49.2994,
    "altitude": 32985,
    "velocity": 446,
    "heading": 297,
    "status": "CLIMBING",
    "risk": 78.3
  },
  {
    "id": "FL094",
    "callsign": "CX118",
    "airline": "AI",
    "origin": "SYD",
    "destination": "MIA",
    "lat": 22.4605,
    "lon": -67.3761,
    "altitude": 31776,
    "velocity": 420,
    "heading": 284,
    "status": "CLIMBING",
    "risk": 25.4
  },
  {
    "id": "FL095",
    "callsign": "LH479",
    "airline": "JL",
    "origin": "JNB",
    "destination": "SYD",
    "lat": -31.3981,
    "lon": 111.1192,
    "altitude": 40340,
    "velocity": 387,
    "heading": 93,
    "status": "DESCENDING",
    "risk": 45.8
  },
  {
    "id": "FL096",
    "callsign": "AA418",
    "airline": "UA",
    "origin": "LHR",
    "destination": "IST",
    "lat": 45.2385,
    "lon": 16.9396,
    "altitude": 35067,
    "velocity": 463,
    "heading": 109,
    "status": "AIRBORNE",
    "risk": 12.7
  },
  {
    "id": "FL097",
    "callsign": "SQ120",
    "airline": "TK",
    "origin": "NRT",
    "destination": "FRA",
    "lat": 47.4288,
    "lon": 32.6589,
    "altitude": 38567,
    "velocity": 476,
    "heading": 276,
    "status": "CRUISING",
    "risk": 48.2
  },
  {
    "id": "FL098",
    "callsign": "EK458",
    "airline": "KL",
    "origin": "SIN",
    "destination": "MEX",
    "lat": 13.537,
    "lon": -32.7866,
    "altitude": 34148,
    "velocity": 408,
    "heading": 275,
    "status": "CLIMBING",
    "risk": 63.5
  },
  {
    "id": "FL099",
    "callsign": "JL229",
    "airline": "SQ",
    "origin": "JNB",
    "destination": "MIA",
    "lat": 5.7028,
    "lon": -38.3024,
    "altitude": 30353,
    "velocity": 500,
    "heading": 295,
    "status": "DELAYED",
    "risk": 41.6
  },
  {
    "id": "FL100",
    "callsign": "AA673",
    "airline": "AA",
    "origin": "FRA",
    "destination": "MEX",
    "lat": 29.8505,
    "lon": -62.442,
    "altitude": 40426,
    "velocity": 492,
    "heading": 254,
    "status": "DESCENDING",
    "risk": 21.6
  },
  {
    "id": "FL101",
    "callsign": "CX313",
    "airline": "JL",
    "origin": "AMS",
    "destination": "DXB",
    "lat": 34.5728,
    "lon": 37.9379,
    "altitude": 38441,
    "velocity": 395,
    "heading": 118,
    "status": "AIRBORNE",
    "risk": 58.8
  },
  {
    "id": "FL102",
    "callsign": "EK372",
    "airline": "AF",
    "origin": "LHR",
    "destination": "MIA",
    "lat": 36.8898,
    "lon": -45.7883,
    "altitude": 40565,
    "velocity": 465,
    "heading": 252,
    "status": "CRUISING",
    "risk": 52.0
  },
  {
    "id": "FL103",
    "callsign": "BA691",
    "airline": "QR",
    "origin": "IST",
    "destination": "NRT",
    "lat": 39.9358,
    "lon": 51.1933,
    "altitude": 35760,
    "velocity": 412,
    "heading": 92,
    "status": "AIRBORNE",
    "risk": 21.8
  },
  {
    "id": "FL104",
    "callsign": "SQ109",
    "airline": "AI",
    "origin": "LAX",
    "destination": "DEL",
    "lat": 31.3386,
    "lon": -23.9102,
    "altitude": 25262,
    "velocity": 456,
    "heading": 91,
    "status": "DELAYED",
    "risk": 58.3
  },
  {
    "id": "FL105",
    "callsign": "CX718",
    "airline": "BA",
    "origin": "SIN",
    "destination": "SFO",
    "lat": 24.094,
    "lon": -37.9213,
    "altitude": 25295,
    "velocity": 419,
    "heading": 279,
    "status": "CRUISING",
    "risk": 16.5
  },
  {
    "id": "FL106",
    "callsign": "UA133",
    "airline": "UA",
    "origin": "LAX",
    "destination": "SYD",
    "lat": -8.1847,
    "lon": 48.8913,
    "altitude": 34972,
    "velocity": 459,
    "heading": 104,
    "status": "DELAYED",
    "risk": 64.5
  },
  {
    "id": "FL107",
    "callsign": "QR211",
    "airline": "AF",
    "origin": "IST",
    "destination": "HKG",
    "lat": 34.8847,
    "lon": 56.6052,
    "altitude": 29656,
    "velocity": 484,
    "heading": 102,
    "status": "DESCENDING",
    "risk": 14.4
  },
  {
    "id": "FL108",
    "callsign": "BA754",
    "airline": "6E",
    "origin": "JNB",
    "destination": "SIN",
    "lat": -13.5851,
    "lon": 62.8204,
    "altitude": 25639,
    "velocity": 464,
    "heading": 70,
    "status": "DELAYED",
    "risk": 75.8
  },
  {
    "id": "FL109",
    "callsign": "JL437",
    "airline": "AF",
    "origin": "BOM",
    "destination": "PEK",
    "lat": 36.6444,
    "lon": 109.4445,
    "altitude": 26832,
    "velocity": 462,
    "heading": 64,
    "status": "DELAYED",
    "risk": 41.6
  },
  {
    "id": "FL110",
    "callsign": "EK375",
    "airline": "AA",
    "origin": "MIA",
    "destination": "FRA",
    "lat": 41.5576,
    "lon": -22.5168,
    "altitude": 31045,
    "velocity": 510,
    "heading": 74,
    "status": "CRUISING",
    "risk": 47.5
  },
  {
    "id": "FL111",
    "callsign": "EK117",
    "airline": "AI",
    "origin": "JFK",
    "destination": "DXB",
    "lat": 31.5178,
    "lon": 2.7902,
    "altitude": 40493,
    "velocity": 431,
    "heading": 96,
    "status": "CLIMBING",
    "risk": 70.9
  },
  {
    "id": "FL112",
    "callsign": "EK590",
    "airline": "KL",
    "origin": "SIN",
    "destination": "JFK",
    "lat": 28.6719,
    "lon": -19.6039,
    "altitude": 27380,
    "velocity": 500,
    "heading": 282,
    "status": "DELAYED",
    "risk": 16.6
  },
  {
    "id": "FL113",
    "callsign": "LH621",
    "airline": "EK",
    "origin": "DEL",
    "destination": "SIN",
    "lat": 24.2492,
    "lon": 81.3594,
    "altitude": 30194,
    "velocity": 403,
    "heading": 135,
    "status": "CLIMBING",
    "risk": 13.3
  },
  {
    "id": "FL114",
    "callsign": "AI735",
    "airline": "EK",
    "origin": "MEX",
    "destination": "FRA",
    "lat": 35.5187,
    "lon": -42.5054,
    "altitude": 36265,
    "velocity": 386,
    "heading": 74,
    "status": "CLIMBING",
    "risk": 67.1
  },
  {
    "id": "FL115",
    "callsign": "SQ531",
    "airline": "SQ",
    "origin": "SFO",
    "destination": "CDG",
    "lat": 42.5116,
    "lon": -68.7341,
    "altitude": 25150,
    "velocity": 519,
    "heading": 84,
    "status": "CLIMBING",
    "risk": 22.2
  },
  {
    "id": "FL116",
    "callsign": "BA413",
    "airline": "BA",
    "origin": "NRT",
    "destination": "PEK",
    "lat": 39.5549,
    "lon": 119.4965,
    "altitude": 39595,
    "velocity": 390,
    "heading": 280,
    "status": "DESCENDING",
    "risk": 41.5
  },
  {
    "id": "FL117",
    "callsign": "TK512",
    "airline": "6E",
    "origin": "SFO",
    "destination": "BOM",
    "lat": 24.6775,
    "lon": 13.9927,
    "altitude": 34389,
    "velocity": 510,
    "heading": 95,
    "status": "CLIMBING",
    "risk": 25.1
  },
  {
    "id": "FL118",
    "callsign": "CX922",
    "airline": "BA",
    "origin": "FRA",
    "destination": "JNB",
    "lat": -11.5184,
    "lon": 24.4681,
    "altitude": 31600,
    "velocity": 436,
    "heading": 165,
    "status": "CRUISING",
    "risk": 42.8
  },
  {
    "id": "FL119",
    "callsign": "JL840",
    "airline": "AF",
    "origin": "MEX",
    "destination": "IST",
    "lat": 29.7205,
    "lon": -38.026,
    "altitude": 27252,
    "velocity": 506,
    "heading": 80,
    "status": "CLIMBING",
    "risk": 24.7
  }
] + [
      {
        "id": f"FL{(i+2):03d}",
        "callsign": f"SIM{random.randint(100,999)}",
        "airline": random.choice(["DL", "UA", "AA", "BA", "EK", "SQ", "JL", "NH", "AF", "LH"]),
        "origin": random.choice(["JFK", "LHR", "NRT", "SIN", "DXB", "CDG", "FRA", "SYD"]),
        "destination": random.choice(["JFK", "LHR", "NRT", "SIN", "DXB", "CDG", "FRA", "SYD"]),
        "lat": round(random.uniform(-60, 70), 4),
        "lon": round(random.uniform(-180, 180), 4),
        "altitude": random.randint(28000, 41000),
        "velocity": random.randint(380, 520),
        "heading": random.randint(0, 360),
        "status": "AIRBORNE",
        "risk": round(random.uniform(5, 82), 1)
      } for i in range(117)
] + [
  {
    "id": "FL119",
    "callsign": "SQ101",
    "airline": "JL",
    "origin": "SYD",
    "destination": "NRT",
    "lat": 36.4425,
    "lon": 158.4443,
    "altitude": 27340,
    "velocity": 396,
    "heading": 150,
    "status": "AIRBORNE",
    "risk": 74.3
  }
]

OPENSKY_CLIENT_ID = "r.v.k.balaji1203@gmail.com-api-client"
OPENSKY_CLIENT_SECRET = ""
TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"

_access_token = None
_token_expiry = 0

def _get_valid_token():
    global _access_token, _token_expiry
    
    # Fast path: check memory cache first
    if _access_token and time.time() < _token_expiry:
        return _access_token
        
    # Check DuckDB cache
    try:
        conn = get_connection()
        row = conn.execute("SELECT access_token, expires_at FROM opensky_tokens WHERE client_id = ?", (OPENSKY_CLIENT_ID,)).fetchone()
        if row:
            db_token, db_expiry = row[0], row[1]
            if time.time() < db_expiry:
                print("🔄 Read OpenSky OAuth2 token from DuckDB cache")
                _access_token = db_token
                _token_expiry = db_expiry
                return _access_token
    except Exception as e:
        print(f"⚠️ Failed to read token from DuckDB: {e}")

    try:
        print("🔄 Requesting new OpenSky OAuth2 token from API...")
        r = requests.post(
            TOKEN_URL, 
            data={'grant_type': 'client_credentials'}, 
            auth=(OPENSKY_CLIENT_ID, OPENSKY_CLIENT_SECRET), 
            timeout=10
        )
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        print(f"⚠️ Failed to get OpenSky token: {e}. Falling back to anonymous request if permitted.")
        return None
    _access_token = data.get('access_token')
    expires_in = data.get('expires_in', 1800)
    _token_expiry = time.time() + expires_in - 60  # refresh 1 minute early
    
    # Save to DuckDB cache
    try:
        conn = get_connection()
        conn.execute("""
            INSERT INTO opensky_tokens (client_id, access_token, expires_at)
            VALUES (?, ?, ?)
            ON CONFLICT (client_id) DO UPDATE SET 
                access_token = excluded.access_token,
                expires_at = excluded.expires_at
        """, (OPENSKY_CLIENT_ID, _access_token, _token_expiry))
        print("✅ Saved new OpenSky token to DuckDB")
    except Exception as e:
        print(f"⚠️ Failed to save token to DuckDB: {e}")
        
    return _access_token

def get_opensky_flights():
    try:
        url = "https://opensky-network.org/api/states/all"
        token = _get_valid_token()
        
        headers = {
            "User-Agent": "AeroStream-Legacy-Console/0.9.4"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        r = requests.get(url, headers=headers, timeout=10)
        r.raise_for_status()                    # raises on 4xx/5xx
        
        data = r.json()
        states = data.get("states", [])
        
        flights = []
        for s in states[:160]:                     # limit for performance
            if s[5] and s[6]:                      # lat, lon exist
                flights.append({
                    "id": str(s[0]),
                    "callsign": (s[1] or "UNK").strip(),
                    "airline": "REAL",
                    "origin": s[2] or "??",
                    "destination": "??",
                    "lat": round(s[6], 4),
                    "lon": round(s[5], 4),
                    "altitude": int(s[7] or 35000),
                    "velocity": int(s[9] or 450),
                    "heading": int(s[10] or 0),
                    "status": "AIRBORNE",
                    "risk": round(random.uniform(5, 75), 1)
                })
        print(f"✅ OpenSky: {len(flights)} flights loaded")
        return flights, "ONLINE"
    except Exception as e:
        print(f"OpenSky API failed ({type(e).__name__}): {e}")
        print("🔄 Using fallback mock data (120 flights)")
        # Animate the mock data slightly so it looks "live" on the frontend
        for f in GLOBAL_FLIGHTS:
            f['lat'] += random.uniform(-0.1, 0.1)
            f['lon'] += random.uniform(-0.1, 0.1)
            f['heading'] = (f['heading'] + random.randint(-5, 5)) % 360
        return GLOBAL_FLIGHTS, "OFFLINE"

@ttl_cache(ttl_seconds=120)
def get_airport_flights(airport_code: str):
    """Fetch arrivals and departures for a given airport (ICAO code) in the last 2 hours."""
    try:
        token = _get_valid_token()
        headers = {
            "User-Agent": "AeroStream-Legacy-Console/0.9.4"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        end_time = int(time.time())
        begin_time = end_time - (2 * 3600)  # last 2 hours
        
        # OpenSky expects ICAO codes (e.g., EDDF, VABB).
        icao_code = airport_code.upper()
        
        # Parallel fetch for arrivals and departures might be too aggressive, do sequential
        arr_url = f"https://opensky-network.org/api/flights/arrival?airport={icao_code}&begin={begin_time}&end={end_time}"
        dep_url = f"https://opensky-network.org/api/flights/departure?airport={icao_code}&begin={begin_time}&end={end_time}"
        
        arr_res = requests.get(arr_url, headers=headers, timeout=10)
        dep_res = requests.get(dep_url, headers=headers, timeout=10)
        
        arr_res.raise_for_status()
        dep_res.raise_for_status()
        
        arrivals = arr_res.json() or []
        departures = dep_res.json() or []
        
        # Format the response to fit our frontend
        formatted_flights = []
        for a in arrivals:
            formatted_flights.append({
                "type": "ARRIVAL",
                "callsign": (a.get("callsign") or "UNK").strip(),
                "icao24": a.get("icao24"),
                "origin": a.get("estDepartureAirport") or "UNK",
                "destination": icao_code,
                "time": a.get("lastSeen")
            })
            
        for d in departures:
            formatted_flights.append({
                "type": "DEPARTURE",
                "callsign": (d.get("callsign") or "UNK").strip(),
                "icao24": d.get("icao24"),
                "origin": icao_code,
                "destination": d.get("estArrivalAirport") or "UNK",
                "time": d.get("firstSeen")
            })
            
        # Sort by time descending
        formatted_flights.sort(key=lambda x: x["time"], reverse=True)
        return formatted_flights
        
    except Exception as e:
        print(f"⚠️ Airport flights fetch failed for {airport_code}: {e}")
        # Return mock data
        return [
            {"type": "ARRIVAL", "callsign": f"SIM{random.randint(100,999)}", "icao24": "mock123", "origin": "UNK", "destination": airport_code, "time": int(time.time()) - random.randint(100, 3600)},
            {"type": "DEPARTURE", "callsign": f"SIM{random.randint(100,999)}", "icao24": "mock456", "origin": airport_code, "destination": "UNK", "time": int(time.time()) - random.randint(100, 3600)},
            {"type": "ARRIVAL", "callsign": f"SIM{random.randint(100,999)}", "icao24": "mock789", "origin": "JFK", "destination": airport_code, "time": int(time.time()) - random.randint(100, 3600)},
            {"type": "DEPARTURE", "callsign": f"SIM{random.randint(100,999)}", "icao24": "mock012", "origin": airport_code, "destination": "LHR", "time": int(time.time()) - random.randint(100, 3600)}
        ]

@ttl_cache(ttl_seconds=300)
def get_aircraft_flights(icao24: str):
    """Fetch past flights for a specific plane (ICAO24 code) in the last 30 days."""
    try:
        token = _get_valid_token()
        headers = {
            "User-Agent": "AeroStream-Legacy-Console/0.9.4"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        # OpenSky allows a maximum of 30 days for this endpoint
        end_time = int(time.time())
        begin_time = end_time - (30 * 24 * 3600)  
        
        url = f"https://opensky-network.org/api/flights/aircraft?icao24={icao24}&begin={begin_time}&end={end_time}"
        
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        
        flights = res.json() or []
        
        formatted_flights = []
        for f in flights:
            formatted_flights.append({
                "callsign": (f.get("callsign") or "UNK").strip(),
                "origin": f.get("estDepartureAirport") or "UNK",
                "destination": f.get("estArrivalAirport") or "UNK",
                "departure_time": f.get("firstSeen"),
                "arrival_time": f.get("lastSeen")
            })
            
        # Sort by departure time descending
        formatted_flights.sort(key=lambda x: x["departure_time"] or 0, reverse=True)
        return formatted_flights
        
    except Exception as e:
        print(f"⚠️ Aircraft history fetch failed for {icao24}: {e}")
        # Return mock history
        now = int(time.time())
        return [
            {"callsign": f"SIM{random.randint(100,999)}", "origin": "UNK", "destination": "JFK", "departure_time": now - 86400 * 2, "arrival_time": now - 86400 * 2 + 18000},
            {"callsign": f"SIM{random.randint(100,999)}", "origin": "LHR", "destination": "UNK", "departure_time": now - 86400 * 4, "arrival_time": now - 86400 * 4 + 21000},
        ]

@ttl_cache(ttl_seconds=60)
def get_flight_track(icao24: str):
    """Fetch the full flight path (lat/lon over time) for a specific active aircraft."""
    try:
        token = _get_valid_token()
        headers = {
            "User-Agent": "AeroStream-Legacy-Console/0.9.4"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        # time=0 gets the track of the currently active flight
        url = f"https://opensky-network.org/api/tracks/all?icao24={icao24}&time=0"
        
        res = requests.get(url, headers=headers, timeout=10)
        res.raise_for_status()
        
        data = res.json()
        
        # The path array contains components like [time, lat, lon, baro_altitude, true_track, on_ground]
        path = data.get("path", [])
        
        formatted_track = []
        for p in path:
            formatted_track.append({
                "time": p[0],
                "lat": p[1],
                "lon": p[2],
                "altitude": p[3],
                "heading": p[4]
            })
            
        return {
            "icao24": data.get("icao24"),
            "callsign": data.get("callsign"),
            "startTime": data.get("startTime"),
            "endTime": data.get("endTime"),
            "path": formatted_track
        }
        
    except Exception as e:
        print(f"⚠️ Flight track fetch failed for {icao24}: {e}")
        # Return mock track centered around a generic point
        base_lat, base_lon = 20.0, 79.0
        mock_path = []
        for i in range(20):
            mock_path.append({
                "time": int(time.time()) - (20 - i) * 60,
                "lat": base_lat + (i * 0.1),
                "lon": base_lon + (i * 0.1),
                "altitude": 35000,
                "heading": 45
            })
        return {
            "icao24": icao24,
            "callsign": "MOCK",
            "path": mock_path
        }

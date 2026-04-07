from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Tankerkönig API configuration
TANKERKOENIG_API_KEY = os.environ.get('TANKERKOENIG_API_KEY', '')
TANKERKOENIG_BASE_URL = "https://creativecommons.tankerkoenig.de/json"

# Create the main app
app = FastAPI(title="FuelRadar API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class StationPrice(BaseModel):
    id: str
    name: str
    brand: str
    street: str
    house_number: str = ""
    post_code: str
    place: str
    lat: float
    lng: float
    diesel: Optional[float] = None
    e5: Optional[float] = None
    e10: Optional[float] = None
    is_open: bool
    dist: float  # distance in km

class StationDetail(BaseModel):
    id: str
    name: str
    brand: str
    street: str
    house_number: str = ""
    post_code: str
    place: str
    lat: float
    lng: float
    diesel: Optional[float] = None
    e5: Optional[float] = None
    e10: Optional[float] = None
    is_open: bool
    whole_day: bool = False
    opening_times: List[dict] = []
    overrides: List[str] = []
    state: Optional[str] = None

class NearbyStationsResponse(BaseModel):
    ok: bool
    stations: List[StationPrice]
    message: Optional[str] = None

class StationDetailResponse(BaseModel):
    ok: bool
    station: Optional[StationDetail] = None
    message: Optional[str] = None

class PriceHistoryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    station_id: str
    fuel_type: str
    price: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    station_id: Optional[str] = None
    station_name: Optional[str] = None
    fuel_type: str
    threshold_price: float
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlertCreate(BaseModel):
    station_id: Optional[str] = None
    station_name: Optional[str] = None
    fuel_type: str
    threshold_price: float

class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    station_id: str
    station_name: str
    station_brand: str
    lat: float
    lng: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FavoriteCreate(BaseModel):
    station_id: str
    station_name: str
    station_brand: str
    lat: float
    lng: float

class PushTokenCreate(BaseModel):
    token: str
    device_id: str

# ============== HELPER FUNCTIONS ==============

def get_mock_stations(lat: float, lng: float, rad: float = 5.0) -> List[dict]:
    """Generate mock station data for development/demo purposes"""
    import random
    
    brands = ["Aral", "Shell", "Total", "Esso", "JET", "STAR", "OMV", "Agip", "Westfalen", "HEM"]
    streets = ["Hauptstraße", "Bahnhofstraße", "Berliner Straße", "Münchener Allee", "Frankfurter Ring", 
               "Kölner Platz", "Hamburger Weg", "Stuttgarter Straße", "Düsseldorfer Allee", "Leipziger Straße"]
    places = ["Berlin", "München", "Hamburg", "Frankfurt", "Köln", "Stuttgart", "Düsseldorf", "Leipzig"]
    
    stations = []
    for i in range(15):
        # Generate random offset within radius
        lat_offset = random.uniform(-rad/111, rad/111)
        lng_offset = random.uniform(-rad/111, rad/111)
        
        # Calculate distance (simplified)
        dist = ((lat_offset * 111) ** 2 + (lng_offset * 111 * 0.7) ** 2) ** 0.5
        
        base_diesel = random.uniform(1.45, 1.75)
        base_e5 = random.uniform(1.55, 1.85)
        base_e10 = random.uniform(1.50, 1.80)
        
        station = {
            "id": f"mock-station-{i+1:03d}",
            "name": f"{random.choice(brands)} {random.choice(streets)}",
            "brand": random.choice(brands),
            "street": random.choice(streets),
            "houseNumber": str(random.randint(1, 200)),
            "postCode": f"{random.randint(10000, 99999)}",
            "place": random.choice(places),
            "lat": lat + lat_offset,
            "lng": lng + lng_offset,
            "diesel": round(base_diesel, 3) if random.random() > 0.1 else None,
            "e5": round(base_e5, 3) if random.random() > 0.1 else None,
            "e10": round(base_e10, 3) if random.random() > 0.1 else None,
            "isOpen": random.random() > 0.15,
            "dist": round(dist, 1)
        }
        stations.append(station)
    
    # Sort by distance
    stations.sort(key=lambda x: x["dist"])
    return stations

def get_mock_station_detail(station_id: str) -> dict:
    """Generate mock station detail for development/demo purposes"""
    import random
    
    brands = ["Aral", "Shell", "Total", "Esso", "JET"]
    brand = random.choice(brands)
    
    return {
        "id": station_id,
        "name": f"{brand} Tankstelle",
        "brand": brand,
        "street": "Hauptstraße",
        "houseNumber": "42",
        "postCode": "10115",
        "place": "Berlin",
        "lat": 52.520008,
        "lng": 13.404954,
        "diesel": round(random.uniform(1.45, 1.75), 3),
        "e5": round(random.uniform(1.55, 1.85), 3),
        "e10": round(random.uniform(1.50, 1.80), 3),
        "isOpen": True,
        "wholeDay": random.random() > 0.5,
        "openingTimes": [
            {"text": "Mo-Fr", "start": "06:00", "end": "22:00"},
            {"text": "Sa", "start": "07:00", "end": "22:00"},
            {"text": "So", "start": "08:00", "end": "20:00"}
        ],
        "overrides": [],
        "state": "Berlin"
    }

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "FuelRadar API v1.0.0", "status": "online"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "api_configured": bool(TANKERKOENIG_API_KEY),
        "timestamp": datetime.utcnow().isoformat()
    }

@api_router.get("/stations/nearby", response_model=NearbyStationsResponse)
async def get_nearby_stations(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    rad: float = Query(5.0, description="Radius in km (max 25)"),
    fuel_type: str = Query("all", description="Filter by fuel type: diesel, e5, e10, or all"),
    sort: str = Query("dist", description="Sort by: dist, price")
):
    """
    Get nearby gas stations with current fuel prices.
    Uses Tankerkönig API if configured, otherwise returns mock data.
    """
    try:
        # Validate radius
        rad = min(rad, 25.0)
        
        # Check if API key is configured
        if not TANKERKOENIG_API_KEY:
            logger.info("No API key configured, returning mock data")
            mock_stations = get_mock_stations(lat, lng, rad)
            stations = []
            for s in mock_stations:
                stations.append(StationPrice(
                    id=s["id"],
                    name=s["name"],
                    brand=s["brand"],
                    street=s["street"],
                    house_number=s.get("houseNumber", ""),
                    post_code=s["postCode"],
                    place=s["place"],
                    lat=s["lat"],
                    lng=s["lng"],
                    diesel=s.get("diesel"),
                    e5=s.get("e5"),
                    e10=s.get("e10"),
                    is_open=s["isOpen"],
                    dist=s["dist"]
                ))
            
            # Sort by price if requested
            if sort == "price" and fuel_type != "all":
                stations.sort(key=lambda x: getattr(x, fuel_type) or 999)
            
            return NearbyStationsResponse(ok=True, stations=stations, message="Using demo data")
        
        # Call Tankerkönig API
        async with httpx.AsyncClient() as client:
            params = {
                "lat": lat,
                "lng": lng,
                "rad": rad,
                "type": fuel_type if fuel_type != "all" else "all",
                "sort": sort,
                "apikey": TANKERKOENIG_API_KEY
            }
            
            response = await client.get(
                f"{TANKERKOENIG_BASE_URL}/list.php",
                params=params,
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Tankerkönig API error: {response.status_code}")
                raise HTTPException(status_code=502, detail="External API error")
            
            data = response.json()
            
            if not data.get("ok"):
                logger.error(f"Tankerkönig API returned error: {data.get('message')}")
                raise HTTPException(status_code=502, detail=data.get("message", "API error"))
            
            stations = []
            for s in data.get("stations", []):
                stations.append(StationPrice(
                    id=s["id"],
                    name=s["name"],
                    brand=s["brand"],
                    street=s["street"],
                    house_number=s.get("houseNumber", ""),
                    post_code=str(s.get("postCode", "")),
                    place=s["place"],
                    lat=s["lat"],
                    lng=s["lng"],
                    diesel=s.get("diesel"),
                    e5=s.get("e5"),
                    e10=s.get("e10"),
                    is_open=s["isOpen"],
                    dist=s["dist"]
                ))
            
            return NearbyStationsResponse(ok=True, stations=stations)
            
    except httpx.TimeoutException:
        logger.error("Tankerkönig API timeout")
        raise HTTPException(status_code=504, detail="External API timeout")
    except Exception as e:
        logger.error(f"Error fetching stations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stations/{station_id}", response_model=StationDetailResponse)
async def get_station_detail(station_id: str):
    """
    Get detailed information about a specific gas station.
    """
    try:
        # Check if API key is configured
        if not TANKERKOENIG_API_KEY:
            logger.info("No API key configured, returning mock data")
            mock_detail = get_mock_station_detail(station_id)
            station = StationDetail(
                id=mock_detail["id"],
                name=mock_detail["name"],
                brand=mock_detail["brand"],
                street=mock_detail["street"],
                house_number=mock_detail.get("houseNumber", ""),
                post_code=mock_detail["postCode"],
                place=mock_detail["place"],
                lat=mock_detail["lat"],
                lng=mock_detail["lng"],
                diesel=mock_detail.get("diesel"),
                e5=mock_detail.get("e5"),
                e10=mock_detail.get("e10"),
                is_open=mock_detail["isOpen"],
                whole_day=mock_detail.get("wholeDay", False),
                opening_times=mock_detail.get("openingTimes", []),
                overrides=mock_detail.get("overrides", []),
                state=mock_detail.get("state")
            )
            return StationDetailResponse(ok=True, station=station, message="Using demo data")
        
        # Call Tankerkönig API
        async with httpx.AsyncClient() as client:
            params = {
                "id": station_id,
                "apikey": TANKERKOENIG_API_KEY
            }
            
            response = await client.get(
                f"{TANKERKOENIG_BASE_URL}/detail.php",
                params=params,
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Tankerkönig API error: {response.status_code}")
                raise HTTPException(status_code=502, detail="External API error")
            
            data = response.json()
            
            if not data.get("ok"):
                logger.error(f"Tankerkönig API returned error: {data.get('message')}")
                raise HTTPException(status_code=404, detail="Station not found")
            
            s = data.get("station", {})
            station = StationDetail(
                id=s["id"],
                name=s["name"],
                brand=s["brand"],
                street=s["street"],
                house_number=s.get("houseNumber", ""),
                post_code=str(s.get("postCode", "")),
                place=s["place"],
                lat=s["lat"],
                lng=s["lng"],
                diesel=s.get("diesel"),
                e5=s.get("e5"),
                e10=s.get("e10"),
                is_open=s["isOpen"],
                whole_day=s.get("wholeDay", False),
                opening_times=s.get("openingTimes", []),
                overrides=s.get("overrides", []),
                state=s.get("state")
            )
            
            return StationDetailResponse(ok=True, station=station)
            
    except httpx.TimeoutException:
        logger.error("Tankerkönig API timeout")
        raise HTTPException(status_code=504, detail="External API timeout")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching station detail: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stations/prices/list")
async def get_prices_by_ids(ids: str = Query(..., description="Comma-separated station IDs (max 10)")):
    """
    Get current prices for multiple stations by their IDs.
    """
    try:
        station_ids = [id.strip() for id in ids.split(",")][:10]
        
        if not TANKERKOENIG_API_KEY:
            logger.info("No API key configured, returning mock prices")
            prices = {}
            import random
            for sid in station_ids:
                prices[sid] = {
                    "status": "open" if random.random() > 0.15 else "closed",
                    "e5": round(random.uniform(1.55, 1.85), 3),
                    "e10": round(random.uniform(1.50, 1.80), 3),
                    "diesel": round(random.uniform(1.45, 1.75), 3)
                }
            return {"ok": True, "prices": prices, "message": "Using demo data"}
        
        async with httpx.AsyncClient() as client:
            params = {
                "ids": ",".join(station_ids),
                "apikey": TANKERKOENIG_API_KEY
            }
            
            response = await client.get(
                f"{TANKERKOENIG_BASE_URL}/prices.php",
                params=params,
                timeout=10.0
            )
            
            data = response.json()
            return {"ok": data.get("ok", False), "prices": data.get("prices", {})}
            
    except Exception as e:
        logger.error(f"Error fetching prices: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Push notification token storage
@api_router.post("/push-tokens")
async def register_push_token(token_data: PushTokenCreate):
    """Register a push notification token"""
    try:
        await db.push_tokens.update_one(
            {"device_id": token_data.device_id},
            {"$set": {"token": token_data.token, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        return {"ok": True, "message": "Token registered"}
    except Exception as e:
        logger.error(f"Error registering push token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics endpoint
@api_router.post("/analytics/search")
async def log_search(data: dict):
    """Log a search for analytics"""
    try:
        data["timestamp"] = datetime.utcnow()
        await db.search_logs.insert_one(data)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Error logging search: {str(e)}")
        return {"ok": False}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

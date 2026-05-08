"""
FuelRadar API - Production Backend
Ein Premium-Backend für die FuelRadar Kraftstoffpreis-App

Features:
- Tankerkönig API Proxy (sichere API-Key Verwaltung)
- Geräteregistrierung und Push-Token-Verwaltung
- Favoriten-System
- Preisalarme mit Hintergrund-Worker
- Redis-Caching
- PostgreSQL-Datenbank
"""

from fastapi import FastAPI, APIRouter, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
import logging
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import app components
from app.core.config import settings
from app.core.cache import cache
from app.core.database import init_db, async_engine

# Import routes
from app.routes.stations import router as stations_router
from app.routes.devices import router as devices_router
from app.routes.favorites import router as favorites_router
from app.routes.alerts import router as alerts_router
from app.routes.geocode import router as geocode_router

# Import services for legacy endpoints
from app.services.tankerkoenig import tankerkoenig_service

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# APScheduler setup
scheduler = None

def setup_scheduler():
    """Setup APScheduler for background tasks"""
    global scheduler
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.interval import IntervalTrigger
        from app.workers.alert_worker import run_alert_check
        
        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            run_alert_check,
            IntervalTrigger(minutes=settings.alert_check_minutes),
            id='alert_check',
            name='Check price alerts',
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"Scheduler started - Alert check every {settings.alert_check_minutes} minutes")
    except Exception as e:
        logger.warning(f"Could not start scheduler: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("FuelRadar API starting up...")
    
    # Connect to Redis
    await cache.connect()
    
    # Initialize database
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database initialization skipped: {e}")
    
    # Start scheduler
    setup_scheduler()
    
    logger.info("FuelRadar API ready")
    
    yield
    
    # Shutdown
    logger.info("FuelRadar API shutting down...")
    
    if scheduler:
        scheduler.shutdown()
    
    await cache.disconnect()
    
    logger.info("FuelRadar API shutdown complete")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Premium Kraftstoffpreis-API für Deutschland",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")


# ============== HEALTH ENDPOINTS ==============

@api_router.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "online",
        "message": "Willkommen bei FuelRadar API"
    }


@api_router.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    
    health = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": settings.app_version,
        "components": {
            "api": True,
            "tankerkoenig": bool(settings.tankerkoenig_api_key),
            "cache": cache.is_available,
            "database": async_engine is not None,
            "scheduler": scheduler.running if scheduler else False
        }
    }
    
    # Check overall health
    critical_components = ["api", "tankerkoenig"]
    all_critical_healthy = all(health["components"].get(c) for c in critical_components)
    
    if not all_critical_healthy:
        health["status"] = "degraded"
    
    return health


# ============== LEGACY ENDPOINTS (for backward compatibility) ==============

from pydantic import BaseModel as _BaseModel

class _PushTokenBody(_BaseModel):
    token: str
    device_id: str
    platform: Optional[str] = None
    locale: str = "de"

class _AnalyticsBody(_BaseModel):
    query: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    results_count: Optional[int] = None


@api_router.post("/push-tokens")
async def register_push_token(body: _PushTokenBody):
    """Register or update a device push token (maps to device registration)"""
    from app.core.database import async_session_factory
    from app.models.device import Device
    from sqlmodel import select
    from datetime import datetime

    if not async_session_factory:
        return {"ok": True, "message": "db not available"}

    try:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Device).where(Device.device_uuid == body.device_id)
            )
            device = result.scalar_one_or_none()
            if device:
                device.expo_push_token = body.token
                if body.platform:
                    device.platform = body.platform
                device.locale = body.locale
                device.updated_at = datetime.utcnow()
            else:
                device = Device(
                    device_uuid=body.device_id,
                    expo_push_token=body.token,
                    platform=body.platform,
                    locale=body.locale,
                )
            session.add(device)
            await session.commit()
    except Exception as e:
        logger.warning(f"push-tokens registration error: {e}")

    return {"ok": True}


@api_router.post("/analytics/search")
async def log_search(body: _AnalyticsBody):
    """Log search analytics"""
    logger.debug(f"Search log: query={body.query} lat={body.lat} lng={body.lng} results={body.results_count}")
    return {"ok": True}


@api_router.get("/stations/prices/list")
async def legacy_prices_list(
    ids: str = Query(..., description="Komma-getrennte Station IDs")
):
    """Preise für mehrere Stationen abrufen"""
    station_ids = [sid.strip() for sid in ids.split(",") if sid.strip()]
    if not station_ids:
        return {"ok": True, "prices": {}}
    result = await tankerkoenig_service.get_prices(station_ids[:10])
    return result


@api_router.get("/stations/nearby")
async def legacy_nearby_stations(
    lat: float = Query(...),
    lng: float = Query(...),
    rad: float = Query(5.0),
    fuel_type: str = Query("all"),
    sort: str = Query("dist")
):
    """Legacy endpoint - redirects to new stations router"""
    result = await tankerkoenig_service.get_nearby_stations(
        lat=lat, lng=lng, radius=rad, fuel_type=fuel_type, sort=sort
    )
    return result


@api_router.get("/stations/{station_id}/history")
async def legacy_station_price_history(
    station_id: str,
    fuel_type: str = Query("diesel"),
    days: int = Query(7, ge=1, le=90),
):
    """Preisverlauf einer Tankstelle"""
    from datetime import datetime, timedelta
    from sqlmodel import select
    from app.core.database import async_session_factory
    from app.models.price_history import PriceHistory

    if fuel_type not in ("diesel", "e5", "e10"):
        raise HTTPException(status_code=400, detail="fuel_type muss diesel, e5 oder e10 sein")
    if async_session_factory is None:
        raise HTTPException(status_code=503, detail="Datenbank nicht verfügbar")

    since = datetime.utcnow() - timedelta(days=days)
    async with async_session_factory() as session:
        result = await session.execute(
            select(PriceHistory)
            .where(PriceHistory.station_id == station_id)
            .where(PriceHistory.fuel_type == fuel_type)
            .where(PriceHistory.recorded_at >= since)
            .order_by(PriceHistory.recorded_at.asc())
        )
        entries = result.scalars().all()

    return [{"price": e.price, "recorded_at": e.recorded_at} for e in entries]


@api_router.get("/stations/{station_id}")
async def legacy_station_detail(station_id: str):
    """Legacy endpoint - redirects to new stations router"""
    result = await tankerkoenig_service.get_station_detail(station_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


# ============== INCLUDE ROUTERS ==============

# Include geocode router at /api/geocode
api_router.include_router(geocode_router)

# Include new modular routes under /api/v2
v2_router = APIRouter(prefix="/v2")
v2_router.include_router(stations_router)
v2_router.include_router(devices_router)
v2_router.include_router(favorites_router)
v2_router.include_router(alerts_router)

api_router.include_router(v2_router)

# Include main API router
app.include_router(api_router)


# ============== ERROR HANDLERS ==============

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return {
        "ok": False,
        "message": "Ein interner Fehler ist aufgetreten",
        "detail": str(exc) if settings.debug else None
    }


# ============== STARTUP MESSAGE ==============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.debug
    )

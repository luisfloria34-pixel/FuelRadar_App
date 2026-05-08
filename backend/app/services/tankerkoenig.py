import asyncio
import hashlib
import logging
from typing import Any, Dict, List, Optional

import httpx
from sqlmodel import select

from app.core.cache import cache
from app.core.config import settings

logger = logging.getLogger(__name__)


async def _store_station_prices(stations: List[Dict[str, Any]]) -> None:
    """Persist prices for each station/fuel combo if they changed since last record."""
    try:
        from app.core.database import async_session_factory
        from app.models.price_history import PriceHistory

        if async_session_factory is None:
            return

        async with async_session_factory() as session:
            for station in stations:
                station_id = station["id"]
                for fuel_type in ("diesel", "e5", "e10"):
                    price = station.get(fuel_type)
                    if price is None:
                        continue

                    result = await session.execute(
                        select(PriceHistory)
                        .where(PriceHistory.station_id == station_id)
                        .where(PriceHistory.fuel_type == fuel_type)
                        .order_by(PriceHistory.recorded_at.desc())
                        .limit(1)
                    )
                    last = result.scalars().first()

                    if last is None or abs(last.price - price) > 0.0001:
                        session.add(PriceHistory(
                            station_id=station_id,
                            fuel_type=fuel_type,
                            price=price,
                        ))

            await session.commit()
    except Exception as exc:
        logger.warning(f"Price history storage failed: {exc}")

class TankerkoenigService:
    """Service for Tankerkönig API interactions"""
    
    BASE_URL = settings.tankerkoenig_base_url
    API_KEY = settings.tankerkoenig_api_key
    
    @classmethod
    def _get_cache_key(cls, endpoint: str, params: Dict) -> str:
        """Generate cache key from endpoint and params"""
        param_str = "&".join(f"{k}={v}" for k, v in sorted(params.items()) if k != "apikey")
        key = f"tk:{endpoint}:{param_str}"
        return hashlib.md5(key.encode()).hexdigest()
    
    @classmethod
    async def get_nearby_stations(
        cls,
        lat: float,
        lng: float,
        radius: float = 5.0,
        fuel_type: str = "all",
        sort: str = "dist"
    ) -> Dict[str, Any]:
        """Get nearby stations from Tankerkönig API"""
        
        # Check cache first
        cache_key = cls._get_cache_key("list", {
            "lat": round(lat, 4),
            "lng": round(lng, 4),
            "rad": radius,
            "type": fuel_type,
            "sort": sort
        })
        
        cached = await cache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for nearby stations")
            return cached
        
        # Check if API key is configured
        if not cls.API_KEY:
            logger.warning("Tankerkönig API key not configured")
            return {
                "ok": False,
                "message": "API nicht konfiguriert. Bitte TANKERKOENIG_API_KEY setzen.",
                "stations": []
            }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{cls.BASE_URL}/list.php",
                    params={
                        "lat": lat,
                        "lng": lng,
                        "rad": min(radius, 25.0),  # Max 25km
                        "type": fuel_type if fuel_type != "all" else "all",
                        "sort": sort,
                        "apikey": cls.API_KEY
                    }
                )
                
                if response.status_code != 200:
                    logger.error(f"Tankerkönig API error: {response.status_code}")
                    return {
                        "ok": False,
                        "message": "API-Fehler",
                        "stations": []
                    }
                
                data = response.json()
                
                if not data.get("ok"):
                    logger.error(f"Tankerkönig API returned error: {data.get('message')}")
                    return data
                
                # Normalize station data
                stations = []
                for s in data.get("stations", []):
                    stations.append({
                        "id": s["id"],
                        "name": s["name"],
                        "brand": s["brand"],
                        "street": s["street"],
                        "house_number": s.get("houseNumber", ""),
                        "post_code": str(s.get("postCode", "")),
                        "place": s["place"],
                        "lat": s["lat"],
                        "lng": s["lng"],
                        "diesel": s.get("diesel"),
                        "e5": s.get("e5"),
                        "e10": s.get("e10"),
                        "is_open": s["isOpen"],
                        "dist": s["dist"]
                    })
                
                result = {
                    "ok": True,
                    "stations": stations
                }
                
                # Cache result
                await cache.set(cache_key, result, settings.cache_ttl_seconds)

                # Store prices in DB (fire-and-forget, does not delay response)
                asyncio.create_task(_store_station_prices(stations))

                return result
                
        except httpx.TimeoutException:
            logger.error("Tankerkönig API timeout")
            return {
                "ok": False,
                "message": "API-Timeout",
                "stations": []
            }
        except Exception as e:
            logger.error(f"Tankerkönig API error: {e}")
            return {
                "ok": False,
                "message": str(e),
                "stations": []
            }
    
    @classmethod
    async def get_station_detail(cls, station_id: str) -> Dict[str, Any]:
        """Get detailed station info from Tankerkönig API"""
        
        # Check cache
        cache_key = cls._get_cache_key("detail", {"id": station_id})
        cached = await cache.get(cache_key)
        if cached:
            return cached
        
        if not cls.API_KEY:
            return {
                "ok": False,
                "message": "API nicht konfiguriert"
            }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{cls.BASE_URL}/detail.php",
                    params={
                        "id": station_id,
                        "apikey": cls.API_KEY
                    }
                )
                
                if response.status_code != 200:
                    return {"ok": False, "message": "API-Fehler"}
                
                data = response.json()
                
                if not data.get("ok"):
                    return data
                
                s = data.get("station", {})
                station = {
                    "id": s["id"],
                    "name": s["name"],
                    "brand": s["brand"],
                    "street": s["street"],
                    "house_number": s.get("houseNumber", ""),
                    "post_code": str(s.get("postCode", "")),
                    "place": s["place"],
                    "lat": s["lat"],
                    "lng": s["lng"],
                    "diesel": s.get("diesel"),
                    "e5": s.get("e5"),
                    "e10": s.get("e10"),
                    "is_open": s["isOpen"],
                    "whole_day": s.get("wholeDay", False),
                    "opening_times": s.get("openingTimes", []),
                    "overrides": s.get("overrides", []),
                    "state": s.get("state")
                }
                
                result = {"ok": True, "station": station}
                await cache.set(cache_key, result, settings.cache_ttl_seconds)
                
                return result
                
        except Exception as e:
            logger.error(f"Station detail error: {e}")
            return {"ok": False, "message": str(e)}
    
    @classmethod
    async def get_prices(cls, station_ids: List[str]) -> Dict[str, Any]:
        """Get current prices for multiple stations (max 10)"""
        
        if not station_ids:
            return {"ok": True, "prices": {}}
        
        # Limit to 10 stations
        station_ids = station_ids[:10]
        
        if not cls.API_KEY:
            return {
                "ok": False,
                "message": "API nicht konfiguriert",
                "prices": {}
            }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{cls.BASE_URL}/prices.php",
                    params={
                        "ids": ",".join(station_ids),
                        "apikey": cls.API_KEY
                    }
                )
                
                if response.status_code != 200:
                    return {"ok": False, "message": "API-Fehler", "prices": {}}
                
                data = response.json()
                return {
                    "ok": data.get("ok", False),
                    "prices": data.get("prices", {})
                }
                
        except Exception as e:
            logger.error(f"Prices error: {e}")
            return {"ok": False, "message": str(e), "prices": {}}

tankerkoenig_service = TankerkoenigService()

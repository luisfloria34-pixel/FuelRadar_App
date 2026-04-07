from fastapi import APIRouter, Query
from typing import Optional
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/geocode", tags=["geocode"])


@router.get("")
async def geocode_search(
    q: str = Query(..., description="PLZ oder Ortsname"),
    country: str = Query("de", description="Ländercode")
):
    """PLZ oder Ortsnamen in Koordinaten umwandeln via OpenStreetMap Nominatim"""
    
    if not q or len(q.strip()) < 2:
        return {"ok": False, "message": "Suchbegriff zu kurz", "results": []}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": q.strip(),
                    "format": "json",
                    "countrycodes": country,
                    "limit": 5,
                    "addressdetails": 1,
                },
                headers={
                    "User-Agent": "FuelRadar/1.0 (fuel price comparison app)",
                    "Accept-Language": "de",
                },
            )
            
            if response.status_code != 200:
                logger.error(f"Nominatim error: {response.status_code}")
                return {"ok": False, "message": "Geocoding fehlgeschlagen", "results": []}
            
            data = response.json()
            
            results = []
            for item in data:
                address = item.get("address", {})
                results.append({
                    "lat": float(item["lat"]),
                    "lng": float(item["lon"]),
                    "display_name": item.get("display_name", ""),
                    "postcode": address.get("postcode", ""),
                    "city": address.get("city") or address.get("town") or address.get("village") or address.get("municipality", ""),
                    "state": address.get("state", ""),
                })
            
            return {"ok": True, "results": results}
    
    except httpx.TimeoutException:
        logger.error("Nominatim timeout")
        return {"ok": False, "message": "Geocoding-Timeout", "results": []}
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return {"ok": False, "message": str(e), "results": []}

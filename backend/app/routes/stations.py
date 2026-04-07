from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
from app.services.tankerkoenig import tankerkoenig_service
from pydantic import BaseModel

router = APIRouter(prefix="/stations", tags=["stations"])

class StationPrice(BaseModel):
    id: str
    name: str
    brand: str
    street: str
    house_number: str
    post_code: str
    place: str
    lat: float
    lng: float
    diesel: Optional[float]
    e5: Optional[float]
    e10: Optional[float]
    is_open: bool
    dist: float

class NearbyResponse(BaseModel):
    ok: bool
    stations: List[StationPrice]
    message: Optional[str] = None

class StationDetail(BaseModel):
    id: str
    name: str
    brand: str
    street: str
    house_number: str
    post_code: str
    place: str
    lat: float
    lng: float
    diesel: Optional[float] = None
    e5: Optional[float] = None
    e10: Optional[float] = None
    is_open: bool
    dist: Optional[float] = None
    whole_day: Optional[bool] = None
    opening_times: Optional[List[dict]] = None
    overrides: Optional[List[str]] = None
    state: Optional[str] = None

class DetailResponse(BaseModel):
    ok: bool
    station: Optional[StationDetail] = None
    message: Optional[str] = None

class PricesRequest(BaseModel):
    ids: List[str]

class PricesResponse(BaseModel):
    ok: bool
    prices: dict
    message: Optional[str] = None


@router.get("/nearby", response_model=NearbyResponse)
async def get_nearby_stations(
    lat: float = Query(..., description="Breitengrad"),
    lng: float = Query(..., description="Längengrad"),
    radius: float = Query(5.0, alias="rad", description="Radius in km (max 25)"),
    fuel: str = Query("all", alias="fuel_type", description="Kraftstoffart: diesel, e5, e10, all"),
    sort: str = Query("dist", description="Sortierung: dist (Entfernung), price (Preis)")
):
    """Tankstellen in der Nähe finden"""
    
    # Validate radius
    radius = min(max(radius, 1.0), 25.0)
    
    # Validate fuel type
    if fuel not in ["diesel", "e5", "e10", "all"]:
        fuel = "all"
    
    # Validate sort
    if sort not in ["dist", "price"]:
        sort = "dist"
    
    result = await tankerkoenig_service.get_nearby_stations(
        lat=lat,
        lng=lng,
        radius=radius,
        fuel_type=fuel,
        sort=sort
    )
    
    return result


@router.get("/{station_id}", response_model=DetailResponse)
async def get_station_detail(station_id: str):
    """Tankstellen-Details abrufen"""
    
    result = await tankerkoenig_service.get_station_detail(station_id)
    
    if not result.get("ok"):
        raise HTTPException(
            status_code=404 if "nicht gefunden" in result.get("message", "").lower() else 502,
            detail=result.get("message", "Unbekannter Fehler")
        )
    
    return result


@router.get("/prices/list", response_model=PricesResponse)
async def get_prices(ids: str = Query(..., description="Komma-getrennte Station IDs")):
    """Aktuelle Preise für mehrere Tankstellen abrufen (max 10)"""
    
    station_ids = [sid.strip() for sid in ids.split(",") if sid.strip()]
    
    if not station_ids:
        return {"ok": True, "prices": {}}
    
    if len(station_ids) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximal 10 Tankstellen pro Anfrage"
        )
    
    result = await tankerkoenig_service.get_prices(station_ids)
    return result

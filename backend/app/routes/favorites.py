from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_
from datetime import datetime
from typing import List

from app.core.database import get_async_session
from app.models.favorite import FavoriteStation, FavoriteCreate, FavoriteResponse
from app.services.tankerkoenig import tankerkoenig_service

router = APIRouter(prefix="/favorites", tags=["favorites"])


@router.get("/{device_uuid}", response_model=List[FavoriteResponse])
async def get_favorites(
    device_uuid: str,
    include_prices: bool = True,
    session: AsyncSession = Depends(get_async_session)
):
    """Favoriten eines Geräts abrufen"""
    
    statement = select(FavoriteStation).where(
        FavoriteStation.device_uuid == device_uuid
    ).order_by(FavoriteStation.created_at.desc())
    
    result = await session.execute(statement)
    favorites = result.scalars().all()
    
    if not favorites:
        return []
    
    # Optionally fetch live prices
    if include_prices and favorites:
        station_ids = [f.station_id for f in favorites]
        prices_result = await tankerkoenig_service.get_prices(station_ids[:10])
        prices = prices_result.get("prices", {})
        
        # Enrich favorites with prices
        enriched = []
        for fav in favorites:
            fav_dict = fav.model_dump()
            if fav.station_id in prices:
                price_data = prices[fav.station_id]
                fav_dict["diesel"] = price_data.get("diesel")
                fav_dict["e5"] = price_data.get("e5")
                fav_dict["e10"] = price_data.get("e10")
                fav_dict["is_open"] = price_data.get("status") == "open"
            enriched.append(FavoriteResponse(**fav_dict))
        
        return enriched
    
    return [FavoriteResponse(**f.model_dump()) for f in favorites]


@router.post("/{device_uuid}", response_model=FavoriteResponse)
async def add_favorite(
    device_uuid: str,
    favorite_data: FavoriteCreate,
    session: AsyncSession = Depends(get_async_session)
):
    """Tankstelle zu Favoriten hinzufügen"""
    
    # Check if already exists
    statement = select(FavoriteStation).where(
        and_(
            FavoriteStation.device_uuid == device_uuid,
            FavoriteStation.station_id == favorite_data.station_id
        )
    )
    result = await session.execute(statement)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Tankstelle ist bereits in den Favoriten"
        )
    
    favorite = FavoriteStation(
        device_uuid=device_uuid,
        **favorite_data.model_dump()
    )
    
    session.add(favorite)
    await session.commit()
    await session.refresh(favorite)
    
    return FavoriteResponse(**favorite.model_dump())


@router.delete("/{device_uuid}/{station_id}")
async def remove_favorite(
    device_uuid: str,
    station_id: str,
    session: AsyncSession = Depends(get_async_session)
):
    """Tankstelle aus Favoriten entfernen"""
    
    statement = select(FavoriteStation).where(
        and_(
            FavoriteStation.device_uuid == device_uuid,
            FavoriteStation.station_id == station_id
        )
    )
    result = await session.execute(statement)
    favorite = result.scalar_one_or_none()
    
    if not favorite:
        raise HTTPException(
            status_code=404,
            detail="Favorit nicht gefunden"
        )
    
    await session.delete(favorite)
    await session.commit()
    
    return {"ok": True, "message": "Favorit entfernt"}

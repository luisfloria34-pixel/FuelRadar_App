from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, and_
from datetime import datetime
from typing import List

from app.core.database import get_async_session
from app.models.alert import (
    Alert, AlertState, AlertCreate, AlertUpdate, AlertResponse,
    AlertType, FuelType
)
from app.models.device import Device

router = APIRouter(prefix="/alerts", tags=["alerts"])

# Maximum alerts per device (free tier)
MAX_FREE_ALERTS = 3
MAX_PREMIUM_ALERTS = 20


@router.get("/{device_uuid}", response_model=List[AlertResponse])
async def get_alerts(
    device_uuid: str,
    active_only: bool = Query(False, description="Nur aktive Alarme"),
    session: AsyncSession = Depends(get_async_session)
):
    """Alle Alarme eines Geräts abrufen"""
    
    statement = select(Alert).where(Alert.device_uuid == device_uuid)
    
    if active_only:
        statement = statement.where(Alert.is_active == True)
    
    statement = statement.order_by(Alert.created_at.desc())
    
    result = await session.execute(statement)
    alerts = result.scalars().all()
    
    return [AlertResponse(**a.model_dump()) for a in alerts]


@router.post("/{device_uuid}", response_model=AlertResponse)
async def create_alert(
    device_uuid: str,
    alert_data: AlertCreate,
    session: AsyncSession = Depends(get_async_session)
):
    """Neuen Preisalarm erstellen"""
    
    # Validate alert type
    try:
        alert_type = AlertType(alert_data.alert_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Ungültiger Alarmtyp. Erlaubt: {[t.value for t in AlertType]}"
        )
    
    # Validate fuel type
    try:
        fuel_type = FuelType(alert_data.fuel_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Ungültiger Kraftstofftyp. Erlaubt: {[t.value for t in FuelType]}"
        )
    
    # Check device exists and get premium status
    device_statement = select(Device).where(Device.device_uuid == device_uuid)
    device_result = await session.execute(device_statement)
    device = device_result.scalar_one_or_none()
    
    is_premium = device.is_premium if device else False
    max_alerts = MAX_PREMIUM_ALERTS if is_premium else MAX_FREE_ALERTS
    
    # Count existing alerts
    count_statement = select(Alert).where(Alert.device_uuid == device_uuid)
    count_result = await session.execute(count_statement)
    current_count = len(count_result.scalars().all())
    
    if current_count >= max_alerts:
        raise HTTPException(
            status_code=403,
            detail=f"Maximale Anzahl an Alarmen erreicht ({max_alerts}). "
                   f"{'Upgraden Sie auf Premium für mehr Alarme.' if not is_premium else ''}"
        )
    
    # Validate specific fields based on alert type
    if alert_type == AlertType.FUEL_THRESHOLD:
        if not alert_data.threshold_price:
            raise HTTPException(
                status_code=400,
                detail="Schwellenwert (threshold_price) erforderlich für diesen Alarmtyp"
            )
    
    if alert_type == AlertType.STATION_CHANGE:
        if not alert_data.station_id:
            raise HTTPException(
                status_code=400,
                detail="Tankstellen-ID (station_id) erforderlich für diesen Alarmtyp"
            )
    
    if alert_type == AlertType.NEARBY_CHEAPER:
        if not alert_data.lat or not alert_data.lng:
            raise HTTPException(
                status_code=400,
                detail="Standort (lat, lng) erforderlich für diesen Alarmtyp"
            )
    
    # Determine if this is a premium feature
    is_premium_feature = alert_type == AlertType.NEARBY_CHEAPER
    
    # Create alert
    alert = Alert(
        device_uuid=device_uuid,
        alert_type=alert_data.alert_type,
        fuel_type=alert_data.fuel_type,
        threshold_price=alert_data.threshold_price,
        station_id=alert_data.station_id,
        station_name=alert_data.station_name,
        lat=alert_data.lat,
        lng=alert_data.lng,
        radius_km=alert_data.radius_km,
        is_premium_feature=is_premium_feature
    )
    
    session.add(alert)
    await session.commit()
    await session.refresh(alert)
    
    # Create initial state
    alert_state = AlertState(alert_id=alert.id)
    session.add(alert_state)
    await session.commit()
    
    return AlertResponse(**alert.model_dump())


@router.patch("/{device_uuid}/{alert_id}", response_model=AlertResponse)
async def update_alert(
    device_uuid: str,
    alert_id: int,
    alert_data: AlertUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    """Alarm aktualisieren"""
    
    statement = select(Alert).where(
        and_(
            Alert.id == alert_id,
            Alert.device_uuid == device_uuid
        )
    )
    result = await session.execute(statement)
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm nicht gefunden")
    
    if alert_data.threshold_price is not None:
        alert.threshold_price = alert_data.threshold_price
    if alert_data.radius_km is not None:
        alert.radius_km = alert_data.radius_km
    if alert_data.is_active is not None:
        alert.is_active = alert_data.is_active
    
    alert.updated_at = datetime.utcnow()
    
    session.add(alert)
    await session.commit()
    await session.refresh(alert)
    
    return AlertResponse(**alert.model_dump())


@router.delete("/{device_uuid}/{alert_id}")
async def delete_alert(
    device_uuid: str,
    alert_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Alarm löschen"""
    
    statement = select(Alert).where(
        and_(
            Alert.id == alert_id,
            Alert.device_uuid == device_uuid
        )
    )
    result = await session.execute(statement)
    alert = result.scalar_one_or_none()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alarm nicht gefunden")
    
    # Delete associated state
    state_statement = select(AlertState).where(AlertState.alert_id == alert_id)
    state_result = await session.execute(state_statement)
    state = state_result.scalar_one_or_none()
    if state:
        await session.delete(state)
    
    await session.delete(alert)
    await session.commit()
    
    return {"ok": True, "message": "Alarm gelöscht"}

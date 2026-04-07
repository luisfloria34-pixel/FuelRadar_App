from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime
from typing import List, Optional

from app.core.database import get_async_session
from app.models.device import Device, DeviceCreate, DeviceUpdate, DeviceResponse

router = APIRouter(prefix="/devices", tags=["devices"])


@router.post("", response_model=DeviceResponse)
async def register_device(
    device_data: DeviceCreate,
    session: AsyncSession = Depends(get_async_session)
):
    """Gerät registrieren oder aktualisieren"""
    
    # Check if device exists
    statement = select(Device).where(Device.device_uuid == device_data.device_uuid)
    result = await session.execute(statement)
    existing_device = result.scalar_one_or_none()
    
    if existing_device:
        # Update existing device
        existing_device.expo_push_token = device_data.expo_push_token or existing_device.expo_push_token
        existing_device.platform = device_data.platform or existing_device.platform
        existing_device.locale = device_data.locale or existing_device.locale
        existing_device.updated_at = datetime.utcnow()
        
        session.add(existing_device)
        await session.commit()
        await session.refresh(existing_device)
        return existing_device
    
    # Create new device
    device = Device(
        device_uuid=device_data.device_uuid,
        expo_push_token=device_data.expo_push_token,
        platform=device_data.platform,
        locale=device_data.locale
    )
    
    session.add(device)
    await session.commit()
    await session.refresh(device)
    
    return device


@router.get("/{device_uuid}", response_model=DeviceResponse)
async def get_device(
    device_uuid: str,
    session: AsyncSession = Depends(get_async_session)
):
    """Gerätedaten abrufen"""
    
    statement = select(Device).where(Device.device_uuid == device_uuid)
    result = await session.execute(statement)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail="Gerät nicht gefunden")
    
    return device


@router.patch("/{device_uuid}", response_model=DeviceResponse)
async def update_device(
    device_uuid: str,
    device_data: DeviceUpdate,
    session: AsyncSession = Depends(get_async_session)
):
    """Gerätedaten aktualisieren"""
    
    statement = select(Device).where(Device.device_uuid == device_uuid)
    result = await session.execute(statement)
    device = result.scalar_one_or_none()
    
    if not device:
        raise HTTPException(status_code=404, detail="Gerät nicht gefunden")
    
    if device_data.expo_push_token is not None:
        device.expo_push_token = device_data.expo_push_token
    if device_data.platform is not None:
        device.platform = device_data.platform
    if device_data.locale is not None:
        device.locale = device_data.locale
    
    device.updated_at = datetime.utcnow()
    
    session.add(device)
    await session.commit()
    await session.refresh(device)
    
    return device

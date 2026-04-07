from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Device(SQLModel, table=True):
    __tablename__ = "devices"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    device_uuid: str = Field(unique=True, index=True)
    expo_push_token: Optional[str] = Field(default=None)
    platform: Optional[str] = Field(default=None)  # ios, android
    locale: str = Field(default="de")  # de, en
    is_premium: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DeviceCreate(SQLModel):
    device_uuid: str
    expo_push_token: Optional[str] = None
    platform: Optional[str] = None
    locale: str = "de"

class DeviceUpdate(SQLModel):
    expo_push_token: Optional[str] = None
    platform: Optional[str] = None
    locale: Optional[str] = None

class DeviceResponse(SQLModel):
    id: int
    device_uuid: str
    expo_push_token: Optional[str]
    platform: Optional[str]
    locale: str
    is_premium: bool
    created_at: datetime

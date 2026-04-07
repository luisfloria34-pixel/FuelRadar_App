from sqlmodel import SQLModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum

class AlertType(str, Enum):
    FUEL_THRESHOLD = "fuel_threshold"  # Price drops below threshold
    STATION_CHANGE = "station_change"  # Price changes at specific station
    NEARBY_CHEAPER = "nearby_cheaper"  # Cheaper station nearby

class FuelType(str, Enum):
    DIESEL = "diesel"
    E5 = "e5"
    E10 = "e10"

class Alert(SQLModel, table=True):
    __tablename__ = "alerts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    device_uuid: str = Field(index=True)
    alert_type: str  # AlertType enum value
    fuel_type: str  # FuelType enum value
    
    # For fuel_threshold alerts
    threshold_price: Optional[float] = None
    
    # For station_change alerts
    station_id: Optional[str] = Field(default=None, index=True)
    station_name: Optional[str] = None
    
    # For nearby_cheaper alerts
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_km: float = Field(default=5.0)
    
    # State
    is_active: bool = Field(default=True)
    last_triggered_at: Optional[datetime] = None
    trigger_count: int = Field(default=0)
    
    # Premium feature flag
    is_premium_feature: bool = Field(default=False)
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AlertState(SQLModel, table=True):
    """Track last known state to detect changes"""
    __tablename__ = "alert_states"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    alert_id: int = Field(foreign_key="alerts.id", index=True)
    last_price: Optional[float] = None
    last_station_id: Optional[str] = None
    last_check_at: datetime = Field(default_factory=datetime.utcnow)

class AlertCreate(SQLModel):
    alert_type: str
    fuel_type: str
    threshold_price: Optional[float] = None
    station_id: Optional[str] = None
    station_name: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_km: float = 5.0

class AlertUpdate(SQLModel):
    threshold_price: Optional[float] = None
    radius_km: Optional[float] = None
    is_active: Optional[bool] = None

class AlertResponse(SQLModel):
    id: int
    device_uuid: str
    alert_type: str
    fuel_type: str
    threshold_price: Optional[float]
    station_id: Optional[str]
    station_name: Optional[str]
    lat: Optional[float]
    lng: Optional[float]
    radius_km: float
    is_active: bool
    last_triggered_at: Optional[datetime]
    trigger_count: int
    is_premium_feature: bool
    created_at: datetime

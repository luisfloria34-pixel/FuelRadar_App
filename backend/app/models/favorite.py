from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class FavoriteStation(SQLModel, table=True):
    __tablename__ = "favorite_stations"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    device_uuid: str = Field(index=True)
    station_id: str = Field(index=True)
    station_name: str
    station_brand: str
    street: Optional[str] = None
    place: Optional[str] = None
    lat: float
    lng: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        # Composite unique constraint
        schema_extra = {
            "unique_together": [("device_uuid", "station_id")]
        }

class FavoriteCreate(SQLModel):
    station_id: str
    station_name: str
    station_brand: str
    street: Optional[str] = None
    place: Optional[str] = None
    lat: float
    lng: float

class FavoriteResponse(SQLModel):
    id: int
    device_uuid: str
    station_id: str
    station_name: str
    station_brand: str
    street: Optional[str]
    place: Optional[str]
    lat: float
    lng: float
    created_at: datetime
    # Live price data (populated at runtime)
    diesel: Optional[float] = None
    e5: Optional[float] = None
    e10: Optional[float] = None
    is_open: Optional[bool] = None

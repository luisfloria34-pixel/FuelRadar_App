from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class PriceHistory(SQLModel, table=True):
    __tablename__ = "price_history"

    id: Optional[int] = Field(default=None, primary_key=True)
    station_id: str = Field(index=True)
    fuel_type: str = Field(index=True)  # diesel | e5 | e10
    price: float
    recorded_at: datetime = Field(default_factory=datetime.utcnow)


class PriceHistoryEntry(SQLModel):
    price: float
    recorded_at: datetime

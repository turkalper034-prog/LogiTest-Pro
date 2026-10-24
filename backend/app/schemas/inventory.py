from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StockMovementCreate(BaseModel):
    product_id: int = Field(gt=0)
    warehouse_id: int = Field(gt=0)
    movement_type: Literal["inbound", "outbound"]
    quantity: int = Field(gt=0)
    note: str | None = Field(default=None, max_length=500)

    @field_validator("note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class StockMovementRead(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    warehouse_id: int
    warehouse_name: str
    movement_type: Literal["inbound", "outbound"]
    quantity: int
    previous_quantity: int
    new_quantity: int
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WarehouseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    location: str | None = Field(default=None, max_length=200)

    @field_validator("name")
    @classmethod
    def require_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Depo adı boş bırakılamaz.")
        return value

    @field_validator("location")
    @classmethod
    def normalize_location(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class WarehouseRead(BaseModel):
    id: int
    name: str
    location: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class WarehouseSummary(WarehouseRead):
    movement_count: int = 0


class AnalyticsRead(BaseModel):
    products_count: int
    units_in_stock: int
    inventory_value: float
    low_stock_count: int
    categories_count: int
    stock_movements_count: int

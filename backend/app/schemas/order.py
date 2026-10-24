from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator, model_validator

OrderStatus = Literal["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]


class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    warehouse_id: int = Field(gt=0)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=100)

    @model_validator(mode="after")
    def ensure_unique_products(self):
        product_ids = [item.product_id for item in self.items]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Bir siparişte aynı ürün birden fazla satırda bulunamaz.")
        return self


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderItemRead(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("unit_price", "line_total", when_used="json")
    def serialize_amount(self, value: Decimal) -> float:
        return float(value)


class OrderRead(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    warehouse_id: int
    warehouse_name: str
    created_at: datetime
    items: list[OrderItemRead]
    total: Decimal

    @field_serializer("total", when_used="json")
    def serialize_total(self, value: Decimal) -> float:
        return float(value)


class OrderListItem(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    warehouse_id: int
    warehouse_name: str
    created_at: datetime
    item_count: int
    total: Decimal

    @field_serializer("total", when_used="json")
    def serialize_total(self, value: Decimal) -> float:
        return float(value)

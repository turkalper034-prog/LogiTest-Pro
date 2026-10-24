from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, ValidationInfo, field_serializer, field_validator


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    sku: str = Field(..., min_length=1, max_length=50)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    quantity: int = Field(default=0, ge=0)
    price: Decimal = Field(default=Decimal("0.00"), ge=0, max_digits=10, decimal_places=2)

    @field_validator("name", "sku")
    @classmethod
    def validate_required_text(cls, value: str, info: ValidationInfo) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Bu alan boş bırakılamaz.")
        return value.upper() if info.field_name == "sku" else value

    @field_serializer("price", when_used="json")
    def serialize_price(self, value: Decimal) -> float:
        return float(value)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    sku: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    quantity: int | None = Field(None, ge=0)
    price: Decimal | None = Field(None, ge=0)

    @field_validator("quantity", "price", mode="before")
    @classmethod
    def validate_non_nullable_values(cls, value: object) -> object:
        if value is None:
            raise ValueError("Bu alan null olamaz.")
        return value

    @field_validator("price")
    @classmethod
    def validate_price_precision(cls, value: Decimal | None) -> Decimal | None:
        if value is not None and (
            value > Decimal("99999999.99") or value.as_tuple().exponent < -2
        ):
            raise ValueError("Fiyat en fazla iki ondalık basamak içerebilir.")
        return value

    @field_validator("name", "sku", mode="before")
    @classmethod
    def validate_required_text(cls, value: str | None, info: ValidationInfo) -> str:
        if value is None:
            raise ValueError("Bu alan boş bırakılamaz.")
        value = value.strip()
        if not value:
            raise ValueError("Bu alan boş bırakılamaz.")
        return value.upper() if info.field_name == "sku" else value


class ProductRead(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

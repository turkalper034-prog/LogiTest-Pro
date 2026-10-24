from sqlalchemy import CheckConstraint, Column, DateTime, Integer, Numeric, String, Text
from sqlalchemy.sql import func
from app.db.database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("length(trim(name)) > 0", name="ck_products_name_not_blank"),
        CheckConstraint("length(trim(sku)) > 0", name="ck_products_sku_not_blank"),
        CheckConstraint("quantity >= 0", name="ck_products_quantity_nonnegative"),
        CheckConstraint("price >= 0", name="ck_products_price_nonnegative"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    sku = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    quantity = Column(Integer, nullable=False, default=0)
    price = Column(Numeric(10, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.schemas.inventory import StockMovementCreate
from app.schemas.order import OrderCreate, OrderStatus, OrderStatusUpdate
from app.services.inventory import create_movement_in_transaction

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"processing", "cancelled"},
    "processing": {"shipped"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


def _order_or_404(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.warehouse))
        .filter(Order.id == order_id)
        .first()
    )
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sipariş bulunamadı.")
    return order


def list_orders(db: Session, search: str | None = None, order_status: str | None = None) -> list[Order]:
    query = db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.warehouse))
    if search:
        query = query.filter(Order.order_number.ilike(f"%{search.strip()}%"))
    if order_status:
        query = query.filter(Order.status == order_status)
    return query.order_by(Order.created_at.desc(), Order.id.desc()).all()


def get_order(db: Session, order_id: int) -> Order:
    return _order_or_404(db, order_id)


def serialize_order(order: Order) -> dict:
    items = [
        {
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "product_sku": item.product.sku,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "line_total": item.unit_price * item.quantity,
        }
        for item in order.items
    ]
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "warehouse_id": order.warehouse_id,
        "warehouse_name": order.warehouse.name,
        "created_at": order.created_at,
        "items": items,
        "total": sum((item["line_total"] for item in items), Decimal("0.00")),
    }


def serialize_order_list_item(order: Order) -> dict:
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status,
        "warehouse_id": order.warehouse_id,
        "warehouse_name": order.warehouse.name,
        "created_at": order.created_at,
        "item_count": len(order.items),
        "total": sum((item.unit_price * item.quantity for item in order.items), Decimal("0.00")),
    }


def create_order(db: Session, data: OrderCreate) -> Order:
    try:
        with db.begin():
            warehouse = db.get(Warehouse, data.warehouse_id)
            if warehouse is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Depo bulunamadı.")

            products: dict[int, Product] = {}
            for item in data.items:
                product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
                if product is None:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Ürün bulunamadı (id: {item.product_id}).",
                    )
                products[item.product_id] = product

            order = Order(
                order_number=f"ORD-{datetime.now(timezone.utc):%Y%m%d}-{uuid4().hex[:8].upper()}",
                status="pending",
                warehouse_id=data.warehouse_id,
            )
            db.add(order)
            db.flush()
            for item in data.items:
                product = products[item.product_id]
                db.add(
                    OrderItem(
                        order_id=order.id,
                        product_id=product.id,
                        quantity=item.quantity,
                        unit_price=product.price,
                    )
                )
        return _order_or_404(db, order.id)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sipariş kaydı oluşturulamadı.") from error


def update_order_status(db: Session, order_id: int, data: OrderStatusUpdate) -> Order:
    try:
        with db.begin():
            order = (
                db.query(Order)
                .options(joinedload(Order.items).joinedload(OrderItem.product), joinedload(Order.warehouse))
                .filter(Order.id == order_id)
                .first()
            )
            if order is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sipariş bulunamadı.")

            if data.status == order.status:
                return order

            if data.status not in ALLOWED_TRANSITIONS.get(order.status, set()):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"'{order.status}' durumundan '{data.status}' durumuna geçiş yapılamaz.",
                )

            result = db.execute(
                update(Order)
                .where(Order.id == order_id, Order.status == order.status)
                .values(status=data.status)
            )
            if result.rowcount != 1:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sipariş durumu eşzamanlı olarak değişti.")

            if data.status == "shipped":
                for item in order.items:
                    create_movement_in_transaction(
                        db,
                        StockMovementCreate(
                            product_id=item.product_id,
                            warehouse_id=order.warehouse_id,
                            movement_type="outbound",
                            quantity=item.quantity,
                            note=f"Shipment for {order.order_number}",
                        ),
                    )
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sipariş güncellemesi kaydedilemedi.") from error

    return _order_or_404(db, order_id)

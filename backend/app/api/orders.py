from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.order import OrderCreate, OrderListItem, OrderRead, OrderStatusUpdate
from app.services import orders as order_service

router = APIRouter()


@router.get("", response_model=list[OrderListItem])
def list_orders(
    search: str | None = Query(default=None, max_length=40),
    order_status: Literal["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
):
    return [order_service.serialize_order_list_item(order) for order in order_service.list_orders(db, search, order_status)]


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    created = order_service.create_order(db, order)
    return order_service.serialize_order(created)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return order_service.serialize_order(order_service.get_order(db, order_id))


@router.patch("/{order_id}/status", response_model=OrderRead)
def update_order_status(order_id: int, data: OrderStatusUpdate, db: Session = Depends(get_db)):
    updated = order_service.update_order_status(db, order_id, data)
    return order_service.serialize_order(updated)

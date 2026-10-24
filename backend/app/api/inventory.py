from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.product import Product
from app.models.warehouse import Warehouse
from app.schemas.inventory import (
    AnalyticsRead,
    StockMovementCreate,
    StockMovementRead,
    WarehouseCreate,
    WarehouseRead,
    WarehouseSummary,
)
from app.services import inventory as inventory_service

router = APIRouter()


@router.get("/analytics", response_model=AnalyticsRead)
def get_analytics(
    low_stock_threshold: int = Query(default=10, ge=0),
    db: Session = Depends(get_db),
):
    return inventory_service.get_analytics(db, low_stock_threshold)


@router.get("/warehouses", response_model=list[WarehouseSummary])
def list_warehouses(db: Session = Depends(get_db)):
    counts = inventory_service.warehouse_movement_counts(db)
    return [
        WarehouseSummary.model_validate(warehouse).model_copy(
            update={"movement_count": counts.get(warehouse.id, 0)}
        )
        for warehouse in inventory_service.list_warehouses(db)
    ]


@router.post("/warehouses", response_model=WarehouseRead, status_code=status.HTTP_201_CREATED)
def create_warehouse(warehouse: WarehouseCreate, db: Session = Depends(get_db)):
    return inventory_service.create_warehouse(db, warehouse)


@router.get("/movements", response_model=list[StockMovementRead])
def list_movements(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    rows = inventory_service.list_movements(db, limit)
    return [
        {
            "id": movement.id,
            "product_id": movement.product_id,
            "product_name": product_name,
            "product_sku": product_sku,
            "warehouse_id": movement.warehouse_id,
            "warehouse_name": warehouse_name,
            "movement_type": movement.movement_type,
            "quantity": movement.quantity,
            "previous_quantity": movement.previous_quantity,
            "new_quantity": movement.new_quantity,
            "note": movement.note,
            "created_at": movement.created_at,
        }
        for movement, product_name, product_sku, warehouse_name in rows
    ]


@router.post("/movements", response_model=StockMovementRead, status_code=status.HTTP_201_CREATED)
def create_movement(movement: StockMovementCreate, db: Session = Depends(get_db)):
    record = inventory_service.create_movement(db, movement)
    return {
        "id": record.id,
        "product_id": record.product_id,
        "product_name": db.get(Product, record.product_id).name,
        "product_sku": db.get(Product, record.product_id).sku,
        "warehouse_id": record.warehouse_id,
        "warehouse_name": db.get(Warehouse, record.warehouse_id).name,
        "movement_type": record.movement_type,
        "quantity": record.quantity,
        "previous_quantity": record.previous_quantity,
        "new_quantity": record.new_quantity,
        "note": record.note,
        "created_at": record.created_at,
    }

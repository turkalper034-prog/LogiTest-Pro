from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.warehouse import Warehouse
from app.schemas.inventory import StockMovementCreate, WarehouseCreate


def list_warehouses(db: Session) -> list[Warehouse]:
    return db.query(Warehouse).order_by(Warehouse.name).all()


def create_warehouse(db: Session, data: WarehouseCreate) -> Warehouse:
    exists = db.query(Warehouse).filter(func.lower(Warehouse.name) == data.name.lower()).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu depo adı zaten kayıtlı.")
    warehouse = Warehouse(**data.model_dump())
    db.add(warehouse)
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu depo adı zaten kayıtlı.") from error
    db.refresh(warehouse)
    return warehouse


def list_movements(db: Session, limit: int = 100) -> list[tuple]:
    return (
        db.query(StockMovement, Product.name, Product.sku, Warehouse.name)
        .join(Product, StockMovement.product_id == Product.id)
        .join(Warehouse, StockMovement.warehouse_id == Warehouse.id)
        .order_by(StockMovement.created_at.desc(), StockMovement.id.desc())
        .limit(limit)
        .all()
    )


def create_movement_in_transaction(db: Session, data: StockMovementCreate) -> StockMovement:
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ürün bulunamadı.")
    if db.query(Warehouse.id).filter(Warehouse.id == data.warehouse_id).first() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Depo bulunamadı.")

    if data.movement_type == "outbound":
        result = db.execute(
            update(Product)
            .where(Product.id == data.product_id, Product.quantity >= data.quantity)
            .values(quantity=Product.quantity - data.quantity)
            .returning(Product.quantity)
        )
        new_quantity = result.scalar_one_or_none()
        if new_quantity is None:
            if db.query(Product.id).filter(Product.id == data.product_id).first() is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ürün bulunamadı.")
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Stok yetersiz; negatif stok oluşturulamaz.")
        previous_quantity = new_quantity + data.quantity
    else:
        result = db.execute(
            update(Product)
            .where(Product.id == data.product_id)
            .values(quantity=Product.quantity + data.quantity)
            .returning(Product.quantity)
        )
        new_quantity = result.scalar_one()
        previous_quantity = new_quantity - data.quantity

    movement = StockMovement(
        product_id=data.product_id,
        warehouse_id=data.warehouse_id,
        movement_type=data.movement_type,
        quantity=data.quantity,
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        note=data.note,
    )
    db.add(movement)
    db.flush()
    return movement


def create_movement(db: Session, data: StockMovementCreate) -> StockMovement:
    try:
        movement = create_movement_in_transaction(db, data)
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ürün veya depo artık mevcut değil.") from error
    db.refresh(movement)
    return movement


def get_analytics(db: Session, low_stock_threshold: int) -> dict[str, int | float]:
    product_totals = db.query(
        func.count(Product.id),
        func.coalesce(func.sum(Product.quantity), 0),
        func.coalesce(func.sum(Product.price * Product.quantity), 0),
        func.count(func.distinct(Product.category)),
    ).one()
    low_stock_count = db.query(func.count(Product.id)).filter(
        Product.quantity <= low_stock_threshold
    ).scalar()
    movement_count = db.query(func.count(StockMovement.id)).scalar()
    return {
        "products_count": product_totals[0],
        "units_in_stock": product_totals[1],
        "inventory_value": float(product_totals[2]),
        "categories_count": product_totals[3],
        "low_stock_count": low_stock_count or 0,
        "stock_movements_count": movement_count or 0,
    }


def warehouse_movement_counts(db: Session) -> dict[int, int]:
    rows = db.execute(
        select(StockMovement.warehouse_id, func.count(StockMovement.id))
        .group_by(StockMovement.warehouse_id)
    ).all()
    return {warehouse_id: count for warehouse_id, count in rows}

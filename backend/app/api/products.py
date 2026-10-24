from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.order import OrderItem
from app.models.stock_movement import StockMovement
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services import product as product_service

router = APIRouter()


@router.get("", response_model=list[ProductRead])
def list_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    search: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
):
    return product_service.get_products(db, skip=skip, limit=limit, search=search)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    if product_service.get_product_by_sku(db, product.sku):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu SKU zaten kullanılıyor.")
    try:
        return product_service.create_product(db, product)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu SKU zaten kullanılıyor.") from error


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = product_service.get_product_by_id(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ürün bulunamadı.")
    return product


@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    existing = product_service.get_product_by_id(db, product_id)
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ürün bulunamadı.")
    update_data = product.model_dump(exclude_unset=True)
    if "quantity" in update_data and update_data["quantity"] != existing.quantity:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Stok miktarını değiştirmek için inventory movement kullanın.",
        )
    if product.sku and product.sku != existing.sku and product_service.get_product_by_sku(db, product.sku):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu SKU zaten kullanılıyor.")
    try:
        return product_service.update_product(db, product_id, product)
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu SKU zaten kullanılıyor.") from error


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    if product_service.get_product_by_id(db, product_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ürün bulunamadı.")
    if db.query(StockMovement.id).filter(StockMovement.product_id == product_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stok hareketi geçmişi olan ürün silinemez.",
        )
    if db.query(OrderItem.id).filter(OrderItem.product_id == product_id).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Sipariş geçmişinde bulunan ürün silinemez.",
        )
    if not product_service.delete_product(db, product_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ürün bulunamadı.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

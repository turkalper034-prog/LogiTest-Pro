import unittest
from decimal import Decimal

from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import products as product_api
from app.api import inventory as inventory_api
from app.api import orders as orders_api
from app.db.database import Base
from app.models.order import Order, OrderItem
from app.models.stock_movement import StockMovement
from app.schemas.product import ProductCreate, ProductUpdate
from app.schemas.inventory import StockMovementCreate, WarehouseCreate
from app.schemas.order import OrderCreate, OrderStatusUpdate
from app.services import inventory as inventory_service


class ProductApiTests(unittest.TestCase):
    def setUp(self):
        from app.models.warehouse import Warehouse
        from app.models.stock_movement import StockMovement

        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=self.engine)
        self.session = sessionmaker(bind=self.engine)()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def create_input(self, **overrides):
        values = {
            "name": "Test Product",
            "sku": "test-001",
            "description": "Test description",
            "category": "Test",
            "quantity": 5,
            "price": Decimal("12.50"),
        }
        values.update(overrides)
        return ProductCreate(**values)

    def test_product_create_list_detail_update_delete(self):
        created = product_api.create_product(self.create_input(), self.session)
        self.assertEqual(created.sku, "TEST-001")
        self.assertEqual(created.price, Decimal("12.50"))

        listed = product_api.list_products(skip=0, limit=100, search="test-001", db=self.session)
        self.assertEqual([item.id for item in listed], [created.id])
        self.assertEqual(product_api.get_product(created.id, self.session).name, "Test Product")

        updated = product_api.update_product(
            created.id,
            ProductUpdate(price=Decimal("15.00")),
            self.session,
        )
        self.assertEqual(updated.quantity, 5)
        self.assertEqual(updated.price, Decimal("15.00"))

        response = product_api.delete_product(created.id, self.session)
        self.assertEqual(response.status_code, 204)
        with self.assertRaises(HTTPException) as missing:
            product_api.get_product(created.id, self.session)
        self.assertEqual(missing.exception.status_code, 404)

    def test_duplicate_sku_is_rejected_case_insensitively(self):
        product_api.create_product(self.create_input(), self.session)
        with self.assertRaises(HTTPException) as duplicate:
            product_api.create_product(self.create_input(sku=" TEST-001 "), self.session)
        self.assertEqual(duplicate.exception.status_code, 409)

    def test_product_validation_rejects_blank_and_negative_values(self):
        with self.assertRaises(ValidationError):
            self.create_input(name="  ")
        with self.assertRaises(ValidationError):
            self.create_input(sku="")
        with self.assertRaises(ValidationError):
            self.create_input(quantity=-1)
        with self.assertRaises(ValidationError):
            self.create_input(price=Decimal("-0.01"))
        with self.assertRaises(ValidationError):
            ProductUpdate(name=None)
        with self.assertRaises(ValidationError):
            ProductUpdate(quantity=None)
        with self.assertRaises(ValidationError):
            ProductUpdate(price=None)

    def test_openapi_exposes_product_crud_endpoints(self):
        from app.main import app

        paths = app.openapi()["paths"]
        self.assertIn("/api/v1/products", paths)
        self.assertIn("get", paths["/api/v1/products"])
        self.assertIn("post", paths["/api/v1/products"])
        self.assertIn("/api/v1/products/{product_id}", paths)
        self.assertTrue({"get", "put", "delete"}.issubset(paths["/api/v1/products/{product_id}"]))
        self.assertIn("/api/v1/inventory/movements", paths)
        self.assertIn("/api/v1/inventory/warehouses", paths)
        self.assertIn("/api/v1/orders", paths)
        self.assertIn("post", paths["/api/v1/orders"])
        self.assertIn("/api/v1/orders/{order_id}/status", paths)

    def test_stock_movements_update_product_and_persist_history(self):
        product = product_api.create_product(self.create_input(), self.session)
        warehouse = inventory_service.create_warehouse(
            self.session,
            WarehouseCreate(name="Main Warehouse", location="Istanbul"),
        )

        inbound = inventory_service.create_movement(
            self.session,
            StockMovementCreate(
                product_id=product.id,
                warehouse_id=warehouse.id,
                movement_type="inbound",
                quantity=3,
                note="Restock",
            ),
        )
        self.assertEqual((inbound.previous_quantity, inbound.new_quantity), (5, 8))

        outbound = inventory_service.create_movement(
            self.session,
            StockMovementCreate(
                product_id=product.id,
                warehouse_id=warehouse.id,
                movement_type="outbound",
                quantity=6,
            ),
        )
        self.assertEqual((outbound.previous_quantity, outbound.new_quantity), (8, 2))
        self.session.expire_all()
        self.assertEqual(product_api.get_product(product.id, self.session).quantity, 2)
        self.assertEqual(self.session.query(StockMovement).count(), 2)

        movement_rows = inventory_api.list_movements(limit=100, db=self.session)
        self.assertEqual(movement_rows[0]["product_sku"], "TEST-001")
        self.assertEqual(movement_rows[0]["warehouse_name"], "Main Warehouse")

    def test_stock_cannot_go_negative_and_direct_quantity_edit_is_rejected(self):
        product = product_api.create_product(self.create_input(), self.session)
        warehouse = inventory_service.create_warehouse(self.session, WarehouseCreate(name="Outbound"))

        with self.assertRaises(HTTPException) as insufficient:
            inventory_service.create_movement(
                self.session,
                StockMovementCreate(
                    product_id=product.id,
                    warehouse_id=warehouse.id,
                    movement_type="outbound",
                    quantity=6,
                ),
            )
        self.assertEqual(insufficient.exception.status_code, 409)
        self.assertEqual(product_api.get_product(product.id, self.session).quantity, 5)
        self.assertEqual(self.session.query(StockMovement).count(), 0)

        with self.assertRaises(HTTPException) as direct_edit:
            product_api.update_product(product.id, ProductUpdate(quantity=2), self.session)
        self.assertEqual(direct_edit.exception.status_code, 422)

    def test_warehouse_duplicates_and_analytics_use_database_records(self):
        product_api.create_product(self.create_input(), self.session)
        warehouse = inventory_service.create_warehouse(self.session, WarehouseCreate(name="North"))
        with self.assertRaises(HTTPException) as duplicate:
            inventory_service.create_warehouse(self.session, WarehouseCreate(name=" north "))
        self.assertEqual(duplicate.exception.status_code, 409)
        listed = inventory_api.list_warehouses(self.session)
        self.assertEqual(listed[0].id, warehouse.id)
        self.assertEqual(listed[0].movement_count, 0)

        analytics = inventory_service.get_analytics(self.session, low_stock_threshold=5)
        self.assertEqual(analytics["products_count"], 1)
        self.assertEqual(analytics["units_in_stock"], 5)
        self.assertEqual(analytics["low_stock_count"], 1)
        self.assertEqual(analytics["stock_movements_count"], 0)

    def create_order_input(self, items, warehouse_id=None):
        from app.models.warehouse import Warehouse

        warehouse = self.session.query(Warehouse).first()
        if warehouse_id is None and warehouse is None:
            warehouse = inventory_service.create_warehouse(
                self.session,
                WarehouseCreate(name="Order Warehouse"),
            )
        resolved_warehouse_id = warehouse_id or warehouse.id
        self.session.commit()
        return {
            "warehouse_id": resolved_warehouse_id,
            "items": items,
        }

    def move_order_to_processing(self, order):
        self.session.commit()
        order_id = order["id"]
        orders_api.update_order_status(order_id, OrderStatusUpdate(status="confirmed"), self.session)
        self.session.commit()
        processing = orders_api.update_order_status(order_id, OrderStatusUpdate(status="processing"), self.session)
        self.session.commit()
        return processing

    def test_successful_order_dispatches_stock_once_and_returns_detail(self):
        product = product_api.create_product(self.create_input(quantity=10, price=Decimal("8.25")), self.session)
        order = orders_api.create_order(
            OrderCreate(**self.create_order_input([{"product_id": product.id, "quantity": 3}])),
            self.session,
        )
        self.assertTrue(order["order_number"].startswith("ORD-"))
        self.assertEqual(order["status"], "pending")
        self.assertEqual(order["items"][0]["product_name"], product.name)
        self.assertEqual(order["total"], Decimal("24.75"))
        self.assertEqual(product_api.get_product(product.id, self.session).quantity, 10)
        self.session.commit()
        listed_orders = orders_api.list_orders(search=order["order_number"], order_status=None, db=self.session)
        self.assertEqual(listed_orders[0]["order_number"], order["order_number"])

        self.move_order_to_processing(order)
        self.session.commit()
        shipped = orders_api.update_order_status(order["id"], OrderStatusUpdate(status="shipped"), self.session)
        self.assertEqual(shipped["status"], "shipped")
        self.assertEqual(product_api.get_product(product.id, self.session).quantity, 7)
        self.assertEqual(self.session.query(StockMovement).filter(StockMovement.note.contains(order["order_number"])).count(), 1)

        self.session.commit()
        repeated = orders_api.update_order_status(order["id"], OrderStatusUpdate(status="shipped"), self.session)
        self.assertEqual(repeated["status"], "shipped")
        self.assertEqual(product_api.get_product(product.id, self.session).quantity, 7)
        self.assertEqual(self.session.query(StockMovement).filter(StockMovement.note.contains(order["order_number"])).count(), 1)

        self.session.commit()
        delivered = orders_api.update_order_status(order["id"], OrderStatusUpdate(status="delivered"), self.session)
        self.assertEqual(delivered["status"], "delivered")
        self.session.commit()
        with self.assertRaises(HTTPException) as terminal:
            orders_api.update_order_status(order["id"], OrderStatusUpdate(status="shipped"), self.session)
        self.assertEqual(terminal.exception.status_code, 409)
        self.session.commit()
        self.assertEqual(product_api.get_product(product.id, self.session).quantity, 7)

        self.session.commit()
        details = orders_api.get_order(order["id"], self.session)
        self.assertEqual(details["items"][0]["quantity"], 3)

    def test_order_rejects_unknown_products_and_nonpositive_quantities(self):
        warehouse = inventory_service.create_warehouse(self.session, WarehouseCreate(name="Validation Warehouse"))
        warehouse_id = warehouse.id
        self.session.commit()
        with self.assertRaises(HTTPException) as missing:
            orders_api.create_order(
                OrderCreate(warehouse_id=warehouse_id, items=[{"product_id": 999, "quantity": 1}]),
                self.session,
            )
        self.assertEqual(missing.exception.status_code, 404)
        self.assertEqual(self.session.query(Order).count(), 0)

        product = product_api.create_product(self.create_input(), self.session)
        self.session.commit()
        with self.assertRaises(ValidationError):
            OrderCreate.model_validate({"warehouse_id": warehouse_id, "items": [{"product_id": product.id, "quantity": 0}]})
        with self.assertRaises(ValidationError):
            OrderCreate.model_validate({"warehouse_id": warehouse_id, "items": [{"product_id": product.id, "quantity": -1}]})

    def test_invalid_state_transition_is_rejected(self):
        product = product_api.create_product(self.create_input(), self.session)
        order = orders_api.create_order(OrderCreate(**self.create_order_input([{"product_id": product.id, "quantity": 1}])), self.session)
        self.session.commit()
        with self.assertRaises(HTTPException) as invalid:
            orders_api.update_order_status(order["id"], OrderStatusUpdate(status="delivered"), self.session)
        self.assertEqual(invalid.exception.status_code, 409)
        self.session.commit()
        self.assertEqual(orders_api.get_order(order["id"], self.session)["status"], "pending")

        self.session.commit()
        cancelled = orders_api.update_order_status(order["id"], OrderStatusUpdate(status="cancelled"), self.session)
        self.assertEqual(cancelled["status"], "cancelled")
        self.session.commit()
        with self.assertRaises(HTTPException):
            orders_api.update_order_status(order["id"], OrderStatusUpdate(status="confirmed"), self.session)
        self.session.commit()
        self.assertEqual(product_api.get_product(product.id, self.session).quantity, 5)

    def test_insufficient_stock_rolls_back_entire_shipment(self):
        first = product_api.create_product(self.create_input(name="First", sku="FIRST", quantity=10), self.session)
        second = product_api.create_product(self.create_input(name="Second", sku="SECOND", quantity=1), self.session)
        order = orders_api.create_order(
            OrderCreate(**self.create_order_input([
                {"product_id": first.id, "quantity": 2},
                {"product_id": second.id, "quantity": 2},
            ])),
            self.session,
        )
        self.session.commit()
        self.move_order_to_processing(order)

        with self.assertRaises(HTTPException) as insufficient:
            orders_api.update_order_status(order["id"], OrderStatusUpdate(status="shipped"), self.session)
        self.assertEqual(insufficient.exception.status_code, 409)
        self.session.commit()
        self.assertEqual(product_api.get_product(first.id, self.session).quantity, 10)
        self.assertEqual(product_api.get_product(second.id, self.session).quantity, 1)
        self.assertEqual(self.session.query(StockMovement).count(), 0)
        self.assertEqual(orders_api.get_order(order["id"], self.session)["status"], "processing")


if __name__ == "__main__":
    unittest.main()

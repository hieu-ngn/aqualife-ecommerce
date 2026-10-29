"""Tests for admin detail/PATCH endpoints, revenue rules and dashboard metrics."""
import sys
import uuid
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from config.database import get_db_cursor

PASSWORD = "Password123!"


@pytest.fixture
def app():
    application = create_app()
    application.config["TESTING"] = True
    return application


def _register_login(client, role="customer"):
    email = f"admintest_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post(
        "/api/auth/register",
        json={"name": "Admin API Test", "email": email,
              "password": PASSWORD, "confirm_password": PASSWORD},
    )
    assert res.status_code == 201
    user_id = res.get_json()["data"]["id"]
    if role == "admin":
        with get_db_cursor(commit=True) as cur:
            cur.execute("UPDATE users SET role = 'admin' WHERE id = %s", (user_id,))
    login = client.post("/api/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200
    return user_id


def _cleanup(user_ids=(), product_ids=(), category_ids=()):
    with get_db_cursor(commit=True) as cur:
        for uid in user_ids:
            cur.execute(
                "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = %s)",
                (uid,),
            )
            cur.execute("DELETE FROM orders WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM cart WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM users WHERE id = %s", (uid,))
        for pid in product_ids:
            cur.execute("DELETE FROM products WHERE id = %s", (pid,))
        for cid in category_ids:
            cur.execute("DELETE FROM categories WHERE id = %s", (cid,))


def _make_product(price=50000, stock=10):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO products (name, price, stock) VALUES (%s, %s, %s) RETURNING id",
            (f"Test product {uuid.uuid4().hex[:6]}", price, stock),
        )
        return cur.fetchone()["id"]


NEW_ADMIN_ROUTES = [
    ("get", "/api/admin/products/1"),
    ("patch", "/api/admin/products/1/status"),
    ("patch", "/api/admin/products/1/stock"),
    ("patch", "/api/admin/categories/1/status"),
    ("get", "/api/admin/orders/1"),
    ("get", "/api/admin/users/1"),
    ("get", "/api/admin/revenue"),
]


def test_new_admin_routes_require_auth_then_admin(app):
    with app.test_client() as anon:
        for method, url in NEW_ADMIN_ROUTES:
            assert getattr(anon, method)(url).status_code == 401, url

    with app.test_client() as customer:
        uid = _register_login(customer, "customer")
        try:
            for method, url in NEW_ADMIN_ROUTES:
                assert getattr(customer, method)(url).status_code == 403, url
        finally:
            _cleanup(user_ids=[uid])


def test_admin_product_detail_status_and_stock(app):
    pid = _make_product(stock=10)
    with app.test_client() as client:
        uid = _register_login(client, "admin")
        try:
            detail = client.get(f"/api/admin/products/{pid}")
            assert detail.status_code == 200
            assert detail.get_json()["data"]["id"] == pid

            assert client.get("/api/admin/products/999999999").status_code == 404

            res = client.patch(f"/api/admin/products/{pid}/stock", json={"stock": 7})
            assert res.status_code == 200
            assert res.get_json()["data"]["stock"] == 7

            for bad in (-1, "abc", None, True, 1.5):
                res = client.patch(f"/api/admin/products/{pid}/stock", json={"stock": bad})
                assert res.status_code == 422, bad

            res = client.patch(f"/api/admin/products/{pid}/status", json={"status": "inactive"})
            assert res.status_code == 200
            assert res.get_json()["data"]["status"] == "inactive"
            assert client.patch(
                f"/api/admin/products/{pid}/status", json={"status": "deleted"}
            ).status_code == 422
            assert client.patch(
                "/api/admin/products/999999999/stock", json={"stock": 1}
            ).status_code == 404
        finally:
            _cleanup(user_ids=[uid], product_ids=[pid])


def test_admin_category_status_patch(app):
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO categories (name) VALUES (%s) RETURNING id",
            (f"Cat {uuid.uuid4().hex[:6]}",),
        )
        cid = cur.fetchone()["id"]
    with app.test_client() as client:
        uid = _register_login(client, "admin")
        try:
            res = client.patch(f"/api/admin/categories/{cid}/status", json={"status": "inactive"})
            assert res.status_code == 200
            assert res.get_json()["data"]["status"] == "inactive"
            assert client.patch(
                f"/api/admin/categories/{cid}/status", json={"status": "x"}
            ).status_code == 422
            assert client.patch(
                "/api/admin/categories/999999999/status", json={"status": "active"}
            ).status_code == 404
        finally:
            _cleanup(user_ids=[uid], category_ids=[cid])


def test_admin_order_and_user_detail_hide_password_hash(app):
    pid = _make_product(price=40000, stock=5)
    customer, admin = app.test_client(), app.test_client()
    cust_id = _register_login(customer, "customer")
    admin_id = _register_login(admin, "admin")
    try:
        assert customer.post("/api/cart", json={"product_id": pid, "quantity": 2}).status_code in (200, 201)
        order = customer.post(
            "/api/orders",
            json={"shipping_name": "A", "shipping_phone": "0900000000",
                  "shipping_address": "Ha Noi", "payment_method": "cod"},
        )
        assert order.status_code == 201
        oid = order.get_json()["data"]["id"]

        res = admin.get(f"/api/admin/orders/{oid}")
        assert res.status_code == 200
        data = res.get_json()["data"]
        assert data["id"] == oid and len(data["items"]) == 1
        assert float(data["total_amount"]) == 80000
        assert admin.get("/api/admin/orders/999999999").status_code == 404

        res = admin.get(f"/api/admin/users/{cust_id}")
        assert res.status_code == 200
        assert "password_hash" not in res.get_json()["data"]
        assert res.get_json()["data"]["order_count"] == 1
        assert admin.get("/api/admin/users/999999999").status_code == 404
    finally:
        _cleanup(user_ids=[cust_id, admin_id], product_ids=[pid])


def test_revenue_counts_only_completed_orders_with_filters(app):
    pid = _make_product(price=100000, stock=20)
    customer, admin = app.test_client(), app.test_client()
    cust_id = _register_login(customer, "customer")
    admin_id = _register_login(admin, "admin")
    order_ids = []
    try:
        def place(qty):
            assert customer.post("/api/cart", json={"product_id": pid, "quantity": qty}).status_code in (200, 201)
            res = customer.post(
                "/api/orders",
                json={"shipping_name": "A", "shipping_phone": "0900000000",
                      "shipping_address": "Ha Noi", "payment_method": "bank_transfer"},
            )
            assert res.status_code == 201
            order_ids.append(res.get_json()["data"]["id"])
            return order_ids[-1]

        pending_id = place(1)       # stays pending -> must NOT count
        cancelled_id = place(2)     # cancelled     -> must NOT count
        completed_id = place(3)     # completed     -> counts 300000

        assert admin.patch(f"/api/admin/orders/{cancelled_id}/status", json={"status": "cancelled"}).status_code == 200
        for status in ("confirmed", "processing", "shipping", "completed"):
            assert admin.patch(f"/api/admin/orders/{completed_id}/status", json={"status": status}).status_code == 200

        with get_db_cursor() as cur:
            cur.execute("SELECT updated_at::date AS d FROM orders WHERE id = %s", (completed_id,))
            day = cur.fetchone()["d"].isoformat()

        res = admin.get(f"/api/admin/revenue?from={day}&to={day}&group_by=day")
        assert res.status_code == 200
        data = res.get_json()["data"]
        assert data["basis"] == "completed"
        pay = {p["payment_method"]: p for p in data["by_payment"]}
        assert pay["bank_transfer"]["revenue"] >= 300000
        # Our pending/cancelled orders (100000 + 200000) are excluded: compare with a DB oracle.
        with get_db_cursor() as cur:
            cur.execute(
                "SELECT COALESCE(SUM(total_amount),0) AS s FROM orders "
                "WHERE status='completed' AND updated_at::date = %s",
                (day,),
            )
            expected = float(cur.fetchone()["s"])
        assert data["total_revenue"] == expected
        assert data["series"][0]["period"] == day

        month = admin.get("/api/admin/revenue?group_by=month").get_json()["data"]
        assert all(len(item["period"]) == 7 for item in month["series"])

        assert admin.get("/api/admin/revenue?group_by=year").status_code == 422
        assert admin.get("/api/admin/revenue?from=not-a-date").status_code == 422
        assert admin.get("/api/admin/revenue?from=2026-02-01&to=2026-01-01").status_code == 422

        dash = admin.get("/api/admin/dashboard").get_json()["data"]
        for key in ("today_revenue", "monthly_revenue", "completed_orders", "total_customers"):
            assert key in dash
        assert dash["today_revenue"] >= 300000
        assert dash["monthly_revenue"] >= dash["today_revenue"]
        _ = pending_id
    finally:
        _cleanup(user_ids=[cust_id, admin_id], product_ids=[pid])

"""Tồn kho theo TỪNG kích thước: tổng = tổng các size, mua/hủy chỉ đổi đúng size."""
import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app  # noqa: E402
from config.database import get_db_cursor  # noqa: E402

EMAIL = "size_stock_test@aqualife.com"
PW = "Password@123"
NAME = "ZZ Test Size Stock"
SHIP = {"shipping_name": "Test", "shipping_phone": "0912345678",
        "shipping_address": "Ha Noi", "payment_method": "cod"}
SIZES = [
    {"size": "S", "price": 10000, "stock": 5},
    {"size": "M", "price": 20000, "stock": 2},
    {"size": "L", "price": 30000, "stock": 0},
]


def _cleanup():
    with get_db_cursor(commit=True) as cur:
        cur.execute("SELECT id FROM users WHERE email=%s", (EMAIL,))
        uids = [r["id"] for r in cur.fetchall()]
        cur.execute("SELECT id FROM products WHERE name=%s", (NAME,))
        pids = [r["id"] for r in cur.fetchall()]
        if uids:
            cur.execute("DELETE FROM orders WHERE user_id = ANY(%s)", (uids,))
            cur.execute("DELETE FROM cart WHERE user_id = ANY(%s)", (uids,))
            cur.execute("DELETE FROM users WHERE id = ANY(%s)", (uids,))
        if pids:
            cur.execute("DELETE FROM order_items WHERE product_id = ANY(%s)", (pids,))
            cur.execute("DELETE FROM products WHERE id = ANY(%s)", (pids,))


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config["TESTING"] = True
    _cleanup()
    yield a
    _cleanup()


@pytest.fixture(scope="module")
def admin(app):
    c = app.test_client()
    assert c.post("/api/auth/login", json={"email": "admin@aqualife.com", "password": "Admin@123"}).status_code == 200
    return c


@pytest.fixture(scope="module")
def customer(app):
    c = app.test_client()
    c.post("/api/auth/register", json={"name": "Size Tester", "email": EMAIL,
                                       "password": PW, "confirm_password": PW})
    assert c.post("/api/auth/login", json={"email": EMAIL, "password": PW}).status_code == 200
    return c


@pytest.fixture(scope="module")
def product(admin):
    r = admin.post("/api/admin/products", json={"name": NAME, "price": 10000, "stock": 999,
                                                 "category_id": None, "sizes": SIZES})
    assert r.status_code == 201, r.get_json()
    return r.get_json()["data"]


def _get(admin, pid):
    return admin.get(f"/api/admin/products?search={NAME}").get_json()["data"] and next(
        p for p in admin.get("/api/admin/products").get_json()["data"] if p["id"] == pid)


def _stocks(p):
    return {s["size"]: s["stock"] for s in p["sizes"]}


def test_total_stock_is_sum_of_sizes(admin, product):
    assert _stocks(product) == {"S": 5, "M": 2, "L": 0}
    assert product["stock"] == 7  # bỏ qua stock=999 gửi kèm, lấy tổng các size


def test_negative_size_stock_rejected(admin, product):
    bad = [{"size": "S", "price": 1, "stock": -1}]
    r = admin.put(f"/api/admin/products/{product['id']}", json={"sizes": bad})
    assert r.status_code == 422


def test_cart_limited_by_each_size(customer, product):
    pid = product["id"]
    customer.delete("/api/cart")
    # size L hết hàng dù tổng còn 7
    assert customer.post("/api/cart", json={"product_id": pid, "quantity": 1, "selected_size": "L"}).status_code == 400
    # size M chỉ còn 2
    assert customer.post("/api/cart", json={"product_id": pid, "quantity": 3, "selected_size": "M"}).status_code == 400
    assert customer.post("/api/cart", json={"product_id": pid, "quantity": 2, "selected_size": "M"}).status_code == 201
    r = customer.put(f"/api/cart/{pid}", json={"quantity": 3})
    assert r.status_code == 400


def test_checkout_and_cancel_only_touch_chosen_size(customer, admin, product):
    pid = product["id"]
    customer.delete("/api/cart")
    customer.post("/api/cart", json={"product_id": pid, "quantity": 2, "selected_size": "M"})
    r = customer.post("/api/orders", json=SHIP)
    assert r.status_code == 201, r.get_json()
    order = r.get_json()["data"]
    assert order["total_amount"] == 40000  # giá của size M, tính ở backend

    after = _get(admin, pid)
    assert _stocks(after) == {"S": 5, "M": 0, "L": 0}
    assert after["stock"] == 5

    # hết size M thì không đặt thêm được nữa
    assert customer.post("/api/cart", json={"product_id": pid, "quantity": 1, "selected_size": "M"}).status_code == 400

    # hủy đơn -> hoàn đúng size M
    assert customer.patch(f"/api/orders/{order['id']}/cancel").status_code == 200
    back = _get(admin, pid)
    assert _stocks(back) == {"S": 5, "M": 2, "L": 0} and back["stock"] == 7


def test_bulk_delta_applies_to_every_size(admin, product):
    pid = product["id"]
    r = admin.post("/api/admin/products/bulk", json={"product_ids": [pid], "action": "update_price", "stock_delta": 3})
    assert r.status_code == 200
    p = _get(admin, pid)
    assert _stocks(p) == {"S": 8, "M": 5, "L": 3} and p["stock"] == 16

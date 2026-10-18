import os
import sys
from pathlib import Path
import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from config.database import get_db_cursor


TEST_EMAIL_1 = "m08_test_user@aqualife.com"
TEST_EMAIL_2 = "m08_other_user@aqualife.com"


def _cleanup_test_users():
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "SELECT id FROM users WHERE email IN (%s, %s)",
            (TEST_EMAIL_1, TEST_EMAIL_2),
        )
        uids = [r["id"] for r in cur.fetchall()]
        if uids:
            cur.execute("DELETE FROM orders WHERE user_id = ANY(%s)", (uids,))
            cur.execute("DELETE FROM cart WHERE user_id = ANY(%s)", (uids,))
            cur.execute("DELETE FROM users WHERE id = ANY(%s)", (uids,))


@pytest.fixture(scope="module")
def app():
    flask_app = create_app()
    flask_app.config["TESTING"] = True
    _cleanup_test_users()
    yield flask_app
    _cleanup_test_users()


@pytest.fixture()
def client(app):
    return app.test_client()


def _register_and_login(client, name, email, password="Password@123"):
    client.post(
        "/api/auth/register",
        json={
            "name": name,
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )
    res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200
    return res.get_json()["data"]


def test_categories_and_products_endpoints(client):
    # 1. List categories
    cat_res = client.get("/api/categories")
    assert cat_res.status_code == 200
    cat_body = cat_res.get_json()
    assert cat_body["success"] is True
    assert len(cat_body["data"]) >= 4

    first_cat_id = cat_body["data"][0]["id"]
    single_cat = client.get(f"/api/categories/{first_cat_id}")
    assert single_cat.status_code == 200
    assert single_cat.get_json()["data"]["id"] == first_cat_id

    # 2. List products & filter
    prod_res = client.get("/api/products")
    assert prod_res.status_code == 200
    prods = prod_res.get_json()["data"]
    assert len(prods) >= 20

    # Search filter
    search_res = client.get("/api/products?search=Vàng&sort=price_asc")
    assert search_res.status_code == 200
    search_items = search_res.get_json()["data"]
    assert len(search_items) >= 1
    prices = [item["price"] for item in search_items]
    assert prices == sorted(prices)

    # Product detail & 404
    first_pid = prods[0]["id"]
    detail_res = client.get(f"/api/products/{first_pid}")
    assert detail_res.status_code == 200
    assert detail_res.get_json()["data"]["id"] == first_pid

    not_found_res = client.get("/api/products/999999")
    assert not_found_res.status_code == 404
    assert not_found_res.get_json()["success"] is False


def test_cart_requires_auth(client):
    res = client.get("/api/cart")
    assert res.status_code == 401
    assert res.get_json()["success"] is False


def test_cart_crud_and_stock_validation(client):
    _register_and_login(client, "M08 Tester", TEST_EMAIL_1)

    # Clear cart first
    client.delete("/api/cart")

    # Find an in-stock product and an out-of-stock product
    prods = client.get("/api/products").get_json()["data"]
    in_stock_prod = next(p for p in prods if p["stock"] >= 5)
    out_of_stock_prod = next((p for p in prods if p["stock"] == 0), None)

    # 1. Add item to cart
    add_res = client.post(
        "/api/cart",
        json={"product_id": in_stock_prod["id"], "quantity": 2},
    )
    assert add_res.status_code == 201
    cart_data = add_res.get_json()["data"]
    assert cart_data["total_quantity"] == 2
    assert cart_data["total_amount"] == in_stock_prod["price"] * 2

    item_id = cart_data["items"][0]["id"]

    # 2. Update quantity
    upd_res = client.put(f"/api/cart/{item_id}", json={"quantity": 3})
    assert upd_res.status_code == 200
    assert upd_res.get_json()["data"]["total_quantity"] == 3

    # 3. Exceed stock should fail with 400
    exceed_res = client.put(
        f"/api/cart/{item_id}", json={"quantity": in_stock_prod["stock"] + 10}
    )
    assert exceed_res.status_code == 400
    assert exceed_res.get_json()["success"] is False

    if out_of_stock_prod:
        zero_res = client.post(
            "/api/cart",
            json={"product_id": out_of_stock_prod["id"], "quantity": 1},
        )
        assert zero_res.status_code == 400

    # 4. Delete single item & clear cart
    del_res = client.delete(f"/api/cart/{item_id}")
    assert del_res.status_code == 200
    assert del_res.get_json()["data"]["total_quantity"] == 0


def test_checkout_transaction_order_history_and_cancel(client):
    _register_and_login(client, "M08 Tester", TEST_EMAIL_1)
    client.delete("/api/cart")

    prods = client.get("/api/products").get_json()["data"]
    target_prod = next(p for p in prods if p["stock"] >= 5)
    initial_stock = target_prod["stock"]
    pid = target_prod["id"]

    # Add 2 units to cart
    client.post("/api/cart", json={"product_id": pid, "quantity": 2})

    # Checkout -> Create order
    order_res = client.post(
        "/api/orders",
        json={
            "shipping_name": "Nguyễn Văn Test",
            "shipping_phone": "0912345678",
            "shipping_address": "207 Giải Phóng, Hà Nội",
            "payment_method": "cod",
        },
    )
    assert order_res.status_code == 201
    order_data = order_res.get_json()["data"]
    order_id = order_data["id"]
    assert order_data["status"] == "pending"
    assert order_data["total_amount"] == target_prod["price"] * 2
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["product_name"] == target_prod["name"]
    assert order_data["items"][0]["unit_price"] == target_prod["price"]

    # Verify stock decreased by 2 and cart is cleared
    prod_after = client.get(f"/api/products/{pid}").get_json()["data"]
    assert prod_after["stock"] == initial_stock - 2

    cart_after = client.get("/api/cart").get_json()["data"]
    assert cart_after["total_quantity"] == 0

    # Verify order history & order detail
    list_res = client.get("/api/orders")
    assert list_res.status_code == 200
    assert any(o["id"] == order_id for o in list_res.get_json()["data"])

    detail_res = client.get(f"/api/orders/{order_id}")
    assert detail_res.status_code == 200
    assert detail_res.get_json()["data"]["id"] == order_id

    # Verify another user cannot access or cancel this order
    _register_and_login(client, "Other User", TEST_EMAIL_2)
    forbidden_get = client.get(f"/api/orders/{order_id}")
    assert forbidden_get.status_code == 403
    forbidden_cancel = client.patch(f"/api/orders/{order_id}/cancel")
    assert forbidden_cancel.status_code == 403

    # Switch back to owner and cancel the order -> stock must be restored!
    _register_and_login(client, "M08 Tester", TEST_EMAIL_1)
    cancel_res = client.patch(f"/api/orders/{order_id}/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.get_json()["data"]["status"] == "cancelled"

    prod_restored = client.get(f"/api/products/{pid}").get_json()["data"]
    assert prod_restored["stock"] == initial_stock

    # Cancelling again should fail with 400
    cancel_again = client.patch(f"/api/orders/{order_id}/cancel")
    assert cancel_again.status_code == 400


def test_checkout_rollback_and_fallback_items(client):
    _register_and_login(client, "M08 Tester", TEST_EMAIL_1)
    client.delete("/api/cart")

    prods = client.get("/api/products").get_json()["data"]
    target_prod = next(p for p in prods if p["stock"] >= 3)
    initial_stock = target_prod["stock"]
    pid = target_prod["id"]

    # 1. Try checkout with fallback items exceeding stock -> should 400 and rollback
    bad_order = client.post(
        "/api/orders",
        json={
            "shipping_name": "Nguyễn Văn Rollback",
            "shipping_phone": "0912345678",
            "shipping_address": "Hà Nội",
            "payment_method": "transfer",
            "items": [{"product_id": pid, "quantity": initial_stock + 50}],
        },
    )
    assert bad_order.status_code == 400
    assert bad_order.get_json()["success"] is False

    # Stock must remain untouched
    prod_check = client.get(f"/api/products/{pid}").get_json()["data"]
    assert prod_check["stock"] == initial_stock

    # 2. Valid checkout with fallback items and payment alias 'transfer' -> 'bank_transfer'
    ok_order = client.post(
        "/api/orders",
        json={
            "shipping_name": "Nguyễn Văn Transfer",
            "shipping_phone": "0912345678",
            "shipping_address": "Hà Nội",
            "payment_method": "transfer",
            "items": [{"product_id": pid, "quantity": 1}],
        },
    )
    assert ok_order.status_code == 201
    order_data = ok_order.get_json()["data"]
    assert order_data["payment_method"] == "bank_transfer"

    # Cancel to restore stock
    client.patch(f"/api/orders/{order_data['id']}/cancel")
    prod_final = client.get(f"/api/products/{pid}").get_json()["data"]
    assert prod_final["stock"] == initial_stock


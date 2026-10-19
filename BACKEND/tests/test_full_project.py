import sys
import uuid
from pathlib import Path
import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from config.database import get_db_cursor


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client



def _create_user_and_login(client, role="customer"):
    suffix = uuid.uuid4().hex[:8]
    email = f"fulltest_{suffix}@example.com"
    password = "Password123!"
    reg_res = client.post(
        "/api/auth/register",
        json={
            "name": f"Test {role.capitalize()}",
            "email": email,
            "password": password,
            "confirm_password": password,
        },
    )
    assert reg_res.status_code == 201
    user_id = reg_res.get_json()["data"]["id"]

    if role == "admin":
        with get_db_cursor(commit=True) as cur:
            cur.execute("UPDATE users SET role = 'admin' WHERE id = %s", (user_id,))

    login_res = client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    return user_id, email, password


def _cleanup_user_data(user_ids, created_product_ids=None, created_cat_ids=None):
    with get_db_cursor(commit=True) as cur:
        for uid in user_ids:
            cur.execute("DELETE FROM reviews WHERE user_id = %s", (uid,))
            cur.execute(
                "DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = %s)",
                (uid,),
            )
            cur.execute("DELETE FROM orders WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM cart WHERE user_id = %s", (uid,))
            cur.execute("DELETE FROM users WHERE id = %s", (uid,))
        for pid in created_product_ids or []:
            cur.execute("DELETE FROM products WHERE id = %s", (pid,))
        for cid in created_cat_ids or []:
            cur.execute("DELETE FROM categories WHERE id = %s", (cid,))


def test_unified_static_frontend_serving(client):
    root_res = client.get("/")
    assert root_res.status_code in (301, 302)
    assert "/html/home.html" in root_res.headers.get("Location", "")

    for page in ("home.html", "products.html", "profile.html", "admin.html", "contact.html", "orders.html"):
        res = client.get(f"/html/{page}")
        assert res.status_code == 200


def test_m09a_profile_and_password_change(client):
    uid, email, old_pw = _create_user_and_login(client, role="customer")
    try:
        # 1. Get profile
        res = client.get("/api/users/me")
        assert res.status_code == 200
        assert res.get_json()["data"]["email"] == email

        # 2. Update profile
        upd_res = client.put(
            "/api/users/me",
            json={
                "name": "Nguyễn Thủy Sinh",
                "phone": "0988777666",
                "address": "207 Giải Phóng, Hà Nội",
            },
        )
        assert upd_res.status_code == 200
        upd_data = upd_res.get_json()["data"]
        assert upd_data["name"] == "Nguyễn Thủy Sinh"
        assert upd_data["phone"] == "0988777666"
        assert upd_data["address"] == "207 Giải Phóng, Hà Nội"

        # 3. Wrong current password -> 400
        bad_pw_res = client.put(
            "/api/users/me/password",
            json={
                "current_password": "WrongPassword",
                "new_password": "NewPassword456!",
                "confirm_password": "NewPassword456!",
            },
        )
        assert bad_pw_res.status_code == 400

        # 4. Valid password change -> 200 & re-login works
        ok_pw_res = client.put(
            "/api/users/me/password",
            json={
                "current_password": old_pw,
                "new_password": "NewPassword456!",
                "confirm_password": "NewPassword456!",
            },
        )
        assert ok_pw_res.status_code == 200

        login_new = client.post(
            "/api/auth/login",
            json={"email": email, "password": "NewPassword456!"},
        )
        assert login_new.status_code == 200
    finally:
        _cleanup_user_data([uid])


def test_m09b_verified_purchase_reviews(client):
    uid, _, _ = _create_user_and_login(client, role="customer")
    product_id = None
    initial_stock = None
    try:
        prods = client.get("/api/products?available_only=true").get_json()["data"]
        target = next(p for p in prods if p["stock"] >= 3)
        product_id = target["id"]
        initial_stock = target["stock"]

        # 1. Cannot review before purchasing -> 403
        pre_rev = client.post(
            f"/api/products/{product_id}/reviews",
            json={"rating": 5, "comment": "Thử đánh giá khi chưa mua"},
        )
        assert pre_rev.status_code == 403

        # 2. Purchase product -> then cancel order should still not count, so keep order active
        order_res = client.post(
            "/api/orders",
            json={
                "shipping_name": "Reviewer",
                "shipping_phone": "0912345678",
                "shipping_address": "Hà Nội",
                "payment_method": "cod",
                "items": [{"product_id": product_id, "quantity": 1}],
            },
        )
        assert order_res.status_code == 201
        order_id = order_res.get_json()["data"]["id"]

        # 3. Create review after purchase -> 201
        rev_res = client.post(
            f"/api/products/{product_id}/reviews",
            json={"rating": 5, "comment": "Cá khỏe mạnh, đóng gói oxy rất kỹ!"},
        )
        assert rev_res.status_code == 201
        review_id = rev_res.get_json()["data"]["id"]

        # 4. Duplicate review -> 409
        dup_res = client.post(
            f"/api/products/{product_id}/reviews",
            json={"rating": 4, "comment": "Đánh giá lần 2"},
        )
        assert dup_res.status_code == 409

        # 5. Update review -> 200
        upd_rev = client.put(
            f"/api/reviews/{review_id}",
            json={"rating": 4, "comment": "Cập nhật nhận xét 4 sao"},
        )
        assert upd_rev.status_code == 200
        assert upd_rev.get_json()["data"]["rating"] == 4

        # 6. List reviews -> includes updated review
        list_rev = client.get(f"/api/products/{product_id}/reviews")
        assert list_rev.status_code == 200
        list_data = list_rev.get_json()["data"]
        assert list_data["total_reviews"] >= 1
        assert any(r["id"] == review_id for r in list_data["reviews"])

        # 6b. Featured reviews on home page -> sorted by rating DESC, created_at ASC
        feat_rev = client.get("/api/reviews?limit=20")
        assert feat_rev.status_code == 200
        feat_data = feat_rev.get_json()["data"]
        assert isinstance(feat_data, list) and len(feat_data) >= 1
        ratings = [r["rating"] for r in feat_data]
        assert ratings == sorted(ratings, reverse=True)

        # 7. Delete review -> 200
        del_rev = client.delete(f"/api/reviews/{review_id}")
        assert del_rev.status_code == 200

        # Cancel the test order to restore stock cleanly
        client.patch(f"/api/orders/{order_id}/cancel")
    finally:
        if product_id is not None and initial_stock is not None:
            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    "UPDATE products SET stock = %s WHERE id = %s",
                    (initial_stock, product_id),
                )
        _cleanup_user_data([uid])


def test_m10_m11_m12_admin_dashboard_and_management(client):
    cust_id, _, _ = _create_user_and_login(client, role="customer")
    created_prods = []
    created_cats = []
    admin_id = None
    product_id = None
    initial_stock = None

    try:
        # Customer cannot access /api/admin/dashboard -> 403
        forbid_res = client.get("/api/admin/dashboard")
        assert forbid_res.status_code == 403

        # Customer places an order first
        prods = client.get("/api/products?available_only=true").get_json()["data"]
        target = next(p for p in prods if p["stock"] >= 5)
        product_id = target["id"]
        initial_stock = target["stock"]

        order_res = client.post(
            "/api/orders",
            json={
                "shipping_name": "Khách টেস্ট Admin",
                "shipping_phone": "0911222333",
                "shipping_address": "Đống Đa, Hà Nội",
                "payment_method": "bank_transfer",
                "items": [{"product_id": product_id, "quantity": 2}],
            },
        )
        assert order_res.status_code == 201
        order_id = order_res.get_json()["data"]["id"]

        # Switch session to Admin
        admin_id, _, _ = _create_user_and_login(client, role="admin")

        # 1. Dashboard Overview
        dash_res = client.get("/api/admin/dashboard")
        assert dash_res.status_code == 200
        dash_data = dash_res.get_json()["data"]
        assert dash_data["total_users"] >= 2
        assert dash_data["total_products"] >= 50
        assert dash_data["total_orders"] >= 1

        # 2. M10 Category CRUD
        cat_name = f"Danh mục Test {uuid.uuid4().hex[:6]}"
        cat_res = client.post(
            "/api/admin/categories",
            json={"name": cat_name, "description": "Mô tả test", "status": "active"},
        )
        assert cat_res.status_code == 201
        cat_id = cat_res.get_json()["data"]["id"]
        created_cats.append(cat_id)

        # 3. M10 Product CRUD (including water_type environment classification & sizes pricing)
        prod_res = client.post(
            "/api/admin/products",
            json={
                "name": "Cá Koi Kohaku Test Admin",
                "category_id": cat_id,
                "water_type": "Nước ngọt",
                "price": 450000,
                "stock": 15,
                "description": "Cá Koi Nhật Bản",
                "image": "image/ocean-bg.svg",
                "status": "active",
                "sizes": [
                    {"size": "Size S (10 - 15cm)", "price": 320000},
                    {"size": "Size M (20 - 25cm)", "price": 450000},
                    {"size": "Size L (30 - 35cm)", "price": 680000},
                ],
            },
        )
        assert prod_res.status_code == 201
        prod_data = prod_res.get_json()["data"]
        assert prod_data["water_type"] == "Nước ngọt"
        assert len(prod_data["sizes"]) == 3
        assert prod_data["sizes"][2]["price"] == 680000
        new_prod_id = prod_data["id"]
        created_prods.append(new_prod_id)

        upd_prod_res = client.put(
            f"/api/admin/products/{new_prod_id}",
            json={
                "price": 500000,
                "stock": 10,
                "water_type": "Nước lợ",
                "sizes": [
                    {"size": "Size M - Tiêu chuẩn", "price": 500000},
                    {"size": "Size XL - Jumbo", "price": 850000},
                ],
            },
        )
        assert upd_prod_res.status_code == 200
        assert upd_prod_res.get_json()["data"]["price"] == 500000
        assert upd_prod_res.get_json()["data"]["water_type"] == "Nước lợ"
        assert len(upd_prod_res.get_json()["data"]["sizes"]) == 2
        assert upd_prod_res.get_json()["data"]["sizes"][1]["price"] == 850000

        del_prod_res = client.delete(f"/api/admin/products/{new_prod_id}")
        assert del_prod_res.status_code == 200
        assert del_prod_res.get_json()["data"]["status"] == "inactive"

        # 3b. Bulk product operations & Revenue report
        bulk_toggle = client.post(
            "/api/admin/products/bulk",
            json={"product_ids": [new_prod_id], "action": "toggle_status"},
        )
        assert bulk_toggle.status_code == 200
        assert bulk_toggle.get_json()["data"]["updated_count"] == 1

        bulk_price = client.post(
            "/api/admin/products/bulk",
            json={
                "product_ids": [new_prod_id],
                "action": "update_price",
                "fixed_price": 380000,
                "stock_delta": 5,
            },
        )
        assert bulk_price.status_code == 200

        rev_res = client.get("/api/admin/revenue")
        assert rev_res.status_code == 200
        assert "by_category" in rev_res.get_json()["data"]

        # 4. M11 Order Status Workflow & Stock Restoration on Cancel
        conf_res = client.patch(
            f"/api/admin/orders/{order_id}/status",
            json={"status": "confirmed"},
        )
        assert conf_res.status_code == 200
        assert conf_res.get_json()["data"]["status"] == "confirmed"

        canc_res = client.patch(
            f"/api/admin/orders/{order_id}/status",
            json={"status": "cancelled"},
        )
        assert canc_res.status_code == 200
        assert canc_res.get_json()["data"]["status"] == "cancelled"

        # Verify stock was restored to initial_stock
        restored_prod = client.get(f"/api/products/{product_id}").get_json()["data"]
        assert restored_prod["stock"] == initial_stock

        # 5. M12 User Management
        lock_self = client.patch(
            f"/api/admin/users/{admin_id}/status",
            json={"status": "inactive"},
        )
        assert lock_self.status_code == 400

        lock_cust = client.patch(
            f"/api/admin/users/{cust_id}/status",
            json={"status": "inactive"},
        )
        assert lock_cust.status_code == 200
        assert lock_cust.get_json()["data"]["status"] == "inactive"

        # 6. Admin Contact Settings & Store Info Synchronization
        orig_info = client.get("/api/store-info").get_json()["data"]
        upd_set_res = client.put(
            "/api/admin/settings",
            json={
                "phone": "0988 999 888",
                "address": "207 Đ. Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội",
                "email": "admin@aqualife.com",
                "open_hours": "08:00 – 23:59 (T2 – CN)",
            },
        )
        assert upd_set_res.status_code == 200
        public_info = client.get("/api/store-info").get_json()["data"]
        assert public_info["phone"] == "0988 999 888"

        # Restore original store settings
        client.put("/api/admin/settings", json=orig_info)
    finally:
        if product_id is not None and initial_stock is not None:
            with get_db_cursor(commit=True) as cur:
                cur.execute(
                    "UPDATE products SET stock = %s WHERE id = %s",
                    (initial_stock, product_id),
                )
        ids_to_clean = [cust_id] + ([admin_id] if admin_id else [])
        _cleanup_user_data(ids_to_clean, created_prods, created_cats)


def test_ai_tank_builder_advisor(client):
    res = client.post(
        "/api/advisor/chat",
        json={"message": "500k nước mặn nên build bể cá như thế nào (gồm cá, ốc, tép, san hô)?"},
    )
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["budget"] == 500000
    assert data["water_type"] == "Nước mặn"
    assert 0 < data["total_cost"] <= 500000
    assert len(data["items"]) >= 3
    species_in_combo = {item["species"] for item in data["items"]}
    assert "Cá" in species_in_combo
    assert "Ốc" in species_in_combo



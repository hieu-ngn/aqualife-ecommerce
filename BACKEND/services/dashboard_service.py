import json
from decimal import Decimal
from psycopg.errors import UniqueViolation
from config.database import get_db_cursor
from services.order_service import (
    OrderNotFoundError,
    InvalidOrderStatusError,
    _fetch_order_items,
    _serialize_order,
)
from services.product_service import _normalize_sizes, _serialize_category, _serialize_product


class CategoryNameExistsError(Exception):
    """Tên danh mục đã tồn tại."""


class CategoryNotFoundError(Exception):
    """Không tìm thấy danh mục."""


class AdminSelfModificationError(Exception):
    """Không thể tự khóa hoặc hạ quyền tài khoản của chính mình."""


VALID_ORDER_STATUSES = {
    "pending",
    "confirmed",
    "processing",
    "shipping",
    "completed",
    "cancelled",
}

ALLOWED_TRANSITIONS = {
    "pending": {"confirmed", "processing", "shipping", "completed", "cancelled"},
    "confirmed": {"processing", "shipping", "completed", "cancelled"},
    "processing": {"shipping", "completed", "cancelled"},
    "shipping": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
}


def _serialize_number(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    return value


def get_dashboard_overview() -> dict:
    with get_db_cursor() as cur:
        # 1. Users summary
        cur.execute(
            """
            SELECT
                COUNT(*) AS total_users,
                COUNT(*) FILTER (WHERE status = 'active') AS active_users,
                COUNT(*) FILTER (WHERE role = 'admin') AS admin_users
            FROM users
            """
        )
        user_stats = cur.fetchone()

        # 2. Products summary
        cur.execute(
            """
            SELECT
                COUNT(*) AS total_products,
                COUNT(*) FILTER (WHERE status = 'active') AS active_products,
                COUNT(*) FILTER (WHERE status = 'active' AND stock <= 5) AS low_stock_products,
                COUNT(*) FILTER (WHERE status = 'active' AND stock = 0) AS out_of_stock_products
            FROM products
            """
        )
        product_stats = cur.fetchone()

        # 3. Orders & revenue summary
        cur.execute(
            """
            SELECT
                COUNT(*) AS total_orders,
                COALESCE(SUM(total_amount) FILTER (WHERE status = 'completed'), 0) AS completed_revenue,
                COALESCE(SUM(total_amount) FILTER (WHERE status != 'cancelled'), 0) AS active_revenue,
                COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders,
                COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_orders,
                COUNT(*) FILTER (WHERE status = 'processing') AS processing_orders,
                COUNT(*) FILTER (WHERE status = 'shipping') AS shipping_orders,
                COUNT(*) FILTER (WHERE status = 'completed') AS completed_orders,
                COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders
            FROM orders
            """
        )
        order_stats = cur.fetchone()

        # 4. Top selling products (non-cancelled orders)
        cur.execute(
            """
            SELECT
                oi.product_id,
                oi.product_name,
                SUM(oi.quantity) AS total_sold,
                SUM(oi.subtotal) AS total_revenue,
                p.stock,
                p.image
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE o.status != 'cancelled'
            GROUP BY oi.product_id, oi.product_name, p.stock, p.image
            ORDER BY total_sold DESC, total_revenue DESC
            LIMIT 5
            """
        )
        top_products = [
            {
                "product_id": r["product_id"],
                "product_name": r["product_name"],
                "total_sold": int(r["total_sold"] or 0),
                "total_revenue": _serialize_number(r["total_revenue"] or 0),
                "stock": r.get("stock"),
                "image": r.get("image"),
            }
            for r in cur.fetchall()
        ]

        # 5. Recent orders
        cur.execute(
            """
            SELECT o.id, o.user_id, u.name AS user_name, u.email AS user_email,
                   o.total_amount, o.status, o.shipping_name, o.shipping_phone,
                   o.shipping_address, o.payment_method, o.created_at, o.updated_at
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            ORDER BY o.created_at DESC, o.id DESC
            LIMIT 8
            """
        )
        recent_orders = []
        for r in cur.fetchall():
            item_data = _serialize_order(r, [])
            item_data["user_name"] = r.get("user_name")
            item_data["user_email"] = r.get("user_email")
            recent_orders.append(item_data)

        return {
            "total_users": int(user_stats["total_users"] or 0),
            "active_users": int(user_stats["active_users"] or 0),
            "admin_users": int(user_stats["admin_users"] or 0),
            "total_products": int(product_stats["total_products"] or 0),
            "active_products": int(product_stats["active_products"] or 0),
            "low_stock_products": int(product_stats["low_stock_products"] or 0),
            "out_of_stock_products": int(product_stats["out_of_stock_products"] or 0),
            "total_orders": int(order_stats["total_orders"] or 0),
            "total_revenue": _serialize_number(order_stats["completed_revenue"] or 0),
            "active_revenue": _serialize_number(order_stats["active_revenue"] or 0),
            "orders_by_status": {
                "pending": int(order_stats["pending_orders"] or 0),
                "confirmed": int(order_stats["confirmed_orders"] or 0),
                "processing": int(order_stats["processing_orders"] or 0),
                "shipping": int(order_stats["shipping_orders"] or 0),
                "completed": int(order_stats["completed_orders"] or 0),
                "cancelled": int(order_stats["cancelled_orders"] or 0),
            },
            "top_selling_products": top_products,
            "recent_orders": recent_orders,
        }


# ============================================================
# M10: Admin Category Management
# ============================================================
def admin_list_categories() -> list[dict]:
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT c.id, c.name, c.description, c.status, c.created_at, c.updated_at,
                   COUNT(p.id) AS product_count
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            GROUP BY c.id
            ORDER BY c.id ASC
            """
        )
        rows = cur.fetchall()
    result = []
    for r in rows:
        cat = _serialize_category(r)
        cat["product_count"] = int(r.get("product_count") or 0)
        result.append(cat)
    return result


def admin_create_category(name: str, description: str | None, status: str = "active") -> dict:
    try:
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                """
                INSERT INTO categories (name, description, status)
                VALUES (%s, %s, %s)
                RETURNING id, name, description, status, created_at, updated_at
                """,
                (name, description or "", status),
            )
            return _serialize_category(cur.fetchone())
    except UniqueViolation:
        raise CategoryNameExistsError()


def admin_update_category(
    category_id: int,
    name: str | None = None,
    description: str | None = None,
    status: str | None = None,
) -> dict:
    try:
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                "SELECT id, name, description, status FROM categories WHERE id = %s FOR UPDATE",
                (category_id,),
            )
            existing = cur.fetchone()
            if not existing:
                raise CategoryNotFoundError()

            new_name = name if name is not None else existing["name"]
            new_desc = description if description is not None else existing["description"]
            new_status = status if status is not None else existing["status"]

            cur.execute(
                """
                UPDATE categories
                SET name = %s,
                    description = %s,
                    status = %s
                WHERE id = %s
                RETURNING id, name, description, status, created_at, updated_at
                """,
                (new_name, new_desc, new_status, category_id),
            )
            return _serialize_category(cur.fetchone())
    except UniqueViolation:
        raise CategoryNameExistsError()


def admin_delete_category(category_id: int) -> dict:
    return admin_update_category(category_id, status="inactive")


# ============================================================
# M10: Admin Product Management
# ============================================================
def admin_list_products(
    search: str | None = None,
    category_id: int | None = None,
    status: str | None = None,
) -> list[dict]:
    conditions = ["1=1"]
    params = []

    if search:
        kw = f"%{search.strip()}%"
        conditions.append("(p.name ILIKE %s OR COALESCE(p.description, '') ILIKE %s)")
        params.extend([kw, kw])

    if category_id is not None:
        conditions.append("p.category_id = %s")
        params.append(category_id)

    if status in ("active", "inactive"):
        conditions.append("p.status = %s")
        params.append(status)

    where_clause = " AND ".join(conditions)
    query = f"""
        SELECT p.id, p.category_id, c.name AS category_name,
               p.name, p.description, p.price, p.sizes, p.stock, p.image, p.water_type, p.status,
               p.created_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE {where_clause}
        ORDER BY p.id DESC
    """
    with get_db_cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()
    return [_serialize_product(r) for r in rows]


def admin_create_product(
    name: str,
    category_id: int | None,
    description: str | None,
    price: Decimal,
    stock: int,
    image: str | None,
    status: str = "active",
    water_type: str = "Nước ngọt",
    sizes: list[dict] | None = None,
) -> dict:
    with get_db_cursor(commit=True) as cur:
        if category_id is not None:
            cur.execute("SELECT id, name FROM categories WHERE id = %s", (category_id,))
            cat = cur.fetchone()
            if not cat:
                raise CategoryNotFoundError()
        else:
            cat = None

        normalized_sizes = _normalize_sizes(sizes, price)
        if (price is None or price == 0) and normalized_sizes:
            price = Decimal(str(normalized_sizes[0]["price"]))

        cur.execute(
            """
            INSERT INTO products (category_id, name, description, price, sizes, stock, image, water_type, status)
            VALUES (%s, %s, %s, %s, %s::jsonb, %s, %s, %s, %s)
            RETURNING id, category_id, name, description, price, sizes, stock, image, water_type, status, created_at, updated_at
            """,
            (
                category_id,
                name,
                description or "",
                price,
                json.dumps(normalized_sizes, ensure_ascii=False),
                stock,
                image or "image/ocean-bg.svg",
                water_type or "Nước ngọt",
                status,
            ),
        )
        row = cur.fetchone()
        row["category_name"] = cat["name"] if cat else None
        return _serialize_product(row)


def admin_update_product(
    product_id: int,
    name: str | None = None,
    category_id: int | None = None,
    description: str | None = None,
    price: Decimal | None = None,
    stock: int | None = None,
    image: str | None = None,
    status: str | None = None,
    water_type: str | None = None,
    sizes: list[dict] | None = None,
) -> dict:
    from services.cart_service import ProductNotFoundError

    with get_db_cursor(commit=True) as cur:
        cur.execute(
            """
            SELECT id, category_id, name, description, price, sizes, stock, image, water_type, status
            FROM products
            WHERE id = %s
            FOR UPDATE
            """,
            (product_id,),
        )
        existing = cur.fetchone()
        if not existing:
            raise ProductNotFoundError()

        new_cat_id = category_id if category_id is not None else existing["category_id"]
        if new_cat_id is not None:
            cur.execute("SELECT id, name FROM categories WHERE id = %s", (new_cat_id,))
            cat = cur.fetchone()
            if not cat:
                raise CategoryNotFoundError()
        else:
            cat = None

        new_name = name if name is not None else existing["name"]
        new_desc = description if description is not None else existing["description"]
        new_price = price if price is not None else existing["price"]
        new_stock = stock if stock is not None else existing["stock"]
        new_image = image if image is not None else existing["image"]
        new_water_type = water_type if water_type is not None else (existing.get("water_type") or "Nước ngọt")
        new_status = status if status is not None else existing["status"]

        if sizes is not None:
            new_sizes = _normalize_sizes(sizes, new_price)
        elif price is not None and price != existing["price"]:
            # If only price was updated without explicit sizes, scale or update first size
            old_sizes = _normalize_sizes(existing.get("sizes"), existing["price"])
            if old_sizes:
                old_sizes[0]["price"] = int(new_price)
            new_sizes = old_sizes
        else:
            new_sizes = _normalize_sizes(existing.get("sizes"), new_price)

        cur.execute(
            """
            UPDATE products
            SET category_id = %s,
                name = %s,
                description = %s,
                price = %s,
                sizes = %s::jsonb,
                stock = %s,
                image = %s,
                water_type = %s,
                status = %s
            WHERE id = %s
            RETURNING id, category_id, name, description, price, sizes, stock, image, water_type, status, created_at, updated_at
            """,
            (
                new_cat_id,
                new_name,
                new_desc,
                new_price,
                json.dumps(new_sizes, ensure_ascii=False),
                new_stock,
                new_image,
                new_water_type,
                new_status,
                product_id,
            ),
        )
        row = cur.fetchone()
        row["category_name"] = cat["name"] if cat else None
        return _serialize_product(row)


def admin_delete_product(product_id: int) -> dict:
    return admin_update_product(product_id, status="inactive")


# ============================================================
# M11: Admin Order Management
# ============================================================
def admin_list_orders(status: str | None = None, search: str | None = None) -> list[dict]:
    conditions = ["1=1"]
    params = []

    if status and status in VALID_ORDER_STATUSES:
        conditions.append("o.status = %s")
        params.append(status)

    if search:
        kw = f"%{search.strip()}%"
        conditions.append(
            "(o.shipping_name ILIKE %s OR o.shipping_phone ILIKE %s OR COALESCE(u.email, '') ILIKE %s OR CAST(o.id AS TEXT) ILIKE %s)"
        )
        params.extend([kw, kw, kw, kw])

    where_clause = " AND ".join(conditions)
    with get_db_cursor() as cur:
        cur.execute(
            f"""
            SELECT o.id, o.user_id, u.name AS user_name, u.email AS user_email,
                   o.total_amount, o.status, o.shipping_name, o.shipping_phone,
                   o.shipping_address, o.payment_method, o.created_at, o.updated_at
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            WHERE {where_clause}
            ORDER BY o.created_at DESC, o.id DESC
            """,
            params,
        )
        orders = cur.fetchall()
        if not orders:
            return []

        order_ids = [o["id"] for o in orders]
        cur.execute(
            """
            SELECT oi.id, oi.order_id, oi.product_id, oi.product_name,
                   oi.unit_price, oi.quantity, oi.subtotal,
                   p.image
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = ANY(%s)
            ORDER BY oi.id ASC
            """,
            (order_ids,),
        )
        from services.order_service import _serialize_order_item

        items_by_order: dict[int, list[dict]] = {oid: [] for oid in order_ids}
        for r in cur.fetchall():
            items_by_order[r["order_id"]].append(_serialize_order_item(r))

        result = []
        for o in orders:
            serialized = _serialize_order(o, items_by_order.get(o["id"], []))
            serialized["user_name"] = o.get("user_name")
            serialized["user_email"] = o.get("user_email")
            result.append(serialized)
        return result


def admin_update_order_status(order_id: int, new_status: str) -> dict:
    if new_status not in VALID_ORDER_STATUSES:
        raise InvalidOrderStatusError(f"Trạng thái '{new_status}' không hợp lệ")

    with get_db_cursor(commit=True) as cur:
        cur.execute(
            """
            SELECT id, user_id, total_amount, status,
                   shipping_name, shipping_phone, shipping_address,
                   payment_method, created_at, updated_at
            FROM orders
            WHERE id = %s
            FOR UPDATE
            """,
            (order_id,),
        )
        order = cur.fetchone()
        if not order:
            raise OrderNotFoundError()

        current_status = order["status"]
        if current_status == new_status:
            items = _fetch_order_items(cur, order_id)
            return _serialize_order(order, items)

        allowed = ALLOWED_TRANSITIONS.get(current_status, set())
        if new_status not in allowed:
            raise InvalidOrderStatusError(
                f"Không thể chuyển trạng thái đơn hàng từ '{current_status}' sang '{new_status}'"
            )

        cur.execute(
            """
            UPDATE orders
            SET status = %s
            WHERE id = %s
            RETURNING id, user_id, total_amount, status,
                      shipping_name, shipping_phone, shipping_address,
                      payment_method, created_at, updated_at
            """,
            (new_status, order_id),
        )
        updated_order = cur.fetchone()

        # If transitioning to cancelled, restore stock
        if new_status == "cancelled" and current_status != "cancelled":
            cur.execute(
                """
                SELECT product_id, quantity
                FROM order_items
                WHERE order_id = %s AND product_id IS NOT NULL
                ORDER BY product_id ASC
                """,
                (order_id,),
            )
            for item in cur.fetchall():
                cur.execute(
                    """
                    UPDATE products
                    SET stock = stock + %s
                    WHERE id = %s
                    """,
                    (item["quantity"], item["product_id"]),
                )

        items = _fetch_order_items(cur, order_id)
        return _serialize_order(updated_order, items)


# ============================================================
# M12: Admin User Management
# ============================================================
def admin_list_users(
    search: str | None = None,
    role: str | None = None,
    status: str | None = None,
) -> list[dict]:
    conditions = ["1=1"]
    params = []

    if search:
        kw = f"%{search.strip()}%"
        conditions.append("(u.name ILIKE %s OR u.email ILIKE %s OR COALESCE(u.phone, '') ILIKE %s)")
        params.extend([kw, kw, kw])

    if role in ("customer", "admin"):
        conditions.append("u.role = %s")
        params.append(role)

    if status in ("active", "inactive"):
        conditions.append("u.status = %s")
        params.append(status)

    where_clause = " AND ".join(conditions)
    with get_db_cursor() as cur:
        cur.execute(
            f"""
            SELECT u.id, u.name, u.email, u.role, u.status, u.phone, u.address,
                   u.created_at, u.updated_at,
                   COUNT(o.id) AS order_count,
                   COALESCE(SUM(o.total_amount) FILTER (WHERE o.status != 'cancelled'), 0) AS total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            WHERE {where_clause}
            GROUP BY u.id
            ORDER BY u.id ASC
            """,
            params,
        )
        rows = cur.fetchall()

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "role": r["role"],
            "status": r["status"],
            "phone": r.get("phone") or "",
            "address": r.get("address") or "",
            "order_count": int(r.get("order_count") or 0),
            "total_spent": _serialize_number(r.get("total_spent") or 0),
            "created_at": r["created_at"].isoformat() if r.get("created_at") else None,
            "updated_at": r["updated_at"].isoformat() if r.get("updated_at") else None,
        }
        for r in rows
    ]


def admin_update_user_status(admin_id: int, target_user_id: int, new_status: str) -> dict:
    from services.user_service import UserNotFoundError, _serialize_user

    if admin_id == target_user_id and new_status != "active":
        raise AdminSelfModificationError("Bạn không thể tự khóa tài khoản của chính mình")

    with get_db_cursor(commit=True) as cur:
        cur.execute(
            """
            UPDATE users
            SET status = %s
            WHERE id = %s
            RETURNING id, name, email, role, status, phone, address, created_at, updated_at
            """,
            (new_status, target_user_id),
        )
        row = cur.fetchone()
    if not row:
        raise UserNotFoundError()
    return _serialize_user(row)


def admin_update_user_role(admin_id: int, target_user_id: int, new_role: str) -> dict:
    from services.user_service import UserNotFoundError, _serialize_user

    if admin_id == target_user_id and new_role != "admin":
        raise AdminSelfModificationError("Bạn không thể tự hạ quyền quản trị của chính mình")

    with get_db_cursor(commit=True) as cur:
        cur.execute(
            """
            UPDATE users
            SET role = %s
            WHERE id = %s
            RETURNING id, name, email, role, status, phone, address, created_at, updated_at
            """,
            (new_role, target_user_id),
        )
        row = cur.fetchone()
    if not row:
        raise UserNotFoundError()
    return _serialize_user(row)


def admin_bulk_update_products(
    product_ids: list[int],
    action: str,
    status: str | None = None,
    price_percent: Decimal | None = None,
    fixed_price: Decimal | None = None,
    stock_delta: int | None = None,
) -> dict:
    if not product_ids:
        return {"updated_count": 0}

    clean_ids = sorted({int(pid) for pid in product_ids if int(pid) > 0})
    if not clean_ids:
        return {"updated_count": 0}

    with get_db_cursor(commit=True) as cur:
        if action == "delete":
            cur.execute(
                "UPDATE products SET status = 'inactive' WHERE id = ANY(%s)",
                (clean_ids,),
            )
            return {"updated_count": cur.rowcount}

        if action == "toggle_status":
            if status in ("active", "inactive"):
                cur.execute(
                    "UPDATE products SET status = %s WHERE id = ANY(%s)",
                    (status, clean_ids),
                )
            else:
                cur.execute(
                    """
                    UPDATE products
                    SET status = CASE WHEN status = 'active' THEN 'inactive' ELSE 'active' END
                    WHERE id = ANY(%s)
                    """,
                    (clean_ids,),
                )
            return {"updated_count": cur.rowcount}

        if action == "update_price":
            updated_count = 0
            if fixed_price is not None and fixed_price >= 0:
                cur.execute(
                    "UPDATE products SET price = %s WHERE id = ANY(%s)",
                    (fixed_price, clean_ids),
                )
                updated_count = cur.rowcount
            elif price_percent is not None:
                multiplier = Decimal("1") + (price_percent / Decimal("100"))
                if multiplier < Decimal("0"):
                    multiplier = Decimal("0")
                cur.execute(
                    """
                    UPDATE products
                    SET price = GREATEST(0, ROUND((price * %s) / 1000.0) * 1000)
                    WHERE id = ANY(%s)
                    """,
                    (multiplier, clean_ids),
                )
                updated_count = cur.rowcount

            if stock_delta is not None and stock_delta != 0:
                cur.execute(
                    """
                    UPDATE products
                    SET stock = GREATEST(0, stock + %s)
                    WHERE id = ANY(%s)
                    """,
                    (stock_delta, clean_ids),
                )
                updated_count = max(updated_count, cur.rowcount)

            return {"updated_count": updated_count}

    raise ValueError(f"Hành động hàng loạt '{action}' không hợp lệ")


def get_revenue_report() -> dict:
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT
                COALESCE(c.name, 'Chưa phân loại') AS category_name,
                COUNT(DISTINCT o.id) AS order_count,
                COALESCE(SUM(oi.quantity), 0) AS units_sold,
                COALESCE(SUM(oi.subtotal), 0) AS revenue
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            LEFT JOIN products p ON p.id = oi.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE o.status != 'cancelled'
            GROUP BY COALESCE(c.name, 'Chưa phân loại')
            ORDER BY revenue DESC
            """
        )
        by_category = [
            {
                "category_name": r["category_name"],
                "order_count": int(r["order_count"] or 0),
                "units_sold": int(r["units_sold"] or 0),
                "revenue": _serialize_number(r["revenue"] or 0),
            }
            for r in cur.fetchall()
        ]

        cur.execute(
            """
            SELECT
                payment_method,
                COUNT(*) AS order_count,
                COALESCE(SUM(total_amount), 0) AS revenue
            FROM orders
            WHERE status != 'cancelled'
            GROUP BY payment_method
            """
        )
        by_payment = [
            {
                "payment_method": r["payment_method"],
                "order_count": int(r["order_count"] or 0),
                "revenue": _serialize_number(r["revenue"] or 0),
            }
            for r in cur.fetchall()
        ]

        return {
            "by_category": by_category,
            "by_payment": by_payment,
        }


# ============================================================
# Store & Admin Contact Info Synchronization
# ============================================================
def _ensure_store_settings_table(cur) -> None:
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS store_settings (
            id              INTEGER      PRIMARY KEY DEFAULT 1 CHECK (id = 1),
            studio_title    VARCHAR(120) NOT NULL DEFAULT 'Showroom & Studio',
            address         TEXT         NOT NULL DEFAULT '207 Đ. Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội',
            address_sub     VARCHAR(255) NOT NULL DEFAULT 'Trường ĐH Kinh tế Quốc dân (NEU)',
            hotline_title   VARCHAR(120) NOT NULL DEFAULT 'Hotline & Zalo 24/7',
            phone           VARCHAR(50)  NOT NULL DEFAULT '086 781 7946',
            hotline_sub     VARCHAR(255) NOT NULL DEFAULT 'Hỗ trợ khẩn cấp & tư vấn kỹ thuật',
            email_title     VARCHAR(120) NOT NULL DEFAULT 'Hộp thư Điện tử',
            email           VARCHAR(255) NOT NULL DEFAULT 'admin@aqualife.com',
            email_sub       VARCHAR(255) NOT NULL DEFAULT 'Phản hồi nhanh trong vòng 2 giờ',
            hours_title     VARCHAR(120) NOT NULL DEFAULT 'Giờ Mở Cửa',
            open_hours      VARCHAR(120) NOT NULL DEFAULT '08:00 – 23:59 (T2 – CN)',
            open_hours_sub  VARCHAR(255) NOT NULL DEFAULT 'Hoạt động xuyên lễ & cuối tuần',
            updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
        """
    )


def get_store_settings() -> dict:
    with get_db_cursor(commit=True) as cur:
        _ensure_store_settings_table(cur)

        cur.execute(
            """
            SELECT id, name, email, phone, address
            FROM users
            WHERE role = 'admin' AND status = 'active'
            ORDER BY id ASC
            LIMIT 1
            """
        )
        admin_user = cur.fetchone()

        cur.execute("SELECT * FROM store_settings WHERE id = 1")
        settings = cur.fetchone()

        default_phone = (
            admin_user["phone"]
            if admin_user and admin_user.get("phone") and admin_user["phone"] != "0900000000"
            else "086 781 7946"
        )
        default_address = (
            admin_user["address"]
            if admin_user and admin_user.get("address") and admin_user["address"] != "Aqualife HQ, Ha Noi"
            else "207 Đ. Giải Phóng, Đồng Tâm, Hai Bà Trưng, Hà Nội"
        )
        default_email = (
            admin_user["email"] if admin_user and admin_user.get("email") else "admin@aqualife.com"
        )

        if not settings:
            cur.execute(
                """
                INSERT INTO store_settings (id, address, phone, email)
                VALUES (1, %s, %s, %s)
                RETURNING *
                """,
                (default_address, default_phone, default_email),
            )
            settings = cur.fetchone()

        if admin_user and (
            admin_user.get("phone") in (None, "", "0900000000")
            or admin_user.get("address") in (None, "", "Aqualife HQ, Ha Noi")
        ):
            cur.execute(
                """
                UPDATE users
                SET phone = %s,
                    address = %s
                WHERE id = %s
                RETURNING id, name, email, phone, address
                """,
                (
                    settings["phone"] or default_phone,
                    settings["address"] or default_address,
                    admin_user["id"],
                ),
            )
            admin_user = cur.fetchone()

        effective_phone = (
            admin_user["phone"]
            if admin_user and admin_user.get("phone")
            else settings["phone"]
        )
        effective_address = (
            admin_user["address"]
            if admin_user and admin_user.get("address")
            else settings["address"]
        )
        effective_email = settings["email"] or (
            admin_user["email"] if admin_user and admin_user.get("email") else "info@aqualife.com"
        )

        return {
            "admin_id": admin_user["id"] if admin_user else None,
            "admin_name": admin_user["name"] if admin_user else "Aqualife Admin",
            "admin_email": admin_user["email"] if admin_user else effective_email,
            "studio_title": settings["studio_title"],
            "address": effective_address,
            "address_sub": settings["address_sub"],
            "hotline_title": settings["hotline_title"],
            "phone": effective_phone,
            "hotline_sub": settings["hotline_sub"],
            "email_title": settings["email_title"],
            "email": effective_email,
            "email_sub": settings["email_sub"],
            "hours_title": settings["hours_title"],
            "open_hours": settings["open_hours"],
            "open_hours_sub": settings["open_hours_sub"],
            "updated_at": settings["updated_at"].isoformat() if settings.get("updated_at") else None,
        }


def admin_update_store_settings(admin_id: int, payload: dict) -> dict:
    with get_db_cursor(commit=True) as cur:
        _ensure_store_settings_table(cur)
        current = get_store_settings()

        studio_title = str(payload.get("studio_title") or current["studio_title"]).strip()
        address = str(payload.get("address") or current["address"]).strip()
        address_sub = str(payload.get("address_sub") or current["address_sub"]).strip()
        hotline_title = str(payload.get("hotline_title") or current["hotline_title"]).strip()
        phone = str(payload.get("phone") or current["phone"]).strip()
        hotline_sub = str(payload.get("hotline_sub") or current["hotline_sub"]).strip()
        email_title = str(payload.get("email_title") or current["email_title"]).strip()
        email = str(payload.get("email") or current["email"]).strip()
        email_sub = str(payload.get("email_sub") or current["email_sub"]).strip()
        hours_title = str(payload.get("hours_title") or current["hours_title"]).strip()
        open_hours = str(payload.get("open_hours") or current["open_hours"]).strip()
        open_hours_sub = str(payload.get("open_hours_sub") or current["open_hours_sub"]).strip()
        admin_name = str(payload.get("admin_name") or "").strip()

        cur.execute(
            """
            INSERT INTO store_settings (
                id, studio_title, address, address_sub,
                hotline_title, phone, hotline_sub,
                email_title, email, email_sub,
                hours_title, open_hours, open_hours_sub, updated_at
            )
            VALUES (1, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON CONFLICT (id) DO UPDATE SET
                studio_title = EXCLUDED.studio_title,
                address = EXCLUDED.address,
                address_sub = EXCLUDED.address_sub,
                hotline_title = EXCLUDED.hotline_title,
                phone = EXCLUDED.phone,
                hotline_sub = EXCLUDED.hotline_sub,
                email_title = EXCLUDED.email_title,
                email = EXCLUDED.email,
                email_sub = EXCLUDED.email_sub,
                hours_title = EXCLUDED.hours_title,
                open_hours = EXCLUDED.open_hours,
                open_hours_sub = EXCLUDED.open_hours_sub,
                updated_at = NOW()
            """,
            (
                studio_title,
                address,
                address_sub,
                hotline_title,
                phone,
                hotline_sub,
                email_title,
                email,
                email_sub,
                hours_title,
                open_hours,
                open_hours_sub,
            ),
        )

        # Đồng bộ ngược lại vào tài khoản Admin trong bảng users
        target_admin_id = admin_id or current.get("admin_id")
        if target_admin_id:
            if admin_name:
                cur.execute(
                    "UPDATE users SET name = %s, phone = %s, address = %s WHERE id = %s",
                    (admin_name, phone, address, target_admin_id),
                )
            else:
                cur.execute(
                    "UPDATE users SET phone = %s, address = %s WHERE id = %s",
                    (phone, address, target_admin_id),
                )
            # Đồng bộ cho cả tài khoản admin chính (id đầu tiên) nếu có nhiều admin
            cur.execute(
                """
                UPDATE users
                SET phone = %s, address = %s
                WHERE id = (SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1)
                """,
                (phone, address),
            )

    return get_store_settings()



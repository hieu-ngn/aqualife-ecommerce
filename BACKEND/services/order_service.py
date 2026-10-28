from decimal import Decimal
from config.database import get_db_cursor
from services.cart_service import InsufficientStockError, ProductNotFoundError
from services.product_service import change_size_stock, resolve_size


class EmptyCartError(Exception):
    """Giỏ hàng đang trống."""


class OrderNotFoundError(Exception):
    """Không tìm thấy đơn hàng."""


class OrderForbiddenError(Exception):
    """Không có quyền truy cập đơn hàng của người khác."""


class InvalidOrderStatusError(Exception):
    """Trạng thái đơn hàng không cho phép thực hiện thao tác này."""


ALLOWED_PAYMENT_METHODS = {"cod", "bank_transfer"}
CANCELLABLE_STATUSES = {"pending", "confirmed"}


def _serialize_number(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    return value


def _serialize_order_item(row):
    return {
        "id": row["id"],
        "order_id": row["order_id"],
        "product_id": row.get("product_id"),
        "product_name": row["product_name"],
        "unit_price": _serialize_number(row["unit_price"]),
        "quantity": row["quantity"],
        "subtotal": _serialize_number(row["subtotal"]),
        "image": row.get("image"),
    }


def _serialize_order(row, items=None):
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "total_amount": _serialize_number(row["total_amount"]),
        "status": row["status"],
        "shipping_name": row["shipping_name"],
        "shipping_phone": row["shipping_phone"],
        "shipping_address": row["shipping_address"],
        "payment_method": row["payment_method"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
        "items": items if items is not None else [],
    }


def _fetch_order_items(cur, order_id: int) -> list[dict]:
    cur.execute(
        """
        SELECT oi.id, oi.order_id, oi.product_id, oi.product_name,
               oi.unit_price, oi.quantity, oi.subtotal,
               p.image
        FROM order_items oi
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = %s
        ORDER BY oi.id ASC
        """,
        (order_id,),
    )
    return [_serialize_order_item(r) for r in cur.fetchall()]


def create_order(
    user_id: int,
    shipping_name: str,
    shipping_phone: str,
    shipping_address: str,
    payment_method: str,
    fallback_items: list[dict] | None = None,
) -> dict:
    if payment_method not in ALLOWED_PAYMENT_METHODS:
        raise ValueError("Phương thức thanh toán không hợp lệ")

    with get_db_cursor(commit=True) as cur:

        # 1. Read current cart from database
        cur.execute("SELECT id FROM cart WHERE user_id = %s", (user_id,))
        cart_row = cur.fetchone()
        cart_id = cart_row["id"] if cart_row else None

        requested_quantities: dict[int, int] = {}
        requested_sizes: dict[int, str] = {}

        if cart_id is not None:
            cur.execute(
                """
                SELECT product_id, quantity, selected_size
                FROM cart_items
                WHERE cart_id = %s
                ORDER BY product_id ASC
                """,
                (cart_id,),
            )
            for row in cur.fetchall():
                pid = int(row["product_id"])
                requested_quantities[pid] = int(row["quantity"])
                if row.get("selected_size"):
                    requested_sizes[pid] = str(row["selected_size"])

        # Fallback to client-provided items if DB cart is empty
        if not requested_quantities and fallback_items:
            for item in fallback_items:
                pid = int(item["product_id"])
                qty = int(item["quantity"])
                if qty > 0:
                    requested_quantities[pid] = requested_quantities.get(pid, 0) + qty
                    if item.get("selected_size"):
                        requested_sizes[pid] = str(item["selected_size"])

        if not requested_quantities:
            raise EmptyCartError("Giỏ hàng đang trống")

        # 2. Lock relevant product rows in deterministic order
        product_ids = sorted(requested_quantities.keys())
        cur.execute(
            """
            SELECT id, name, price, sizes, stock, status, image
            FROM products
            WHERE id = ANY(%s)
            ORDER BY id ASC
            FOR UPDATE
            """,
            (product_ids,),
        )
        locked_products = {r["id"]: r for r in cur.fetchall()}

        # 3. Validate product status & stock, and calculate authoritative totals
        total_amount = Decimal("0")
        prepared_items = []

        for pid in product_ids:
            qty = requested_quantities[pid]
            product = locked_products.get(pid)
            if not product or product["status"] != "active":
                raise ProductNotFoundError(f"Sản phẩm #{pid} không tồn tại hoặc ngừng bán")

            chosen_size = requested_sizes.get(pid, "")
            chosen = resolve_size(product, chosen_size)
            unit_price = chosen["price"]
            # khách không chọn size => giữ tên gốc; tồn kho vẫn tính theo size đầu (size nhỏ nhất)
            resolved_size = chosen["label"] if chosen_size.strip() else ""
            # tồn kho kiểm tra theo TỪNG kích thước
            if chosen["stock"] < qty:
                raise InsufficientStockError(f"{product['name']} ({chosen['label']})", chosen["stock"])
            subtotal = unit_price * Decimal(qty)
            total_amount += subtotal

            snap_name = (
                f"{product['name']} ({resolved_size})"
                if resolved_size
                else product["name"]
            )

            prepared_items.append(
                {
                    "product_id": pid,
                    "product_name": snap_name,
                    "size_label": resolved_size,
                    "unit_price": unit_price,
                    "quantity": qty,
                    "subtotal": subtotal,
                    "image": product.get("image"),
                }
            )

        # 4. Insert order
        cur.execute(
            """
            INSERT INTO orders (
                user_id, total_amount, status,
                shipping_name, shipping_phone, shipping_address, payment_method
            )
            VALUES (%s, %s, 'pending', %s, %s, %s, %s)
            RETURNING id, user_id, total_amount, status,
                      shipping_name, shipping_phone, shipping_address,
                      payment_method, created_at, updated_at
            """,
            (
                user_id,
                total_amount,
                shipping_name,
                shipping_phone,
                shipping_address,
                payment_method,
            ),
        )
        order_row = cur.fetchone()
        order_id = order_row["id"]

        # 5. Insert order_items (snapshot) & decrease product stock
        created_items = []
        for item in prepared_items:
            cur.execute(
                """
                INSERT INTO order_items (
                    order_id, product_id, product_name,
                    unit_price, quantity, subtotal, size_label
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING id, order_id, product_id, product_name,
                          unit_price, quantity, subtotal
                """,
                (
                    order_id,
                    item["product_id"],
                    item["product_name"],
                    item["unit_price"],
                    item["quantity"],
                    item["subtotal"],
                    item["size_label"],
                ),
            )
            oi_row = cur.fetchone()
            oi_row["image"] = item["image"]
            created_items.append(_serialize_order_item(oi_row))

            change_size_stock(cur, item["product_id"], item["size_label"], -item["quantity"])

        # 6. Clear cart
        if cart_id is not None:
            cur.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart_id,))
            cur.execute("UPDATE cart SET updated_at = NOW() WHERE id = %s", (cart_id,))

        return _serialize_order(order_row, created_items)


def list_orders_for_user(user_id: int) -> list[dict]:
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, total_amount, status,
                   shipping_name, shipping_phone, shipping_address,
                   payment_method, created_at, updated_at
            FROM orders
            WHERE user_id = %s
            ORDER BY created_at DESC, id DESC
            """,
            (user_id,),
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
        items_by_order: dict[int, list[dict]] = {oid: [] for oid in order_ids}
        for r in cur.fetchall():
            items_by_order[r["order_id"]].append(_serialize_order_item(r))

        return [_serialize_order(o, items_by_order.get(o["id"], [])) for o in orders]


def get_order_for_user(user_id: int, order_id: int) -> dict:
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT id, user_id, total_amount, status,
                   shipping_name, shipping_phone, shipping_address,
                   payment_method, created_at, updated_at
            FROM orders
            WHERE id = %s
            """,
            (order_id,),
        )
        order = cur.fetchone()
        if not order:
            raise OrderNotFoundError()
        if order["user_id"] != user_id:
            raise OrderForbiddenError()

        items = _fetch_order_items(cur, order_id)
        return _serialize_order(order, items)


def cancel_order_for_user(user_id: int, order_id: int) -> dict:
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
        if order["user_id"] != user_id:
            raise OrderForbiddenError()
        if order["status"] not in CANCELLABLE_STATUSES:
            raise InvalidOrderStatusError(
                f"Không thể hủy đơn hàng ở trạng thái '{order['status']}'"
            )

        cur.execute(
            """
            UPDATE orders
            SET status = 'cancelled'
            WHERE id = %s
            RETURNING id, user_id, total_amount, status,
                      shipping_name, shipping_phone, shipping_address,
                      payment_method, created_at, updated_at
            """,
            (order_id,),
        )
        updated_order = cur.fetchone()

        # Restore stock for all items in the cancelled order
        cur.execute(
            """
            SELECT product_id, quantity, size_label
            FROM order_items
            WHERE order_id = %s AND product_id IS NOT NULL
            ORDER BY product_id ASC
            """,
            (order_id,),
        )
        for item in cur.fetchall():
            change_size_stock(cur, item["product_id"], item["size_label"], item["quantity"])

        items = _fetch_order_items(cur, order_id)
        return _serialize_order(updated_order, items)

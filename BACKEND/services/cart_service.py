from decimal import Decimal
from config.database import get_db_cursor


class ProductNotFoundError(Exception):
    """Sản phẩm không tồn tại hoặc ngừng kinh doanh."""


class InsufficientStockError(Exception):
    """Số lượng vượt quá tồn kho hiện tại."""

    def __init__(self, product_name: str = "", available_stock: int = 0):
        self.product_name = product_name
        self.available_stock = available_stock
        msg = (
            f"Sản phẩm '{product_name}' chỉ còn {available_stock} trong kho (Insufficient stock)"
            if product_name
            else "Insufficient stock"
        )
        super().__init__(msg)


class CartItemNotFoundError(Exception):
    """Không tìm thấy sản phẩm trong giỏ hàng."""


def _serialize_number(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    return value


def _get_or_create_cart_id(cur, user_id: int) -> int:
    cur.execute("SELECT id FROM cart WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    if row:
        return row["id"]

    cur.execute(
        """
        INSERT INTO cart (user_id)
        VALUES (%s)
        ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
        RETURNING id
        """,
        (user_id,),
    )
    return cur.fetchone()["id"]


def _fetch_cart_payload(cur, cart_id: int, user_id: int) -> dict:
    cur.execute(
        """
        SELECT ci.id,
               ci.product_id,
               ci.quantity,
               ci.selected_size,
               ci.unit_price,
               p.name,
               p.price,
               p.sizes,
               p.stock,
               p.image,
               p.status,
               (COALESCE(ci.unit_price, p.price) * ci.quantity) AS subtotal
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.cart_id = %s
        ORDER BY ci.id ASC
        """,
        (cart_id,),
    )
    rows = cur.fetchall()
    items = []
    total_amount = Decimal("0")
    total_quantity = 0

    for r in rows:
        effective_price = r.get("unit_price") if r.get("unit_price") is not None else r["price"]
        subtotal = r["subtotal"] or Decimal("0")
        total_amount += subtotal
        total_quantity += r["quantity"]
        items.append(
            {
                "id": r["id"],
                "product_id": r["product_id"],
                "name": r["name"],
                "selected_size": r.get("selected_size") or "",
                "price": _serialize_number(effective_price),
                "stock": r["stock"],
                "image": r.get("image"),
                "status": r["status"],
                "quantity": r["quantity"],
                "subtotal": _serialize_number(subtotal),
            }
        )

    return {
        "cart_id": cart_id,
        "user_id": user_id,
        "items": items,
        "total_quantity": total_quantity,
        "total_amount": _serialize_number(total_amount),
    }


def get_cart(user_id: int) -> dict:
    with get_db_cursor(commit=True) as cur:
        cart_id = _get_or_create_cart_id(cur, user_id)
        return _fetch_cart_payload(cur, cart_id, user_id)


def add_to_cart(
    user_id: int,
    product_id: int,
    quantity: int,
    selected_size: str | None = None,
) -> dict:
    from services.product_service import resolve_size_price

    if quantity <= 0:
        raise ValueError("Số lượng phải lớn hơn 0")

    with get_db_cursor(commit=True) as cur:
        cart_id = _get_or_create_cart_id(cur, user_id)

        cur.execute(
            """
            SELECT id, name, price, sizes, stock, status
            FROM products
            WHERE id = %s
            FOR UPDATE
            """,
            (product_id,),
        )
        product = cur.fetchone()
        if not product or product["status"] != "active":
            raise ProductNotFoundError()

        resolved_size, resolved_price = resolve_size_price(product, selected_size)

        cur.execute(
            """
            SELECT id, quantity, selected_size, unit_price
            FROM cart_items
            WHERE cart_id = %s AND product_id = %s
            """,
            (cart_id, product_id),
        )
        existing = cur.fetchone()
        current_qty = existing["quantity"] if existing else 0
        new_qty = current_qty + quantity

        if new_qty > product["stock"]:
            raise InsufficientStockError(product["name"], product["stock"])

        final_size = resolved_size if resolved_size else (existing.get("selected_size") or "" if existing else "")
        final_price = resolved_price if resolved_size or not existing or existing.get("unit_price") is None else existing["unit_price"]

        cur.execute(
            """
            INSERT INTO cart_items (cart_id, product_id, quantity, selected_size, unit_price)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (cart_id, product_id)
            DO UPDATE SET
                quantity = EXCLUDED.quantity,
                selected_size = EXCLUDED.selected_size,
                unit_price = EXCLUDED.unit_price
            """,
            (cart_id, product_id, new_qty, final_size, final_price),
        )
        cur.execute("UPDATE cart SET updated_at = NOW() WHERE id = %s", (cart_id,))
        return _fetch_cart_payload(cur, cart_id, user_id)


def update_cart_item(user_id: int, item_or_product_id: int, quantity: int) -> dict:
    with get_db_cursor(commit=True) as cur:
        cart_id = _get_or_create_cart_id(cur, user_id)

        cur.execute(
            """
            SELECT id, product_id, quantity
            FROM cart_items
            WHERE cart_id = %s AND id = %s
            """,
            (cart_id, item_or_product_id),
        )
        item = cur.fetchone()
        if not item:
            cur.execute(
                """
                SELECT id, product_id, quantity
                FROM cart_items
                WHERE cart_id = %s AND product_id = %s
                """,
                (cart_id, item_or_product_id),
            )
            item = cur.fetchone()

        if not item:
            raise CartItemNotFoundError()

        if quantity <= 0:
            cur.execute("DELETE FROM cart_items WHERE id = %s", (item["id"],))
            return _fetch_cart_payload(cur, cart_id, user_id)

        cur.execute(
            """
            SELECT id, name, stock, status
            FROM products
            WHERE id = %s
            FOR UPDATE
            """,
            (item["product_id"],),
        )
        product = cur.fetchone()
        if not product or product["status"] != "active":
            raise ProductNotFoundError()

        if quantity > product["stock"]:
            raise InsufficientStockError(product["name"], product["stock"])

        cur.execute(
            "UPDATE cart_items SET quantity = %s WHERE id = %s",
            (quantity, item["id"]),
        )
        cur.execute("UPDATE cart SET updated_at = NOW() WHERE id = %s", (cart_id,))
        return _fetch_cart_payload(cur, cart_id, user_id)


def remove_cart_item(user_id: int, item_or_product_id: int) -> dict:
    with get_db_cursor(commit=True) as cur:
        cart_id = _get_or_create_cart_id(cur, user_id)
        cur.execute(
            """
            DELETE FROM cart_items
            WHERE cart_id = %s AND id = %s
            RETURNING id
            """,
            (cart_id, item_or_product_id),
        )
        deleted = cur.fetchone()
        if not deleted:
            cur.execute(
                """
                DELETE FROM cart_items
                WHERE cart_id = %s AND product_id = %s
                RETURNING id
                """,
                (cart_id, item_or_product_id),
            )
            deleted = cur.fetchone()

        if not deleted:
            raise CartItemNotFoundError()

        cur.execute("UPDATE cart SET updated_at = NOW() WHERE id = %s", (cart_id,))
        return _fetch_cart_payload(cur, cart_id, user_id)


def clear_cart(user_id: int) -> dict:
    with get_db_cursor(commit=True) as cur:
        cart_id = _get_or_create_cart_id(cur, user_id)
        cur.execute("DELETE FROM cart_items WHERE cart_id = %s", (cart_id,))
        cur.execute("UPDATE cart SET updated_at = NOW() WHERE id = %s", (cart_id,))
        return _fetch_cart_payload(cur, cart_id, user_id)

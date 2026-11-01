from flask import g, request, session
from middleware.auth import login_required
from services import cart_service, product_service
from utils.responses import success, error


def _sync_flask_session_cart(cart_payload: dict) -> dict:
    """Đồng bộ giỏ hàng vào Flask Session (session['cart']) theo đúng yêu cầu lưu trữ phiên làm việc."""
    session_items = {}
    for item in cart_payload.get("items", []):
        pid = str(item["product_id"])
        session_items[pid] = {
            "product_id": item["product_id"],
            "name": item["name"],
            "price": item["price"],
            "quantity": item["quantity"],
            "selected_size": item.get("selected_size", ""),
            "subtotal": item["subtotal"],
            "image": item.get("image"),
        }
    session["cart"] = session_items
    session.modified = True
    cart_payload["session_synced"] = True
    return cart_payload


def _build_session_cart_payload() -> dict:
    """Đọc giỏ hàng lưu trực tiếp trong Flask Session (hỗ trợ cả khách chưa đăng nhập)."""
    raw_cart = session.get("cart")
    if not isinstance(raw_cart, dict):
        raw_cart = {}

    items = []
    total_quantity = 0
    total_amount = 0
    cleaned_cart = {}

    for pid_str, entry in raw_cart.items():
        try:
            pid = int(pid_str)
            qty = int(entry.get("quantity", 0)) if isinstance(entry, dict) else int(entry)
        except (TypeError, ValueError):
            continue

        if qty <= 0:
            continue

        product = product_service.get_product_by_id(pid)
        if not product or product.get("status") != "active":
            continue

        selected_size = (
            str(entry.get("selected_size") or "") if isinstance(entry, dict) else ""
        )
        price = product["price"]
        subtotal = price * qty
        total_quantity += qty
        total_amount += subtotal

        item_data = {
            "id": pid,
            "product_id": pid,
            "name": product["name"],
            "price": price,
            "stock": product["stock"],
            "image": product.get("image"),
            "water_type": product.get("water_type"),
            "category_name": product.get("category_name"),
            "selected_size": selected_size,
            "status": product["status"],
            "quantity": qty,
            "subtotal": subtotal,
        }
        items.append(item_data)
        cleaned_cart[str(pid)] = {
            "product_id": pid,
            "name": product["name"],
            "price": price,
            "quantity": qty,
            "selected_size": selected_size,
            "subtotal": subtotal,
            "image": product.get("image"),
        }

    session["cart"] = cleaned_cart
    session.modified = True

    return {
        "storage": "flask_session",
        "items": items,
        "total_quantity": total_quantity,
        "total_amount": total_amount,
    }


def get_session_cart():
    return success(_build_session_cart_payload())


def add_to_session_cart():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    try:
        product_id = int(body.get("product_id"))
        quantity = int(body.get("quantity", 1))
    except (TypeError, ValueError):
        return error("product_id và quantity phải là số nguyên hợp lệ", 422)

    if quantity <= 0:
        return error("Số lượng sản phẩm phải lớn hơn 0", 422)

    selected_size = str(body.get("selected_size") or body.get("size") or "").strip()

    product = product_service.get_product_by_id(product_id)
    if not product or product.get("status") != "active":
        return error("Product not found", 404)

    raw_cart = session.get("cart")
    if not isinstance(raw_cart, dict):
        raw_cart = {}

    existing = raw_cart.get(str(product_id))
    current_qty = (
        int(existing.get("quantity", 0))
        if isinstance(existing, dict)
        else int(existing or 0)
    )
    new_qty = current_qty + quantity

    if new_qty > product["stock"]:
        return error(
            f"Sản phẩm '{product['name']}' chỉ còn {product['stock']} trong kho (Insufficient stock)",
            400,
        )

    raw_cart[str(product_id)] = {
        "product_id": product_id,
        "name": product["name"],
        "price": product["price"],
        "quantity": new_qty,
        "selected_size": selected_size,
        "subtotal": product["price"] * new_qty,
        "image": product.get("image"),
    }
    session["cart"] = raw_cart
    session.modified = True

    return success(_build_session_cart_payload(), 201)


def update_session_cart_item(product_id: int):
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    try:
        quantity = int(body.get("quantity"))
    except (TypeError, ValueError):
        return error("Số lượng không hợp lệ", 422)

    if quantity < 0:
        return error("Số lượng không được âm", 422)

    raw_cart = session.get("cart")
    if not isinstance(raw_cart, dict):
        raw_cart = {}

    if quantity == 0:
        raw_cart.pop(str(product_id), None)
        session["cart"] = raw_cart
        session.modified = True
        return success(_build_session_cart_payload())

    product = product_service.get_product_by_id(product_id)
    if not product or product.get("status") != "active":
        return error("Product not found", 404)

    if quantity > product["stock"]:
        return error(
            f"Sản phẩm '{product['name']}' chỉ còn {product['stock']} trong kho (Insufficient stock)",
            400,
        )

    existing = raw_cart.get(str(product_id))
    selected_size = (
        str(existing.get("selected_size") or "") if isinstance(existing, dict) else ""
    )

    raw_cart[str(product_id)] = {
        "product_id": product_id,
        "name": product["name"],
        "price": product["price"],
        "quantity": quantity,
        "selected_size": selected_size,
        "subtotal": product["price"] * quantity,
        "image": product.get("image"),
    }
    session["cart"] = raw_cart
    session.modified = True
    return success(_build_session_cart_payload())


def remove_session_cart_item(product_id: int):
    raw_cart = session.get("cart")
    if isinstance(raw_cart, dict):
        raw_cart.pop(str(product_id), None)
        session["cart"] = raw_cart
        session.modified = True
    return success(_build_session_cart_payload())


def clear_session_cart():
    session["cart"] = {}
    session.modified = True
    return success(_build_session_cart_payload())


@login_required
def get_cart():
    data = cart_service.get_cart(g.current_user["id"])
    return success(_sync_flask_session_cart(data))


@login_required
def add_to_cart():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    product_id = body.get("product_id")
    quantity = body.get("quantity", 1)
    selected_size = str(body.get("selected_size") or body.get("size") or "").strip()

    try:
        product_id = int(product_id)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return error("product_id và quantity phải là số nguyên hợp lệ", 422)

    if quantity <= 0:
        return error("Số lượng sản phẩm phải lớn hơn 0", 422)

    try:
        data = cart_service.add_to_cart(
            g.current_user["id"], product_id, quantity, selected_size=selected_size
        )
    except cart_service.ProductNotFoundError:
        return error("Product not found", 404)
    except cart_service.InsufficientStockError as exc:
        return error(str(exc), 400)

    return success(_sync_flask_session_cart(data), 201)


@login_required
def update_cart_item(item_id: int):
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    try:
        quantity = int(body.get("quantity"))
    except (TypeError, ValueError):
        return error("Số lượng không hợp lệ", 422)

    if quantity < 0:
        return error("Số lượng không được âm", 422)

    try:
        data = cart_service.update_cart_item(g.current_user["id"], item_id, quantity)
    except cart_service.CartItemNotFoundError:
        return error("Không tìm thấy sản phẩm trong giỏ hàng", 404)
    except cart_service.ProductNotFoundError:
        return error("Product not found", 404)
    except cart_service.InsufficientStockError as exc:
        return error(str(exc), 400)

    return success(_sync_flask_session_cart(data))


@login_required
def remove_cart_item(item_id: int):
    try:
        data = cart_service.remove_cart_item(g.current_user["id"], item_id)
    except cart_service.CartItemNotFoundError:
        return error("Không tìm thấy sản phẩm trong giỏ hàng", 404)

    return success(_sync_flask_session_cart(data))


@login_required
def clear_cart():
    data = cart_service.clear_cart(g.current_user["id"])
    return success(_sync_flask_session_cart(data))

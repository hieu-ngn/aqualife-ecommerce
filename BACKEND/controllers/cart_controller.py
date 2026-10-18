from flask import g, request
from middleware.auth import login_required
from services import cart_service
from utils.responses import success, error


@login_required
def get_cart():
    data = cart_service.get_cart(g.current_user["id"])
    return success(data)


@login_required
def add_to_cart():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    product_id = body.get("product_id")
    quantity = body.get("quantity", 1)

    try:
        product_id = int(product_id)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return error("product_id và quantity phải là số nguyên hợp lệ", 422)

    if quantity <= 0:
        return error("Số lượng sản phẩm phải lớn hơn 0", 422)

    try:
        data = cart_service.add_to_cart(g.current_user["id"], product_id, quantity)
    except cart_service.ProductNotFoundError:
        return error("Product not found", 404)
    except cart_service.InsufficientStockError as exc:
        return error(str(exc), 400)

    return success(data, 201)


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

    return success(data)


@login_required
def remove_cart_item(item_id: int):
    try:
        data = cart_service.remove_cart_item(g.current_user["id"], item_id)
    except cart_service.CartItemNotFoundError:
        return error("Không tìm thấy sản phẩm trong giỏ hàng", 404)

    return success(data)


@login_required
def clear_cart():
    data = cart_service.clear_cart(g.current_user["id"])
    return success(data)

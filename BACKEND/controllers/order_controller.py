import re
from flask import g, request, session
from middleware.auth import login_required
from decimal import Decimal, InvalidOperation
from services import order_service
from services.cart_service import InsufficientStockError, ProductNotFoundError
from services.voucher_service import (
    validate_voucher,
    calculate_shipping_fee,
    list_active_vouchers,
    VoucherNotFoundError,
    VoucherExpiredError,
    VoucherUsageLimitError,
    VoucherMinOrderError,
)
from utils.responses import success, error

PHONE_RE = re.compile(r"^[0-9+\-\s()]{8,20}$")

PAYMENT_ALIASES = {
    "cod": "cod",
    "cash": "cod",
    "tien_mat": "cod",
    "bank_transfer": "bank_transfer",
    "transfer": "bank_transfer",
    "chuyen_khoan": "bank_transfer",
}


@login_required
def create_order():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    shipping_name = str(body.get("shipping_name") or "").strip()
    shipping_phone = str(body.get("shipping_phone") or "").strip()
    shipping_address = str(body.get("shipping_address") or "").strip()
    raw_payment = str(body.get("payment_method") or "cod").strip().lower()
    payment_method = PAYMENT_ALIASES.get(raw_payment)

    if not shipping_name:
        return error("Vui lòng nhập họ tên người nhận", 422)
    if len(shipping_name) > 100:
        return error("Họ tên người nhận không vượt quá 100 ký tự", 422)
    if not shipping_phone or not PHONE_RE.match(shipping_phone):
        return error("Số điện thoại người nhận không hợp lệ", 422)
    if not shipping_address:
        return error("Vui lòng nhập địa chỉ giao hàng", 422)
    if not payment_method:
        return error("Phương thức thanh toán không hợp lệ (chỉ hỗ trợ cod hoặc bank_transfer)", 422)

    raw_items = body.get("items")
    fallback_items = None
    if isinstance(raw_items, list):
        fallback_items = []
        for entry in raw_items:
            if not isinstance(entry, dict):
                return error("Danh sách sản phẩm gửi kèm không hợp lệ", 422)
            try:
                pid = int(entry.get("product_id"))
                qty = int(entry.get("quantity", 0))
            except (TypeError, ValueError):
                return error("product_id và quantity phải là số nguyên", 422)
            if qty <= 0:
                return error("Số lượng sản phẩm phải lớn hơn 0", 422)
            sel_size = str(entry.get("selected_size") or entry.get("size") or "").strip()
            fallback_items.append({"product_id": pid, "quantity": qty, "selected_size": sel_size})
    elif isinstance(session.get("cart"), dict) and session["cart"]:
        fallback_items = []
        for pid_str, entry in session["cart"].items():
            try:
                pid = int(pid_str)
                qty = int(entry.get("quantity", 0)) if isinstance(entry, dict) else int(entry)
                sel_size = (
                    str(entry.get("selected_size") or "")
                    if isinstance(entry, dict)
                    else ""
                )
                if pid > 0 and qty > 0:
                    fallback_items.append(
                        {"product_id": pid, "quantity": qty, "selected_size": sel_size}
                    )
            except (TypeError, ValueError):
                continue

    shipping_method = str(body.get("shipping_method") or "standard").strip().lower()
    voucher_code = str(body.get("voucher_code") or "").strip() or None

    try:
        order = order_service.create_order(
            user_id=g.current_user["id"],
            shipping_name=shipping_name,
            shipping_phone=shipping_phone,
            shipping_address=shipping_address,
            payment_method=payment_method,
            shipping_method=shipping_method,
            voucher_code=voucher_code,
            fallback_items=fallback_items,
        )
    except order_service.EmptyCartError as exc:
        return error(str(exc), 400)
    except ProductNotFoundError:
        return error("Product not found", 404)
    except InsufficientStockError as exc:
        return error(str(exc), 400)
    except (VoucherNotFoundError, VoucherExpiredError, VoucherUsageLimitError, VoucherMinOrderError) as exc:
        return error(str(exc), 400)

    session["cart"] = {}
    session.modified = True

    return success(order, 201)


@login_required
def list_orders():
    orders = order_service.list_orders_for_user(g.current_user["id"])
    return success(orders)


@login_required
def get_order(order_id: int):
    try:
        order = order_service.get_order_for_user(g.current_user["id"], order_id)
    except order_service.OrderNotFoundError:
        return error("Không tìm thấy đơn hàng", 404)
    except order_service.OrderForbiddenError:
        return error("Bạn không có quyền xem đơn hàng này", 403)

    return success(order)


@login_required
def cancel_order(order_id: int):
    try:
        order = order_service.cancel_order_for_user(g.current_user["id"], order_id)
    except order_service.OrderNotFoundError:
        return error("Không tìm thấy đơn hàng", 404)
    except order_service.OrderForbiddenError:
        return error("Bạn không có quyền hủy đơn hàng này", 403)
    except order_service.InvalidOrderStatusError as exc:
        return error(str(exc), 400)

    return success(order)


def list_vouchers():
    """Lấy danh sách mã giảm giá đang hoạt động cho khách hàng."""
    return success(list_active_vouchers())


def apply_voucher():
    """Kiểm tra và tính toán giảm giá của voucher trước khi đặt hàng."""
    body = request.get_json(silent=True) or {}
    code = str(body.get("code") or "").strip()
    if not code:
        return error("Vui lòng nhập mã giảm giá", 422)

    raw_subtotal = body.get("subtotal")
    try:
        subtotal = Decimal(str(raw_subtotal)) if raw_subtotal is not None else Decimal("0")
    except (InvalidOperation, TypeError):
        return error("Giá trị đơn hàng không hợp lệ", 422)

    shipping_method = str(body.get("shipping_method") or "standard").strip().lower()
    shipping_fee = calculate_shipping_fee(shipping_method, subtotal)

    try:
        result = validate_voucher(code, subtotal, shipping_fee)
        result["shipping_fee"] = float(shipping_fee)
        result["total_amount"] = max(0.0, float(subtotal + shipping_fee) - result["discount_amount"])
        return success(result)
    except (VoucherNotFoundError, VoucherExpiredError, VoucherUsageLimitError, VoucherMinOrderError) as exc:
        return error(str(exc), 400)
    except Exception as exc:
        return error(f"Lỗi kiểm tra voucher: {str(exc)}", 500)

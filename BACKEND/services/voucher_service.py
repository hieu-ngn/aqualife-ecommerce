from decimal import Decimal
from config.database import get_db_cursor


class VoucherNotFoundError(Exception):
    pass

class VoucherExpiredError(Exception):
    pass

class VoucherUsageLimitError(Exception):
    pass

class VoucherMinOrderError(Exception):
    pass


# Shipping fee constants
SHIPPING_FEES = {
    "standard": Decimal("30000"),
    "express": Decimal("50000"),
}
FREE_SHIPPING_THRESHOLD = Decimal("500000")  # Free standard shipping for orders >= 500k


def calculate_shipping_fee(method: str, subtotal: Decimal) -> Decimal:
    """Calculate shipping fee. Standard is free for orders >= 500k."""
    if method not in SHIPPING_FEES:
        method = "standard"
    fee = SHIPPING_FEES[method]
    if method == "standard" and subtotal >= FREE_SHIPPING_THRESHOLD:
        return Decimal("0")
    return fee


def validate_voucher(code: str, subtotal: Decimal, shipping_fee: Decimal = Decimal("0")) -> dict:
    """Validate a voucher code and return discount info. Does NOT increment used_count."""
    code = code.strip().upper()
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT id, code, discount_type, discount_value, max_discount,
                   min_order_amount, usage_limit, used_count, starts_at, expires_at, status
            FROM vouchers
            WHERE code = %s
            """,
            (code,),
        )
        v = cur.fetchone()

    if not v:
        raise VoucherNotFoundError(f"Mã giảm giá '{code}' không tồn tại")

    if v["status"] != "active":
        raise VoucherExpiredError("Mã giảm giá đã bị vô hiệu hóa")

    if v["expires_at"] is not None:
        cur_time_check = None
        with get_db_cursor() as cur2:
            cur2.execute("SELECT NOW() AS now")
            cur_time_check = cur2.fetchone()["now"]
        if cur_time_check and v["expires_at"] < cur_time_check:
            raise VoucherExpiredError("Mã giảm giá đã hết hạn sử dụng")

    if v["usage_limit"] is not None and v["used_count"] >= v["usage_limit"]:
        raise VoucherUsageLimitError("Mã giảm giá đã được sử dụng hết số lượt cho phép")

    min_order = Decimal(str(v["min_order_amount"] or 0))
    if subtotal < min_order:
        raise VoucherMinOrderError(
            f"Đơn hàng tối thiểu {int(min_order):,}₫ để sử dụng mã này".replace(",", ".")
        )

    discount_amount = _calc_discount(v, subtotal, shipping_fee)

    return {
        "voucher_id": v["id"],
        "code": v["code"],
        "discount_type": v["discount_type"],
        "discount_value": float(v["discount_value"]),
        "max_discount": float(v["max_discount"]) if v["max_discount"] else None,
        "min_order_amount": float(min_order),
        "discount_amount": float(discount_amount),
        "message": _build_message(v, discount_amount),
    }


def apply_voucher_in_transaction(cur, code: str, subtotal: Decimal, shipping_fee: Decimal = Decimal("0")) -> tuple[Decimal, str]:
    """Inside a transaction, validate + lock + increment used_count. Returns (discount_amount, code_upper)."""
    code = code.strip().upper()
    cur.execute(
        """
        SELECT id, code, discount_type, discount_value, max_discount,
               min_order_amount, usage_limit, used_count, expires_at, status
        FROM vouchers
        WHERE code = %s
        FOR UPDATE
        """,
        (code,),
    )
    v = cur.fetchone()
    if not v or v["status"] != "active":
        raise VoucherNotFoundError(f"Mã giảm giá '{code}' không hợp lệ")

    if v["expires_at"] is not None:
        cur.execute("SELECT NOW() AS now")
        if v["expires_at"] < cur.fetchone()["now"]:
            raise VoucherExpiredError("Mã giảm giá đã hết hạn")

    if v["usage_limit"] is not None and v["used_count"] >= v["usage_limit"]:
        raise VoucherUsageLimitError("Mã giảm giá đã hết lượt sử dụng")

    min_order = Decimal(str(v["min_order_amount"] or 0))
    if subtotal < min_order:
        raise VoucherMinOrderError(
            f"Đơn hàng tối thiểu {int(min_order):,}₫ để sử dụng mã này".replace(",", ".")
        )

    discount_amount = _calc_discount(v, subtotal, shipping_fee)

    cur.execute("UPDATE vouchers SET used_count = used_count + 1 WHERE id = %s", (v["id"],))

    return discount_amount, v["code"]


def _calc_discount(v: dict, subtotal: Decimal, shipping_fee: Decimal = Decimal("0")) -> Decimal:
    dtype = v["discount_type"]
    dval = Decimal(str(v["discount_value"]))
    max_d = Decimal(str(v["max_discount"])) if v["max_discount"] is not None else None

    if dtype == "percent":
        discount = subtotal * dval / Decimal("100")
        if max_d is not None:
            discount = min(discount, max_d)
    elif dtype == "fixed":
        discount = min(dval, subtotal)
    elif dtype == "free_shipping":
        # free_shipping discounts the shipping fee (capped at max_discount if specified)
        discount = shipping_fee
        if max_d is not None:
            discount = min(discount, max_d)
    else:
        discount = Decimal("0")

    return min(discount, subtotal + shipping_fee)


def _build_message(v: dict, discount_amount: Decimal) -> str:
    dtype = v["discount_type"]
    if dtype == "percent":
        msg = f"Giảm {int(v['discount_value'])}%"
        if v["max_discount"]:
            msg += f" (tối đa {int(v['max_discount']):,}₫)".replace(",", ".")
    elif dtype == "fixed":
        msg = f"Giảm {int(v['discount_value']):,}₫".replace(",", ".")
    elif dtype == "free_shipping":
        msg = "Miễn phí vận chuyển"
    else:
        msg = "Ưu đãi"
    return f"✅ {msg} — Bạn tiết kiệm {int(discount_amount):,}₫".replace(",", ".")


def list_active_vouchers() -> list[dict]:
    """Return public-facing list of active vouchers for display."""
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT code, discount_type, discount_value, max_discount,
                   min_order_amount, usage_limit, used_count, expires_at
            FROM vouchers
            WHERE status = 'active'
              AND (expires_at IS NULL OR expires_at > NOW())
              AND (usage_limit IS NULL OR used_count < usage_limit)
            ORDER BY discount_type, discount_value DESC
            """
        )
        rows = cur.fetchall()

    result = []
    for r in rows:
        desc = ""
        dtype = r["discount_type"]
        if dtype == "percent":
            desc = f"Giảm {int(r['discount_value'])}%"
            if r["max_discount"]:
                desc += f" (tối đa {int(r['max_discount']):,}₫)".replace(",", ".")
        elif dtype == "fixed":
            desc = f"Giảm {int(r['discount_value']):,}₫".replace(",", ".")
        elif dtype == "free_shipping":
            desc = "Miễn phí vận chuyển"

        if r["min_order_amount"] and float(r["min_order_amount"]) > 0:
            desc += f" cho đơn từ {int(r['min_order_amount']):,}₫".replace(",", ".")

        remaining = None
        if r["usage_limit"] is not None:
            remaining = max(0, r["usage_limit"] - r["used_count"])

        result.append({
            "code": r["code"],
            "description": desc,
            "remaining": remaining,
        })
    return result

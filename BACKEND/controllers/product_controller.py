from decimal import Decimal, InvalidOperation
from flask import request
from services import product_service
from utils.responses import success, error


def _parse_decimal_param(raw_val, param_name):
    if raw_val is None or str(raw_val).strip() == "":
        return None
    try:
        val = Decimal(str(raw_val).strip())
        if val < 0:
            raise ValueError()
        return val
    except (InvalidOperation, ValueError):
        raise ValueError(f"Tham số {param_name} không hợp lệ")


def list_products():
    search = request.args.get("search")
    category = request.args.get("category") or request.args.get("category_id")
    sort = request.args.get("sort")
    available_raw = (request.args.get("available") or "").strip().lower()
    available_only = available_raw in ("1", "true", "yes", "in_stock")

    try:
        min_price = _parse_decimal_param(request.args.get("min_price"), "min_price")
        max_price = _parse_decimal_param(request.args.get("max_price"), "max_price")
    except ValueError as exc:
        return error(str(exc), 400)

    page = request.args.get("page", type=int)
    limit = request.args.get("limit", type=int)

    products = product_service.list_products(
        search=search,
        category=category,
        min_price=min_price,
        max_price=max_price,
        available_only=available_only,
        sort=sort,
        page=page,
        limit=limit,
    )
    return success(products)


def get_product(product_id: int):
    product = product_service.get_product_by_id(product_id)
    if not product:
        return error("Product not found", 404)
    return success(product)

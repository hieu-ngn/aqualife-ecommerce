from decimal import Decimal, InvalidOperation
from flask import g, request
from middleware.auth import admin_required
from services import dashboard_service
from services.cart_service import ProductNotFoundError
from services.order_service import InvalidOrderStatusError, OrderNotFoundError
from services.user_service import UserNotFoundError
from utils.responses import success, error


@admin_required
def get_dashboard():
    data = dashboard_service.get_dashboard_overview()
    return success(data)


# ============================================================
# Categories
# ============================================================
@admin_required
def list_categories():
    return success(dashboard_service.admin_list_categories())


@admin_required
def create_category():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    name = str(body.get("name") or "").strip()
    description = str(body.get("description") or "").strip()
    status = str(body.get("status") or "active").strip().lower()

    if not name:
        return error("Vui lòng nhập tên danh mục", 422)
    if len(name) > 100:
        return error("Tên danh mục không vượt quá 100 ký tự", 422)
    if status not in ("active", "inactive"):
        return error("Trạng thái danh mục không hợp lệ", 422)

    try:
        cat = dashboard_service.admin_create_category(name, description, status)
        return success(cat, 201)
    except dashboard_service.CategoryNameExistsError:
        return error("Tên danh mục đã tồn tại", 409)


@admin_required
def update_category(category_id: int):
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    name = str(body["name"]).strip() if "name" in body and body["name"] is not None else None
    description = (
        str(body["description"]).strip()
        if "description" in body and body["description"] is not None
        else None
    )
    status = (
        str(body["status"]).strip().lower()
        if "status" in body and body["status"] is not None
        else None
    )

    if name is not None and not name:
        return error("Tên danh mục không được để trống", 422)
    if status is not None and status not in ("active", "inactive"):
        return error("Trạng thái danh mục không hợp lệ", 422)

    try:
        cat = dashboard_service.admin_update_category(
            category_id=category_id,
            name=name,
            description=description,
            status=status,
        )
        return success(cat)
    except dashboard_service.CategoryNotFoundError:
        return error("Không tìm thấy danh mục", 404)
    except dashboard_service.CategoryNameExistsError:
        return error("Tên danh mục đã tồn tại", 409)


@admin_required
def delete_category(category_id: int):
    try:
        cat = dashboard_service.admin_delete_category(category_id)
        return success(cat)
    except dashboard_service.CategoryNotFoundError:
        return error("Không tìm thấy danh mục", 404)


# ============================================================
# Products
# ============================================================
@admin_required
def list_products():
    search = request.args.get("search")
    raw_cat = request.args.get("category_id")
    status = request.args.get("status")

    cat_id = None
    if raw_cat and raw_cat.isdigit():
        cat_id = int(raw_cat)

    products = dashboard_service.admin_list_products(
        search=search,
        category_id=cat_id,
        status=status,
    )
    return success(products)


@admin_required
def create_product():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    name = str(body.get("name") or "").strip()
    if not name:
        return error("Vui lòng nhập tên sản phẩm", 422)
    if len(name) > 255:
        return error("Tên sản phẩm không vượt quá 255 ký tự", 422)

    raw_cat_id = body.get("category_id")
    category_id = None
    if raw_cat_id is not None and str(raw_cat_id).strip() != "":
        try:
            category_id = int(raw_cat_id)
        except (TypeError, ValueError):
            return error("category_id không hợp lệ", 422)

    try:
        price = Decimal(str(body.get("price", 0)))
    except (InvalidOperation, TypeError, ValueError):
        return error("Giá sản phẩm không hợp lệ", 422)
    if price < 0:
        return error("Giá sản phẩm không được âm", 422)

    try:
        stock = int(body.get("stock", 0))
    except (TypeError, ValueError):
        return error("Tồn kho (stock) phải là số nguyên", 422)
    if stock < 0:
        return error("Tồn kho (stock) không được âm", 422)

    description = str(body.get("description") or "").strip()
    image = str(body.get("image") or "").strip() or "image/ocean-bg.svg"
    water_type = str(body.get("water_type") or body.get("waterType") or "Nước ngọt").strip()
    status = str(body.get("status") or "active").strip().lower()
    if status not in ("active", "inactive"):
        return error("Trạng thái sản phẩm không hợp lệ", 422)

    try:
        product = dashboard_service.admin_create_product(
            name=name,
            category_id=category_id,
            description=description,
            price=price,
            stock=stock,
            image=image,
            status=status,
            water_type=water_type,
        )
        return success(product, 201)
    except dashboard_service.CategoryNotFoundError:
        return error("Danh mục không tồn tại", 404)


@admin_required
def update_product(product_id: int):
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    name = str(body["name"]).strip() if "name" in body and body["name"] is not None else None
    if name is not None and not name:
        return error("Tên sản phẩm không được để trống", 422)

    category_id = None
    if "category_id" in body and body["category_id"] is not None and str(body["category_id"]).strip() != "":
        try:
            category_id = int(body["category_id"])
        except (TypeError, ValueError):
            return error("category_id không hợp lệ", 422)

    price = None
    if "price" in body and body["price"] is not None:
        try:
            price = Decimal(str(body["price"]))
        except (InvalidOperation, TypeError, ValueError):
            return error("Giá sản phẩm không hợp lệ", 422)
        if price < 0:
            return error("Giá sản phẩm không được âm", 422)

    stock = None
    if "stock" in body and body["stock"] is not None:
        try:
            stock = int(body["stock"])
        except (TypeError, ValueError):
            return error("Tồn kho (stock) phải là số nguyên", 422)
        if stock < 0:
            return error("Tồn kho (stock) không được âm", 422)

    description = (
        str(body["description"]).strip()
        if "description" in body and body["description"] is not None
        else None
    )
    image = (
        str(body["image"]).strip()
        if "image" in body and body["image"] is not None
        else None
    )
    water_type = None
    if "water_type" in body and body["water_type"] is not None:
        water_type = str(body["water_type"]).strip()
    elif "waterType" in body and body["waterType"] is not None:
        water_type = str(body["waterType"]).strip()

    status = (
        str(body["status"]).strip().lower()
        if "status" in body and body["status"] is not None
        else None
    )
    if status is not None and status not in ("active", "inactive"):
        return error("Trạng thái sản phẩm không hợp lệ", 422)

    try:
        product = dashboard_service.admin_update_product(
            product_id=product_id,
            name=name,
            category_id=category_id,
            description=description,
            price=price,
            stock=stock,
            image=image,
            status=status,
            water_type=water_type,
        )
        return success(product)
    except ProductNotFoundError:
        return error("Không tìm thấy sản phẩm", 404)
    except dashboard_service.CategoryNotFoundError:
        return error("Danh mục không tồn tại", 404)


@admin_required
def delete_product(product_id: int):
    try:
        product = dashboard_service.admin_delete_product(product_id)
        return success(product)
    except ProductNotFoundError:
        return error("Không tìm thấy sản phẩm", 404)


# ============================================================
# Orders
# ============================================================
@admin_required
def list_orders():
    status = request.args.get("status")
    search = request.args.get("search")
    orders = dashboard_service.admin_list_orders(status=status, search=search)
    return success(orders)


@admin_required
def update_order_status(order_id: int):
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    new_status = str(body.get("status") or "").strip().lower()
    if not new_status:
        return error("Vui lòng chọn trạng thái đơn hàng", 422)

    try:
        order = dashboard_service.admin_update_order_status(order_id, new_status)
        return success(order)
    except OrderNotFoundError:
        return error("Không tìm thấy đơn hàng", 404)
    except InvalidOrderStatusError as exc:
        return error(str(exc), 400)


# ============================================================
# Users
# ============================================================
@admin_required
def list_users():
    search = request.args.get("search")
    role = request.args.get("role")
    status = request.args.get("status")
    users = dashboard_service.admin_list_users(search=search, role=role, status=status)
    return success(users)


@admin_required
def update_user_status(user_id: int):
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    new_status = str(body.get("status") or "").strip().lower()
    if new_status not in ("active", "inactive"):
        return error("Trạng thái người dùng chỉ nhận 'active' hoặc 'inactive'", 422)

    try:
        user = dashboard_service.admin_update_user_status(
            admin_id=g.current_user["id"],
            target_user_id=user_id,
            new_status=new_status,
        )
        return success(user)
    except dashboard_service.AdminSelfModificationError as exc:
        return error(str(exc), 400)
    except UserNotFoundError:
        return error("Không tìm thấy người dùng", 404)


@admin_required
def update_user_role(user_id: int):
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    new_role = str(body.get("role") or "").strip().lower()
    if new_role not in ("customer", "admin"):
        return error("Vai trò chỉ nhận 'customer' hoặc 'admin'", 422)

    try:
        user = dashboard_service.admin_update_user_role(
            admin_id=g.current_user["id"],
            target_user_id=user_id,
            new_role=new_role,
        )
        return success(user)
    except dashboard_service.AdminSelfModificationError as exc:
        return error(str(exc), 400)
    except UserNotFoundError:
        return error("Không tìm thấy người dùng", 404)


@admin_required
def bulk_update_products():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    raw_ids = body.get("product_ids")
    if not isinstance(raw_ids, list) or not raw_ids:
        return error("Vui lòng chọn ít nhất một sản phẩm", 422)

    try:
        product_ids = [int(pid) for pid in raw_ids]
    except (TypeError, ValueError):
        return error("Danh sách ID sản phẩm không hợp lệ", 422)

    action = str(body.get("action") or "").strip().lower()
    if action not in ("delete", "toggle_status", "update_price"):
        return error("Thao tác hàng loạt không hợp lệ", 422)

    status = body.get("status")
    price_percent = None
    if body.get("price_percent") is not None and str(body.get("price_percent")).strip() != "":
        try:
            price_percent = Decimal(str(body.get("price_percent")))
        except (InvalidOperation, TypeError, ValueError):
            return error("Phần trăm điều chỉnh giá không hợp lệ", 422)

    fixed_price = None
    if body.get("fixed_price") is not None and str(body.get("fixed_price")).strip() != "":
        try:
            fixed_price = Decimal(str(body.get("fixed_price")))
        except (InvalidOperation, TypeError, ValueError):
            return error("Giá cố định không hợp lệ", 422)

    stock_delta = None
    if body.get("stock_delta") is not None and str(body.get("stock_delta")).strip() != "":
        try:
            stock_delta = int(body.get("stock_delta"))
        except (TypeError, ValueError):
            return error("Số lượng tồn kho điều chỉnh không hợp lệ", 422)

    try:
        result = dashboard_service.admin_bulk_update_products(
            product_ids=product_ids,
            action=action,
            status=status,
            price_percent=price_percent,
            fixed_price=fixed_price,
            stock_delta=stock_delta,
        )
        return success(result)
    except ValueError as exc:
        return error(str(exc), 422)


@admin_required
def get_revenue():
    return success(dashboard_service.get_revenue_report())


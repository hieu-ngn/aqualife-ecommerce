from decimal import Decimal
from config.database import get_db_cursor


def _serialize_number(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    return value


def _serialize_category(row):
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "description": row.get("description"),
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


def _serialize_product(row):
    if not row:
        return None
    wt = row.get("water_type") or "Nước ngọt"
    return {
        "id": row["id"],
        "category_id": row["category_id"],
        "category_name": row.get("category_name"),
        "name": row["name"],
        "description": row.get("description") or "",
        "price": _serialize_number(row["price"]),
        "stock": row["stock"],
        "image": row.get("image"),
        "water_type": wt,
        "waterType": wt,
        "status": row["status"],
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


def list_categories(include_inactive: bool = False):
    query = """
        SELECT id, name, description, status, created_at, updated_at
        FROM categories
    """
    params = []
    if not include_inactive:
        query += " WHERE status = 'active'"
    query += " ORDER BY id ASC"

    with get_db_cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()
    return [_serialize_category(r) for r in rows]


def get_category_by_id(category_id: int, include_inactive: bool = False):
    query = """
        SELECT id, name, description, status, created_at, updated_at
        FROM categories
        WHERE id = %s
    """
    if not include_inactive:
        query += " AND status = 'active'"

    with get_db_cursor() as cur:
        cur.execute(query, (category_id,))
        row = cur.fetchone()
    return _serialize_category(row)


def list_products(
    search: str | None = None,
    category: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    available_only: bool = False,
    sort: str | None = None,
    page: int | None = None,
    limit: int | None = None,
):
    conditions = ["p.status = 'active'"]
    params = []

    if search:
        kw = f"%{search.strip()}%"
        conditions.append("(p.name ILIKE %s OR COALESCE(p.description, '') ILIKE %s)")
        params.extend([kw, kw])

    if category:
        cat_str = str(category).strip()
        if cat_str.isdigit():
            conditions.append("p.category_id = %s")
            params.append(int(cat_str))
        else:
            conditions.append("c.name ILIKE %s")
            params.append(f"%{cat_str}%")

    if min_price is not None:
        conditions.append("p.price >= %s")
        params.append(min_price)

    if max_price is not None:
        conditions.append("p.price <= %s")
        params.append(max_price)

    if available_only:
        conditions.append("p.stock > 0")

    where_clause = " AND ".join(conditions)

    sort_map = {
        "price_asc": "p.price ASC, p.id ASC",
        "low": "p.price ASC, p.id ASC",
        "price_desc": "p.price DESC, p.id ASC",
        "high": "p.price DESC, p.id ASC",
        "name_asc": "p.name ASC, p.id ASC",
        "name": "p.name ASC, p.id ASC",
        "newest": "p.created_at DESC, p.id DESC",
        "new": "p.id ASC",
    }
    order_by = sort_map.get((sort or "").lower(), "p.id ASC")

    query = f"""
        SELECT p.id, p.category_id, c.name AS category_name,
               p.name, p.description, p.price, p.stock, p.image, p.water_type, p.status,
               p.created_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE {where_clause}
        ORDER BY {order_by}
    """

    if limit is not None and limit > 0:
        page_num = max(1, page or 1)
        offset = (page_num - 1) * limit
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])

    with get_db_cursor() as cur:
        cur.execute(query, params)
        rows = cur.fetchall()

    return [_serialize_product(r) for r in rows]


def get_product_by_id(product_id: int, include_inactive: bool = False):
    query = """
        SELECT p.id, p.category_id, c.name AS category_name,
               p.name, p.description, p.price, p.stock, p.image, p.water_type, p.status,
               p.created_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE p.id = %s
    """
    if not include_inactive:
        query += " AND p.status = 'active'"

    with get_db_cursor() as cur:
        cur.execute(query, (product_id,))
        row = cur.fetchone()

    return _serialize_product(row)

import json
from decimal import Decimal
from config.database import get_db_cursor


def _serialize_number(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    return value


def _round_vnd(val: float) -> int:
    if val <= 15000:
        return int(round(val / 1000.0) * 1000)
    return int(round(val / 5000.0) * 5000)


def _normalize_sizes(raw_sizes, base_price=0) -> list[dict]:
    parsed = raw_sizes
    if isinstance(raw_sizes, str):
        try:
            parsed = json.loads(raw_sizes)
        except Exception:
            parsed = []

    cleaned = []
    if isinstance(parsed, list):
        for item in parsed:
            if not isinstance(item, dict):
                continue
            label = str(item.get("size") or item.get("label") or "").strip()
            if not label:
                continue
            try:
                p_val = _serialize_number(Decimal(str(item.get("price", base_price or 0))))
            except Exception:
                p_val = _serialize_number(Decimal(str(base_price or 0)))
            if p_val < 0:
                p_val = 0
            cleaned.append({"size": label, "price": p_val})

    if not cleaned:
        p = float(base_price or 0)
        cleaned = [
            {"size": "Size S - Nhỏ (2 - 3cm)", "price": int(p)},
            {"size": "Size M - Trung (4 - 6cm)", "price": _round_vnd(p * 1.4)},
            {"size": "Size L - Trưởng thành (7 - 10cm)", "price": _round_vnd(p * 1.85)},
        ]
    return cleaned


def resolve_size_price(product_row: dict, selected_size: str | None = None) -> tuple[str, Decimal]:
    """Return (resolved_size_label, authoritative_unit_price) for a product."""
    base_price = Decimal(str(product_row.get("price") or 0))
    sizes = _normalize_sizes(product_row.get("sizes"), base_price)
    if selected_size:
        target = selected_size.strip().lower()
        for s in sizes:
            if s["size"].strip().lower() == target:
                return s["size"], Decimal(str(s["price"]))
    return (selected_size or "").strip(), base_price


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


CATEGORY_TO_SPECIES = {
    "Cá cảnh": "Cá",
    "Tép cảnh": "Tép",
    "Ốc cảnh": "Ốc",
    "Thủy sinh & San hô": "Thủy Sinh / San hô",
}


def _serialize_product(row):
    if not row:
        return None
    wt = row.get("water_type") or "Nước ngọt"
    cat_name = row.get("category_name") or ""
    species = row.get("species") or CATEGORY_TO_SPECIES.get(cat_name, "Cá")
    base_price = _serialize_number(row["price"])
    sizes = _normalize_sizes(row.get("sizes"), base_price)
    return {
        "id": row["id"],
        "category_id": row["category_id"],
        "category_name": cat_name,
        "species": species,
        "name": row["name"],
        "description": row.get("description") or "",
        "price": base_price,
        "sizes": sizes,
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
               p.name, p.description, p.price, p.sizes, p.stock, p.image, p.water_type, p.status,
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
               p.name, p.description, p.price, p.sizes, p.stock, p.image, p.water_type, p.status,
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

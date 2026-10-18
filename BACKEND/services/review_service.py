from psycopg.errors import UniqueViolation
from config.database import get_db_cursor
from services.cart_service import ProductNotFoundError


class PurchaseRequiredError(Exception):
    """Chỉ khách hàng đã mua sản phẩm mới được đánh giá."""


class ReviewAlreadyExistsError(Exception):
    """Bạn đã đánh giá sản phẩm này rồi."""


class ReviewNotFoundError(Exception):
    """Không tìm thấy đánh giá."""


class ReviewForbiddenError(Exception):
    """Bạn không có quyền chỉnh sửa hoặc xóa đánh giá này."""


def _serialize_review(row):
    if not row:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "user_name": row.get("user_name") or "Khách hàng",
        "product_id": row["product_id"],
        "rating": int(row["rating"]),
        "comment": row.get("comment") or "",
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


def user_has_purchased_product(cur, user_id: int, product_id: int) -> bool:
    cur.execute(
        """
        SELECT 1
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = %s
          AND oi.product_id = %s
          AND o.status != 'cancelled'
        LIMIT 1
        """,
        (user_id, product_id),
    )
    return cur.fetchone() is not None


def list_reviews_for_product(product_id: int, current_user_id: int | None = None) -> dict:
    with get_db_cursor() as cur:
        cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
        if not cur.fetchone():
            raise ProductNotFoundError()

        cur.execute(
            """
            SELECT r.id, r.user_id, u.name AS user_name,
                   r.product_id, r.rating, r.comment,
                   r.created_at, r.updated_at
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.product_id = %s
            ORDER BY r.created_at DESC, r.id DESC
            """,
            (product_id,),
        )
        rows = cur.fetchall()
        reviews = [_serialize_review(r) for r in rows]

        total_reviews = len(reviews)
        avg_rating = (
            round(sum(r["rating"] for r in reviews) / total_reviews, 1)
            if total_reviews > 0
            else 0.0
        )

        can_review = False
        has_purchased = False
        my_review = None
        if current_user_id is not None:
            has_purchased = user_has_purchased_product(cur, current_user_id, product_id)
            for rev in reviews:
                if rev["user_id"] == current_user_id:
                    my_review = rev
                    break
            can_review = has_purchased and (my_review is None)

        return {
            "product_id": product_id,
            "average_rating": avg_rating,
            "total_reviews": total_reviews,
            "has_purchased": has_purchased,
            "can_review": can_review,
            "my_review": my_review,
            "reviews": reviews,
        }


def create_review(user_id: int, product_id: int, rating: int, comment: str | None) -> dict:
    try:
        with get_db_cursor(commit=True) as cur:
            cur.execute("SELECT id FROM products WHERE id = %s AND status = 'active'", (product_id,))
            if not cur.fetchone():
                raise ProductNotFoundError()

            if not user_has_purchased_product(cur, user_id, product_id):
                raise PurchaseRequiredError(
                    "Bạn cần mua sản phẩm này trước khi gửi đánh giá"
                )

            cur.execute(
                "SELECT id FROM reviews WHERE user_id = %s AND product_id = %s",
                (user_id, product_id),
            )
            if cur.fetchone():
                raise ReviewAlreadyExistsError("Bạn đã đánh giá sản phẩm này rồi")

            cur.execute(
                """
                INSERT INTO reviews (user_id, product_id, rating, comment)
                VALUES (%s, %s, %s, %s)
                RETURNING id, user_id, product_id, rating, comment, created_at, updated_at
                """,
                (user_id, product_id, rating, (comment or "").strip()),
            )
            row = cur.fetchone()
            cur.execute("SELECT name FROM users WHERE id = %s", (user_id,))
            user_row = cur.fetchone()
            row["user_name"] = user_row["name"] if user_row else "Khách hàng"
            return _serialize_review(row)
    except UniqueViolation:
        raise ReviewAlreadyExistsError("Bạn đã đánh giá sản phẩm này rồi")


def update_review(user_id: int, review_id: int, rating: int, comment: str | None) -> dict:
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            """
            SELECT r.id, r.user_id, u.name AS user_name,
                   r.product_id, r.rating, r.comment, r.created_at, r.updated_at
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            WHERE r.id = %s
            FOR UPDATE OF r
            """,
            (review_id,),
        )
        existing = cur.fetchone()
        if not existing:
            raise ReviewNotFoundError()
        if existing["user_id"] != user_id:
            raise ReviewForbiddenError()

        cur.execute(
            """
            UPDATE reviews
            SET rating = %s,
                comment = %s
            WHERE id = %s
            RETURNING id, user_id, product_id, rating, comment, created_at, updated_at
            """,
            (rating, (comment or "").strip(), review_id),
        )
        updated = cur.fetchone()
        updated["user_name"] = existing["user_name"]
        return _serialize_review(updated)


def delete_review(user_id: int, is_admin: bool, review_id: int) -> None:
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "SELECT id, user_id FROM reviews WHERE id = %s FOR UPDATE",
            (review_id,),
        )
        existing = cur.fetchone()
        if not existing:
            raise ReviewNotFoundError()
        if existing["user_id"] != user_id and not is_admin:
            raise ReviewForbiddenError()

        cur.execute("DELETE FROM reviews WHERE id = %s", (review_id,))

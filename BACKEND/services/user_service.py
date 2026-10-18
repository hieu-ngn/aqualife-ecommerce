from werkzeug.security import check_password_hash, generate_password_hash
from config.database import get_db_cursor


class UserNotFoundError(Exception):
    """Không tìm thấy người dùng."""


class InvalidPasswordError(Exception):
    """Mật khẩu hiện tại không đúng."""


def _serialize_user(row):
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "status": row["status"],
        "phone": row.get("phone") or "",
        "address": row.get("address") or "",
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


def get_profile(user_id: int) -> dict:
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT id, name, email, role, status, phone, address, created_at, updated_at
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        )
        row = cur.fetchone()
    if not row:
        raise UserNotFoundError()
    return _serialize_user(row)


def update_profile(user_id: int, name: str, phone: str | None, address: str | None) -> dict:
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            """
            UPDATE users
            SET name = %s,
                phone = %s,
                address = %s
            WHERE id = %s
            RETURNING id, name, email, role, status, phone, address, created_at, updated_at
            """,
            (name, phone or None, address or None, user_id),
        )
        row = cur.fetchone()
    if not row:
        raise UserNotFoundError()
    return _serialize_user(row)


def change_password(user_id: int, current_password: str, new_password: str) -> None:
    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "SELECT id, password_hash FROM users WHERE id = %s FOR UPDATE",
            (user_id,),
        )
        user = cur.fetchone()
        if not user:
            raise UserNotFoundError()

        if not check_password_hash(user["password_hash"], current_password):
            raise InvalidPasswordError()

        new_hash = generate_password_hash(new_password)
        cur.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_hash, user_id),
        )

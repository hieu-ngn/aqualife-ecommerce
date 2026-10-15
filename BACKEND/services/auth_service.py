from psycopg.errors import UniqueViolation
from werkzeug.security import check_password_hash, generate_password_hash
from config.database import get_db_cursor


class EmailExistsError(Exception):
    """Email đã được đăng ký."""


def register_user(name, email, password):
    password_hash = generate_password_hash(password)
    try:
        with get_db_cursor(commit=True) as cur:
            cur.execute(
                "SELECT id FROM users WHERE LOWER(email) = LOWER(%s)", (email,)
            )
            if cur.fetchone():
                raise EmailExistsError()

            cur.execute(
                """
                INSERT INTO users (name, email, password_hash, role, status)
                VALUES (%s, %s, %s, 'customer', 'active')
                RETURNING id, name, email, role, status
                """,
                (name, email, password_hash),
            )
            return cur.fetchone()
    except UniqueViolation:
        raise EmailExistsError()

class InvalidCredentialsError(Exception):
    """Sai email hoặc mật khẩu."""


class InactiveUserError(Exception):
    """Tài khoản đã bị khóa."""


def authenticate_user(email, password):
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT id, name, email, password_hash, role, status
            FROM users
            WHERE LOWER(email) = LOWER(%s)
            """,
            (email,),
        )
        user = cur.fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        raise InvalidCredentialsError()
    if user["status"] != "active":
        raise InactiveUserError()

    user.pop("password_hash")
    return user


def get_user_by_id(user_id):
    with get_db_cursor() as cur:
        cur.execute(
            "SELECT id, name, email, role, status FROM users WHERE id = %s",
            (user_id,),
        )
        return cur.fetchone()
from psycopg.errors import UniqueViolation
from werkzeug.security import generate_password_hash

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
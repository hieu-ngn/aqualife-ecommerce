"""
PostgreSQL connection handling for Aqualife (using psycopg v3).
"""
import os
from contextlib import contextmanager
from typing import Optional

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

_pool: Optional[ConnectionPool] = None


def init_pool(app=None):
    """Create the global connection pool. Call once at app startup."""
    global _pool
    if _pool is not None:
        return _pool

    database_url = (app.config.get("DATABASE_URL") if app else None) or os.environ.get(
        "DATABASE_URL"
    )
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Copy .env.example to .env and fill it in."
        )

    _pool = ConnectionPool(conninfo=database_url, min_size=1, max_size=10, open=True)
    return _pool


def close_pool():
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def get_db_cursor(commit: bool = False):
    """
    Yield a cursor whose rows behave like dicts (dict_row).

    Usage:
        with get_db_cursor() as cur:
            cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            row = cur.fetchone()

        with get_db_cursor(commit=True) as cur:
            cur.execute("INSERT INTO products (...) VALUES (...)")

    On any exception the transaction is rolled back and the error re-raised.
    """
    if _pool is None:
        raise RuntimeError("Connection pool not initialized. Call init_pool() first.")

    with _pool.connection() as conn:
        conn.row_factory = dict_row
        cur = conn.cursor()
        try:
            yield cur
            if commit:
                conn.commit()
            else:
                conn.rollback()
        except Exception:
            conn.rollback()
            raise
        finally:
            cur.close()

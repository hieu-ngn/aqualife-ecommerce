import atexit
import os
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from dotenv import load_dotenv
from psycopg import Cursor
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool


load_dotenv(Path(__file__).resolve().parents[1] / ".env")

_pool: ConnectionPool | None = None


def init_pool(app=None) -> ConnectionPool:
    """Create and open the PostgreSQL connection pool once."""
    global _pool

    if _pool is not None and not _pool.closed:
        return _pool

    database_url = (
        (app.config.get("DATABASE_URL") if app else None)
        or os.environ.get("DATABASE_URL")
    )
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Configure it in BACKEND/.env."
        )

    pool = ConnectionPool(
        conninfo=database_url,
        min_size=1,
        max_size=10,
        kwargs={"row_factory": dict_row},
        open=False,
    )
    try:
        pool.open(wait=True, timeout=10)
    except Exception:
        pool.close()
        raise

    _pool = pool
    return pool


def close_pool() -> None:
    global _pool

    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def get_db_cursor(commit: bool = False) -> Iterator[Cursor]:
    """Yield a dict-row cursor and commit writes only when requested."""
    if _pool is None or _pool.closed:
        raise RuntimeError("Database pool is not initialized. Call init_pool() first.")

    with _pool.connection() as conn:
        with conn.cursor() as cur:
            try:
                yield cur
                if commit:
                    conn.commit()
                else:
                    conn.rollback()
            except Exception:
                conn.rollback()
                raise


atexit.register(close_pool)

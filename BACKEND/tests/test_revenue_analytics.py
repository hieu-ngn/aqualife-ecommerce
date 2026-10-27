"""Test API báo cáo doanh thu (BI) và hiệu suất sản phẩm của Admin."""
import sys
from datetime import date, timedelta
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app  # noqa: E402
from config.database import get_db_cursor  # noqa: E402

CUSTOMER = "bi_test_customer@aqualife.com"
PW = "Password@123"


@pytest.fixture(scope="module")
def app():
    a = create_app()
    a.config["TESTING"] = True
    _cleanup()
    yield a
    _cleanup()


def _cleanup():
    with get_db_cursor(commit=True) as cur:
        cur.execute("SELECT id FROM users WHERE email=%s", (CUSTOMER,))
        ids = [r["id"] for r in cur.fetchall()]
        if ids:
            cur.execute("DELETE FROM orders WHERE user_id = ANY(%s)", (ids,))
            cur.execute("DELETE FROM cart WHERE user_id = ANY(%s)", (ids,))
            cur.execute("DELETE FROM users WHERE id = ANY(%s)", (ids,))


def _login(app, email, password):
    c = app.test_client()
    r = c.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.get_json()
    return c


@pytest.fixture()
def admin(app):
    return _login(app, "admin@aqualife.com", "Admin@123")


def test_requires_auth_and_admin(app):
    anon = app.test_client()
    assert anon.get("/api/admin/revenue").status_code == 401
    assert anon.get("/api/admin/products/performance").status_code == 401

    anon.post("/api/auth/register", json={"name": "BI Test", "email": CUSTOMER,
                                          "password": PW, "confirm_password": PW})
    cust = _login(app, CUSTOMER, PW)
    assert cust.get("/api/admin/revenue").status_code == 403
    assert cust.get("/api/admin/products/performance").status_code == 403


def test_revenue_validation(admin):
    assert admin.get("/api/admin/revenue?from=abc").status_code == 422
    assert admin.get("/api/admin/revenue?from=2026-10-30&to=2026-10-01").status_code == 422
    assert admin.get("/api/admin/revenue?group_by=week").status_code == 422
    assert admin.get("/api/admin/revenue?from=2020-01-01&to=2026-10-01").status_code == 422
    assert admin.get("/api/admin/products/performance?days=5").status_code == 422


def test_revenue_shape_and_math(admin):
    today = date.today()
    d1 = today - timedelta(days=29)
    r = admin.get(f"/api/admin/revenue?from={d1}&to={today}")
    assert r.status_code == 200
    d = r.get_json()["data"]
    assert d["range"]["group_by"] == "day" and len(d["series"]) == 30
    # tổng chuỗi thời gian == doanh thu KPI (cùng định nghĩa: đơn completed)
    assert sum(x["revenue"] for x in d["series"]) == pytest.approx(d["kpi"]["revenue"])
    assert sum(x["orders"] for x in d["series"]) == d["kpi"]["orders"]
    # cơ cấu nhóm hàng cộng lại cũng bằng doanh thu
    assert sum(c["revenue"] for c in d["by_category"]) == pytest.approx(d["kpi"]["revenue"])
    # không rò rỉ dữ liệu nhạy cảm
    assert "password_hash" not in r.get_data(as_text=True)
    for key in ("kpi_prev", "heatmap", "inventory", "forecast", "insights", "roadmap", "abc_summary"):
        assert key in d


def test_revenue_matches_database(admin):
    today = date.today()
    d1 = today - timedelta(days=29)
    d = admin.get(f"/api/admin/revenue?from={d1}&to={today}").get_json()["data"]
    with get_db_cursor() as cur:
        cur.execute(
            "SELECT COALESCE(SUM(total_amount),0) s FROM orders WHERE status='completed' "
            "AND created_at >= %s AND created_at < %s",
            (d1, today + timedelta(days=1)),
        )
        assert float(cur.fetchone()["s"]) == pytest.approx(d["kpi"]["revenue"])


def test_month_grouping(admin):
    r = admin.get("/api/admin/revenue?from=2026-01-01&to=2026-10-25&group_by=month")
    d = r.get_json()["data"]
    assert len(d["series"]) == 10
    assert all(x["period"].endswith("-01") for x in d["series"])


def test_product_performance(admin):
    d = admin.get("/api/admin/products/performance?days=90").get_json()["data"]
    assert d["days"] == 90
    for item in d["items"].values():
        assert item["abc"] in ("A", "B", "C") and item["units"] > 0

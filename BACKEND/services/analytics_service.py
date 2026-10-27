"""Phân tích kinh doanh (BI) cho trang Báo cáo doanh thu của Admin.

Quy ước số liệu
---------------
* Doanh thu = tổng `orders.total_amount` của đơn có status = 'completed'.
* Mốc thời gian dùng `orders.created_at` (schema chưa có cột completed_at).
* Tốc độ bán / tồn kho tính trên đơn KHÔNG bị hủy (vì tồn kho đã bị trừ khi đặt hàng).
* Schema chưa có giá vốn nên hệ thống KHÔNG tính lợi nhuận/biên lợi nhuận;
  mục này được nêu rõ trong phần đề xuất thay vì hiển thị số liệu giả.
"""
import calendar
import math
from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal

from config.database import get_db_cursor

# 4 khung giờ cho heatmap (giờ bắt đầu, giờ kết thúc không gồm, nhãn)
TIME_BANDS = [
    (5, 11, "Sáng (5–11h)"),
    (11, 17, "Chiều (11–17h)"),
    (17, 22, "Tối (17–22h)"),
    (22, 29, "Đêm (22–5h)"),
]
WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]


# ----------------------------------------------------------------------
# helpers
# ----------------------------------------------------------------------
def _num(v):
    if v is None:
        return 0
    if isinstance(v, Decimal):
        return int(v) if v == v.to_integral_value() else float(v)
    return v


def _pct_change(cur, prev):
    """% thay đổi; None khi kỳ trước = 0 (không có cơ sở so sánh)."""
    if not prev:
        return None
    return round((cur - prev) / prev * 100, 1)


def _f(x, nd=1):
    """Số thập phân kiểu Việt Nam (dấu phẩy)."""
    return f"{x:.{nd}f}".replace(".", ",")


def _vnd(v):
    v = float(v or 0)
    if abs(v) >= 1e9:
        return f"{v / 1e9:.2f} tỷ ₫".replace(".", ",")
    if abs(v) >= 1e6:
        return f"{v / 1e6:.1f} triệu ₫".replace(".", ",")
    return f"{v:,.0f} ₫".replace(",", ".")


def _bucket_start(d, group_by):
    return d.replace(day=1) if group_by == "month" else d


def _bucket_list(d1, d2, group_by):
    out, cur = [], _bucket_start(d1, group_by)
    while cur <= d2:
        out.append(cur)
        if group_by == "month":
            cur = (cur.replace(day=28) + timedelta(days=4)).replace(day=1)
        else:
            cur += timedelta(days=1)
    return out


def _dt(d):
    return datetime(d.year, d.month, d.day)


# ----------------------------------------------------------------------
# data queries
# ----------------------------------------------------------------------
def _kpis(cur, d1, d2):
    a, b = _dt(d1), _dt(d2 + timedelta(days=1))
    cur.execute(
        """
        SELECT
          COUNT(*) FILTER (WHERE status='completed')                           AS orders,
          COALESCE(SUM(total_amount) FILTER (WHERE status='completed'), 0)     AS revenue,
          COUNT(*)                                                             AS created,
          COUNT(*) FILTER (WHERE status='cancelled')                           AS cancelled,
          COALESCE(SUM(total_amount) FILTER (WHERE status NOT IN ('completed','cancelled')), 0) AS pipeline,
          COUNT(*) FILTER (WHERE status NOT IN ('completed','cancelled'))      AS pipeline_orders
        FROM orders WHERE created_at >= %s AND created_at < %s
        """,
        (a, b),
    )
    r = cur.fetchone()
    orders = int(r["orders"])
    revenue = float(r["revenue"])

    cur.execute(
        """
        SELECT COALESCE(SUM(oi.quantity),0) AS units,
               COUNT(*) AS lines
        FROM order_items oi JOIN orders o ON o.id = oi.order_id
        WHERE o.status='completed' AND o.created_at >= %s AND o.created_at < %s
        """,
        (a, b),
    )
    it = cur.fetchone()

    cur.execute(
        """
        SELECT COUNT(*) FILTER (WHERE n = 1) AS single, COUNT(*) AS total FROM (
          SELECT o.id, COUNT(*) n FROM orders o JOIN order_items oi ON oi.order_id = o.id
          WHERE o.status='completed' AND o.created_at >= %s AND o.created_at < %s GROUP BY o.id) t
        """,
        (a, b),
    )
    sg = cur.fetchone()

    cur.execute(
        """
        SELECT o.user_id, SUM(o.total_amount) AS rev, COUNT(*) AS n, MIN(fo.f) AS first_at
        FROM orders o
        JOIN (SELECT user_id, MIN(created_at) AS f FROM orders WHERE status='completed' GROUP BY user_id) fo
          ON fo.user_id = o.user_id
        WHERE o.status='completed' AND o.created_at >= %s AND o.created_at < %s
        GROUP BY o.user_id
        """,
        (a, b),
    )
    custs = cur.fetchall()
    new_c = [c for c in custs if c["first_at"] >= a]
    ret_c = [c for c in custs if c["first_at"] < a]
    return {
        "revenue": revenue,
        "orders": orders,
        "aov": round(revenue / orders) if orders else 0,
        "units": int(it["units"]),
        "customers": len(custs),
        "new_customers": len(new_c),
        "returning_customers": len(ret_c),
        "returning_rate": round(len(ret_c) / len(custs) * 100, 1) if custs else 0,
        "new_revenue": float(sum(c["rev"] for c in new_c)),
        "returning_revenue": float(sum(c["rev"] for c in ret_c)),
        "created_orders": int(r["created"]),
        "cancelled_orders": int(r["cancelled"]),
        "cancel_rate": round(int(r["cancelled"]) / int(r["created"]) * 100, 1) if r["created"] else 0,
        "pipeline_value": float(r["pipeline"]),
        "pipeline_orders": int(r["pipeline_orders"]),
        "single_item_rate": round(sg["single"] / sg["total"] * 100, 1) if sg["total"] else 0,
        "avg_items_per_order": round(it["lines"] / orders, 2) if orders else 0,
    }


def _series(cur, d1, d2, group_by):
    a, b = _dt(d1), _dt(d2 + timedelta(days=1))
    cur.execute(
        f"""
        SELECT date_trunc('{group_by}', created_at)::date AS p,
               SUM(total_amount) AS revenue, COUNT(*) AS orders
        FROM orders
        WHERE status='completed' AND created_at >= %s AND created_at < %s
        GROUP BY 1
        """,
        (a, b),
    )
    got = {r["p"]: r for r in cur.fetchall()}
    rows = []
    for p in _bucket_list(d1, d2, group_by):
        r = got.get(p)
        rows.append({
            "period": p.isoformat(),
            "revenue": float(r["revenue"]) if r else 0,
            "orders": int(r["orders"]) if r else 0,
        })
    return rows


def _by_category(cur, d1, d2):
    a, b = _dt(d1), _dt(d2 + timedelta(days=1))
    cur.execute(
        """
        SELECT COALESCE(c.name,'Chưa phân loại') AS name,
               COALESCE(SUM(oi.subtotal),0) AS revenue,
               COALESCE(SUM(oi.quantity),0) AS units,
               COUNT(DISTINCT o.id) AS orders
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE o.status='completed' AND o.created_at >= %s AND o.created_at < %s
        GROUP BY 1 ORDER BY revenue DESC
        """,
        (a, b),
    )
    return [{"name": r["name"], "revenue": float(r["revenue"]), "units": int(r["units"]),
             "orders": int(r["orders"])} for r in cur.fetchall()]


def _by_product(cur, d1, d2):
    a, b = _dt(d1), _dt(d2 + timedelta(days=1))
    cur.execute(
        """
        SELECT oi.product_id AS id, MAX(oi.product_name) AS name,
               MAX(c.name) AS category, MAX(p.image) AS image,
               MAX(p.stock) AS stock, MAX(p.price) AS price, MAX(p.status) AS status,
               SUM(oi.subtotal) AS revenue, SUM(oi.quantity) AS units,
               COUNT(DISTINCT o.id) AS orders
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE o.status='completed' AND o.created_at >= %s AND o.created_at < %s
        GROUP BY oi.product_id ORDER BY revenue DESC
        """,
        (a, b),
    )
    return cur.fetchall()


def _heatmap(cur, d1, d2):
    a, b = _dt(d1), _dt(d2 + timedelta(days=1))
    cur.execute(
        """
        SELECT EXTRACT(ISODOW FROM created_at)::int AS dow,
               EXTRACT(HOUR FROM created_at)::int AS hr,
               COUNT(*) AS orders, SUM(total_amount) AS revenue
        FROM orders
        WHERE status='completed' AND created_at >= %s AND created_at < %s
        GROUP BY 1, 2
        """,
        (a, b),
    )
    grid = [[{"orders": 0, "revenue": 0.0} for _ in TIME_BANDS] for _ in range(7)]
    for r in cur.fetchall():
        hr = r["hr"] if r["hr"] >= 5 else r["hr"] + 24
        for bi, (lo, hi, _) in enumerate(TIME_BANDS):
            if lo <= hr < hi:
                cell = grid[r["dow"] - 1][bi]
                cell["orders"] += int(r["orders"])
                cell["revenue"] += float(r["revenue"])
                break
    return {"weekdays": WEEKDAY_LABELS, "bands": [t[2] for t in TIME_BANDS], "cells": grid}


def _by_payment(cur, d1, d2):
    a, b = _dt(d1), _dt(d2 + timedelta(days=1))
    cur.execute(
        """
        SELECT payment_method, COUNT(*) AS orders, SUM(total_amount) AS revenue
        FROM orders WHERE status='completed' AND created_at >= %s AND created_at < %s
        GROUP BY 1 ORDER BY revenue DESC
        """,
        (a, b),
    )
    return [{"payment_method": r["payment_method"], "orders": int(r["orders"]),
             "revenue": float(r["revenue"])} for r in cur.fetchall()]


def _funnel(cur, d1, d2):
    a, b = _dt(d1), _dt(d2 + timedelta(days=1))
    cur.execute(
        """
        SELECT status, COUNT(*) AS orders, COALESCE(SUM(total_amount),0) AS amount
        FROM orders WHERE created_at >= %s AND created_at < %s GROUP BY 1
        """,
        (a, b),
    )
    got = {r["status"]: r for r in cur.fetchall()}
    order = ["pending", "confirmed", "processing", "shipping", "completed", "cancelled"]
    return [{"status": s, "orders": int(got[s]["orders"]) if s in got else 0,
             "amount": float(got[s]["amount"]) if s in got else 0} for s in order]


def _inventory(cur, today):
    """Tồn kho: rủi ro hết hàng, hết hàng đang có nhu cầu, tồn đọng."""
    since30 = _dt(today - timedelta(days=29))
    since60 = _dt(today - timedelta(days=59))
    cur.execute(
        """
        SELECT p.id, p.name, p.stock, p.price, p.image, p.status, c.name AS category,
               COALESCE(v30.units, 0) AS units30, COALESCE(v60.units, 0) AS units60
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN (SELECT oi.product_id, SUM(oi.quantity) units FROM order_items oi
                   JOIN orders o ON o.id = oi.order_id
                   WHERE o.status <> 'cancelled' AND o.created_at >= %s GROUP BY 1) v30
               ON v30.product_id = p.id
        LEFT JOIN (SELECT oi.product_id, SUM(oi.quantity) units FROM order_items oi
                   JOIN orders o ON o.id = oi.order_id
                   WHERE o.status <> 'cancelled' AND o.created_at >= %s GROUP BY 1) v60
               ON v60.product_id = p.id
        WHERE p.status = 'active'
        """,
        (since30, since60),
    )
    rows = cur.fetchall()
    at_risk, oos_demand, dead = [], [], []
    stock_value = 0.0
    for r in rows:
        stock, price = int(r["stock"]), float(r["price"])
        stock_value += stock * price
        daily = int(r["units30"]) / 30
        item = {"id": r["id"], "name": r["name"], "stock": stock, "price": price,
                "category": r["category"], "image": r["image"], "units30": int(r["units30"])}
        if stock > 0 and daily > 0:
            cover = stock / daily
            if cover < 14:
                at_risk.append({**item, "cover_days": round(cover, 1)})
        if stock == 0 and int(r["units30"]) > 0:
            oos_demand.append({**item, "lost_revenue_est": round(int(r["units30"]) * price)})
        if stock > 0 and int(r["units60"]) == 0:
            dead.append({**item, "tied_value": round(stock * price)})
    at_risk.sort(key=lambda x: x["cover_days"])
    oos_demand.sort(key=lambda x: -x["lost_revenue_est"])
    dead.sort(key=lambda x: -x["tied_value"])
    return {
        "stock_value": round(stock_value),
        "active_products": len(rows),
        "at_risk": at_risk[:8],
        "at_risk_total": len(at_risk),
        "out_of_stock_demand": oos_demand[:8],
        "out_of_stock_total": len(oos_demand),
        "dead_stock": dead[:8],
        "dead_stock_total": len(dead),
        "dead_stock_value": sum(d["tied_value"] for d in dead),
    }


def _monthly_history(cur, today, months=12):
    first = date(today.year, today.month, 1)
    y, m = first.year, first.month - (months - 1)
    while m <= 0:
        m += 12
        y -= 1
    start = date(y, m, 1)
    s = _series(cur, start, today, "month")
    return s


def _forecast(cur, today):
    hist = _monthly_history(cur, today, 12)
    complete = hist[:-1]  # bỏ tháng đang chạy
    cur_m = hist[-1]
    dim = calendar.monthrange(today.year, today.month)[1]
    projection = round(cur_m["revenue"] / today.day * dim) if today.day else 0
    base = [h["revenue"] for h in complete[-6:]]
    out = {"history": hist, "current_month_projection": projection,
           "current_month_actual": cur_m["revenue"], "days_elapsed": today.day, "days_in_month": dim,
           "months": [], "method": "Hồi quy tuyến tính 6 tháng đã chốt gần nhất, dải ±1 độ lệch chuẩn phần dư"}
    if len(base) < 4 or sum(base) == 0:
        return out
    n = len(base)
    xs = list(range(n))
    mx, my = sum(xs) / n, sum(base) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    slope = sum((x - mx) * (y - my) for x, y in zip(xs, base)) / sxx
    icpt = my - slope * mx
    resid = [y - (icpt + slope * x) for x, y in zip(xs, base)]
    sd = math.sqrt(sum(r * r for r in resid) / max(1, n - 2))
    y, m = today.year, today.month
    for k in range(1, 4):
        m += 1
        if m > 12:
            m, y = 1, y + 1
        v = max(0, icpt + slope * (n - 1 + k))
        out["months"].append({"period": date(y, m, 1).isoformat(), "value": round(v),
                              "low": round(max(0, v - sd)), "high": round(v + sd)})
    out["slope_per_month"] = round(slope)
    return out


def _top_customers(cur, d1, d2, limit=5):
    a, b = _dt(d1), _dt(d2 + timedelta(days=1))
    cur.execute(
        """
        SELECT u.id, u.name, COUNT(*) AS orders, SUM(o.total_amount) AS revenue
        FROM orders o JOIN users u ON u.id = o.user_id
        WHERE o.status='completed' AND o.created_at >= %s AND o.created_at < %s
        GROUP BY u.id, u.name ORDER BY revenue DESC LIMIT %s
        """,
        (a, b, limit),
    )
    return [{"id": r["id"], "name": r["name"], "orders": int(r["orders"]),
             "revenue": float(r["revenue"])} for r in cur.fetchall()]


def _stale_pending(cur):
    cur.execute(
        "SELECT COUNT(*) AS n FROM orders WHERE status='pending' AND created_at < NOW() - INTERVAL '24 hours'"
    )
    return int(cur.fetchone()["n"])


# ----------------------------------------------------------------------
# insights & roadmap
# ----------------------------------------------------------------------
def _build_insights(d, days):
    k, pk = d["kpi"], d["kpi_prev"]
    cats, prods, inv, heat = d["by_category"], d["top_products_all"], d["inventory"], d["heatmap"]
    out = []

    def add(kind, title, detail, action=None):
        out.append({"type": kind, "title": title, "detail": detail, "action": action})

    # 1. tăng trưởng
    ch = _pct_change(k["revenue"], pk["revenue"])
    if ch is None:
        add("info", "Chưa có kỳ trước để so sánh",
            f"Doanh thu kỳ này {_vnd(k['revenue'])}. Kỳ liền trước chưa phát sinh doanh thu hoàn tất.")
    elif ch >= 10:
        top_up = max(cats, key=lambda c: c["revenue"] - c.get("prev_revenue", 0), default=None)
        extra = f" Động lực chính: {top_up['name']}." if top_up and top_up["revenue"] > top_up.get("prev_revenue", 0) else ""
        add("opportunity", f"Doanh thu tăng {_f(ch)}% so với kỳ trước",
            f"{_vnd(k['revenue'])} so với {_vnd(pk['revenue'])}.{extra}",
            "Giữ nhịp: đảm bảo tồn kho các mã bán chạy và nhân rộng chiến dịch đang hiệu quả.")
    elif ch <= -10:
        add("risk", f"Doanh thu giảm {_f(abs(ch))}% so với kỳ trước",
            f"{_vnd(k['revenue'])} so với {_vnd(pk['revenue'])}.",
            "Rà soát đơn bị hủy, hết hàng và kênh lưu lượng; cân nhắc khuyến mãi ngắn hạn.")
    else:
        add("info", f"Doanh thu đi ngang ({'+' if ch >= 0 else ''}{_f(ch)}%)",
            f"{_vnd(k['revenue'])} so với {_vnd(pk['revenue'])} ở kỳ trước.")

    # 2. tập trung doanh thu
    if cats and k["revenue"]:
        top = cats[0]
        share = top["revenue"] / k["revenue"] * 100
        if share >= 50:
            add("risk", f"Phụ thuộc vào nhóm “{top['name']}” ({share:.0f}% doanh thu)",
                "Một nhóm chiếm quá nửa doanh thu: biến động mùa vụ hoặc nguồn cung của nhóm này ảnh hưởng toàn cửa hàng.",
                "Đẩy mạnh các nhóm còn lại bằng combo chéo (cá + thức ăn + phụ kiện).")
    if prods and k["revenue"]:
        top3 = sum(float(p["revenue"]) for p in prods[:3]) / k["revenue"] * 100
        if top3 >= 40:
            add("risk", f"3 sản phẩm đầu bảng chiếm {top3:.0f}% doanh thu",
                ", ".join(p["name"] for p in prods[:3]) + ".",
                "Đa dạng hóa danh mục bán chạy và đảm bảo nguồn cung dự phòng cho 3 mã này.")

    # 3. tồn kho
    cls_a = {p["id"] for p in d["abc"] if p["abc_class"] == "A"}
    risky_a = [x for x in inv["at_risk"] if x["id"] in cls_a]
    oos = inv["out_of_stock_demand"]
    if risky_a or oos:
        names = ", ".join([x["name"] for x in oos[:3]] + [x["name"] for x in risky_a[:3]])
        est = sum(x["lost_revenue_est"] for x in oos)
        add("risk", f"{inv['out_of_stock_total']} mã đang hết hàng dù có nhu cầu, {len(risky_a)} mã nhóm A sắp hết",
            f"Ví dụ: {names}." + (f" Doanh thu 30 ngày của các mã hết hàng ≈ {_vnd(est)}." if est else ""),
            "Lập đơn nhập bổ sung ngay; đặt mức tồn tối thiểu theo tốc độ bán (≥ 14 ngày).")
    if inv["dead_stock_total"]:
        add("opportunity", f"{inv['dead_stock_total']} mã tồn đọng (60 ngày không bán)",
            f"Giá trị tồn theo giá bán ≈ {_vnd(inv['dead_stock_value'])}.",
            "Gom thành combo, giảm giá có thời hạn hoặc ngừng nhập thêm.")

    # 4. khách hàng
    if k["customers"]:
        if k["returning_rate"] < 30:
            add("opportunity", f"Tỷ lệ khách quay lại {_f(k['returning_rate'])}%",
                f"{k['returning_customers']}/{k['customers']} khách đã từng mua trước kỳ này.",
                "Gửi ưu đãi mua lần 2 (email/Zalo) sau 7–14 ngày kể từ đơn hoàn tất.")
        else:
            share = k["returning_revenue"] / k["revenue"] * 100 if k["revenue"] else 0
            add("opportunity", f"Khách cũ đóng góp {share:.0f}% doanh thu",
                f"Tỷ lệ quay lại {_f(k['returning_rate'])}%.",
                "Lập chương trình khách thân thiết/tích điểm để giữ nhóm này.")

    # 5. vận hành
    if k["cancel_rate"] >= 10:
        add("risk", f"Tỷ lệ hủy đơn {_f(k['cancel_rate'])}%",
            f"{k['cancelled_orders']}/{k['created_orders']} đơn bị hủy trong kỳ.",
            "Kiểm tra lý do hủy (giao chậm, hết hàng, sai mô tả) và bổ sung xác nhận đơn nhanh.")
    if d["stale_pending"]:
        add("risk", f"{d['stale_pending']} đơn chờ xác nhận quá 24 giờ",
            "Đơn để lâu làm tăng nguy cơ khách hủy.",
            "Xử lý ngay tại tab Đơn hàng; cân nhắc thông báo đơn mới cho quản trị viên.")

    # 6. giỏ hàng
    if k["orders"] and k["single_item_rate"] >= 40:
        add("opportunity", f"{_f(k['single_item_rate'])}% đơn chỉ có 1 sản phẩm",
            f"Trung bình {_f(k['avg_items_per_order'], 2)} dòng hàng/đơn, AOV {_vnd(k['aov'])}.",
            "Gợi ý mua kèm tại giỏ hàng và đặt ngưỡng miễn phí vận chuyển cao hơn AOV hiện tại.")

    # 7. giờ cao điểm
    best, tot = None, 0
    for di, row in enumerate(heat["cells"]):
        for bi, cell in enumerate(row):
            tot += cell["revenue"]
            if best is None or cell["revenue"] > best[0]:
                best = (cell["revenue"], di, bi)
    if best and tot > 0:
        add("info", f"Khung giờ vàng: {heat['weekdays'][best[1]]} {heat['bands'][best[2]]}",
            f"Chiếm {best[0] / tot * 100:.0f}% doanh thu trong kỳ.",
            "Đặt thông báo khuyến mãi và trực tư vấn vào khung giờ này.")

    # 8. dữ liệu thiếu
    add("info", "Chưa có giá vốn nên chưa tính được lợi nhuận",
        "Báo cáo hiện dừng ở doanh thu; không thể xếp hạng sản phẩm theo biên lợi nhuận.",
        "Thêm cột products.cost_price để phân tích lợi nhuận gộp theo sản phẩm/nhóm.")
    return out


def _build_roadmap(d):
    k, inv = d["kpi"], d["inventory"]
    fc = d["forecast"]
    near = [
        {"title": "Chốt tồn kho an toàn cho mã bán chạy",
         "why": f"{inv['at_risk_total']} mã còn dưới 14 ngày bán, {inv['out_of_stock_total']} mã hết hàng vẫn có nhu cầu.",
         "kpi": "Tỷ lệ hết hàng nhóm A < 2%", "priority": "P1"},
        {"title": "Xử lý tồn đọng bằng combo/giảm giá có thời hạn",
         "why": f"{inv['dead_stock_total']} mã không bán trong 60 ngày, giá trị ≈ {_vnd(inv['dead_stock_value'])}.",
         "kpi": "Giảm 50% giá trị tồn đọng sau 60 ngày", "priority": "P1"},
        {"title": "Rút ngắn thời gian xác nhận đơn",
         "why": f"{d['stale_pending']} đơn chờ quá 24h, tỷ lệ hủy {_f(k['cancel_rate'])}%.",
         "kpi": "Xác nhận trong 2 giờ làm việc; hủy < 6%", "priority": "P1"},
    ]
    mid = [
        {"title": "Gợi ý mua kèm & combo thiết lập bể",
         "why": f"{_f(k['single_item_rate'])}% đơn chỉ 1 sản phẩm, AOV {_vnd(k['aov'])}.",
         "kpi": "AOV +15%, dòng hàng/đơn ≥ 1,8", "priority": "P2"},
        {"title": "Chương trình khách thân thiết & remarketing",
         "why": f"Tỷ lệ quay lại hiện {_f(k['returning_rate'])}%.",
         "kpi": "Tỷ lệ quay lại ≥ 40%", "priority": "P2"},
        {"title": "Thêm giá vốn để quản lý lợi nhuận",
         "why": "Chưa có cost_price nên mọi quyết định giá/khuyến mãi mới dựa trên doanh thu.",
         "kpi": "Biên lợi nhuận gộp theo nhóm hàng", "priority": "P2"},
    ]
    far = [
        {"title": "Dự báo nhu cầu & đặt hàng nhà cung cấp theo mùa",
         "why": ("Xu hướng " + (f"{'+' if fc.get('slope_per_month', 0) >= 0 else ''}{_vnd(fc['slope_per_month'])}/tháng"
                 if "slope_per_month" in fc else "chưa đủ dữ liệu") + "; mùa vụ cuối năm/Tết cần chuẩn bị hàng sớm."),
         "kpi": "Sai số dự báo < 15%", "priority": "P3"},
        {"title": "Mở rộng nhóm hàng giá trị cao (san hô, bể, thiết bị)",
         "why": "Nhóm giá thấp kéo số lượng nhưng ít đóng góp doanh thu mỗi đơn.",
         "kpi": "Tỷ trọng nhóm giá trị cao ≥ 30%", "priority": "P3"},
        {"title": "Thêm kênh bán & thanh toán online (QR/ví điện tử)",
         "why": "Mở rộng tệp khách ngoài khu vực và giảm rủi ro COD.",
         "kpi": "Tỷ lệ thanh toán trước ≥ 50%", "priority": "P3"},
    ]
    return [
        {"horizon": "Ngắn hạn (0–30 ngày)", "items": near},
        {"horizon": "Trung hạn (1–3 tháng)", "items": mid},
        {"horizon": "Dài hạn (3–12 tháng)", "items": far},
    ]


# ----------------------------------------------------------------------
# public API
# ----------------------------------------------------------------------
def get_revenue_analytics(d1: date, d2: date, group_by: str) -> dict:
    today = date.today()
    n_days = (d2 - d1).days + 1
    p2 = d1 - timedelta(days=1)
    p1 = p2 - timedelta(days=n_days - 1)

    with get_db_cursor() as cur:
        kpi, kpi_prev = _kpis(cur, d1, d2), _kpis(cur, p1, p2)
        series, series_prev = _series(cur, d1, d2, group_by), _series(cur, p1, p2, group_by)
        for i, row in enumerate(series):
            row["prev_revenue"] = series_prev[i]["revenue"] if i < len(series_prev) else None

        cats, cats_prev = _by_category(cur, d1, d2), {c["name"]: c for c in _by_category(cur, p1, p2)}
        total = sum(c["revenue"] for c in cats) or 1
        for c in cats:
            c["share"] = round(c["revenue"] / total * 100, 1)
            c["prev_revenue"] = cats_prev.get(c["name"], {}).get("revenue", 0)
            c["growth"] = _pct_change(c["revenue"], c["prev_revenue"])

        prods = _by_product(cur, d1, d2)
        prods_prev = {r["id"]: float(r["revenue"]) for r in _by_product(cur, p1, p2)}
        ptotal = sum(float(p["revenue"]) for p in prods) or 1
        cum, abc, top = 0.0, [], []
        for rank, p in enumerate(prods, start=1):
            rev = float(p["revenue"])
            before = cum / ptotal * 100
            cum += rev
            cls = "A" if before < 80 else "B" if before < 95 else "C"
            row = {
                "rank": rank, "id": p["id"], "name": p["name"], "category": p["category"],
                "image": p["image"], "stock": _num(p["stock"]), "price": _num(p["price"]),
                "status": p["status"], "units": int(p["units"]), "orders": int(p["orders"]),
                "revenue": rev, "share": round(rev / ptotal * 100, 1),
                "cum_share": round(cum / ptotal * 100, 1), "abc_class": cls,
                "growth": _pct_change(rev, prods_prev.get(p["id"], 0)),
                "cover_days": round(_num(p["stock"]) / (int(p["units"]) / n_days), 1)
                if p["stock"] is not None and int(p["units"]) > 0 else None,
            }
            abc.append(row)
            if rank <= 10:
                top.append(row)
        abc_summary = {}
        for cl in "ABC":
            items = [x for x in abc if x["abc_class"] == cl]
            abc_summary[cl] = {"products": len(items),
                               "revenue": sum(x["revenue"] for x in items),
                               "share": round(sum(x["revenue"] for x in items) / ptotal * 100, 1)}

        data = {
            "range": {"from": d1.isoformat(), "to": d2.isoformat(), "days": n_days,
                      "prev_from": p1.isoformat(), "prev_to": p2.isoformat(), "group_by": group_by},
            "definition": "Doanh thu = đơn có trạng thái completed, tính theo ngày tạo đơn.",
            "kpi": kpi, "kpi_prev": kpi_prev,
            "change": {key: _pct_change(kpi[key], kpi_prev[key])
                       for key in ("revenue", "orders", "aov", "units", "customers")},
            "series": series,
            "by_category": cats,
            "by_payment": _by_payment(cur, d1, d2),
            "funnel": _funnel(cur, d1, d2),
            "heatmap": _heatmap(cur, d1, d2),
            "top_products": top,
            "abc": abc,
            "abc_summary": abc_summary,
            "top_customers": _top_customers(cur, d1, d2),
            "inventory": _inventory(cur, today),
            "forecast": _forecast(cur, today),
            "stale_pending": _stale_pending(cur),
        }
    data["top_products_all"] = prods
    data["insights"] = _build_insights(data, n_days)
    data["roadmap"] = _build_roadmap(data)
    del data["top_products_all"]
    # giữ ABC gọn khi trả về (chỉ 25 dòng đầu)
    data["abc"] = data["abc"][:25]
    return data


def get_product_performance(days: int = 30) -> dict:
    """Hiệu suất bán của TỪNG sản phẩm (đơn hoàn tất) trong `days` ngày gần nhất.

    Dùng cho cột "Hiệu suất" ở trang Quản lý sản phẩm. Trả về map product_id -> số liệu.
    Hạng ABC xếp theo doanh thu lũy kế (A = 80% doanh thu đầu).
    """
    today = date.today()
    d1 = today - timedelta(days=days - 1)
    a, b = _dt(d1), _dt(today + timedelta(days=1))
    with get_db_cursor() as cur:
        cur.execute(
            """
            SELECT oi.product_id AS id, SUM(oi.quantity) AS units, SUM(oi.subtotal) AS revenue
            FROM order_items oi JOIN orders o ON o.id = oi.order_id
            WHERE o.status='completed' AND o.created_at >= %s AND o.created_at < %s
              AND oi.product_id IS NOT NULL
            GROUP BY oi.product_id ORDER BY revenue DESC
            """,
            (a, b),
        )
        rows = cur.fetchall()
        # tốc độ bán dùng đơn không hủy (tồn kho đã bị trừ lúc đặt hàng)
        cur.execute(
            """
            SELECT oi.product_id AS id, SUM(oi.quantity) AS units
            FROM order_items oi JOIN orders o ON o.id = oi.order_id
            WHERE o.status <> 'cancelled' AND o.created_at >= %s AND o.created_at < %s
              AND oi.product_id IS NOT NULL
            GROUP BY oi.product_id
            """,
            (a, b),
        )
        velocity = {r["id"]: int(r["units"]) for r in cur.fetchall()}
        cur.execute("SELECT id, stock FROM products")
        stock = {r["id"]: int(r["stock"]) for r in cur.fetchall()}

    total = sum(float(r["revenue"]) for r in rows) or 1
    cum, items = 0.0, {}
    for rank, r in enumerate(rows, start=1):
        before = cum / total * 100
        cum += float(r["revenue"])
        v = velocity.get(r["id"], 0)
        items[str(r["id"])] = {
            "units": int(r["units"]), "revenue": float(r["revenue"]), "rank": rank,
            "abc": "A" if before < 80 else "B" if before < 95 else "C",
            "cover_days": round(stock.get(r["id"], 0) / (v / days), 1) if v else None,
        }
    return {"days": days, "from": d1.isoformat(), "to": today.isoformat(),
            "sold_products": len(rows), "items": items}

"""Sinh dữ liệu DEMO 12 tháng để dashboard BI có số liệu để phân tích.

Chỉ dùng cho môi trường phát triển. Dữ liệu demo được đánh dấu bằng email
`*@demo.aqualife.test` nên chạy lại script là idempotent (xóa rồi tạo lại).

Chạy:
    cd BACKEND
    python scripts/seed_bi_demo.py            # 12 tháng gần nhất
    python scripts/seed_bi_demo.py --clean    # chỉ xóa dữ liệu demo

Lưu ý: script KHÔNG sửa tồn kho sản phẩm (để giữ nguyên dữ liệu seed gốc).
"""
import argparse
import math
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from werkzeug.security import generate_password_hash  # noqa: E402

from config.database import get_db_cursor, init_pool  # noqa: E402

DEMO_DOMAIN = "@demo.aqualife.test"
RNG = random.Random(20261025)  # cố định để kết quả lặp lại được

FAMILY = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô"]
GIVEN = ["Minh", "Hà", "Linh", "Tuấn", "Lan", "Hùng", "Mai", "Nam", "Thảo", "Quang",
         "Yến", "Dũng", "Trang", "Khoa", "Phương", "Long", "Ngọc", "Sơn", "Hạnh", "Việt"]
CITIES = ["Hà Nội", "TP Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế", "Nha Trang"]
STREETS = ["Nguyễn Trãi", "Lê Lợi", "Trần Hưng Đạo", "Giải Phóng", "Láng Hạ", "Hai Bà Trưng"]

# Hệ số mùa vụ theo tháng (tháng 1-2 gần Tết, tháng 5-7 mùa hè hồ thủy sinh)
SEASON = {1: 1.25, 2: 1.15, 3: 0.95, 4: 0.95, 5: 1.05, 6: 1.10,
          7: 1.10, 8: 1.00, 9: 1.00, 10: 1.08, 11: 1.12, 12: 1.20}
HOUR_WEIGHTS = {8: 2, 9: 3, 10: 4, 11: 4, 12: 3, 13: 3, 14: 3, 15: 3, 16: 4,
                17: 5, 18: 6, 19: 8, 20: 9, 21: 8, 22: 5, 23: 2}
WEEKDAY_WEIGHTS = [0.85, 0.85, 0.9, 0.95, 1.1, 1.35, 1.3]  # T2..CN


def clean(cur):
    cur.execute("SELECT id FROM users WHERE email LIKE %s", (f"%{DEMO_DOMAIN}",))
    ids = [r["id"] for r in cur.fetchall()]
    if not ids:
        return 0
    cur.execute("DELETE FROM reviews WHERE user_id = ANY(%s)", (ids,))
    cur.execute("DELETE FROM orders WHERE user_id = ANY(%s)", (ids,))  # cascade order_items
    cur.execute("DELETE FROM users WHERE id = ANY(%s)", (ids,))
    return len(ids)


def month_start(dt, back):
    y, m = dt.year, dt.month - back
    while m <= 0:
        m += 12
        y -= 1
    return datetime(y, m, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--clean", action="store_true", help="chỉ xóa dữ liệu demo")
    args = ap.parse_args()

    from app import create_app  # khởi tạo pool đúng cách

    create_app()
    init_pool()

    with get_db_cursor(commit=True) as cur:
        removed = clean(cur)
        print(f"Đã xóa {removed} khách demo cũ (và đơn hàng của họ).")
        if args.clean:
            return

        cur.execute(
            "SELECT id, name, price, category_id FROM products WHERE status='active'"
        )
        products = cur.fetchall()
        if not products:
            sys.exit("Chưa có sản phẩm. Hãy chạy DATABASE/seed.sql trước.")

        # Độ phổ biến sản phẩm: phân phối Zipf + ưu tiên mặt hàng giá thấp-trung bình
        order = products[:]
        RNG.shuffle(order)
        pop = {}
        for rank, p in enumerate(order, start=1):
            price = float(p["price"])
            price_bias = 1.0 if price < 100_000 else 0.55 if price < 300_000 else 0.3
            pop[p["id"]] = (1.0 / rank ** 0.85) * price_bias
        pids = [p["id"] for p in products]
        weights = [pop[i] for i in pids]
        pinfo = {p["id"]: p for p in products}

        # 45 khách demo, đăng ký rải đều theo thời gian
        pwd = generate_password_hash("Demo@12345")
        now = datetime.now().replace(microsecond=0)
        start = month_start(now, 11)
        customers = []
        for i in range(45):
            name = f"{RNG.choice(FAMILY)} {RNG.choice(['Văn', 'Thị', 'Quốc', 'Thanh'])} {RNG.choice(GIVEN)}"
            joined = start + timedelta(days=RNG.randint(0, (now - start).days - 3))
            cur.execute(
                """INSERT INTO users (name, email, password_hash, role, status, phone, address, created_at)
                   VALUES (%s,%s,%s,'customer','active',%s,%s,%s) RETURNING id""",
                (name, f"kh{i + 1:02d}{DEMO_DOMAIN}", pwd,
                 f"09{RNG.randint(10000000, 99999999)}",
                 f"{RNG.randint(1, 250)} {RNG.choice(STREETS)}, {RNG.choice(CITIES)}",
                 joined),
            )
            customers.append({"id": cur.fetchone()["id"], "name": name, "joined": joined,
                              "loyal": RNG.random() < 0.3})

        total_orders = 0
        day = start
        while day.date() <= now.date():
            # đơn/ngày: nền tăng trưởng 0.9 -> 3.6 đơn/ngày * mùa vụ * thứ trong tuần
            progress = (day - start).days / max(1, (now - start).days)
            base = 0.9 + 2.7 * progress ** 1.2
            lam = base * SEASON[day.month] * WEEKDAY_WEIGHTS[day.weekday()]
            n = _poisson(lam)
            eligible = [c for c in customers if c["joined"] <= day]
            for _ in range(n if eligible else 0):
                # khách trung thành mua nhiều hơn
                cust = RNG.choices(eligible, weights=[3.0 if c["loyal"] else 1.0 for c in eligible])[0]
                hour = RNG.choices(list(HOUR_WEIGHTS), weights=list(HOUR_WEIGHTS.values()))[0]
                created = day.replace(hour=hour, minute=RNG.randint(0, 59), second=RNG.randint(0, 59))
                if created > now:
                    continue
                total_orders += 1
                _create_order(cur, cust, created, now, pids, weights, pinfo)
            day += timedelta(days=1)

        print(f"Đã tạo {len(customers)} khách demo và {total_orders} đơn hàng demo.")


def _poisson(lam):
    L, k, p = math.exp(-lam), 0, 1.0
    while p > L:
        k += 1
        p *= RNG.random()
    return k - 1


def _create_order(cur, cust, created, now, pids, weights, pinfo):
    age_days = (now - created).days
    # trạng thái theo độ tuổi đơn
    if age_days > 10:
        status = RNG.choices(["completed", "cancelled"], weights=[92, 8])[0]
    elif age_days > 4:
        status = RNG.choices(["completed", "shipping", "cancelled"], weights=[70, 22, 8])[0]
    elif age_days > 1:
        status = RNG.choices(["shipping", "processing", "confirmed", "cancelled"], weights=[40, 30, 22, 8])[0]
    else:
        status = RNG.choices(["pending", "confirmed", "processing"], weights=[55, 30, 15])[0]

    n_lines = RNG.choices([1, 2, 3, 4], weights=[45, 30, 17, 8])[0]
    chosen = set()
    lines = []
    for _ in range(n_lines):
        pid = RNG.choices(pids, weights=weights)[0]
        if pid in chosen:
            continue
        chosen.add(pid)
        p = pinfo[pid]
        price = float(p["price"])
        qty = RNG.choices([1, 2, 3, 5, 10], weights=[45, 25, 15, 10, 5])[0] if price < 60_000 \
            else RNG.choices([1, 2, 3], weights=[75, 20, 5])[0]
        lines.append((pid, p["name"], price, qty))
    total = sum(price * qty for _, _, price, qty in lines)
    cur.execute(
        """INSERT INTO orders (user_id, total_amount, status, shipping_name, shipping_phone,
                               shipping_address, payment_method, created_at, updated_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING id""",
        (cust["id"], total, status, cust["name"], "0900000000", "Địa chỉ demo",
         RNG.choices(["cod", "bank_transfer"], weights=[58, 42])[0],
         created, created + timedelta(hours=RNG.randint(2, 70))),
    )
    oid = cur.fetchone()["id"]
    for pid, name, price, qty in lines:
        cur.execute(
            """INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            (oid, pid, name, price, qty, price * qty),
        )


if __name__ == "__main__":
    main()

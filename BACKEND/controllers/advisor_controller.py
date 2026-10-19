import re
from flask import request
from services.product_service import list_products
from utils.responses import success, error


WATER_GUIDES = {
    "Nước mặn": {
        "icon": "",
        "temp": "24 – 26°C",
        "ph": "8.1 – 8.4",
        "salinity": "1.023 – 1.025 SG (Độ mặn 32 – 35 ppt)",
        "setup_tip": (
            "Pha muối biển chuyên dụng với nước RO, chạy lọc váng và đèn quang phổ Xanh (Actinic) "
            "trước khi thả San hô, Ốc dọn rêu rồi mới thả Cá và Tép."
        ),
    },
    "Nước lợ": {
        "icon": "",
        "temp": "24 – 28°C",
        "ph": "7.5 – 8.2",
        "salinity": "1.005 – 1.015 SG (Pha 8 – 15g muối biển/lít)",
        "setup_tip": (
            "Dùng nền cát san hô vụn hoặc sỏi suối để giữ pH ổn định, bố trí lũa rừng ngập mặn "
            "và cây chịu lợ (Dương xỉ, Tiêu thảo) tạo lãnh thổ cho cá."
        ),
    },
    "Nước ngọt": {
        "icon": "",
        "temp": "23 – 28°C",
        "ph": "6.5 – 7.5",
        "salinity": "0 ppt (Nước ngọt hoàn toàn, đã khử Clo)",
        "setup_tip": (
            "Chạy lọc vi sinh tối thiểu 24–48h, trồng cây thủy sinh rồi thả đội vệ sinh (Ốc cảnh, Tép cảnh) "
            "trước khi thả đàn cá chính để bể luôn trong vắt."
        ),
    },
}

ROLE_LABELS = {
    "Cá": "Cá cảnh chủ đạo (Tâm điểm của bể)",
    "Thủy Sinh / San hô": "Nền sinh thái (San hô / Cây thủy sinh tạo cảnh & trú ẩn)",
    "Ốc": "Đội dọn rêu hại (Làm sạch thành kính & đá lũa)",
    "Tép": "Đội vệ sinh tầng đáy (Dọn thức ăn thừa & rêu tơ)",
}


def _parse_budget(text: str, explicit_budget: int | None = None) -> int:
    if explicit_budget and explicit_budget > 0:
        return int(explicit_budget)

    lower = text.lower().replace(",", ".")
    # Match patterns like 1tr5, 1.5tr, 2 triệu, 2 củ
    m_tr_combo = re.search(r"(\d+)\s*(?:tr|triệu|củ)\s*(\d+)", lower)
    if m_tr_combo:
        millions = int(m_tr_combo.group(1))
        dec = int(m_tr_combo.group(2))
        scale = 100000 if dec < 10 else 10000
        return millions * 1000000 + dec * scale

    m_tr = re.search(r"(\d+(?:\.\d+)?)\s*(?:tr|triệu|trieu|củ|cu)\b", lower)
    if m_tr:
        return int(float(m_tr.group(1)) * 1000000)

    # Match patterns like 500k, 500 nghìn, 500 ngàn, 500 cành
    m_k = re.search(r"(\d+(?:\.\d+)?)\s*(?:k|nghìn|nghin|ngàn|ngan|cành|canh)\b", lower)
    if m_k:
        return int(float(m_k.group(1)) * 1000)

    # Match plain large numbers like 500.000 or 500000
    raw_digits = re.sub(r"\.(\d{3})\b", r"\1", lower)
    m_num = re.search(r"\b(\d{5,8})\b", raw_digits)
    if m_num:
        return int(m_num.group(1))

    return 500000


def _parse_water_type(text: str, explicit_water: str | None = None) -> str:
    if explicit_water in ("Nước mặn", "Nước lợ", "Nước ngọt"):
        return explicit_water

    lower = text.lower()
    if any(k in lower for k in ("nước mặn", "nuoc man", "cá biển", "ca bien", "san hô", "san ho", "hải quỳ", "nemo", "đại dương")):
        return "Nước mặn"
    if any(k in lower for k in ("nước lợ", "nuoc lo", "ngập mặn", "cá nóc", "bắn tỉa", "bống rồng", "bống hiệp sĩ", "ong mật")):
        return "Nước lợ"
    if any(k in lower for k in ("nước ngọt", "nuoc ngot", "thủy sinh", "thuy sinh", "betta", "guppy", "bảy màu", "neon", "koi", "rồng")):
        return "Nước ngọt"
    return "Nước mặn" if "mặn" in lower else ("Nước lợ" if "lợ" in lower else "Nước ngọt")


def _get_item_tier(product: dict, max_price: float) -> tuple[str, float]:
    sizes = product.get("sizes") or []
    if not sizes:
        return "Size M - Tiêu chuẩn", float(product.get("price") or 0)

    # Choose the nicest size that fits within max_price, or the smallest size
    sorted_sizes = sorted(sizes, key=lambda s: float(s.get("price") or 0))
    chosen = sorted_sizes[0]
    for s in sorted_sizes:
        if float(s.get("price") or 0) <= max_price:
            chosen = s
    return chosen["size"], float(chosen["price"])


def build_tank_combo(
    message: str,
    explicit_budget: int | None = None,
    explicit_water: str | None = None,
    variant_index: int = 0,
) -> dict:
    budget = _parse_budget(message, explicit_budget)
    water_type = _parse_water_type(message, explicit_water)
    all_prods = list_products(available_only=True)

    # Filter products matching the environment
    env_prods = [
        p
        for p in all_prods
        if (p.get("waterType") or p.get("water_type") or "Nước ngọt") == water_type
        and int(p.get("stock") or 0) > 0
    ]

    by_species: dict[str, list[dict]] = {
        "Cá": [],
        "Thủy Sinh / San hô": [],
        "Ốc": [],
        "Tép": [],
    }
    for p in env_prods:
        sp = p.get("species") or "Cá"
        by_species.setdefault(sp, []).append(p)

    # Sort each group by smallest size price ascending
    for sp in by_species:
        by_species[sp].sort(
            key=lambda x: min(
                [float(s.get("price") or x["price"]) for s in (x.get("sizes") or [{"price": x["price"]}])]
            )
        )

    remaining = float(budget)
    combo_items: list[dict] = []

    def add_or_increment(prod: dict, size_label: str, unit_price: float, qty: int, role_key: str):
        nonlocal remaining
        cost = unit_price * qty
        if cost > remaining or qty <= 0:
            return False
        for existing in combo_items:
            if existing["id"] == prod["id"] and existing["selected_size"] == size_label:
                if existing["quantity"] + qty > int(prod.get("stock") or 10):
                    return False
                existing["quantity"] += qty
                existing["subtotal"] = existing["quantity"] * existing["unit_price"]
                remaining -= cost
                return True
        combo_items.append(
            {
                "id": prod["id"],
                "slug": prod.get("slug") or str(prod["id"]),
                "name": prod["name"],
                "image": prod.get("image") or "image/ocean-bg.svg",
                "species": prod.get("species") or role_key,
                "role_label": ROLE_LABELS.get(role_key, role_key),
                "water_type": water_type,
                "selected_size": size_label,
                "unit_price": unit_price,
                "quantity": qty,
                "subtotal": cost,
                "stock": int(prod.get("stock") or 10),
            }
        )
        remaining -= cost
        return True

    # Target ecological sequence:
    # 1. Main Fish (Cá) ~ 40-50% budget
    # 2. Coral / Aquascape (Thủy Sinh / San hô) ~ 25-35% budget
    # 3. Cleaner Snail (Ốc) ~ 10-15% budget
    # 4. Cleaner Shrimp (Tép) ~ 10-15% budget
    plan_roles = [
        ("Cá", 0.48),
        ("Thủy Sinh / San hô", 0.32),
        ("Ốc", 0.12),
        ("Tép", 0.12),
    ]

    for role_idx, (role_key, share) in enumerate(plan_roles):
        candidates = by_species.get(role_key) or []
        if not candidates:
            continue

        role_cap = max(remaining * 0.65, budget * share)
        # Filter candidates whose lowest size price <= remaining
        affordable = [
            p
            for p in candidates
            if min([float(s.get("price") or p["price"]) for s in (p.get("sizes") or [{"price": p["price"]}])])
            <= remaining
        ]
        if not affordable:
            continue

        # Pick candidate based on variant_index and role_cap so it feels intelligent & varied
        prefer = [
            p
            for p in affordable
            if min([float(s.get("price") or p["price"]) for s in (p.get("sizes") or [{"price": p["price"]}])])
            <= role_cap
        ]
        pool = prefer if prefer else affordable
        chosen_prod = pool[(variant_index + role_idx) % len(pool)]
        size_label, unit_price = _get_item_tier(chosen_prod, min(role_cap, remaining))

        if unit_price <= remaining:
            # Determine initial quantity (e.g., schooling small fish or multiple snails/shrimps if cheap)
            init_qty = 1
            if role_key in ("Cá", "Tép") and unit_price * 2 <= min(role_cap, remaining) and unit_price <= budget * 0.2:
                init_qty = 2
            add_or_increment(chosen_prod, size_label, unit_price, init_qty, role_key)

    # Top-up pass: if we still have significant budget left (> 15% of budget), add a second fish species or extra snails/shrimp/plants
    for extra_round in range(4):
        if remaining < 10000:
            break
        progressed = False
        for role_key in ("Cá", "Thủy Sinh / San hô", "Ốc", "Tép"):
            candidates = by_species.get(role_key) or []
            affordable = [
                p
                for p in candidates
                if min([float(s.get("price") or p["price"]) for s in (p.get("sizes") or [{"price": p["price"]}])])
                <= remaining
            ]
            if not affordable:
                continue
            pick = affordable[(variant_index + extra_round + len(combo_items)) % len(affordable)]
            size_label, unit_price = _get_item_tier(pick, remaining * 0.6)
            if unit_price <= remaining:
                if add_or_increment(pick, size_label, unit_price, 1, role_key):
                    progressed = True
                    if remaining < budget * 0.08:
                        break
        if not progressed:
            break

    total_cost = sum(item["subtotal"] for item in combo_items)
    guide = WATER_GUIDES.get(water_type, WATER_GUIDES["Nước ngọt"])

    species_summary = []
    for rk in ("Cá", "Thủy Sinh / San hô", "Ốc", "Tép"):
        matched = [i for i in combo_items if i["species"] == rk]
        if matched:
            names = ", ".join(f"{i['quantity']}x {i['name']} ({i['selected_size']})" for i in matched)
            species_summary.append(f"• **{ROLE_LABELS[rk]}**: {names}")

    summary_text = (
        f"Với ngân sách **{int(budget):,}đ** cho hệ sinh thái **{guide['icon']} {water_type}**, "
        f"Chuyên gia Aqualife gợi ý cấu hình bể cân bằng sinh học gồm **{len(combo_items)} loài "
        f"({sum(i['quantity'] for i in combo_items)} cá thể)** với tổng chi phí **{int(total_cost):,}đ** "
        f"(dư **{int(remaining):,}đ** dự phòng thức ăn/vi sinh):"
    ).replace(",", ".")

    return {
        "query": message,
        "budget": int(budget),
        "water_type": water_type,
        "variant_index": variant_index,
        "total_cost": int(total_cost),
        "remaining_budget": int(remaining),
        "total_creatures": sum(i["quantity"] for i in combo_items),
        "guide": guide,
        "summary_text": summary_text,
        "species_breakdown": species_summary,
        "items": combo_items,
    }


def chat_advisor():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    message = str(body.get("message") or "").strip()
    if not message:
        message = "Tư vấn build bể 500k nước mặn"

    raw_budget = body.get("budget")
    explicit_budget = int(raw_budget) if raw_budget and str(raw_budget).isdigit() else None
    explicit_water = body.get("water_type")
    variant_index = int(body.get("variant_index") or 0)

    result = build_tank_combo(
        message=message,
        explicit_budget=explicit_budget,
        explicit_water=explicit_water,
        variant_index=variant_index,
    )
    return success(result)

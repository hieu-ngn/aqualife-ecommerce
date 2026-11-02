import re
import unicodedata
from flask import request
from services.product_service import list_products
from utils.responses import success, error


WATER_GUIDES = {
    "Nước mặn": {
        "icon": "🌊",
        "temp": "24 – 26°C",
        "ph": "8.1 – 8.4",
        "salinity": "1.023 – 1.025 SG (Độ mặn 32 – 35 ppt)",
        "setup_tip": (
            "Pha muối biển chuyên dụng với nước RO, chạy lọc váng và đèn quang phổ Xanh (Actinic) "
            "trước khi thả San hô, Ốc dọn rêu rồi mới thả Cá và Tép."
        ),
    },
    "Nước lợ": {
        "icon": "🌿",
        "temp": "24 – 28°C",
        "ph": "7.5 – 8.2",
        "salinity": "1.005 – 1.015 SG (Pha 8 – 15g muối biển/lít)",
        "setup_tip": (
            "Dùng nền cát san hô vụn hoặc sỏi suối để giữ pH ổn định, bố trí lũa rừng ngập mặn "
            "và cây chịu lợ (Dương xỉ, Tiêu thảo) tạo lãnh thổ cho cá."
        ),
    },
    "Nước ngọt": {
        "icon": "💧",
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

OFF_TOPIC_REFUSAL_MESSAGE = (
    "Xin lỗi, Chatbox không hỗ trợ nội dung này. Trợ lý Aqualife chỉ tư vấn các vấn đề "
    "liên quan đến bể cá, cá cảnh, sinh vật thủy sinh (cá, tép, ốc, san hô) và thiết lập môi trường nước tại Aqualife."
)

# Các từ khóa ngoài lĩnh vực bể cá (nếu xuất hiện mà không gắn với ngữ cảnh bể cá thì từ chối ngay)
OFF_TOPIC_KEYWORDS = (
    "thời tiết", "thoi tiet", "mưa", "nắng", "bóng đá", "bong da", "world cup", "ngoại hạng",
    "chứng khoán", "chung khoan", "bitcoin", "crypto", "vàng sjc", "bất động sản",
    "điện thoại", "dien thoai", "iphone", "samsung", "xiaomi", "oppo", "laptop", "macbook",
    "máy tính", "may tinh", "card màn hình", "quần áo", "quan ao", "giày dép", "túi xách",
    "mỹ phẩm", "son môi", "nước hoa", "xe máy", "ô tô", "xe hơi", "honda", "yamaha",
    "nấu ăn", "nau an", "cơm rang", "phở bò", "bún chả", "trà sữa", "cà phê", "lẩu", "nướng",
    "xem phim", "ca nhạc", "ca sĩ", "diễn viên", "bài hát", "game", "liên quân", "lmht", "pubg",
    "lập trình", "lap trinh", "code python", "javascript", "java", "c++", "html", "css",
    "giải toán", "phương trình", "đạo hàm", "tích phân", "vật lý", "hóa học", "lịch sử", "địa lý",
    "tổng thống", "chính trị", "chiến tranh", "người yêu", "tán gái", "bói toán", "tử vi", "xổ số", "lô đề",
)

# Các từ khóa thuộc lĩnh vực Bể cá / Thủy sinh / Aqualife
AQUARIUM_KEYWORDS = (
    "cá", "tép", "tôm", "ốc", "san hô", "hải quỳ", "thủy sinh", "rong", "rêu", "tảo",
    "dương xỉ", "tiêu thảo", "bể", "hồ", "nước mặn", "nước ngọt", "nước lợ", "cá biển",
    "mặn", "ngọt", "lợ", "nemo", "thia", "hoàng đế", "bướm", "trạng nguyên", "betta",
    "guppy", "bảy màu", "oranda", "đầu lân", "piranha", "cá chuột", "longfin", "mahseer",
    "mương hoa", "chạch", "botia", "thần tiên", "kim sơn", "bống", "mập", "nerita",
    "nerite", "turbo", "trochus", "ramshorn", "ốc táo", "mặt trăng", "amano", "su la",
    "sula", "rili", "fire red", "blue dream", "socola", "ong đỏ", "vàng thái", "vàng đài",
    "peppermint", "bác sĩ", "blood red", "coral banded", "tép ma", "xenia", "toadstool",
    "zoanthid", "hammer", "torch", "san hô não", "san hô mè", "lọc", "sủi", "oxy", "đèn",
    "sưởi", "vi sinh", "độ mặn", "nhiệt độ", "thay nước", "ph ", "nuôi", "thả", "ghép",
    "cắn", "thức ăn", "cám", "size", "combo", "build", "setup", "set up", "aqualife",
)

AQUARIUM_ASCII_PATTERNS = (
    r"\bca\b", r"\btep\b", r"\btom\b", r"\boc\b", r"\bsan ho\b", r"\bhai quy\b",
    r"\bthuy sinh\b", r"\bbe\b", r"\bho ca\b", r"\bnuoc man\b", r"\bnuoc ngot\b",
    r"\bnuoc lo\b", r"\bca bien\b", r"\bsetup\b", r"\bbuild\b", r"\bcombo\b",
    r"\bnemo\b", r"\bbetta\b", r"\bguppy\b", r"\bpiranha\b", r"\bmahseer\b",
    r"\bbotia\b", r"\bnerita\b", r"\bturbo\b", r"\btrochus\b", r"\bamano\b",
    r"\bxenia\b", r"\bzoanthid\b", r"\bhammer\b", r"\btorch\b", r"\bph\b",
)

GREETING_PATTERNS = (
    r"^(?:xin chào|chào|chào shop|chào bạn|hello|hi|hey|alo|shop ơi|ad ơi|tư vấn|tư vấn giúp)[!.,?\s]*$",
)


def _strip_accents(text: str) -> str:
    norm = unicodedata.normalize("NFD", text)
    return "".join(ch for ch in norm if unicodedata.category(ch) != "Mn").replace("đ", "d").replace("Đ", "D")


def _classify_domain(message: str) -> str:
    """Trả về 'aquarium', 'greeting', hoặc 'off_topic'."""
    lower = message.lower().strip()
    if not lower:
        return "greeting"

    for pat in GREETING_PATTERNS:
        if re.match(pat, lower):
            return "greeting"

    # Kiểm tra từ khóa ngoài luồng trước
    for bad_kw in OFF_TOPIC_KEYWORDS:
        if bad_kw in lower:
            return "off_topic"

    # Kiểm tra từ khóa có dấu thuộc lĩnh vực bể cá
    for kw in AQUARIUM_KEYWORDS:
        if kw in lower:
            return "aquarium"

    # Kiểm tra từ khóa không dấu (VD: "ca 500 nuoc man chon ca nao")
    ascii_lower = _strip_accents(lower)
    for pat in AQUARIUM_ASCII_PATTERNS:
        if re.search(pat, ascii_lower):
            return "aquarium"

    return "off_topic"


def _has_explicit_budget(text: str) -> bool:
    lower = text.lower().replace(",", ".")
    if re.search(r"\d+\s*(?:tr|triệu|trieu|củ|cu|k|nghìn|nghin|ngàn|ngan|cành|canh|đ|vnd|đồng)\b", lower):
        return True
    raw_digits = re.sub(r"\.(\d{3})\b", r"\1", lower)
    if re.search(r"\b\d{5,8}\b", raw_digits):
        return True
    # Bare number like "500" in "cá 500 nước mặn" or "tầm 300"
    if re.search(r"\b([2-9]\d|[1-9]\d{2,3})\b(?!\s*(?:cm|mm|lít|lit|l\b|con|cá thể|°|độ|%))", lower):
        return True
    return False


def _parse_budget(text: str, explicit_budget: int | None = None) -> int:
    if explicit_budget and explicit_budget > 0:
        return int(explicit_budget)

    lower = text.lower().replace(",", ".")
    # Match patterns like 1tr5, 1.5tr, 2 triệu, 2 củ
    m_tr_combo = re.search(r"(\d+)\s*(?:tr|triệu|trieu|củ|cu)\s*(\d+)", lower)
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

    # Match shorthand numbers like "500" in "cá 500 nước mặn" -> 500.000đ
    m_short = re.search(
        r"\b([2-9]\d|[1-9]\d{2,3})\b(?!\s*(?:cm|mm|lít|lit|l\b|con|cá thể|°|độ|%))",
        lower,
    )
    if m_short:
        val = int(m_short.group(1))
        if 15 <= val <= 9999:
            return val * 1000

    return 500000


def _parse_water_type(text: str, explicit_water: str | None = None) -> str:
    if explicit_water in ("Nước mặn", "Nước lợ", "Nước ngọt"):
        return explicit_water

    lower = text.lower()
    ascii_lower = _strip_accents(lower)
    if any(
        k in lower
        for k in ("nước mặn", "cá biển", "san hô", "hải quỳ", "nemo", "đại dương", "hoàng đế", "cá bướm", "trạng nguyên", "thia xanh", "tôm bác sĩ")
    ) or any(k in ascii_lower for k in ("nuoc man", "ca bien", "san ho", "hai quy")):
        return "Nước mặn"
    if any(
        k in lower
        for k in ("nước lợ", "ngập mặn", "cá nóc", "bắn tỉa", "bống rồng", "bống hiệp sĩ", "mập colombia", "tép ma")
    ) or "nuoc lo" in ascii_lower:
        return "Nước lợ"
    if any(
        k in lower
        for k in ("nước ngọt", "thủy sinh", "betta", "guppy", "bảy màu", "neon", "koi", "rồng", "piranha", "đầu lân", "cá chuột", "thần tiên", "mahseer")
    ) or "nuoc ngot" in ascii_lower:
        return "Nước ngọt"
    return "Nước mặn" if "mặn" in lower else ("Nước lợ" if "lợ" in lower else "Nước ngọt")


def _detect_requested_species(text: str) -> str | None:
    """Kiểm tra xem người dùng đang hỏi đích danh 1 nhóm sinh vật (VD: 'chọn cá nào', 'cá 500 nước mặn') hay hỏi build cả bể."""
    lower = text.lower()
    ascii_lower = _strip_accents(lower)

    # Nếu người dùng nói rõ build bể / setup bể / combo hoặc liệt kê nhiều nhóm (cá, ốc, tép...) -> trả None để chạy build_tank_combo
    is_full_tank = any(
        kw in lower
        for kw in ("build bể", "build hồ", "setup bể", "set up bể", "combo bể", "trọn bộ", "cấu hình bể", "gồm những gì")
    ) or any(kw in ascii_lower for kw in ("build be", "setup be", "combo be"))

    mentioned_groups = set()
    if re.search(r"\bcá\b", lower) or re.search(r"\bca\b", ascii_lower):
        # Lưu ý: nếu chỉ có cụm "bể cá" hoặc "hồ cá" kèm "build" thì là hỏi cả bể
        cleaned_ca = re.sub(r"\b(?:bể|hồ)\s+cá\b", "", lower)
        cleaned_ca_ascii = re.sub(r"\b(?:be|ho)\s+ca\b", "", ascii_lower)
        if re.search(r"\bcá\b", cleaned_ca) or re.search(r"\bca\b", cleaned_ca_ascii):
            mentioned_groups.add("Cá")
    if re.search(r"\b(?:tép|tôm)\b", lower) or re.search(r"\b(?:tep|tom)\b", ascii_lower):
        mentioned_groups.add("Tép")
    if re.search(r"\bốc\b", lower) or re.search(r"\boc\b", ascii_lower):
        mentioned_groups.add("Ốc")
    if any(k in lower for k in ("san hô", "cây thủy sinh", "rong", "dương xỉ", "tiêu thảo")) or "san ho" in ascii_lower:
        mentioned_groups.add("Thủy Sinh / San hô")

    if is_full_tank or len(mentioned_groups) != 1:
        return None

    return next(iter(mentioned_groups))


def _get_item_tier(product: dict, max_price: float) -> tuple[str, float]:
    sizes = product.get("sizes") or []
    if not sizes:
        return "Size M - Tiêu chuẩn", float(product.get("price") or 0)

    sorted_sizes = sorted(sizes, key=lambda s: float(s.get("price") or 0))
    chosen = sorted_sizes[0]
    for s in sorted_sizes:
        if float(s.get("price") or 0) <= max_price:
            chosen = s
    return chosen["size"], float(chosen["price"])


def build_species_recommendation(
    message: str,
    target_species: str,
    budget: int,
    water_type: str,
    variant_index: int = 0,
) -> dict:
    """Khi người dùng hỏi kiểu: 'cá 500 nước mặn có thể chọn cá nào' -> Liệt kê tất cả loài Cá nước mặn <= 500k và gợi ý cách chọn."""
    all_prods = list_products(available_only=True)
    env_species_prods = [
        p
        for p in all_prods
        if (p.get("waterType") or p.get("water_type") or "Nước ngọt") == water_type
        and (p.get("species") or "Cá") == target_species
        and int(p.get("stock") or 0) > 0
    ]

    def min_price(p: dict) -> float:
        sizes = p.get("sizes") or [{"price": p["price"]}]
        return min(float(s.get("price") or p["price"]) for s in sizes)

    env_species_prods.sort(key=min_price)

    affordable = [p for p in env_species_prods if min_price(p) <= budget]
    slightly_above = [p for p in env_species_prods if min_price(p) > budget]

    guide = WATER_GUIDES.get(water_type, WATER_GUIDES["Nước ngọt"])

    # Tạo danh sách tất cả các lựa chọn phù hợp để hiển thị cho khách chọn
    catalog_options = []
    for p in affordable:
        sizes = p.get("sizes") or [{"size": "Size M - Tiêu chuẩn", "price": p["price"]}]
        valid_sizes = [s for s in sizes if float(s.get("price") or p["price"]) <= budget]
        if not valid_sizes:
            valid_sizes = [sizes[0]]
        best_size = valid_sizes[0]
        unit_p = float(best_size.get("price") or p["price"])
        max_qty = max(1, min(int(p.get("stock") or 10), int(budget // unit_p)))
        sizes_label_str = ", ".join(
            f"{s['size']}: {int(float(s['price'])):,}đ".replace(",", ".") for s in valid_sizes
        )
        catalog_options.append(
            {
                "id": p["id"],
                "slug": p.get("slug") or str(p["id"]),
                "name": p["name"],
                "image": p.get("image") or "image/ocean-bg.svg",
                "species": target_species,
                "role_label": f"Lựa chọn {target_species} {water_type} (Tầm giá ≤ {int(budget):,}đ)".replace(",", "."),
                "water_type": water_type,
                "selected_size": best_size["size"],
                "unit_price": unit_p,
                "quantity": 1,
                "subtotal": unit_p,
                "max_qty_in_budget": max_qty,
                "available_sizes_note": sizes_label_str,
                "description": p.get("description") or "",
                "stock": int(p.get("stock") or 10),
            }
        )

    # Đồng thời tạo 1 phương án phối kết hợp trong tầm ngân sách (nếu khách bấm "Gợi ý phương án khác" sẽ xoay vòng các loài)
    combo_items = []
    remaining = float(budget)
    if affordable:
        # Sắp xếp xoay vòng theo variant_index để tạo các phương án chọn khác nhau
        rotated = affordable[variant_index % len(affordable) :] + affordable[: variant_index % len(affordable)]
        for p in rotated:
            sz_label, u_price = _get_item_tier(p, remaining)
            if u_price <= remaining:
                qty = 2 if (u_price * 2 <= remaining and len(affordable) <= 2) else 1
                cost = u_price * qty
                combo_items.append(
                    {
                        "id": p["id"],
                        "slug": p.get("slug") or str(p["id"]),
                        "name": p["name"],
                        "image": p.get("image") or "image/ocean-bg.svg",
                        "species": target_species,
                        "role_label": f"{target_species} {water_type} đề xuất",
                        "water_type": water_type,
                        "selected_size": sz_label,
                        "unit_price": u_price,
                        "quantity": qty,
                        "subtotal": cost,
                        "stock": int(p.get("stock") or 10),
                    }
                )
                remaining -= cost
                if remaining < min_price(affordable[0]):
                    break

    # Nếu người dùng hỏi "có thể chọn cá nào", hiển thị đầy đủ tất cả các loài phù hợp (catalog_options) ở lần hỏi đầu,
    # hoặc hiển thị phương án phối cụ thể khi bấm "Gợi ý phương án khác"
    display_items = catalog_options if (variant_index == 0 and len(catalog_options) > 0) else combo_items
    total_cost = sum(i["subtotal"] for i in combo_items)

    above_note = ""
    if slightly_above:
        above_names = ", ".join(
            f"<strong>{p['name']}</strong> ({int(min_price(p)):,}đ)".replace(",", ".")
            for p in slightly_above[:2]
        )
        above_note = f"<div style='margin-top:6px;font-size:12.5px;color:#b45309;'>💡 <em>Gợi ý thêm:</em> Nếu nâng nhẹ ngân sách, bạn có thể tham khảo thêm {above_names}.</div>"

    if not affordable:
        cheapest = env_species_prods[0] if env_species_prods else None
        min_needed = int(min_price(cheapest)) if cheapest else 100000
        reply_html = (
            f"Hiện tại với ngân sách <strong>{int(budget):,}đ</strong> chưa đủ để chọn dòng <strong>{target_species} {water_type}</strong> "
            f"(dòng thấp nhất hiện tại là <strong>{cheapest['name'] if cheapest else ''}</strong> giá từ <strong>{min_needed:,}đ</strong>). "
            f"Dưới đây là các dòng {target_species} {water_type} gần tầm giá nhất để bạn tham khảo:"
        ).replace(",", ".")
        if cheapest:
            sz_l, u_p = _get_item_tier(cheapest, min_needed)
            display_items = [
                {
                    "id": cheapest["id"],
                    "slug": cheapest.get("slug") or str(cheapest["id"]),
                    "name": cheapest["name"],
                    "image": cheapest.get("image") or "image/ocean-bg.svg",
                    "species": target_species,
                    "role_label": f"{target_species} {water_type}",
                    "water_type": water_type,
                    "selected_size": sz_l,
                    "unit_price": u_p,
                    "quantity": 1,
                    "subtotal": u_p,
                    "stock": int(cheapest.get("stock") or 10),
                }
            ]
    elif variant_index == 0:
        bullet_lines = []
        for opt in catalog_options:
            bullet_lines.append(
                f"• <strong>{opt['name']}</strong> — Giá từ <strong>{int(opt['unit_price']):,}đ</strong> "
                f"(Với {int(budget):,}đ mua được tối đa <strong>{opt['max_qty_in_budget']} cá thể</strong>; các cỡ: {opt['available_sizes_note']})"
            )
        combo_preview = " + ".join(f"{c['quantity']}x {c['name']} ({int(c['subtotal']):,}đ)" for c in combo_items)
        reply_html = (
            f"Với ngân sách <strong>{int(budget):,}đ</strong> cho môi trường <strong>{guide['icon']} {water_type}</strong>, "
            f"bạn có thể chọn <strong>{len(catalog_options)} dòng {target_species}</strong> đang sẵn hàng tại Aqualife:<br>"
            f"<div style='margin:8px 0;line-height:1.6;'>" + "<br>".join(bullet_lines).replace(",", ".") + "</div>"
            f"<div style='padding:8px 10px;background:#f0f9ff;border-left:3px solid #0284c7;border-radius:6px;font-size:12.5px;'>"
            f"🎯 <strong>Gợi ý phối vừa tầm {int(budget):,}đ:</strong> {combo_preview.replace(',', '.')} "
            f"(Tổng: <strong>{int(total_cost):,}đ</strong>, dư <strong>{int(budget - total_cost):,}đ</strong>)."
            f"</div>"
            f"{above_note}"
        ).replace(",", ".")
    else:
        combo_preview = " + ".join(f"{c['quantity']}x {c['name']}" for c in display_items)
        sum_display = sum(i["subtotal"] for i in display_items)
        reply_html = (
            f"<strong>Phương án phối {target_species} {water_type} #{variant_index + 1}</strong> trong ngân sách "
            f"<strong>{int(budget):,}đ</strong>: {combo_preview} (Tổng chi phí: <strong>{int(sum_display):,}đ</strong>, "
            f"còn dư <strong>{int(max(0, budget - sum_display)):,}đ</strong>):"
        ).replace(",", ".")

    shown_cost = sum(i["subtotal"] for i in display_items)
    return {
        "mode": "species_select",
        "query": message,
        "budget": int(budget),
        "water_type": water_type,
        "target_species": target_species,
        "variant_index": variant_index,
        "total_cost": int(shown_cost),
        "remaining_budget": int(max(0, budget - shown_cost)),
        "total_creatures": sum(i["quantity"] for i in display_items),
        "guide": guide,
        "reply_html": reply_html,
        "summary_text": reply_html,
        "items": display_items,
    }


def answer_aquarium_knowledge_or_product(message: str) -> dict | None:
    """Trả lời khi khách hỏi trực tiếp về 1 loài cá/tép/ốc/san hô hoặc hỏi nuôi chung / thông số nước mà không kèm ngân sách."""
    if _has_explicit_budget(message):
        return None

    lower = message.lower()
    ascii_lower = _strip_accents(lower)

    # Nếu khách bấm gợi ý hoặc hỏi chung "build bể như thế nào" thì để build_tank_combo xử lý
    if any(k in lower for k in ("build", "setup", "set up", "combo", "cấu hình bể")):
        return None

    all_prods = list_products(available_only=False)
    matched_prods = []
    for p in all_prods:
        p_name_lower = (p.get("name") or "").lower()
        p_name_ascii = _strip_accents(p_name_lower)
        # Bỏ tiền tố "cá ", "tép ", "ốc ", "san hô " để so khớp tên riêng (VD: "nemo", "piranha", "đầu lân", "thia xanh")
        short_key = re.sub(r"^(?:cá|tép|tôm|ốc|san hô)\s+", "", p_name_lower).strip()
        short_ascii = _strip_accents(short_key)
        if (p_name_lower and p_name_lower in lower) or (len(short_key) >= 4 and short_key in lower) or (len(short_ascii) >= 4 and short_ascii in ascii_lower):
            matched_prods.append(p)

    water_type = _parse_water_type(message)
    guide = WATER_GUIDES.get(water_type, WATER_GUIDES["Nước ngọt"])

    if matched_prods:
        items = []
        details_html = []
        for p in matched_prods[:4]:
            wt = p.get("waterType") or p.get("water_type") or "Nước ngọt"
            water_type = wt
            guide = WATER_GUIDES.get(wt, guide)
            sizes = p.get("sizes") or [{"size": "Size M - Tiêu chuẩn", "price": p["price"]}]
            sz_str = " | ".join(f"{s['size']}: <strong>{int(float(s['price'])):,}đ</strong>".replace(",", ".") for s in sizes)
            compat_note = (
                "⚠️ <strong>Lưu ý nuôi chung:</strong> Đây là loài săn mồi / có tính lãnh thổ cao, cần nuôi bể riêng hoặc ghép cùng cá kích thước lớn tương đương."
                if "piranha" in p["name"].lower() or "hoàng đế" in p["name"].lower()
                else "✅ <strong>Tương thích sinh học:</strong> Hiền lành, dễ nuôi ghép trong bể cộng đồng cùng Tép vệ sinh, Ốc dọn rêu và San hô / Cây thủy sinh cùng hệ nước."
            )
            details_html.append(
                f"<div style='margin-bottom:8px;'>"
                f"🐠 <strong>{p['name']}</strong> ({wt} · Tồn kho: {p.get('stock', 0)} cá thể)<br>"
                f"• <strong>Mô tả:</strong> {p.get('description') or 'Cá thể khỏe mạnh tại Aqualife.'}<br>"
                f"• <strong>Bảng giá theo kích thước:</strong> {sz_str}<br>"
                f"• {compat_note}"
                f"</div>"
            )
            first_sz = sizes[0]
            items.append(
                {
                    "id": p["id"],
                    "slug": p.get("slug") or str(p["id"]),
                    "name": p["name"],
                    "image": p.get("image") or "image/ocean-bg.svg",
                    "species": p.get("species") or "Cá",
                    "role_label": f"{p.get('species') or 'Cá'} ({wt})",
                    "water_type": wt,
                    "selected_size": first_sz["size"],
                    "unit_price": float(first_sz["price"]),
                    "quantity": 1,
                    "subtotal": float(first_sz["price"]),
                    "stock": int(p.get("stock") or 10),
                }
            )

        total_cost = sum(i["subtotal"] for i in items)
        reply_html = (
            f"Thông tin tư vấn chi tiết từ <strong>Chuyên gia Aqualife</strong>:<br><br>"
            + "".join(details_html)
        )
        return {
            "mode": "product_qa",
            "query": message,
            "budget": int(total_cost),
            "water_type": water_type,
            "variant_index": 0,
            "total_cost": int(total_cost),
            "remaining_budget": 0,
            "total_creatures": len(items),
            "guide": guide,
            "reply_html": reply_html,
            "summary_text": reply_html,
            "items": items,
        }

    # Nếu khách hỏi về danh sách loài theo môi trường mà không ghi ngân sách (VD: "cá nước mặn có những loại nào?")
    req_species = _detect_requested_species(message)
    if req_species:
        return build_species_recommendation(
            message=message,
            target_species=req_species,
            budget=1000000,
            water_type=water_type,
            variant_index=0,
        )

    return None


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
        affordable = [
            p
            for p in candidates
            if min([float(s.get("price") or p["price"]) for s in (p.get("sizes") or [{"price": p["price"]}])])
            <= remaining
        ]
        if not affordable:
            continue

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
            init_qty = 1
            if role_key in ("Cá", "Tép") and unit_price * 2 <= min(role_cap, remaining) and unit_price <= budget * 0.2:
                init_qty = 2
            add_or_increment(chosen_prod, size_label, unit_price, init_qty, role_key)

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
        "mode": "tank_combo",
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

    # 1. Kiểm tra phạm vi câu hỏi (Nếu ngoài lĩnh vực bể cá -> trả lời không hỗ trợ)
    domain = _classify_domain(message)
    if domain == "off_topic":
        return success(
            {
                "mode": "off_topic",
                "query": message,
                "reply_html": (
                    "Xin lỗi, <strong>Chatbox không hỗ trợ</strong> câu hỏi ngoài lĩnh vực bể cá và thủy sinh.<br><br>"
                    "Trợ lý Aqualife chỉ tư vấn chọn <strong>cá cảnh, tép, ốc, san hô</strong>, thông số môi trường nước "
                    "(Nước mặn, Nước ngọt, Nước lợ) và thiết lập bể theo ngân sách. "
                    "Bạn có thể hỏi ví dụ: <em>\"Cá 500 nước mặn có thể chọn cá nào?\"</em> hoặc <em>\"500k nước mặn build bể thế nào?\"</em> nhé!"
                ),
                "summary_text": OFF_TOPIC_REFUSAL_MESSAGE,
                "items": [],
            }
        )

    if domain == "greeting":
        return success(
            {
                "mode": "greeting",
                "query": message,
                "reply_html": (
                    "Xin chào bạn đến với <strong>Trợ lý Tư vấn Bể cá Aqualife</strong>! 🐠<br>"
                    "Mình có thể giúp bạn:<br>"
                    "• <strong>Chọn cá / tép / ốc / san hô theo tầm tiền:</strong> VD: <em>\"Cá 500 nước mặn có thể chọn cá nào?\"</em><br>"
                    "• <strong>Build trọn bộ hệ sinh thái bể:</strong> VD: <em>\"500k nước mặn nên build bể như thế nào?\"</em><br>"
                    "• <strong>Tra cứu giá & tập tính từng loài:</strong> VD: <em>\"Cá Nemo giá bao nhiêu?\"</em> hoặc <em>\"Cá Piranha có nuôi chung được không?\"</em>"
                ),
                "summary_text": "Xin chào! Hãy nhập ngân sách và loại cá hoặc môi trường nước cần tư vấn.",
                "items": [],
            }
        )

    # 2. Nếu người dùng hỏi thông tin loài / cách nuôi không kèm ngân sách
    qa_res = answer_aquarium_knowledge_or_product(message)
    if qa_res is not None:
        return success(qa_res)

    # 3. Nếu người dùng hỏi chọn đích danh 1 nhóm loài theo ngân sách (VD: "cá 500 nước mặn có thể chọn cá nào")
    target_species = _detect_requested_species(message)
    if target_species is not None:
        budget = _parse_budget(message, explicit_budget)
        water_type = _parse_water_type(message, explicit_water)
        spec_res = build_species_recommendation(
            message=message,
            target_species=target_species,
            budget=budget,
            water_type=water_type,
            variant_index=variant_index,
        )
        return success(spec_res)

    # 4. Mặc định: Tư vấn Build trọn bộ cấu hình bể cân bằng sinh thái (Cá + San hô/Thủy sinh + Ốc + Tép)
    result = build_tank_combo(
        message=message,
        explicit_budget=explicit_budget,
        explicit_water=explicit_water,
        variant_index=variant_index,
    )
    return success(result)

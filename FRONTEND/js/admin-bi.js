/* ==========================================================================
   AQUALIFE ADMIN - BI DASHBOARD (Báo cáo doanh thu & Phân tích kinh doanh)
   Dữ liệu: GET /api/admin/revenue?from&to&group_by  (PostgreSQL, đơn completed)
   Biểu đồ vẽ bằng SVG thuần, không phụ thuộc thư viện.
   ========================================================================== */
(function () {
  "use strict";

  // Màu phân loại cố định theo thứ tự (palette đã kiểm định CVD của skill dataviz, nền sáng)
  const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
  const INK = { primary: "#111827", secondary: "#475569", muted: "#6b7280", grid: "#e6edf5" };
  const PAY_LABEL = { cod: "Thanh toán khi nhận (COD)", bank_transfer: "Chuyển khoản" };
  const STATUS_LABEL = {
    pending: "Chờ xác nhận", confirmed: "Đã xác nhận", processing: "Đang xử lý",
    shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã hủy",
  };

  const state = { preset: "30d", from: null, to: null, groupBy: "", data: null, seq: 0, tableView: false };

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const nf = new Intl.NumberFormat("vi-VN");
  const money = (v) => nf.format(Math.round(v || 0)) + " ₫";
  const dec1 = (v) => String(v).replace(".", ",");

  function compact(v) {
    const a = Math.abs(v);
    if (a >= 1e9) return dec1((v / 1e9).toFixed(2).replace(/\.?0+$/, "")) + " tỷ";
    if (a >= 1e6) return dec1((v / 1e6).toFixed(1).replace(/\.0$/, "")) + " tr";
    if (a >= 1e3) return dec1((v / 1e3).toFixed(0)) + "k";
    return String(Math.round(v));
  }
  function niceMax(v) { // chọn max sao cho max/4 là số "tròn" => nhãn trục đẹp
    if (v <= 0) return 1;
    const raw = v / 4, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((n) => n * p >= raw - 1e-9) * p;
    return step * 4;
  }
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseIso = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDay = (s) => { const d = parseIso(s); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`; };
  const fmtMonth = (s) => { const d = parseIso(s); return `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`; };
  const fmtDMY = (s) => { const d = parseIso(s); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; };

  // ------------------------------------------------------------------ range
  function presetRange(p) {
    const to = new Date(); to.setHours(0, 0, 0, 0);
    const from = new Date(to);
    if (p === "7d") from.setDate(to.getDate() - 6);
    else if (p === "30d") from.setDate(to.getDate() - 29);
    else if (p === "90d") from.setDate(to.getDate() - 89);
    else if (p === "ytd") { from.setMonth(0, 1); }
    else if (p === "12m") { from.setMonth(to.getMonth() - 11, 1); }
    return { from: iso(from), to: iso(to) };
  }

  // ------------------------------------------------------------------ tooltip
  let tip;
  function tipEl() {
    if (!tip) { tip = document.createElement("div"); tip.className = "bi-tip"; tip.hidden = true; document.body.appendChild(tip); }
    return tip;
  }
  function showTip(html, ev) {
    const t = tipEl(); t.innerHTML = html; t.hidden = false;
    const r = t.getBoundingClientRect();
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + r.width > window.innerWidth - 8) x = ev.clientX - r.width - 14;
    if (y + r.height > window.innerHeight - 8) y = ev.clientY - r.height - 14;
    t.style.left = Math.max(8, x) + "px"; t.style.top = Math.max(8, y) + "px";
  }
  const hideTip = () => { if (tip) tip.hidden = true; };
  function bindTip(node, htmlFn) {
    node.addEventListener("mousemove", (e) => showTip(htmlFn(), e));
    node.addEventListener("mouseleave", hideTip);
  }

  // ------------------------------------------------------------------ chips
  function delta(pct, invert) {
    if (pct === null || pct === undefined) return `<span class="bi-delta bi-delta-flat">— chưa có kỳ trước</span>`;
    const up = pct > 0, flat = pct === 0;
    const good = invert ? !up : up;
    const cls = flat ? "flat" : good ? "up" : "down";
    const arrow = flat ? "▬" : up ? "▲" : "▼";
    return `<span class="bi-delta bi-delta-${cls}">${arrow} ${up ? "+" : ""}${dec1(pct)}% <small>so kỳ trước</small></span>`;
  }
  const growthChip = (g) =>
    g === null || g === undefined
      ? `<span class="bi-chip bi-chip-flat">Mới</span>`
      : `<span class="bi-chip bi-chip-${g > 0 ? "up" : g < 0 ? "down" : "flat"}">${g > 0 ? "▲ +" : g < 0 ? "▼ " : ""}${dec1(g)}%</span>`;

  // ------------------------------------------------------------------ sparkline
  function spark(values, color) {
    const w = 120, h = 34, max = Math.max(...values, 1);
    if (values.length < 2) return "";
    const step = w / (values.length - 1);
    const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - (v / max) * (h - 8)).toFixed(1)}`);
    return `<svg class="bi-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${pts[pts.length - 1].split(",")[0]}" cy="${pts[pts.length - 1].split(",")[1]}" r="3" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`;
  }

  // ------------------------------------------------------------------ KPI cards
  function renderKpis(d) {
    const k = d.kpi, c = d.change;
    const rev = d.series.map((s) => s.revenue), ord = d.series.map((s) => s.orders);
    const cards = [
      { label: "Doanh thu (đơn hoàn tất)", value: money(k.revenue), delta: delta(c.revenue), spark: spark(rev, SERIES[0]),
        sub: k.pipeline_orders ? `Dự kiến thêm ${money(k.pipeline_value)} từ ${k.pipeline_orders} đơn đang xử lý` : "Không có đơn đang xử lý" },
      { label: "Đơn hoàn tất", value: nf.format(k.orders), delta: delta(c.orders), spark: spark(ord, SERIES[2]),
        sub: `${nf.format(k.units)} sản phẩm đã bán` },
      { label: "Giá trị đơn TB (AOV)", value: money(k.aov), delta: delta(c.aov),
        sub: `${dec1(k.avg_items_per_order)} dòng hàng/đơn · ${dec1(k.single_item_rate)}% đơn 1 món` },
      { label: "Khách đã mua", value: nf.format(k.customers), delta: delta(c.customers),
        sub: `${k.new_customers} khách mới · ${k.returning_customers} khách cũ` },
      { label: "Tỷ lệ khách quay lại", value: dec1(k.returning_rate) + "%",
        delta: `<span class="bi-delta bi-delta-flat">Khách cũ: ${compact(k.returning_revenue)} ₫ doanh thu</span>`,
        bar: [k.new_customers, k.returning_customers] , sub: "Khách đã có đơn hoàn tất trước kỳ này" },
      { label: "Tỷ lệ hủy đơn", value: dec1(k.cancel_rate) + "%",
        delta: (() => {
          const pp = Math.round((k.cancel_rate - d.kpi_prev.cancel_rate) * 10) / 10;
          const cls = pp === 0 ? "flat" : pp < 0 ? "up" : "down"; // hủy giảm là tốt
          return `<span class="bi-delta bi-delta-${cls}">${pp === 0 ? "▬" : pp > 0 ? "▲ +" : "▼ "}${dec1(pp)} điểm <small>so kỳ trước</small></span>`;
        })(),
        sub: `${k.cancelled_orders}/${k.created_orders} đơn tạo trong kỳ` },
    ];
    $("bi-kpis").innerHTML = cards.map((x) => `
      <div class="bi-kpi">
        <div class="bi-kpi-label">${esc(x.label)}</div>
        <div class="bi-kpi-value">${esc(x.value)}</div>
        <div class="bi-kpi-delta">${x.delta}</div>
        ${x.spark ? `<div class="bi-kpi-spark">${x.spark}</div>` : ""}
        ${x.bar ? `<div class="bi-splitbar" title="Khách mới / khách cũ"><i style="flex:${Math.max(x.bar[0], 0.0001)};background:${SERIES[0]}"></i><i style="flex:${Math.max(x.bar[1], 0.0001)};background:${SERIES[2]}"></i></div>` : ""}
        <div class="bi-kpi-sub">${esc(x.sub)}</div>
      </div>`).join("");
  }

  // ------------------------------------------------------------------ trend chart
  function renderTrend(d) {
    const box = $("bi-trend");
    const s = d.series, gb = d.range.group_by;
    $("bi-trend-title").textContent = gb === "month" ? "Doanh thu theo tháng" : "Doanh thu theo ngày";
    $("bi-trend-sub").textContent = `${fmtDMY(d.range.from)} – ${fmtDMY(d.range.to)} · so với ${fmtDMY(d.range.prev_from)} – ${fmtDMY(d.range.prev_to)}`;

    if (state.tableView) {
      box.innerHTML = `<div class="bi-table-wrap"><table class="bi-table"><thead><tr><th>${gb === "month" ? "Tháng" : "Ngày"}</th><th class="num">Doanh thu</th><th class="num">Đơn</th><th class="num">Kỳ trước</th></tr></thead><tbody>${
        s.map((r) => `<tr><td>${gb === "month" ? fmtMonth(r.period) : fmtDMY(r.period)}</td><td class="num">${money(r.revenue)}</td><td class="num">${r.orders}</td><td class="num">${r.prev_revenue == null ? "—" : money(r.prev_revenue)}</td></tr>`).join("")
      }</tbody></table></div>`;
      return;
    }
    if (!s.some((r) => r.revenue > 0 || (r.prev_revenue || 0) > 0)) {
      box.innerHTML = `<div class="bi-empty">Chưa có đơn hoàn tất trong khoảng thời gian này.</div>`;
      return;
    }
    const W = Math.max(320, box.clientWidth), H = 300, m = { l: 54, r: 12, t: 14, b: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const max = niceMax(Math.max(...s.map((r) => Math.max(r.revenue, r.prev_revenue || 0))));
    const step = iw / s.length, bw = Math.max(2, Math.min(30, step * 0.62));
    const y = (v) => m.t + ih - (v / max) * ih;
    const cx = (i) => m.l + step * i + step / 2;

    let g = "";
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i, yy = y(v);
      g += `<line x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}" stroke="${i === 0 ? "#cbd5e1" : INK.grid}" stroke-width="1"/>
            <text x="${m.l - 8}" y="${yy + 4}" text-anchor="end" class="bi-axis">${compact(v)}</text>`;
    }
    const every = Math.ceil(s.length / Math.max(2, Math.floor(iw / 62)));
    s.forEach((r, i) => {
      // nhãn cuối chỉ hiện khi không đè nhãn trước
      const lastOk = i === s.length - 1 && (i % every) >= every * 0.6;
      if (i % every === 0 || lastOk)
        g += `<text x="${cx(i)}" y="${H - 8}" text-anchor="middle" class="bi-axis">${gb === "month" ? fmtMonth(r.period) : fmtDay(r.period)}</text>`;
    });
    // cột kỳ này (đầu cột bo 4px, neo đáy)
    s.forEach((r, i) => {
      const h = Math.max(0, (r.revenue / max) * ih);
      if (h <= 0) return;
      const x = cx(i) - bw / 2, rr = Math.min(4, bw / 2, h);
      g += `<path d="M${x},${m.t + ih} V${y(r.revenue) + rr} Q${x},${y(r.revenue)} ${x + rr},${y(r.revenue)} H${x + bw - rr} Q${x + bw},${y(r.revenue)} ${x + bw},${y(r.revenue) + rr} V${m.t + ih} Z" fill="${SERIES[0]}"/>`;
    });
    // đường kỳ trước (cùng trục, cùng đơn vị)
    const pts = s.map((r, i) => (r.prev_revenue == null ? null : `${cx(i)},${y(r.prev_revenue)}`)).filter(Boolean);
    if (pts.length > 1) g += `<polyline points="${pts.join(" ")}" fill="none" stroke="${SERIES[1]}" stroke-width="2" stroke-linejoin="round" stroke-dasharray="5 4"/>`;
    // vùng hover + crosshair
    g += `<line id="bi-cross" y1="${m.t}" y2="${m.t + ih}" stroke="#94a3b8" stroke-width="1" visibility="hidden"/>`;
    s.forEach((r, i) => {
      g += `<rect class="bi-hit" data-i="${i}" x="${m.l + step * i}" y="${m.t}" width="${step}" height="${ih}" fill="transparent"/>`;
    });
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Biểu đồ doanh thu">${g}</svg>`;
    const cross = box.querySelector("#bi-cross");
    box.querySelectorAll(".bi-hit").forEach((rect) => {
      const i = +rect.dataset.i, r = s[i];
      rect.addEventListener("mousemove", (e) => {
        cross.setAttribute("x1", cx(i)); cross.setAttribute("x2", cx(i)); cross.setAttribute("visibility", "visible");
        const ch = r.prev_revenue ? Math.round((r.revenue - r.prev_revenue) / r.prev_revenue * 1000) / 10 : null;
        showTip(`<b>${gb === "month" ? fmtMonth(r.period) : fmtDMY(r.period)}</b>
          <div><i class="bi-dot" style="background:${SERIES[0]}"></i>Kỳ này: <b>${money(r.revenue)}</b> (${r.orders} đơn)</div>
          <div><i class="bi-dot" style="background:${SERIES[1]}"></i>Kỳ trước: ${r.prev_revenue == null ? "—" : money(r.prev_revenue)}</div>
          ${ch === null ? "" : `<div>Chênh lệch: ${ch > 0 ? "+" : ""}${dec1(ch)}%</div>`}`, e);
      });
      rect.addEventListener("mouseleave", () => { cross.setAttribute("visibility", "hidden"); hideTip(); });
    });
  }

  // ------------------------------------------------------------------ donut
  function renderCategories(d) {
    const box = $("bi-cats"), cats = d.by_category, total = cats.reduce((a, c) => a + c.revenue, 0);
    if (!total) { box.innerHTML = `<div class="bi-empty">Chưa có doanh thu theo nhóm hàng.</div>`; return; }
    const R = 62, C = 2 * Math.PI * R, size = 170;
    let off = 0, arcs = "";
    cats.forEach((c, i) => {
      const len = (c.revenue / total) * C, gap = cats.length > 1 ? 2 : 0;
      arcs += `<circle class="bi-arc" data-i="${i}" cx="85" cy="85" r="${R}" fill="none" stroke="${SERIES[i % SERIES.length]}" stroke-width="22"
        stroke-dasharray="${Math.max(0, len - gap)} ${C}" stroke-dashoffset="${-off}" transform="rotate(-90 85 85)"/>`;
      off += len;
    });
    box.innerHTML = `
      <div class="bi-donut-wrap">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Cơ cấu doanh thu theo nhóm hàng">${arcs}
          <text x="85" y="80" text-anchor="middle" class="bi-donut-cap">Tổng</text>
          <text x="85" y="100" text-anchor="middle" class="bi-donut-val">${compact(total)} ₫</text></svg>
      </div>
      <ul class="bi-legend">${cats.map((c, i) => `
        <li data-i="${i}"><i class="bi-dot" style="background:${SERIES[i % SERIES.length]}"></i>
          <span class="bi-leg-name">${esc(c.name)}</span>
          <span class="bi-leg-val"><b>${dec1(c.share)}%</b> · ${compact(c.revenue)} ₫</span>${growthChip(c.growth)}</li>`).join("")}</ul>`;
    const tipFor = (c) => `<b>${esc(c.name)}</b><div>Doanh thu: ${money(c.revenue)} (${dec1(c.share)}%)</div><div>${c.units} sản phẩm · ${c.orders} đơn</div><div>Kỳ trước: ${money(c.prev_revenue)}</div>`;
    box.querySelectorAll(".bi-arc, .bi-legend li").forEach((n) => bindTip(n, () => tipFor(cats[+n.dataset.i])));
  }

  // ------------------------------------------------------------------ heatmap
  function renderHeatmap(d) {
    const h = d.heatmap, box = $("bi-heat");
    const all = h.cells.flat().map((c) => c.revenue), max = Math.max(...all, 1), tot = all.reduce((a, b) => a + b, 0);
    if (!tot) { box.innerHTML = `<div class="bi-empty">Chưa có dữ liệu.</div>`; return; }
    const lerp = (x, y, t) => Math.round(x + (y - x) * t);
    const shade = (v) => { // 1 màu xanh: nhạt (#e6f2fc) -> đậm (#0b5a99)
      const t = Math.sqrt(v / max);
      return `rgb(${lerp(230, 11, t)},${lerp(242, 90, t)},${lerp(252, 153, t)})`;
    };
    let html = `<div class="bi-heat-grid" style="grid-template-columns:78px repeat(${h.bands.length},1fr)"><div></div>`;
    h.bands.forEach((b) => (html += `<div class="bi-heat-col">${esc(b)}</div>`));
    h.weekdays.forEach((w, di) => {
      html += `<div class="bi-heat-row">${w}</div>`;
      h.cells[di].forEach((c, bi) => {
        const t = c.revenue / max;
        html += `<div class="bi-heat-cell" data-d="${di}" data-b="${bi}" style="background:${shade(c.revenue)};color:${t > 0.5 ? "#fff" : INK.primary}">${c.orders ? c.orders : ""}</div>`;
      });
    });
    box.innerHTML = html + `</div><div class="bi-note">Số trong ô = số đơn hoàn tất. Màu đậm = doanh thu cao.</div>`;
    box.querySelectorAll(".bi-heat-cell").forEach((n) => bindTip(n, () => {
      const c = h.cells[+n.dataset.d][+n.dataset.b];
      return `<b>${h.weekdays[+n.dataset.d]} · ${esc(h.bands[+n.dataset.b])}</b><div>${c.orders} đơn · ${money(c.revenue)}</div><div>${dec1((c.revenue / tot * 100).toFixed(1))}% doanh thu</div>`;
    }));
  }

  // ------------------------------------------------------------------ funnel + payment
  function renderOps(d) {
    const f = d.funnel, maxN = Math.max(...f.map((x) => x.orders), 1);
    $("bi-funnel").innerHTML = f.map((x) => `
      <div class="bi-frow" data-s="${x.status}">
        <span class="bi-frow-name">${STATUS_LABEL[x.status]}</span>
        <span class="bi-frow-track"><i style="width:${Math.max(x.orders ? 3 : 0, x.orders / maxN * 100)}%;background:${x.status === "cancelled" ? "#e34948" : SERIES[0]}"></i></span>
        <span class="bi-frow-val"><b>${x.orders}</b> <small>${compact(x.amount)} ₫</small></span>
      </div>`).join("");
    $("bi-funnel").querySelectorAll(".bi-frow").forEach((n) => bindTip(n, () => {
      const x = f.find((r) => r.status === n.dataset.s);
      return `<b>${STATUS_LABEL[x.status]}</b><div>${x.orders} đơn · ${money(x.amount)}</div>`;
    }));

    const p = d.by_payment, tot = p.reduce((a, b) => a + b.revenue, 0);
    $("bi-pay").innerHTML = tot
      ? `<div class="bi-splitbar bi-splitbar-lg">${p.map((x, i) => `<i style="flex:${x.revenue};background:${SERIES[i]}" data-i="${i}"></i>`).join("")}</div>
         <ul class="bi-legend">${p.map((x, i) => `<li><i class="bi-dot" style="background:${SERIES[i]}"></i><span class="bi-leg-name">${esc(PAY_LABEL[x.payment_method] || x.payment_method)}</span><span class="bi-leg-val"><b>${dec1((x.revenue / tot * 100).toFixed(1))}%</b> · ${compact(x.revenue)} ₫ · ${x.orders} đơn</span></li>`).join("")}</ul>`
      : `<div class="bi-empty">Chưa có dữ liệu.</div>`;
  }

  // ------------------------------------------------------------------ products
  function renderProducts(d) {
    const rows = d.top_products, a = d.abc_summary;
    $("bi-abc").innerHTML = ["A", "B", "C"].map((k, i) => `
      <div class="bi-abc-seg bi-abc-${k}" style="flex:${Math.max(a[k].share, 4)}" title="Nhóm ${k}">
        <b>${k}</b><span>${a[k].products} SP · ${dec1(a[k].share)}%</span></div>`).join("");
    $("bi-top-body").innerHTML = rows.length
      ? rows.map((p) => {
          const cover = p.cover_days == null ? "—" : p.stock === 0 ? `<span class="bi-chip bi-chip-down">Hết hàng</span>` :
            p.cover_days < 14 ? `<span class="bi-chip bi-chip-warn">${dec1(Math.round(p.cover_days))} ngày</span>` : `${dec1(Math.round(p.cover_days))} ngày`;
          return `<tr>
            <td class="num">${p.rank}</td>
            <td><a href="#" class="bi-link" data-open-product="${esc(p.name)}"><b>${esc(p.name)}</b></a><div class="bi-sub">${esc(p.category || "—")}</div></td>
            <td><span class="bi-abc-badge bi-abc-${p.abc_class}" title="Nhóm ${p.abc_class}: ${p.abc_class === "A" ? "80% doanh thu đầu" : p.abc_class === "B" ? "15% tiếp theo" : "5% cuối"}">${p.abc_class}</span></td>
            <td class="num">${nf.format(p.units)}</td>
            <td class="num"><b>${money(p.revenue)}</b></td>
            <td class="bi-share"><span class="bi-bar"><i style="width:${Math.min(100, p.share * 2.5)}%"></i></span>${dec1(p.share)}%</td>
            <td>${growthChip(p.growth)}</td>
            <td class="num">${nf.format(p.stock)} <small class="bi-sub">· ${cover}</small></td></tr>`;
        }).join("")
      : `<tr><td colspan="8" class="bi-empty">Chưa có sản phẩm bán ra trong kỳ.</td></tr>`;
    document.querySelectorAll("[data-open-product]").forEach((n) =>
      n.addEventListener("click", (e) => { e.preventDefault(); openProduct(n.dataset.openProduct); }));
  }

  function openProduct(name) {
    const input = $("admin-prod-search");
    if (input) input.value = name;
    document.querySelector('.adm-nav-btn[data-tab="products"]')?.click();
    setTimeout(() => { if (typeof applyProductFiltersAndRender === "function") applyProductFiltersAndRender(); }, 400);
  }

  // ------------------------------------------------------------------ inventory
  function renderInventory(d) {
    const inv = d.inventory;
    $("bi-inv-meta").textContent = `${inv.active_products} sản phẩm đang bán · giá trị tồn theo giá bán ${money(inv.stock_value)}`;
    const list = (arr, fn, empty) => arr.length
      ? `<ul class="bi-inv-list">${arr.map((x) => `<li><a href="#" class="bi-link" data-open-product="${esc(x.name)}">${esc(x.name)}</a><span>${fn(x)}</span></li>`).join("")}</ul>`
      : `<div class="bi-empty bi-empty-sm">${empty}</div>`;
    $("bi-inv-risk").innerHTML = list(inv.at_risk, (x) => `Còn ${nf.format(x.stock)} · <b class="bi-warn">~${dec1(Math.round(x.cover_days))} ngày</b>`, "Không có mã nào sắp hết trong 14 ngày.");
    $("bi-inv-oos").innerHTML = list(inv.out_of_stock_demand, (x) => `Bán ${x.units30} SP/30 ngày · <b class="bi-bad">≈ ${compact(x.lost_revenue_est)} ₫</b>`, "Không có mã hết hàng đang có nhu cầu.");
    $("bi-inv-dead").innerHTML = list(inv.dead_stock, (x) => `Tồn ${nf.format(x.stock)} · <b>${compact(x.tied_value)} ₫</b>`, "Không có hàng tồn đọng.");
    $("bi-inv-risk-n").textContent = inv.at_risk_total;
    $("bi-inv-oos-n").textContent = inv.out_of_stock_total;
    $("bi-inv-dead-n").textContent = inv.dead_stock_total;
    document.querySelectorAll("#bi-inventory [data-open-product]").forEach((n) =>
      n.addEventListener("click", (e) => { e.preventDefault(); openProduct(n.dataset.openProduct); }));
  }

  // ------------------------------------------------------------------ forecast
  function renderForecast(d) {
    const box = $("bi-forecast"), f = d.forecast, hist = f.history, fm = f.months;
    const cols = hist.map((h, i) => ({ label: fmtMonth(h.period), v: h.revenue, kind: i === hist.length - 1 ? "cur" : "hist" }))
      .concat(fm.map((m) => ({ label: fmtMonth(m.period), v: m.value, lo: m.low, hi: m.high, kind: "fc" })));
    const W = Math.max(320, box.clientWidth), H = 260, m = { l: 54, r: 12, t: 14, b: 30 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const max = niceMax(Math.max(...cols.map((c) => Math.max(c.hi || 0, c.v, c.kind === "cur" ? f.current_month_projection : 0)), 1));
    const step = iw / cols.length, bw = Math.min(34, step * 0.6);
    const y = (v) => m.t + ih - (v / max) * ih, cx = (i) => m.l + step * i + step / 2;
    let g = "";
    for (let i = 0; i <= 4; i++) {
      const v = (max / 4) * i;
      g += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${i === 0 ? "#cbd5e1" : INK.grid}"/><text x="${m.l - 8}" y="${y(v) + 4}" text-anchor="end" class="bi-axis">${compact(v)}</text>`;
    }
    cols.forEach((c, i) => {
      const x = cx(i) - bw / 2;
      g += `<text x="${cx(i)}" y="${H - 8}" text-anchor="middle" class="bi-axis">${c.label}</text>`;
      if (c.kind === "fc") {
        g += `<rect x="${x}" y="${y(c.v)}" width="${bw}" height="${Math.max(0, m.t + ih - y(c.v))}" rx="4" fill="#cfe5ff" stroke="${SERIES[0]}" stroke-dasharray="4 3"/>
              <line x1="${cx(i)}" x2="${cx(i)}" y1="${y(c.hi)}" y2="${y(c.lo)}" stroke="${INK.secondary}" stroke-width="1.5"/>
              <line x1="${cx(i) - 5}" x2="${cx(i) + 5}" y1="${y(c.hi)}" y2="${y(c.hi)}" stroke="${INK.secondary}" stroke-width="1.5"/>
              <line x1="${cx(i) - 5}" x2="${cx(i) + 5}" y1="${y(c.lo)}" y2="${y(c.lo)}" stroke="${INK.secondary}" stroke-width="1.5"/>`;
      } else {
        if (c.kind === "cur" && f.current_month_projection > c.v)
          g += `<rect x="${x}" y="${y(f.current_month_projection)}" width="${bw}" height="${y(c.v) - y(f.current_month_projection)}" fill="#cfe5ff" stroke="${SERIES[0]}" stroke-dasharray="4 3"/>`;
        if (c.v > 0) g += `<rect x="${x}" y="${y(c.v)}" width="${bw}" height="${m.t + ih - y(c.v)}" rx="4" fill="${SERIES[0]}"/>`;
      }
      g += `<rect class="bi-hit" data-i="${i}" x="${m.l + step * i}" y="${m.t}" width="${step}" height="${ih}" fill="transparent"/>`;
    });
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Doanh thu 12 tháng và dự báo 3 tháng tới">${g}</svg>`;
    box.querySelectorAll(".bi-hit").forEach((n) => {
      const c = cols[+n.dataset.i];
      bindTip(n, () => c.kind === "fc"
        ? `<b>${c.label} · dự báo</b><div>Ước tính: ${money(c.v)}</div><div>Khoảng: ${money(c.lo)} – ${money(c.hi)}</div>`
        : c.kind === "cur"
          ? `<b>${c.label} · đang chạy</b><div>Thực tế đến nay: ${money(c.v)}</div><div>Dự phóng cả tháng: ${money(f.current_month_projection)}</div>`
          : `<b>${c.label}</b><div>Thực tế: ${money(c.v)}</div>`);
    });
    $("bi-fc-note").innerHTML = fm.length
      ? `Tháng này đã ${f.days_elapsed}/${f.days_in_month} ngày: dự phóng cả tháng <b>${money(f.current_month_projection)}</b>. Xu hướng 6 tháng đã chốt gần nhất: <b>${f.slope_per_month >= 0 ? "+" : "−"}${compact(Math.abs(f.slope_per_month))} ₫/tháng</b>. Đây là ước tính tuyến tính, chưa tính mùa vụ — không phải cam kết.`
      : "Chưa đủ 4 tháng đã chốt có doanh thu để dự báo.";
  }

  // ------------------------------------------------------------------ insights + roadmap
  const INS = { risk: ["⚠", "Rủi ro"], opportunity: ["★", "Cơ hội"], info: ["ℹ", "Ghi nhận"] };
  function renderInsights(d) {
    $("bi-insights").innerHTML = d.insights.map((i) => `
      <article class="bi-ins bi-ins-${i.type}">
        <div class="bi-ins-tag"><span aria-hidden="true">${INS[i.type][0]}</span> ${INS[i.type][1]}</div>
        <h4>${esc(i.title)}</h4><p>${esc(i.detail)}</p>
        ${i.action ? `<div class="bi-ins-act"><b>Đề xuất:</b> ${esc(i.action)}</div>` : ""}
      </article>`).join("");
    $("bi-roadmap").innerHTML = d.roadmap.map((col) => `
      <div class="bi-road-col"><h4>${esc(col.horizon)}</h4>
        ${col.items.map((it) => `<div class="bi-road-item"><div class="bi-road-top"><span class="bi-prio bi-prio-${it.priority}">${it.priority}</span><b>${esc(it.title)}</b></div>
          <p>${esc(it.why)}</p><div class="bi-road-kpi">Mục tiêu: ${esc(it.kpi)}</div></div>`).join("")}
      </div>`).join("");
  }

  // ------------------------------------------------------------------ export
  function exportCsv() {
    const d = state.data; if (!d) return;
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      ["BÁO CÁO DOANH THU AQUALIFE", `${d.range.from} → ${d.range.to}`].map(q).join(","),
      "",
      ["Kỳ", "Doanh thu", "Số đơn", "Doanh thu kỳ trước"].map(q).join(","),
      ...d.series.map((r) => [r.period, r.revenue, r.orders, r.prev_revenue ?? ""].map(q).join(",")),
      "",
      ["Hạng", "Sản phẩm", "Nhóm hàng", "ABC", "Đã bán", "Doanh thu", "Tỷ trọng %", "Tăng trưởng %", "Tồn kho"].map(q).join(","),
      ...d.top_products.map((p) => [p.rank, p.name, p.category, p.abc_class, p.units, p.revenue, p.share, p.growth ?? "", p.stock].map(q).join(",")),
    ];
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `aqualife-doanh-thu-${d.range.from}_${d.range.to}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ------------------------------------------------------------------ load
  function renderAll(d) {
    $("bi-def").textContent = d.definition;
    renderKpis(d); renderTrend(d); renderCategories(d); renderHeatmap(d); renderOps(d);
    renderProducts(d); renderInventory(d); renderForecast(d); renderInsights(d);
    $("bi-updated").textContent = "Cập nhật " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  async function load() {
    const root = $("bi-root"); if (!root) return;
    const my = ++state.seq;
    const r = state.preset === "custom" ? { from: state.from, to: state.to } : presetRange(state.preset);
    state.from = r.from; state.to = r.to;
    $("bi-from").value = r.from; $("bi-to").value = r.to;
    root.classList.add("bi-loading"); $("bi-error").hidden = true;
    const qs = new URLSearchParams({ from: r.from, to: r.to });
    if (state.groupBy) qs.set("group_by", state.groupBy);
    try {
      const data = await window.Aqualife.apiFetch("/admin/revenue?" + qs);
      if (my !== state.seq) return; // đã có yêu cầu mới hơn
      state.data = data;
      document.querySelectorAll("#bi-group button").forEach((b) => b.classList.toggle("active", b.dataset.g === (state.groupBy || data.range.group_by)));
      renderAll(data);
    } catch (err) {
      if (my !== state.seq) return;
      $("bi-error").hidden = false;
      $("bi-error").textContent = "Không tải được báo cáo: " + (err.message || "lỗi không xác định");
    } finally {
      if (my === state.seq) root.classList.remove("bi-loading");
    }
  }

  let bound = false;
  function bind() {
    if (bound) return; bound = true;
    document.querySelectorAll("#bi-presets button").forEach((b) => b.addEventListener("click", () => {
      state.preset = b.dataset.p; state.groupBy = "";
      document.querySelectorAll("#bi-presets button").forEach((x) => x.classList.toggle("active", x === b));
      load();
    }));
    const custom = () => {
      const f = $("bi-from").value, t = $("bi-to").value;
      if (!f || !t) return;
      if (f > t) { window.Aqualife.showToast?.("Ngày bắt đầu phải trước ngày kết thúc", "error"); return; }
      state.preset = "custom"; state.from = f; state.to = t; state.groupBy = "";
      document.querySelectorAll("#bi-presets button").forEach((x) => x.classList.remove("active"));
      load();
    };
    $("bi-from").addEventListener("change", custom);
    $("bi-to").addEventListener("change", custom);
    document.querySelectorAll("#bi-group button").forEach((b) => b.addEventListener("click", () => { state.groupBy = b.dataset.g; load(); }));
    $("bi-refresh").addEventListener("click", load);
    $("bi-export").addEventListener("click", exportCsv);
    $("bi-toggle-table").addEventListener("click", (e) => {
      state.tableView = !state.tableView;
      e.currentTarget.textContent = state.tableView ? "Xem biểu đồ" : "Xem bảng";
      if (state.data) renderTrend(state.data);
    });
    let t; new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => {
      if (state.data && $("panel-revenue").classList.contains("active")) { renderTrend(state.data); renderForecast(state.data); }
    }, 150); }).observe($("panel-revenue"));
  }

  window.AdminBI = { load: () => { bind(); return load(); }, openProduct };
})();

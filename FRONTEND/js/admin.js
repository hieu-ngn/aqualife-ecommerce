const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang chuẩn bị",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const NEXT_STATUS_OPTIONS = {
  pending: ["confirmed", "processing", "shipping", "completed", "cancelled"],
  confirmed: ["processing", "shipping", "completed", "cancelled"],
  processing: ["shipping", "completed", "cancelled"],
  shipping: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

let adminCategories = [];
let allAdminProducts = [];
let filteredAdminProducts = [];
let selectedProductIds = new Set();
let currentCatalogPage = 1;
const CATALOG_PAGE_SIZE = 10;
let currentAdminUser = null;
let productPerf = {}; // product_id -> {units, revenue, rank, abc, cover_days} (đơn hoàn tất)
let perfDays = 30;

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeAdminImage(img) {
  if (!img) return "../image/ocean-bg.svg";
  if (img.startsWith("../") || img.startsWith("http") || img.startsWith("/")) {
    return img.startsWith("/image/") ? `..${img}` : img;
  }
  return `../${img}`;
}

function generateSku(product) {
  const catName = (product.category_name || "").toLowerCase();
  let prefix = "SP";
  if (catName.includes("cá")) prefix = "CA";
  else if (catName.includes("tép")) prefix = "TEP";
  else if (catName.includes("ốc")) prefix = "OC";
  else if (catName.includes("thủy sinh") || catName.includes("san hô")) prefix = "SH";
  else if (catName.includes("thức ăn")) prefix = "FD";
  else if (catName.includes("phụ kiện")) prefix = "PK";

  const idPad = String(product.id || 0).padStart(2, "0");
  return `AQUA-${prefix}-${idPad}`;
}

function formatRelativeTime(isoStr) {
  if (!isoStr) return "Hôm nay, 09:15";
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMinutes = Math.floor((now - d) / 60000);
    if (diffMinutes < 2) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const isToday = d.toDateString() === now.toDateString();
    const hm = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (isToday) return `Hôm nay, ${hm}`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "Hôm nay";
  }
}

function orderStatusBadgeHtml(status) {
  const label = STATUS_LABELS[status] || status;
  let cls = "st-selling";
  if (status === "pending") cls = "st-low";
  else if (status === "cancelled") cls = "st-out";
  else if (status === "completed") cls = "st-selling";
  return `<span class="eco-status-badge ${cls}">${esc(label)}</span>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const guardMsgEl = document.getElementById("admin-guard-msg");
  const workspaceEl = document.getElementById("admin-workspace");

  // Cập nhật đồng hồ GMT+7
  const nowStr = new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const updatedTimeEl = document.getElementById("catalog-updated-time");
  if (updatedTimeEl) {
    updatedTimeEl.textContent = `Cập nhật: Hôm nay, ${nowStr} (GMT+7)`;
  }

  // 1. Kiểm tra quyền Admin
  try {
    currentAdminUser = await window.Aqualife.apiFetch("/auth/me");
  } catch {
    currentAdminUser = null;
  }

  if (!currentAdminUser) {
    window.location.href = "auth.html?redirect=admin.html";
    return;
  }

  if (currentAdminUser.role !== "admin") {
    workspaceEl.classList.add("hidden");
    guardMsgEl.classList.remove("hidden");
    guardMsgEl.innerHTML = `
      <div class="adm-table-card" style="padding:32px;max-width:560px;margin:0 auto;text-align:center;">
        <h2 style="color:#dc2626;margin-top:0;">Truy cập bị từ chối (403)</h2>
        <p>Tài khoản <strong>${esc(
          currentAdminUser.email
        )}</strong> không có quyền Quản trị viên (Admin).</p>
        <p style="margin-top:20px;">
          <a class="btn-adm-primary" href="home.html" style="text-decoration:none;">Quay về Cửa hàng Aqualife</a>
        </p>
      </div>
    `;
    return;
  }

  document.getElementById("adm-current-name").textContent = currentAdminUser.name || "Admin";
  document.getElementById("adm-current-role").textContent = "Quản trị viên";

  // Nút đăng xuất ở Sidebar
  document.getElementById("adm-logout-btn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await window.Aqualife.apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    localStorage.removeItem("aqualife_user");
    localStorage.removeItem("aqualife_user_info");
    window.location.href = "auth.html";
  });

  // 2. Điều hướng 7 tab Sidebar
  const navBtns = document.querySelectorAll(".adm-nav-btn");
  const panels = document.querySelectorAll(".adm-panel");

  async function switchTab(tabName) {
    navBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabName));
    panels.forEach((p) => p.classList.toggle("active", p.id === `panel-${tabName}`));

    if (tabName === "products") {
      await loadAdminCategories();
      await loadAdminProducts();
    } else if (tabName === "overview") {
      await loadOverview();
    } else if (tabName === "orders") {
      await loadAdminOrders();
    } else if (tabName === "users") {
      await loadAdminUsers();
    } else if (tabName === "inventory") {
      await loadAdminCategories();
      await loadAdminProducts();
      renderLowStockReplenishment();
    } else if (tabName === "revenue") {
      await loadRevenueReport();
    } else if (tabName === "settings") {
      await loadAdminStoreSettings();
    }
  }

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Tìm kiếm toàn cục trên Topbar
  const globalSearchInput = document.getElementById("global-admin-search");
  globalSearchInput?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const kw = globalSearchInput.value.trim();
      const prodSearch = document.getElementById("admin-prod-search");
      if (prodSearch) prodSearch.value = kw;
      await switchTab("products");
      applyProductFiltersAndRender();
    }
  });

  // Nút "+ Thêm sản phẩm" trên Topbar
  document.getElementById("topbar-add-product-btn")?.addEventListener("click", () => {
    openProductModal(null);
  });

  // 3. Khởi tạo các sự kiện
  bindCatalogEvents();
  bindOrderEvents();
  bindUserEvents();
  bindSettingsEvents();

  // Tải dữ liệu mặc định (Quản lý sản phẩm + Tổng quan ngầm + Cài đặt liên hệ Admin)
  await loadAdminCategories();
  await loadAdminProducts();
  loadOverview();
  loadAdminStoreSettings();
});

// ==========================================================================
// PANEL 1: QUẢN LÝ SẢN PHẨM (THE OCEANIC CURATOR)
// ==========================================================================
async function loadAdminCategories() {
  const filterSelect = document.getElementById("admin-prod-category");
  const formSelect = document.getElementById("prod-form-category");
  const catTbody = document.getElementById("admin-categories-tbody");

  try {
    adminCategories = await window.Aqualife.apiFetch("/admin/categories");

    if (filterSelect) {
      const prev = filterSelect.value;
      filterSelect.innerHTML =
        `<option value="">Tất cả danh mục & môi trường</option>` +
        `<optgroup label="🌊 Phân loại Môi trường nước">` +
        `<option value="env:Nước ngọt">💧 Hệ Nước ngọt</option>` +
        `<option value="env:Nước mặn">🌊 Hệ Nước mặn / Biển</option>` +
        `<option value="env:Nước lợ">🌿 Hệ Nước lợ</option>` +
        `<option value="env:Đa môi trường">🔄 Đa môi trường</option>` +
        `</optgroup>` +
        `<optgroup label="📂 Danh mục Sinh vật & Thiết bị">` +
        adminCategories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join("") +
        `</optgroup>`;
      filterSelect.value = prev;
    }

    if (formSelect) {
      formSelect.innerHTML = adminCategories
        .map((c) => `<option value="${c.id}">${esc(c.name)}</option>`)
        .join("");
    }

    if (catTbody) {
      if (!adminCategories.length) {
        catTbody.innerHTML = `<tr><td colspan="6" class="muted">Chưa có danh mục nào.</td></tr>`;
      } else {
        catTbody.innerHTML = adminCategories
          .map(
            (c) => `
            <tr>
              <td><strong>#${c.id}</strong></td>
              <td><span class="cat-system-pill">${esc(c.name)}</span></td>
              <td class="muted">${esc(c.description || "")}</td>
              <td><strong>${c.product_count || 0} loài</strong></td>
              <td>
                <span class="eco-status-badge ${c.status === "active" ? "st-selling" : "st-hidden"}">
                  ${c.status === "active" ? "Đang hoạt động" : "Tạm ẩn"}
                </span>
              </td>
              <td>
                <div class="row-actions" style="margin-top:0;">
                  <button type="button" class="btn-row-icon btn-edit-cat" data-id="${c.id}">Sửa</button>
                  <button type="button" class="btn-row-icon btn-toggle-cat" data-id="${c.id}" data-status="${c.status}">
                    ${c.status === "active" ? "Ẩn" : "Kích hoạt"}
                  </button>
                </div>
              </td>
            </tr>
          `
          )
          .join("");
      }
    }
  } catch (err) {
    if (window.Aqualife.showToast) window.Aqualife.showToast(err.message, "error");
  }
}

async function loadAdminProducts() {
  try {
    allAdminProducts = await window.Aqualife.apiFetch("/admin/products");
    updateProductKpiCards(allAdminProducts);
    applyProductFiltersAndRender();
  } catch (err) {
    if (window.Aqualife.showToast) window.Aqualife.showToast(err.message, "error");
  }
  loadProductPerformance(); // không chặn bảng; vẽ lại khi có số liệu
}

async function loadProductPerformance() {
  try {
    const data = await window.Aqualife.apiFetch(`/admin/products/performance?days=${perfDays}`);
    productPerf = data.items || {};
  } catch {
    productPerf = {}; // cột hiệu suất hiện "chưa bán", phần còn lại vẫn dùng được
  }
  const badge = document.getElementById("stat-out-badge");
  if (badge) {
    const demand = allAdminProducts.filter(
      (p) => p.status === "active" && Number(p.stock) <= 0 && productPerf[String(p.id)]
    ).length;
    badge.textContent = demand ? `${demand} mã đang có nhu cầu` : "Không mã nào có nhu cầu";
  }
  applyProductFiltersAndRender();
}

function perfCellHtml(p) {
  const perf = productPerf[String(p.id)];
  if (!perf) return `<div class="perf-none">Chưa bán được trong ${perfDays} ngày</div>`;
  const money = new Intl.NumberFormat("vi-VN").format(Math.round(perf.revenue));
  let cover = "";
  if (perf.cover_days !== null && perf.cover_days !== undefined) {
    const stock = Number(p.stock ?? 0);
    cover =
      stock <= 0
        ? `<span class="perf-cover-bad">Hết hàng</span>`
        : perf.cover_days < 14
        ? `<span class="perf-cover-warn">Đủ bán ~${Math.round(perf.cover_days)} ngày</span>`
        : `<span class="perf-sub">Đủ bán ~${Math.round(perf.cover_days)} ngày</span>`;
  }
  const abcHint = perf.abc === "A" ? "nằm trong 80% doanh thu đầu" : perf.abc === "B" ? "15% doanh thu tiếp theo" : "5% doanh thu cuối";
  return `
    <div class="perf-row"><b>${perf.units}</b> đã bán
      <span class="perf-abc perf-abc-${perf.abc}" title="Nhóm ${perf.abc}: ${abcHint}">${perf.abc}</span></div>
    <div class="perf-sub">${money}đ · hạng #${perf.rank}</div>
    <div>${cover}</div>`;
}

function updateProductKpiCards(products) {
  const total = products.length;
  const activeList = products.filter((p) => p.status === "active");
  const activeCount = activeList.length;
  const lowStockCount = activeList.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outStockCount = activeList.filter((p) => p.stock <= 0).length;
  const activePct = total > 0 ? ((activeCount / total) * 100).toFixed(1) : "0.0";

  const totalEl = document.getElementById("stat-total-products");
  const activeEl = document.getElementById("stat-active-products");
  const activePctEl = document.getElementById("stat-active-percent");
  const lowEl = document.getElementById("stat-low-stock");
  const outEl = document.getElementById("stat-out-stock");

  if (totalEl) totalEl.textContent = String(total);
  const subEl = document.getElementById("stat-total-sub");
  if (subEl) {
    const cutoff = Date.now() - 30 * 86400000;
    const fresh = products.filter((p) => p.created_at && new Date(p.created_at).getTime() >= cutoff).length;
    subEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${fresh} mới trong 30 ngày`;
  }
  if (activeEl) activeEl.textContent = String(activeCount);
  if (activePctEl) {
    activePctEl.innerHTML = `<span style="color:#0277bd;">●</span> ${activePct}% danh mục`;
  }
  if (lowEl) lowEl.textContent = String(lowStockCount);
  if (outEl) outEl.textContent = String(outStockCount);
}

function applyProductFiltersAndRender() {
  const searchKw = (document.getElementById("admin-prod-search")?.value || "")
    .trim()
    .toLowerCase();
  const catId = document.getElementById("admin-prod-category")?.value || "";
  const statusFilter = document.getElementById("admin-prod-status")?.value || "";
  const priceRange = document.getElementById("admin-prod-price-range")?.value || "";
  const sortMode = document.getElementById("admin-prod-sort")?.value || "updated";

  filteredAdminProducts = allAdminProducts.filter((p) => {
    const sku = generateSku(p).toLowerCase();
    const waterEnv = (p.water_type || p.waterType || "Nước ngọt").toLowerCase();
    if (searchKw) {
      const matchName = (p.name || "").toLowerCase().includes(searchKw);
      const matchDesc = (p.description || "").toLowerCase().includes(searchKw);
      const matchSku = sku.includes(searchKw);
      const matchWater = waterEnv.includes(searchKw);
      if (!matchName && !matchDesc && !matchSku && !matchWater) return false;
    }

    if (catId) {
      if (catId.startsWith("env:")) {
        const expectedEnv = catId.slice(4);
        if ((p.water_type || p.waterType || "Nước ngọt") !== expectedEnv) return false;
      } else if (String(p.category_id) !== String(catId)) {
        return false;
      }
    }

    if (statusFilter === "selling") {
      if (p.status !== "active" || p.stock <= 5) return false;
    } else if (statusFilter === "low") {
      if (p.status !== "active" || p.stock <= 0 || p.stock > 5) return false;
    } else if (statusFilter === "out") {
      if (p.status !== "active" || p.stock > 0) return false;
    } else if (statusFilter === "inactive") {
      if (p.status !== "inactive") return false;
    } else if (statusFilter === "restock") {
      const perf = productPerf[String(p.id)];
      if (p.status !== "active" || !perf || perf.cover_days === null || perf.cover_days >= 14) return false;
    } else if (statusFilter === "dead") {
      if (p.status !== "active" || p.stock <= 0 || productPerf[String(p.id)]) return false;
    }

    const price = Number(p.price || 0);
    if (priceRange === "under100" && price >= 100000) return false;
    if (priceRange === "100to300" && (price < 100000 || price > 300000)) return false;
    if (priceRange === "over300" && price <= 300000) return false;

    return true;
  });

  filteredAdminProducts.sort((a, b) => {
    if (sortMode === "price_desc") return Number(b.price) - Number(a.price);
    if (sortMode === "price_asc") return Number(a.price) - Number(b.price);
    if (sortMode === "stock_asc") return Number(a.stock) - Number(b.stock);
    if (sortMode === "name_asc") return String(a.name).localeCompare(String(b.name), "vi");
    if (sortMode === "best_units")
      return (productPerf[String(b.id)]?.units || 0) - (productPerf[String(a.id)]?.units || 0);
    if (sortMode === "best_revenue")
      return (productPerf[String(b.id)]?.revenue || 0) - (productPerf[String(a.id)]?.revenue || 0);
    return Number(b.id) - Number(a.id);
  });

  const totalPages = Math.max(1, Math.ceil(filteredAdminProducts.length / CATALOG_PAGE_SIZE));
  if (currentCatalogPage > totalPages) currentCatalogPage = 1;

  renderProductTablePage();
}

function renderProductTablePage() {
  const tbody = document.getElementById("admin-products-tbody");
  const infoEl = document.getElementById("catalog-pagination-info");
  const pageBtnsEl = document.getElementById("catalog-pagination-btns");
  if (!tbody) return;

  const totalItems = filteredAdminProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / CATALOG_PAGE_SIZE));
  const startIdx = (currentCatalogPage - 1) * CATALOG_PAGE_SIZE;
  const pageItems = filteredAdminProducts.slice(startIdx, startIdx + CATALOG_PAGE_SIZE);

  if (!pageItems.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="muted" style="text-align:center;padding:32px;">
          Không tìm thấy cá thể sinh vật nào khớp bộ lọc hiện tại.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pageItems
      .map((p) => {
        const sku = generateSku(p);
        const stock = Number(p.stock ?? 0);
        const checked = selectedProductIds.has(Number(p.id)) ? "checked" : "";

        // Tồn kho sinh thái & Progress bar
        let stockCountCls = "stock-ok";
        let stockLabelCls = "";
        let stockHealthText = "Ổn định";
        let fillCls = "fill-ok";
        const barPct = Math.max(6, Math.min(100, Math.round((stock / 50) * 100)));

        if (stock <= 0) {
          stockCountCls = "stock-zero";
          stockLabelCls = "stock-zero";
          stockHealthText = "Hết hàng";
          fillCls = "fill-zero";
        } else if (stock <= 5) {
          stockCountCls = "stock-low";
          stockLabelCls = "stock-low";
          stockHealthText = "Cảnh báo nhập";
          fillCls = "fill-low";
        } else if (stock >= 35) {
          stockHealthText = "Dồi dào";
        } else if (stock <= 15) {
          stockHealthText = "Trung bình";
        }

        // Badge trạng thái
        let badgeCls = "st-selling";
        let badgeText = "Đang kinh doanh";
        if (p.status === "inactive") {
          badgeCls = "st-hidden";
          badgeText = "Ngừng kinh doanh";
        } else if (stock <= 0) {
          badgeCls = "st-out";
          badgeText = "Hết hàng";
        } else if (stock <= 5) {
          badgeCls = "st-low";
          badgeText = "Sắp hết hàng";
        }

        const priceFormatted = `${new Intl.NumberFormat("vi-VN").format(p.price || 0)}đ`;
        const priceNote = p.price >= 200000 ? "Niêm yết trại" : "Giá tiêu chuẩn";
        const productSizes = Array.isArray(p.sizes) && p.sizes.length
          ? p.sizes
          : [{ size: "Size M - Tiêu chuẩn", price: p.price || 0 }];
        const sizesBadgesHtml = `
          <div class="admin-table-size-pills">
            ${productSizes
              .map(
                (s) =>
                  `<span class="admin-table-size-pill"><b>${esc(s.size)}</b>: ${new Intl.NumberFormat("vi-VN").format(s.price || 0)}đ</span>`
              )
              .join("")}
          </div>
        `;

        return `
          <tr data-product-id="${p.id}">
            <td>
              <input type="checkbox" class="creature-checkbox" data-id="${p.id}" ${checked} />
            </td>
            <td>
              <div class="creature-info-cell">
                <img class="creature-thumb" src="${esc(normalizeAdminImage(p.image))}" alt="${esc(p.name)}" />
                <div>
                  <div class="creature-title">${esc(p.name)}</div>
                  <div class="creature-sub">
                    <span class="sku-badge">${esc(sku)}</span>
                    <span class="creature-desc-short">${esc(p.description || "Dòng nhân giống khỏe mạnh")}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span class="cat-system-pill">${esc(p.category_name || "Cá Cảnh")}</span>
              <div style="margin-top:5px;font-size:11.5px;color:#0369a1;font-weight:600;">
                ${
                  (p.water_type || p.waterType || "Nước ngọt").includes("mặn")
                    ? "🌊"
                    : (p.water_type || p.waterType || "Nước ngọt").includes("lợ")
                    ? "🌿"
                    : "💧"
                } ${esc(p.water_type || p.waterType || "Nước ngọt")}
              </div>
            </td>
            <td>
              <div class="price-cell-main">${priceFormatted}</div>
              <div class="price-cell-sub">${priceNote}</div>
              ${sizesBadgesHtml}
            </td>
            <td class="eco-stock-cell">
              <div class="eco-stock-top">
                <span class="eco-stock-count ${stockCountCls}">${stock} cá thể</span>
                <span class="eco-stock-label ${stockLabelCls}">${stockHealthText}</span>
              </div>
              <div class="eco-progress">
                <div class="eco-progress-fill ${fillCls}" style="width:${stock <= 0 ? 100 : barPct}%;"></div>
              </div>
            </td>
            <td class="perf-cell">${perfCellHtml(p)}</td>
            <td>
              <span class="eco-status-badge ${badgeCls}">${badgeText}</span>
            </td>
            <td class="updated-cell">
              <div>${formatRelativeTime(p.updated_at || p.created_at)}</div>
              <div class="row-actions">
                <button type="button" class="btn-row-icon btn-edit-prod" data-id="${p.id}">
                  <i class="fa-regular fa-pen-to-square"></i> Sửa
                </button>
                <button type="button" class="btn-row-icon btn-toggle-prod" data-id="${p.id}" data-status="${p.status}">
                  ${p.status === "active" ? "Ẩn" : "Mở"}
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  // Cập nhật thông tin phân trang
  if (infoEl) {
    const from = totalItems === 0 ? 0 : startIdx + 1;
    const to = Math.min(totalItems, startIdx + CATALOG_PAGE_SIZE);
    infoEl.textContent = `Hiển thị ${from}–${to} trên tổng ${totalItems} cá thể sinh vật`;
  }

  if (pageBtnsEl) {
    if (totalPages <= 1) {
      pageBtnsEl.innerHTML = "";
    } else {
      let html = "";
      for (let i = 1; i <= totalPages; i++) {
        html += `<button type="button" class="adm-page-btn ${
          i === currentCatalogPage ? "active" : ""
        }" data-page="${i}">${i}</button>`;
      }
      pageBtnsEl.innerHTML = html;
      pageBtnsEl.querySelectorAll(".adm-page-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          currentCatalogPage = Number(btn.dataset.page || 1);
          renderProductTablePage();
        });
      });
    }
  }

  syncBulkToolbarState(pageItems);
}

function syncBulkToolbarState(currentPageItems = []) {
  const countEl = document.getElementById("selected-count");
  const selectAllEl = document.getElementById("select-all-products");
  if (countEl) countEl.textContent = String(selectedProductIds.size);
  if (selectAllEl && currentPageItems.length > 0) {
    const allChecked = currentPageItems.every((p) => selectedProductIds.has(Number(p.id)));
    selectAllEl.checked = allChecked;
  } else if (selectAllEl) {
    selectAllEl.checked = false;
  }
}

function roundPriceStep(value) {
  const num = Number(value || 0);
  if (num <= 0) return 10000;
  if (num < 50000) return Math.max(5000, Math.round(num / 2000) * 2000);
  return Math.max(10000, Math.round(num / 5000) * 5000);
}

function generateSuggestedSizes(basePrice) {
  const bp = Number(basePrice || 150000);
  return [
    { size: "Size S - Nhỏ (2 - 3cm)", price: roundPriceStep(bp * 0.75) },
    { size: "Size M - Trung (4 - 6cm)", price: bp },
    { size: "Size L - Trưởng thành (7 - 10cm)", price: roundPriceStep(bp * 1.45) },
  ];
}

function addSizeRowToModal(sizeLabel = "", sizePrice = 0) {
  const listEl = document.getElementById("prod-sizes-list");
  if (!listEl) return;

  const row = document.createElement("div");
  row.className = "prod-size-row";
  row.innerHTML = `
    <input type="text" class="prod-size-name-input" placeholder="VD: Size M - Trung (4 - 6cm)" value="${esc(sizeLabel)}" required />
    <input type="number" class="prod-size-price-input" min="0" step="1000" placeholder="Giá (VNĐ)" value="${Number(sizePrice || 0)}" required />
    <button type="button" class="prod-size-remove-btn" title="Xóa kích thước này">
      <i class="fa-solid fa-trash-can"></i>
    </button>
  `;
  row.querySelector(".prod-size-remove-btn")?.addEventListener("click", () => {
    const allRows = listEl.querySelectorAll(".prod-size-row");
    if (allRows.length <= 1) {
      window.Aqualife.showToast("Cần giữ ít nhất 1 kích thước cho sinh vật.", "error");
      return;
    }
    row.remove();
  });
  listEl.appendChild(row);
}

function renderSizeRowsInModal(sizes = [], fallbackBasePrice = 150000) {
  const listEl = document.getElementById("prod-sizes-list");
  if (!listEl) return;
  listEl.innerHTML = "";
  const items = Array.isArray(sizes) && sizes.length > 0 ? sizes : generateSuggestedSizes(fallbackBasePrice);
  items.forEach((item) => {
    addSizeRowToModal(item.size || "", item.price ?? fallbackBasePrice);
  });
}

function collectSizeRowsFromModal(fallbackBasePrice = 150000) {
  const listEl = document.getElementById("prod-sizes-list");
  if (!listEl) return generateSuggestedSizes(fallbackBasePrice);
  const rows = Array.from(listEl.querySelectorAll(".prod-size-row"));
  const parsed = rows
    .map((r) => {
      const size = r.querySelector(".prod-size-name-input")?.value.trim() || "";
      const price = Number(r.querySelector(".prod-size-price-input")?.value || 0);
      return { size, price };
    })
    .filter((item) => item.size !== "" && Number.isFinite(item.price) && item.price >= 0);
  return parsed.length > 0 ? parsed : generateSuggestedSizes(fallbackBasePrice);
}

function openProductModal(prod = null) {
  const modal = document.getElementById("product-modal-backdrop");
  if (!modal) return;

  const waterSelect = document.getElementById("prod-form-water-type");

  if (prod) {
    document.getElementById("product-modal-title").textContent = `Chỉnh sửa sinh vật #${prod.id}`;
    document.getElementById("prod-form-id").value = String(prod.id);
    document.getElementById("prod-form-name").value = prod.name || "";
    document.getElementById("prod-form-category").value = String(prod.category_id || "");
    if (waterSelect) {
      waterSelect.value = prod.water_type || prod.waterType || "Nước ngọt";
    }
    document.getElementById("prod-form-status").value = prod.status || "active";
    document.getElementById("prod-form-price").value = String(prod.price || 0);
    document.getElementById("prod-form-stock").value = String(prod.stock ?? 0);
    document.getElementById("prod-form-image").value = prod.image || "";
    document.getElementById("prod-form-desc").value = prod.description || "";
    renderSizeRowsInModal(prod.sizes, Number(prod.price || 150000));
  } else {
    document.getElementById("product-modal-title").textContent = "Thêm cá thể / sản phẩm mới";
    document.getElementById("prod-form-id").value = "";
    document.getElementById("prod-form-name").value = "";
    if (waterSelect) {
      waterSelect.value = "Nước ngọt";
    }
    document.getElementById("prod-form-status").value = "active";
    document.getElementById("prod-form-price").value = "150000";
    document.getElementById("prod-form-stock").value = "25";
    document.getElementById("prod-form-image").value = "image/ocean-bg.svg";
    document.getElementById("prod-form-desc").value = "";
    renderSizeRowsInModal(generateSuggestedSizes(150000), 150000);
  }
  modal.classList.remove("hidden");
}

function bindCatalogEvents() {
  // Đổi khoảng thời gian của cột "Hiệu suất bán"
  document.querySelectorAll("#perf-range button").forEach((btn) => {
    btn.addEventListener("click", () => {
      perfDays = Number(btn.dataset.d);
      document.querySelectorAll("#perf-range button").forEach((b) => b.classList.toggle("active", b === btn));
      loadProductPerformance();
    });
  });
  // Bộ lọc tự động khi nhập/chọn
  ["admin-prod-search", "admin-prod-category", "admin-prod-status", "admin-prod-price-range", "admin-prod-sort"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        currentCatalogPage = 1;
        applyProductFiltersAndRender();
      });
      el.addEventListener("change", () => {
        currentCatalogPage = 1;
        applyProductFiltersAndRender();
      });
    }
  );

  // Chọn tất cả trang hiện tại
  const selectAllEl = document.getElementById("select-all-products");
  selectAllEl?.addEventListener("change", () => {
    const startIdx = (currentCatalogPage - 1) * CATALOG_PAGE_SIZE;
    const pageItems = filteredAdminProducts.slice(startIdx, startIdx + CATALOG_PAGE_SIZE);
    pageItems.forEach((p) => {
      if (selectAllEl.checked) selectedProductIds.add(Number(p.id));
      else selectedProductIds.delete(Number(p.id));
    });
    renderProductTablePage();
  });

  // Sự kiện trên bảng sản phẩm
  document.getElementById("admin-products-tbody")?.addEventListener("click", async (e) => {
    const checkbox = e.target.closest(".creature-checkbox");
    if (checkbox) {
      const id = Number(checkbox.dataset.id);
      if (checkbox.checked) selectedProductIds.add(id);
      else selectedProductIds.delete(id);
      const startIdx = (currentCatalogPage - 1) * CATALOG_PAGE_SIZE;
      const pageItems = filteredAdminProducts.slice(startIdx, startIdx + CATALOG_PAGE_SIZE);
      syncBulkToolbarState(pageItems);
      return;
    }

    const editBtn = e.target.closest(".btn-edit-prod");
    if (editBtn) {
      const prod = allAdminProducts.find((p) => Number(p.id) === Number(editBtn.dataset.id));
      if (prod) openProductModal(prod);
      return;
    }

    const toggleBtn = e.target.closest(".btn-toggle-prod");
    if (toggleBtn) {
      const id = Number(toggleBtn.dataset.id);
      const nextStatus = toggleBtn.dataset.status === "active" ? "inactive" : "active";
      try {
        await window.Aqualife.apiFetch(`/admin/products/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: nextStatus }),
        });
        window.Aqualife.showToast("Đã cập nhật trạng thái kinh doanh!", "success");
        await loadAdminProducts();
      } catch (err) {
        window.Aqualife.showToast(err.message, "error");
      }
    }
  });

  // Bulk Action 1: Xóa đã chọn
  document.getElementById("btn-bulk-delete")?.addEventListener("click", async () => {
    if (!selectedProductIds.size) {
      window.Aqualife.showToast("Hãy tích chọn ít nhất 1 cá thể trong bảng.", "error");
      return;
    }
    try {
      await window.Aqualife.apiFetch("/admin/products/bulk", {
        method: "POST",
        body: JSON.stringify({
          product_ids: Array.from(selectedProductIds),
          action: "delete",
        }),
      });
      window.Aqualife.showToast(`Đã ngừng kinh doanh ${selectedProductIds.size} sản phẩm đã chọn.`, "success");
      selectedProductIds.clear();
      await loadAdminProducts();
    } catch (err) {
      window.Aqualife.showToast(err.message, "error");
    }
  });

  // Bulk Action 2: Đổi trạng thái
  document.getElementById("btn-bulk-toggle")?.addEventListener("click", async () => {
    if (!selectedProductIds.size) {
      window.Aqualife.showToast("Hãy tích chọn ít nhất 1 cá thể trong bảng.", "error");
      return;
    }
    try {
      await window.Aqualife.apiFetch("/admin/products/bulk", {
        method: "POST",
        body: JSON.stringify({
          product_ids: Array.from(selectedProductIds),
          action: "toggle_status",
        }),
      });
      window.Aqualife.showToast(`Đã đảo trạng thái ${selectedProductIds.size} sản phẩm!`, "success");
      selectedProductIds.clear();
      await loadAdminProducts();
    } catch (err) {
      window.Aqualife.showToast(err.message, "error");
    }
  });

  // Bulk Action 3: Cập nhật giá sỉ / tồn kho
  const bulkModal = document.getElementById("bulk-price-modal-backdrop");
  document.getElementById("btn-bulk-price")?.addEventListener("click", () => {
    if (!selectedProductIds.size) {
      window.Aqualife.showToast("Hãy tích chọn các cá thể cần cập nhật giá sỉ.", "error");
      return;
    }
    document.getElementById("bulk-modal-count").textContent = String(selectedProductIds.size);
    document.getElementById("bulk-price-form")?.reset();
    bulkModal?.classList.remove("hidden");
  });

  document.getElementById("bulk-modal-cancel")?.addEventListener("click", () => {
    bulkModal?.classList.add("hidden");
  });

  document.getElementById("bulk-price-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const pct = document.getElementById("bulk-price-percent").value.trim();
    const fixed = document.getElementById("bulk-fixed-price").value.trim();
    const stockDelta = document.getElementById("bulk-stock-delta").value.trim();

    try {
      await window.Aqualife.apiFetch("/admin/products/bulk", {
        method: "POST",
        body: JSON.stringify({
          product_ids: Array.from(selectedProductIds),
          action: "update_price",
          price_percent: pct !== "" ? Number(pct) : null,
          fixed_price: fixed !== "" ? Number(fixed) : null,
          stock_delta: stockDelta !== "" ? Number(stockDelta) : null,
        }),
      });
      bulkModal?.classList.add("hidden");
      window.Aqualife.showToast("Đã cập nhật giá sỉ & tồn kho hàng loạt!", "success");
      selectedProductIds.clear();
      await loadAdminProducts();
    } catch (err) {
      window.Aqualife.showToast(err.message, "error");
    }
  });

  // Xuất file Excel (CSV UTF-8 BOM)
  document.getElementById("btn-export-excel")?.addEventListener("click", () => {
    const rows = [
      ["ID", "Mã SKU", "Tên Sinh Vật", "Phân Loại Loài", "Môi Trường Nước", "Đơn Giá (VNĐ)", "Tồn Kho", "Trạng Thái"],
      ...filteredAdminProducts.map((p) => [
        p.id,
        generateSku(p),
        `"${String(p.name || "").replace(/"/g, '""')}"`,
        `"${String(p.category_name || "").replace(/"/g, '""')}"`,
        `"${String(p.water_type || p.waterType || "Nước ngọt").replace(/"/g, '""')}"`,
        p.price,
        p.stock,
        p.status,
      ]),
    ];
    const csvContent = "\uFEFF" + rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aqualife_kho_sinh_vat_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    window.Aqualife.showToast("Đã xuất file Excel (CSV) thành công!", "success");
  });

  // Nhập danh sách sản phẩm (Import Modal)
  const importModal = document.getElementById("import-modal-backdrop");
  document.getElementById("btn-import-products")?.addEventListener("click", () => {
    importModal?.classList.remove("hidden");
  });
  document.getElementById("import-modal-cancel")?.addEventListener("click", () => {
    importModal?.classList.add("hidden");
  });
  document.getElementById("import-file-input")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    document.getElementById("import-json-textarea").value = text;
  });
  document.getElementById("import-modal-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const raw = document.getElementById("import-json-textarea").value.trim();
    if (!raw) {
      window.Aqualife.showToast("Vui lòng chọn file hoặc dán dữ liệu JSON.", "error");
      return;
    }
    try {
      const items = JSON.parse(raw);
      if (!Array.isArray(items) || !items.length) {
        throw new Error("Dữ liệu phải là mảng JSON các sản phẩm.");
      }
      const defaultCatId = adminCategories[0]?.id || null;
      let count = 0;
      for (const item of items) {
        if (!item.name) continue;
        const basePrice = Number(item.price || 100000);
        await window.Aqualife.apiFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify({
            name: item.name,
            category_id: item.category_id || defaultCatId,
            water_type: item.water_type || item.waterType || "Nước ngọt",
            price: basePrice,
            stock: Number(item.stock ?? 20),
            image: item.image || "image/ocean-bg.svg",
            description: item.description || "",
            status: "active",
            sizes: Array.isArray(item.sizes) && item.sizes.length ? item.sizes : generateSuggestedSizes(basePrice),
          }),
        });
        count++;
      }
      importModal?.classList.add("hidden");
      window.Aqualife.showToast(`Đã nhập thành công ${count} cá thể vào kho!`, "success");
      await loadAdminProducts();
    } catch (err) {
      window.Aqualife.showToast(err.message || "Lỗi định dạng JSON.", "error");
    }
  });

  // Modal Thêm / Sửa 1 sản phẩm
  const prodModal = document.getElementById("product-modal-backdrop");
  document.getElementById("btn-open-prod-modal")?.addEventListener("click", () => {
    openProductModal(null);
  });
  document.getElementById("prod-modal-cancel")?.addEventListener("click", () => {
    prodModal?.classList.add("hidden");
  });
  document.getElementById("btn-add-size-row")?.addEventListener("click", () => {
    const bp = Number(document.getElementById("prod-form-price")?.value || 150000);
    addSizeRowToModal("", bp);
  });
  document.getElementById("btn-auto-size-rows")?.addEventListener("click", () => {
    const bp = Number(document.getElementById("prod-form-price")?.value || 150000);
    renderSizeRowsInModal(generateSuggestedSizes(bp), bp);
    window.Aqualife.showToast("Đã tự động tạo 3 mốc kích thước S / M / L theo giá cơ sở!", "success");
  });
  document.getElementById("product-modal-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("prod-form-id").value;
    const basePrice = Number(document.getElementById("prod-form-price").value || 0);
    const sizes = collectSizeRowsFromModal(basePrice);
    const payload = {
      name: document.getElementById("prod-form-name").value.trim(),
      category_id: Number(document.getElementById("prod-form-category").value) || null,
      water_type: document.getElementById("prod-form-water-type")?.value || "Nước ngọt",
      status: document.getElementById("prod-form-status").value,
      price: basePrice,
      stock: Number(document.getElementById("prod-form-stock").value || 0),
      image: document.getElementById("prod-form-image").value.trim(),
      description: document.getElementById("prod-form-desc").value.trim(),
      sizes,
    };
    try {
      if (id) {
        await window.Aqualife.apiFetch(`/admin/products/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        window.Aqualife.showToast("Đã cập nhật thông tin & bảng giá kích thước sinh vật!", "success");
      } else {
        await window.Aqualife.apiFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        window.Aqualife.showToast("Đã thêm sinh vật mới kèm bảng giá kích thước vào kho!", "success");
      }
      prodModal?.classList.add("hidden");
      await loadAdminProducts();
      await loadAdminCategories();
    } catch (err) {
      window.Aqualife.showToast(err.message, "error");
    }
  });

  // Modal Danh mục (Tab Kho hàng)
  const catModal = document.getElementById("category-modal-backdrop");
  document.getElementById("btn-open-cat-modal")?.addEventListener("click", () => {
    document.getElementById("category-modal-title").textContent = "Thêm danh mục hệ sinh thái";
    document.getElementById("cat-form-id").value = "";
    document.getElementById("cat-form-name").value = "";
    document.getElementById("cat-form-status").value = "active";
    document.getElementById("cat-form-desc").value = "";
    catModal?.classList.remove("hidden");
  });
  document.getElementById("cat-modal-cancel")?.addEventListener("click", () => {
    catModal?.classList.add("hidden");
  });
  document.getElementById("admin-categories-tbody")?.addEventListener("click", async (e) => {
    const editBtn = e.target.closest(".btn-edit-cat");
    if (editBtn) {
      const cat = adminCategories.find((c) => Number(c.id) === Number(editBtn.dataset.id));
      if (!cat) return;
      document.getElementById("category-modal-title").textContent = `Sửa danh mục #${cat.id}`;
      document.getElementById("cat-form-id").value = String(cat.id);
      document.getElementById("cat-form-name").value = cat.name || "";
      document.getElementById("cat-form-status").value = cat.status || "active";
      document.getElementById("cat-form-desc").value = cat.description || "";
      catModal?.classList.remove("hidden");
      return;
    }
    const toggleBtn = e.target.closest(".btn-toggle-cat");
    if (toggleBtn) {
      const id = Number(toggleBtn.dataset.id);
      const nextStatus = toggleBtn.dataset.status === "active" ? "inactive" : "active";
      try {
        await window.Aqualife.apiFetch(`/admin/categories/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: nextStatus }),
        });
        window.Aqualife.showToast("Đã cập nhật danh mục!", "success");
        await loadAdminCategories();
      } catch (err) {
        window.Aqualife.showToast(err.message, "error");
      }
    }
  });
  document.getElementById("category-modal-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("cat-form-id").value;
    const payload = {
      name: document.getElementById("cat-form-name").value.trim(),
      status: document.getElementById("cat-form-status").value,
      description: document.getElementById("cat-form-desc").value.trim(),
    };
    try {
      if (id) {
        await window.Aqualife.apiFetch(`/admin/categories/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await window.Aqualife.apiFetch("/admin/categories", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      catModal?.classList.add("hidden");
      window.Aqualife.showToast("Đã lưu danh mục!", "success");
      await loadAdminCategories();
    } catch (err) {
      window.Aqualife.showToast(err.message, "error");
    }
  });
}

// ==========================================================================
// PANEL 2: TỔNG QUAN (OVERVIEW)
// ==========================================================================
async function loadOverview() {
  try {
    const data = await window.Aqualife.apiFetch("/admin/dashboard");
    document.getElementById("kpi-completed-revenue").textContent =
      window.Aqualife.formatCurrency(data.total_revenue || 0);
    document.getElementById("kpi-active-revenue").textContent =
      `Tổng đơn hiệu lực: ${window.Aqualife.formatCurrency(data.active_revenue || 0)}`;

    const byStatus = data.orders_by_status || {};
    document.getElementById("kpi-total-orders").textContent = String(data.total_orders || 0);
    document.getElementById("kpi-pending-orders").textContent =
      `${byStatus.pending || 0} đơn chờ xác nhận`;

    document.getElementById("kpi-active-products").textContent =
      `${data.active_products || 0} / ${data.total_products || 0}`;
    document.getElementById("kpi-low-stock").textContent =
      `${data.low_stock_products || 0} sắp hết • ${data.out_of_stock_products || 0} hết hàng`;

    document.getElementById("kpi-total-users").textContent = String(data.total_users || 0);
    document.getElementById("kpi-active-users").textContent =
      `${data.active_users || 0} hoạt động • ${data.admin_users || 0} admin`;

    const topBody = document.getElementById("overview-top-products");
    const topList = data.top_selling_products || [];
    if (topBody) {
      topBody.innerHTML = topList.length
        ? topList
            .map(
              (item) => `
              <tr>
                <td><strong>${esc(item.product_name)}</strong></td>
                <td>${item.total_sold} cá thể</td>
                <td>${item.stock ?? "-"}</td>
                <td><strong>${window.Aqualife.formatCurrency(item.total_revenue)}</strong></td>
              </tr>
            `
            )
            .join("")
        : `<tr><td colspan="4" class="muted">Chưa có dữ liệu bán hàng.</td></tr>`;
    }

    const recentBody = document.getElementById("overview-recent-orders");
    const recentList = data.recent_orders || [];
    if (recentBody) {
      recentBody.innerHTML = recentList.length
        ? recentList
            .map(
              (o) => `
              <tr>
                <td><strong>#${o.id}</strong></td>
                <td>
                  <div><strong>${esc(o.shipping_name)}</strong></div>
                  <div class="muted" style="font-size:12px;">${esc(o.shipping_phone)}</div>
                </td>
                <td><strong>${window.Aqualife.formatCurrency(o.total_amount)}</strong></td>
                <td>${orderStatusBadgeHtml(o.status)}</td>
              </tr>
            `
            )
            .join("")
        : `<tr><td colspan="4" class="muted">Chưa có đơn hàng nào.</td></tr>`;
    }
  } catch {
    // ignore
  }
}

// ==========================================================================
// PANEL 3: ĐƠN HÀNG (ORDERS)
// ==========================================================================
async function loadAdminOrders() {
  const tbody = document.getElementById("admin-orders-tbody");
  const search = document.getElementById("admin-order-search")?.value.trim() || "";
  const status = document.getElementById("admin-order-status")?.value || "";

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (status) params.set("status", status);

  try {
    const orders = await window.Aqualife.apiFetch(`/admin/orders?${params.toString()}`);
    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted">Không có đơn hàng nào khớp bộ lọc.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders
      .map((o) => {
        const nextAllowed = NEXT_STATUS_OPTIONS[o.status] || [];
        const itemsSummary = (o.items || [])
          .map((i) => `${esc(i.product_name)} ×${i.quantity}`)
          .join("<br>");

        let actionControl = `<span class="muted" style="font-size:12px;">Đã đóng</span>`;
        if (nextAllowed.length > 0) {
          const opts = nextAllowed
            .map((st) => `<option value="${st}">${esc(STATUS_LABELS[st])}</option>`)
            .join("");
          actionControl = `
            <div style="display:flex;gap:6px;align-items:center;">
              <select class="adm-select select-order-next" data-order-id="${o.id}" style="padding:6px 8px;font-size:12px;width:auto;">
                ${opts}
              </select>
              <button type="button" class="btn-row-icon btn-apply-order-status" data-order-id="${o.id}">
                Lưu
              </button>
            </div>
          `;
        }

        return `
          <tr>
            <td>
              <strong>#${o.id}</strong>
              <div class="muted" style="font-size:11px;">${new Date(o.created_at).toLocaleString("vi-VN")}</div>
            </td>
            <td>
              <div><strong>${esc(o.shipping_name)}</strong> (${esc(o.shipping_phone)})</div>
              <div class="muted" style="font-size:12px;">${esc(o.shipping_address)}</div>
            </td>
            <td style="font-size:13px;">${itemsSummary || "-"}</td>
            <td><strong>${window.Aqualife.formatCurrency(o.total_amount)}</strong></td>
            <td>${o.payment_method === "bank_transfer" ? "Chuyển khoản" : "COD"}</td>
            <td>${orderStatusBadgeHtml(o.status)}</td>
            <td>${actionControl}</td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    window.Aqualife.showToast(err.message, "error");
  }
}

function bindOrderEvents() {
  document.getElementById("admin-order-filter-btn")?.addEventListener("click", loadAdminOrders);
  document.getElementById("admin-order-search")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadAdminOrders();
  });

  document.getElementById("admin-orders-tbody")?.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-apply-order-status");
    if (!btn) return;
    const orderId = Number(btn.dataset.orderId);
    const select = document.querySelector(`.select-order-next[data-order-id="${orderId}"]`);
    if (!select) return;

    const newStatus = select.value;
    btn.disabled = true;
    try {
      await window.Aqualife.apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      window.Aqualife.showToast(
        `Đơn #${orderId} đã chuyển sang "${STATUS_LABELS[newStatus] || newStatus}"!`,
        "success"
      );
      await loadAdminOrders();
      await loadAdminProducts();
    } catch (err) {
      window.Aqualife.showToast(err.message, "error");
      btn.disabled = false;
    }
  });
}

// ==========================================================================
// PANEL 4: KHÁCH HÀNG (USERS)
// ==========================================================================
async function loadAdminUsers() {
  const tbody = document.getElementById("admin-users-tbody");
  const search = document.getElementById("admin-user-search")?.value.trim() || "";
  const role = document.getElementById("admin-user-role")?.value || "";
  const status = document.getElementById("admin-user-status")?.value || "";

  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (status) params.set("status", status);

  try {
    const users = await window.Aqualife.apiFetch(`/admin/users?${params.toString()}`);
    if (!users.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="muted">Không tìm thấy người dùng nào.</td></tr>`;
      return;
    }

    tbody.innerHTML = users
      .map((u) => {
        const isSelf = currentAdminUser && Number(currentAdminUser.id) === Number(u.id);
        return `
          <tr>
            <td><strong>#${u.id}</strong></td>
            <td>
              <div><strong>${esc(u.name)}</strong> ${isSelf ? `<span class="sku-badge">Bạn</span>` : ""}</div>
              <div class="muted" style="font-size:12px;">${esc(u.email)}</div>
            </td>
            <td style="font-size:13px;">
              <div>${esc(u.phone || "Chưa cập nhật")}</div>
              <div class="muted" style="font-size:12px;">${esc(u.address || "")}</div>
            </td>
            <td>
              <div><strong>${u.order_count || 0} đơn</strong></div>
              <div class="muted" style="font-size:12px;">${window.Aqualife.formatCurrency(u.total_spent || 0)}</div>
            </td>
            <td>
              <span class="cat-system-pill">${u.role === "admin" ? "Admin" : "Customer"}</span>
            </td>
            <td>
              <span class="eco-status-badge ${u.status === "active" ? "st-selling" : "st-out"}">
                ${u.status === "active" ? "Hoạt động" : "Đã khóa"}
              </span>
            </td>
            <td>
              ${
                isSelf
                  ? `<span class="muted" style="font-size:12px;">Tài khoản hiện tại</span>`
                  : `
                  <div class="row-actions" style="margin-top:0;">
                    <button type="button" class="btn-row-icon btn-toggle-user-role" data-id="${u.id}" data-role="${u.role}">
                      ${u.role === "admin" ? "Hạ quyền" : "Nâng Admin"}
                    </button>
                    <button type="button" class="btn-row-icon btn-toggle-user-status" data-id="${u.id}" data-status="${u.status}">
                      ${u.status === "active" ? "Khóa TK" : "Mở khóa"}
                    </button>
                  </div>
                `
              }
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    window.Aqualife.showToast(err.message, "error");
  }
}

function bindUserEvents() {
  document.getElementById("admin-user-filter-btn")?.addEventListener("click", loadAdminUsers);
  document.getElementById("admin-user-search")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadAdminUsers();
  });

  document.getElementById("admin-users-tbody")?.addEventListener("click", async (e) => {
    const roleBtn = e.target.closest(".btn-toggle-user-role");
    if (roleBtn) {
      const id = Number(roleBtn.dataset.id);
      const nextRole = roleBtn.dataset.role === "admin" ? "customer" : "admin";
      try {
        await window.Aqualife.apiFetch(`/admin/users/${id}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: nextRole }),
        });
        window.Aqualife.showToast("Đã cập nhật vai trò người dùng!", "success");
        await loadAdminUsers();
      } catch (err) {
        window.Aqualife.showToast(err.message, "error");
      }
      return;
    }

    const statusBtn = e.target.closest(".btn-toggle-user-status");
    if (statusBtn) {
      const id = Number(statusBtn.dataset.id);
      const nextStatus = statusBtn.dataset.status === "active" ? "inactive" : "active";
      try {
        await window.Aqualife.apiFetch(`/admin/users/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        });
        window.Aqualife.showToast("Đã cập nhật trạng thái tài khoản!", "success");
        await loadAdminUsers();
      } catch (err) {
        window.Aqualife.showToast(err.message, "error");
      }
    }
  });
}

// ==========================================================================
// PANEL 5: KHO HÀNG (REPLENISHMENT)
// ==========================================================================
function renderLowStockReplenishment() {
  const tbody = document.getElementById("inventory-low-stock-tbody");
  if (!tbody) return;

  const lowList = allAdminProducts.filter((p) => p.status === "active" && p.stock <= 5);
  if (!lowList.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Tuyệt vời! Toàn bộ sinh vật trong kho đều trên ngưỡng an toàn (> 5 cá thể).</td></tr>`;
    return;
  }

  tbody.innerHTML = lowList
    .map(
      (p) => `
      <tr>
        <td>
          <strong>${esc(p.name)}</strong>
          <div><span class="sku-badge">${esc(generateSku(p))}</span></div>
        </td>
        <td><span class="cat-system-pill">${esc(p.category_name || "Chưa phân loại")}</span></td>
        <td><strong style="color:#dc2626;">${p.stock} cá thể</strong></td>
        <td>
          <div class="row-actions" style="margin-top:0;">
            <button type="button" class="btn-row-icon btn-quick-restock" data-id="${p.id}" data-add="15">+15 cá thể</button>
            <button type="button" class="btn-row-icon btn-quick-restock" data-id="${p.id}" data-add="30">+30 cá thể</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll(".btn-quick-restock").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      const add = Number(btn.dataset.add || 15);
      try {
        await window.Aqualife.apiFetch("/admin/products/bulk", {
          method: "POST",
          body: JSON.stringify({
            product_ids: [id],
            action: "update_price",
            stock_delta: add,
          }),
        });
        window.Aqualife.showToast(`Đã nhập bổ sung +${add} cá thể!`, "success");
        await loadAdminProducts();
        renderLowStockReplenishment();
      } catch (err) {
        window.Aqualife.showToast(err.message, "error");
      }
    });
  });
}

// ==========================================================================
// PANEL 6: BÁO CÁO DOANH THU (REVENUE)
// ==========================================================================
async function loadRevenueReport() {
  // Dashboard BI nằm trong js/admin-bi.js
  if (window.AdminBI) await window.AdminBI.load();
}

// ==========================================================================
// PANEL 7: CÀI ĐẶT HỆ THỐNG & THÔNG TIN LIÊN HỆ ADMIN
// ==========================================================================
function renderSettingsPreview(info) {
  if (!info) return;
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    if (el && v !== undefined && v !== null) el.value = v;
  };
  const setTxt = (id, v) => {
    const el = document.getElementById(id);
    if (el && v) el.textContent = v;
  };

  setVal("set-store-address", info.address || "");
  setVal("set-store-address-sub", info.address_sub || "");
  setVal("set-store-phone", info.phone || "");
  setVal("set-store-hotline-sub", info.hotline_sub || "");
  setVal("set-store-email", info.email || "");
  setVal("set-store-email-sub", info.email_sub || "");
  setVal("set-store-hours", info.open_hours || "");
  setVal("set-store-hours-sub", info.open_hours_sub || "");

  setTxt("prev-store-address", info.address);
  setTxt("prev-store-address-sub", info.address_sub);
  setTxt("prev-store-phone", info.phone);
  setTxt("prev-store-hotline-sub", info.hotline_sub);
  setTxt("prev-store-email", info.email);
  setTxt("prev-store-email-sub", info.email_sub);
  setTxt("prev-store-hours", info.open_hours);
  setTxt("prev-store-hours-sub", info.open_hours_sub);
}

async function loadAdminStoreSettings() {
  try {
    const info = await window.Aqualife.apiFetch("/admin/settings");
    if (info) {
      localStorage.setItem("aqualife_store_info_v1", JSON.stringify(info));
      renderSettingsPreview(info);
    }
  } catch {
    // ignore
  }
}

function bindSettingsEvents() {
  const form = document.getElementById("admin-store-settings-form");
  if (!form) return;

  // Live preview khi gõ
  const liveMap = [
    ["set-store-address", "prev-store-address"],
    ["set-store-address-sub", "prev-store-address-sub"],
    ["set-store-phone", "prev-store-phone"],
    ["set-store-hotline-sub", "prev-store-hotline-sub"],
    ["set-store-email", "prev-store-email"],
    ["set-store-email-sub", "prev-store-email-sub"],
    ["set-store-hours", "prev-store-hours"],
    ["set-store-hours-sub", "prev-store-hours-sub"],
  ];
  liveMap.forEach(([inputId, prevId]) => {
    const inp = document.getElementById(inputId);
    const prev = document.getElementById(prevId);
    inp?.addEventListener("input", () => {
      if (prev) prev.textContent = inp.value.trim() || "—";
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      address: document.getElementById("set-store-address")?.value.trim() || "",
      address_sub: document.getElementById("set-store-address-sub")?.value.trim() || "",
      phone: document.getElementById("set-store-phone")?.value.trim() || "",
      hotline_sub: document.getElementById("set-store-hotline-sub")?.value.trim() || "",
      email: document.getElementById("set-store-email")?.value.trim() || "",
      email_sub: document.getElementById("set-store-email-sub")?.value.trim() || "",
      open_hours: document.getElementById("set-store-hours")?.value.trim() || "",
      open_hours_sub: document.getElementById("set-store-hours-sub")?.value.trim() || "",
    };

    try {
      const updated = await window.Aqualife.apiFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      localStorage.setItem("aqualife_store_info_v1", JSON.stringify(updated));
      renderSettingsPreview(updated);
      window.Aqualife.showToast("Đã lưu thông tin Admin & đồng bộ lên Trang Liên hệ!", "success");
    } catch (err) {
      window.Aqualife.showToast(err.message, "error");
    }
  });
}


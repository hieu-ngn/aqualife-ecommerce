const AQUALIFE_CART_KEY = "aqualife_cart_v1";
const AQUALIFE_CART_SIZES_KEY = "aqualife_cart_sizes_v1";
let productsCache = null;

const CATEGORY_TO_SPECIES = {
  "Cá cảnh": "Cá",
  "Tép cảnh": "Tép",
  "Ốc cảnh": "Ốc",
  "Thủy sinh & San hô": "Thủy Sinh / San hô",
};

function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `aqualife-toast aqualife-toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.25s ease";
    setTimeout(() => toast.remove(), 260);
  }, 2600);
}

function getCart() {
  try {
    const raw = localStorage.getItem(AQUALIFE_CART_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem(AQUALIFE_CART_KEY, JSON.stringify(cart));
  updateCartBadges();
}

function getCartSizes() {
  try {
    const raw = localStorage.getItem(AQUALIFE_CART_SIZES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCartSizes(sizesMap) {
  localStorage.setItem(AQUALIFE_CART_SIZES_KEY, JSON.stringify(sizesMap || {}));
}

function buildDefaultSizes(basePrice) {
  const p = Number(basePrice || 50000);
  const roundVnd = (v) => (v <= 15000 ? Math.round(v / 1000) * 1000 : Math.round(v / 5000) * 5000);
  return [
    { size: "Size S - Nhỏ (2 - 3cm)", price: p },
    { size: "Size M - Trung (4 - 6cm)", price: roundVnd(p * 1.4) },
    { size: "Size L - Trưởng thành (7 - 10cm)", price: roundVnd(p * 1.85) },
  ];
}

function getProductSelectedSize(product) {
  if (!product) return "";
  const sizesMap = getCartSizes();
  const saved = sizesMap[String(product.id)];
  const list = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : buildDefaultSizes(product.price);
  if (saved && list.some((s) => s.size === saved)) {
    return saved;
  }
  return list[0]?.size || "";
}

// Tồn kho của MỘT kích thước (backend trả sizes[].stock). Thiếu dữ liệu thì dùng tồn kho sản phẩm.
function getSizeStock(product, sizeLabel) {
  if (!product) return null;
  const list = Array.isArray(product.sizes) ? product.sizes : [];
  const found = list.find((s) => s.size === sizeLabel) || (sizeLabel ? null : list[0]);
  if (found && typeof found.stock === "number") return found.stock;
  return typeof product.stock === "number" ? product.stock : null;
}

function getProductEffectivePrice(product, customSize = null) {
  if (!product) return 0;
  const list = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : buildDefaultSizes(product.price);
  const targetSize = customSize !== null ? customSize : getProductSelectedSize(product);
  if (targetSize) {
    const found = list.find((s) => s.size === targetSize);
    if (found && typeof found.price === "number") return found.price;
  }
  return Number(product.price || 0);
}

function setCartItemSize(productId, selectedSize) {
  const product = productsCache ? findProductById(productsCache, productId) : null;
  const canonicalId = product ? String(product.id) : String(productId);
  const sizesMap = getCartSizes();
  sizesMap[canonicalId] = selectedSize;
  saveCartSizes(sizesMap);

  const cart = getCart();
  const currentQty = Number(cart[canonicalId] || 0);
  const numericId = Number(canonicalId);
  if (currentQty > 0 && localStorage.getItem("aqualife_user") && Number.isInteger(numericId) && numericId > 0) {
    // Re-sync selected size with server by re-setting item
    apiFetch(`/cart/${numericId}`, { method: "DELETE" })
      .then(() =>
        apiFetch("/cart", {
          method: "POST",
          body: JSON.stringify({
            product_id: numericId,
            quantity: currentQty,
            selected_size: selectedSize,
          }),
        })
      )
      .catch(() => {});
  }
}

function cartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
}

function updateCartBadges() {
  const count = cartCount();
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(count);
  });
}

function normalizeImagePath(img) {
  if (!img) return "../image/ocean-bg.svg";
  if (img.startsWith("../") || img.startsWith("http") || img.startsWith("/")) {
    return img.startsWith("/image/") ? `..${img}` : img;
  }
  return `../${img}`;
}

function findProductById(products, id) {
  if (id === undefined || id === null) return null;
  const target = String(id);
  return (
    (products || []).find(
      (item) => String(item.id) === target || (item.slug && item.slug === target)
    ) || null
  );
}

const API_BASE =
  window.location.protocol.startsWith("http") && window.location.port !== "5500"
    ? `${window.location.origin}/api`
    : "http://127.0.0.1:5000/api";

async function apiFetch(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (error) {
    throw new Error("Không kết nối được máy chủ. Hãy kiểm tra backend đã chạy chưa.");
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    throw new Error((payload && payload.message) || "Có lỗi xảy ra, vui lòng thử lại.");
  }
  return payload.data;
}

async function loadProducts(forceRefresh = false) {
  if (productsCache && !forceRefresh) return productsCache;

  let jsonMetaList = [];
  try {
    const metaRes = await fetch("../json/products.json");
    if (metaRes.ok) {
      jsonMetaList = await metaRes.json();
    }
  } catch {
    jsonMetaList = [];
  }

  const metaByName = new Map();
  jsonMetaList.forEach((item) => {
    if (item && item.name) {
      metaByName.set(item.name.trim().toLowerCase(), item);
    }
  });

  try {
    const dbProducts = await apiFetch("/products");
    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      productsCache = dbProducts.map((dbItem) => {
        const meta = metaByName.get((dbItem.name || "").trim().toLowerCase()) || {};
        const species =
          meta.species ||
          CATEGORY_TO_SPECIES[dbItem.category_name] ||
          dbItem.category_name ||
          "Cá";
        const waterType =
          dbItem.water_type || dbItem.waterType || meta.waterType || "Nước ngọt";
        const desc = dbItem.description || meta.description || "";
        const shortDescription =
          meta.shortDescription ||
          (desc.length > 70 ? `${desc.slice(0, 67)}...` : desc);

        const basePrice = Number(dbItem.price || 0);
        const rawSizes =
          Array.isArray(dbItem.sizes) && dbItem.sizes.length
            ? dbItem.sizes
            : Array.isArray(meta.sizes) && meta.sizes.length
            ? meta.sizes
            : buildDefaultSizes(basePrice);

        return {
          id: String(dbItem.id),
          dbId: Number(dbItem.id),
          slug: meta.id || String(dbItem.id),
          name: dbItem.name,
          category_id: dbItem.category_id,
          category_name: dbItem.category_name,
          species,
          waterType,
          price: basePrice,
          sizes: rawSizes,
          stock: Number(dbItem.stock ?? 0),
          status: dbItem.status || "active",
          image: normalizeImagePath(dbItem.image || meta.image),
          shortDescription,
          description: desc,
        };
      });
      return productsCache;
    }
  } catch {
    // Fallback sang json tĩnh nếu chưa bật server
  }

  if (!jsonMetaList.length) {
    throw new Error("Không thể tải dữ liệu sản phẩm");
  }

  productsCache = jsonMetaList.map((item, idx) => ({
    ...item,
    id: String(item.id),
    dbId: idx + 1,
    slug: String(item.id),
    sizes:
      Array.isArray(item.sizes) && item.sizes.length
        ? item.sizes
        : buildDefaultSizes(item.price),
    stock: Number(item.stock ?? 20),
    status: "active",
    image: normalizeImagePath(item.image),
  }));
  return productsCache;
}

function addToCart(productId, quantity = 1, selectedSize = null) {
  const qty = Number(quantity || 1);
  if (!productId || Number.isNaN(qty) || qty <= 0) return false;

  const product = productsCache ? findProductById(productsCache, productId) : null;
  const canonicalId = product ? String(product.id) : String(productId);
  const cart = getCart();
  const currentQty = Number(cart[canonicalId] || 0);

  const chosenSizeForStock =
    selectedSize || (product ? getProductSelectedSize(product) : "");
  const sizeStock = getSizeStock(product, chosenSizeForStock);
  const sizeText = chosenSizeForStock ? ` (${chosenSizeForStock})` : "";
  if (product && sizeStock !== null) {
    if (sizeStock <= 0) {
      showToast(`Sản phẩm "${product.name}"${sizeText} hiện đã hết hàng.`, "error");
      return false;
    }
    if (currentQty + qty > sizeStock) {
      showToast(
        `Sản phẩm "${product.name}"${sizeText} chỉ còn ${sizeStock} sản phẩm trong kho.`,
        "error"
      );
      return false;
    }
  }

  const chosenSize =
    selectedSize || (product ? getProductSelectedSize(product) : "");
  if (chosenSize) {
    const sizesMap = getCartSizes();
    sizesMap[canonicalId] = chosenSize;
    saveCartSizes(sizesMap);
  }

  cart[canonicalId] = currentQty + qty;
  saveCart(cart);
  showToast(
    product
      ? `Đã thêm ${qty} "${product.name}"${chosenSize ? ` (${chosenSize})` : ""} vào giỏ hàng!`
      : "Đã thêm sản phẩm vào giỏ hàng!",
    "success"
  );

  const numericId = Number(canonicalId);
  if (localStorage.getItem("aqualife_user") && Number.isInteger(numericId) && numericId > 0) {
    apiFetch("/cart", {
      method: "POST",
      body: JSON.stringify({
        product_id: numericId,
        quantity: qty,
        selected_size: chosenSize,
      }),
    }).catch(() => {});
  }
  return true;
}

function updateCartItemQty(productId, newQuantity) {
  const qty = Number(newQuantity || 0);
  const product = productsCache ? findProductById(productsCache, productId) : null;
  const canonicalId = product ? String(product.id) : String(productId);
  const cart = getCart();

  if (qty <= 0) {
    delete cart[canonicalId];
    saveCart(cart);
    const numericId = Number(canonicalId);
    if (localStorage.getItem("aqualife_user") && Number.isInteger(numericId)) {
      apiFetch(`/cart/${numericId}`, { method: "DELETE" }).catch(() => {});
    }
    return true;
  }

  const curSize = product ? getProductSelectedSize(product) : "";
  const curStock = getSizeStock(product, curSize);
  if (product && curStock !== null && qty > curStock) {
    showToast(
      `Sản phẩm "${product.name}"${curSize ? ` (${curSize})` : ""} chỉ còn tối đa ${curStock} sản phẩm trong kho.`,
      "error"
    );
    return false;
  }

  cart[canonicalId] = qty;
  saveCart(cart);

  const numericId = Number(canonicalId);
  if (localStorage.getItem("aqualife_user") && Number.isInteger(numericId)) {
    apiFetch(`/cart/${numericId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: qty }),
    }).catch(() => {});
  }
  return true;
}

function removeFromCart(productId) {
  const product = productsCache ? findProductById(productsCache, productId) : null;
  const canonicalId = product ? String(product.id) : String(productId);
  const cart = getCart();
  delete cart[canonicalId];
  saveCart(cart);

  const numericId = Number(canonicalId);
  if (localStorage.getItem("aqualife_user") && Number.isInteger(numericId)) {
    apiFetch(`/cart/${numericId}`, { method: "DELETE" }).catch(() => {});
  }
}

async function clearCart() {
  saveCart({});
  saveCartSizes({});
  if (localStorage.getItem("aqualife_user")) {
    try {
      await apiFetch("/cart", { method: "DELETE" });
    } catch {
      // ignore offline
    }
  }
}

async function syncCartWithServer() {
  if (!localStorage.getItem("aqualife_user")) return getCart();
  try {
    const products = await loadProducts();
    const localCart = getCart();
    const localSizes = getCartSizes();
    const serverCart = await apiFetch("/cart");
    const serverItems = (serverCart && serverCart.items) || [];
    const serverMap = new Map(
      serverItems.map((item) => [String(item.product_id), Number(item.quantity)])
    );

    // Nếu local có món mà server chưa có (khách thêm khi chưa đăng nhập), đẩy lên server
    for (const [rawId, rawQty] of Object.entries(localCart)) {
      const qty = Number(rawQty || 0);
      if (qty <= 0) continue;
      const prod = findProductById(products, rawId);
      const pid = prod ? Number(prod.id) : Number(rawId);
      if (Number.isInteger(pid) && pid > 0 && !serverMap.has(String(pid))) {
        try {
          await apiFetch("/cart", {
            method: "POST",
            body: JSON.stringify({
              product_id: pid,
              quantity: qty,
              selected_size: localSizes[String(pid)] || localSizes[rawId] || "",
            }),
          });
        } catch {
          // Bỏ qua nếu vượt stock
        }
      }
    }

    const updatedServerCart = await apiFetch("/cart");
    const merged = {};
    const mergedSizes = { ...localSizes };
    for (const item of (updatedServerCart && updatedServerCart.items) || []) {
      merged[String(item.product_id)] = Number(item.quantity);
      if (item.selected_size) {
        mergedSizes[String(item.product_id)] = item.selected_size;
      }
    }
    saveCartSizes(mergedSizes);
    saveCart(merged);
    return merged;
  } catch {
    return getCart();
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

async function renderAuthNav() {
  const authLink = document.querySelector("a.cart-link:not(.cart-link--cart)");
  if (!authLink) return;

  let user = null;
  try {
    user = await apiFetch("/auth/me");
  } catch (error) {
    user = null;
  }

  if (!user) {
    localStorage.removeItem("aqualife_user");
    localStorage.removeItem("aqualife_user_info");
    return;
  }
  localStorage.setItem("aqualife_user", user.email);
  localStorage.setItem("aqualife_user_info", JSON.stringify(user));

  if (authLink.firstChild) {
    authLink.firstChild.textContent = "Hồ sơ ";
  }
  authLink.href = "profile.html";
  authLink.title = "Thông tin cá nhân & Đổi mật khẩu";

  const ordersLink = document.createElement("a");
  ordersLink.className = "cart-link";
  ordersLink.href = "orders.html";
  ordersLink.textContent = "Đơn hàng";

  let lastInserted = ordersLink;
  authLink.after(ordersLink);

  if (user.role === "admin") {
    const adminLink = document.createElement("a");
    adminLink.className = "cart-link cart-link--admin";
    adminLink.href = "admin.html";
    adminLink.textContent = "Quản trị";
    ordersLink.after(adminLink);
    lastInserted = adminLink;
  }

  const logoutLink = document.createElement("a");
  logoutLink.className = "cart-link";
  logoutLink.href = "#";
  logoutLink.textContent = "Đăng xuất";
  logoutLink.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (error) {
      // vẫn cho người dùng thoát về trang chủ
    }
    localStorage.removeItem("aqualife_user");
    localStorage.removeItem("aqualife_user_info");
    localStorage.removeItem(AQUALIFE_CART_KEY);
    localStorage.removeItem(AQUALIFE_CART_SIZES_KEY);
    window.location.href = "home.html";
  });

  lastInserted.after(logoutLink);

  await syncCartWithServer();
}

window.Aqualife = {
  getCart,
  saveCart,
  getCartSizes,
  setCartItemSize,
  getProductSelectedSize,
  getProductEffectivePrice,
  addToCart,
  updateCartItemQty,
  removeFromCart,
  clearCart,
  syncCartWithServer,
  loadProducts,
  formatCurrency,
  getSizeStock,
  findProductById,
  updateCartBadges,
  apiFetch,
  showToast,
};

// ==========================================================================
// AI TANK BUILDER & ECOSYSTEM ADVISOR CHATBOT (MINIMALIST)
// ==========================================================================
const LOCAL_WATER_GUIDES = {
  "Nước mặn": {
    icon: "",
    temp: "24 – 26°C",
    ph: "8.1 – 8.4",
    salinity: "1.023 – 1.025 SG (Độ mặn 32 – 35 ppt)",
    setup_tip:
      "Pha muối biển chuyên dụng với nước RO, chạy lọc váng và đèn quang phổ Xanh (Actinic) trước khi thả San hô, Ốc dọn rêu rồi mới thả Cá và Tép.",
  },
  "Nước lợ": {
    icon: "",
    temp: "24 – 28°C",
    ph: "7.5 – 8.2",
    salinity: "1.005 – 1.015 SG (Pha 8 – 15g muối biển/lít)",
    setup_tip:
      "Dùng nền cát san hô vụn hoặc sỏi suối để giữ pH ổn định, bố trí lũa rừng ngập mặn và cây chịu lợ (Dương xỉ, Tiêu thảo) tạo lãnh thổ cho cá.",
  },
  "Nước ngọt": {
    icon: "",
    temp: "23 – 28°C",
    ph: "6.5 – 7.5",
    salinity: "0 ppt (Nước ngọt hoàn toàn, đã khử Clo)",
    setup_tip:
      "Chạy lọc vi sinh tối thiểu 24–48h, trồng cây thủy sinh rồi thả đội vệ sinh (Ốc cảnh, Tép cảnh) trước khi thả đàn cá chính để bể luôn trong vắt.",
  },
};

const LOCAL_ROLE_LABELS = {
  Cá: "Cá cảnh chủ đạo (Tâm điểm của bể)",
  "Thủy Sinh / San hô": "Nền sinh thái (San hô / Cây thủy sinh tạo cảnh & trú ẩn)",
  Ốc: "Đội dọn rêu hại (Làm sạch thành kính & đá lũa)",
  Tép: "Đội vệ sinh tầng đáy (Dọn thức ăn thừa & rêu tơ)",
};

function parseVietnameseBudgetClient(text) {
  const lower = String(text || "")
    .toLowerCase()
    .replace(/,/g, ".");
  const mTrCombo = lower.match(/(\d+)\s*(?:tr|triệu|củ)\s*(\d+)/);
  if (mTrCombo) {
    const m = parseInt(mTrCombo[1], 10);
    const d = parseInt(mTrCombo[2], 10);
    return m * 1000000 + d * (d < 10 ? 100000 : 10000);
  }
  const mTr = lower.match(/(\d+(?:\.\d+)?)\s*(?:tr|triệu|trieu|củ|cu)\b/);
  if (mTr) return Math.round(parseFloat(mTr[1]) * 1000000);
  const mK = lower.match(/(\d+(?:\.\d+)?)\s*(?:k|nghìn|nghin|ngàn|ngan|cành|canh)\b/);
  if (mK) return Math.round(parseFloat(mK[1]) * 1000);
  const cleaned = lower.replace(/\.(\d{3})\b/g, "$1");
  const mNum = cleaned.match(/\b(\d{5,8})\b/);
  if (mNum) return parseInt(mNum[1], 10);
  return 500000;
}

function parseWaterTypeClient(text) {
  const lower = String(text || "").toLowerCase();
  if (/nước mặn|nuoc man|cá biển|ca bien|san hô|san ho|hải quỳ|nemo|đại dương|mặn/.test(lower)) {
    return "Nước mặn";
  }
  if (/nước lợ|nuoc lo|ngập mặn|cá nóc|bắn tỉa|bống rồng|bống hiệp sĩ|ong mật|lợ/.test(lower)) {
    return "Nước lợ";
  }
  return "Nước ngọt";
}

async function buildComboFallbackClient(message, variantIndex = 0) {
  const budget = parseVietnameseBudgetClient(message);
  const waterType = parseWaterTypeClient(message);
  const products = await loadProducts();
  const envProds = products.filter(
    (p) => (p.waterType || p.water_type || "Nước ngọt") === waterType && Number(p.stock ?? 10) > 0
  );

  const bySpecies = { Cá: [], "Thủy Sinh / San hô": [], Ốc: [], Tép: [] };
  envProds.forEach((p) => {
    const sp = p.species || "Cá";
    if (!bySpecies[sp]) bySpecies[sp] = [];
    bySpecies[sp].push(p);
  });

  const minPriceOf = (p) => {
    const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : buildDefaultSizes(p.price);
    return Math.min(...sizes.map((s) => Number(s.price || p.price)));
  };

  Object.keys(bySpecies).forEach((k) => {
    bySpecies[k].sort((a, b) => minPriceOf(a) - minPriceOf(b));
  });

  let remaining = budget;
  const comboItems = [];

  const pickTier = (prod, cap) => {
    const sizes = Array.isArray(prod.sizes) && prod.sizes.length ? prod.sizes : buildDefaultSizes(prod.price);
    const sorted = [...sizes].sort((a, b) => a.price - b.price);
    let chosen = sorted[0];
    for (const s of sorted) {
      if (s.price <= cap) chosen = s;
    }
    return chosen;
  };

  const addOrInc = (prod, sizeObj, qty, roleKey) => {
    const cost = sizeObj.price * qty;
    if (cost > remaining || qty <= 0) return false;
    const exist = comboItems.find((i) => String(i.id) === String(prod.id) && i.selected_size === sizeObj.size);
    if (exist) {
      exist.quantity += qty;
      exist.subtotal = exist.quantity * exist.unit_price;
      remaining -= cost;
      return true;
    }
    comboItems.push({
      id: prod.id,
      slug: prod.slug || String(prod.id),
      name: prod.name,
      image: prod.image || "image/ocean-bg.svg",
      species: prod.species || roleKey,
      role_label: LOCAL_ROLE_LABELS[roleKey] || roleKey,
      water_type: waterType,
      selected_size: sizeObj.size,
      unit_price: sizeObj.price,
      quantity: qty,
      subtotal: cost,
    });
    remaining -= cost;
    return true;
  };

  const roles = [
    ["Cá", 0.48],
    ["Thủy Sinh / San hô", 0.32],
    ["Ốc", 0.12],
    ["Tép", 0.12],
  ];

  roles.forEach(([rk, share], idx) => {
    const list = bySpecies[rk] || [];
    const affordable = list.filter((p) => minPriceOf(p) <= remaining);
    if (!affordable.length) return;
    const cap = Math.max(remaining * 0.65, budget * share);
    const prefer = affordable.filter((p) => minPriceOf(p) <= cap);
    const pool = prefer.length ? prefer : affordable;
    const chosen = pool[(variantIndex + idx) % pool.length];
    const tier = pickTier(chosen, Math.min(cap, remaining));
    if (tier.price <= remaining) {
      const qty = (rk === "Cá" || rk === "Tép") && tier.price * 2 <= Math.min(cap, remaining) && tier.price <= budget * 0.2 ? 2 : 1;
      addOrInc(chosen, tier, qty, rk);
    }
  });

  for (let r = 0; r < 4; r++) {
    if (remaining < 10000) break;
    let added = false;
    for (const rk of ["Cá", "Thủy Sinh / San hô", "Ốc", "Tép"]) {
      const affordable = (bySpecies[rk] || []).filter((p) => minPriceOf(p) <= remaining);
      if (!affordable.length) continue;
      const pick = affordable[(variantIndex + r + comboItems.length) % affordable.length];
      const tier = pickTier(pick, remaining * 0.6);
      if (tier.price <= remaining && addOrInc(pick, tier, 1, rk)) {
        added = true;
        if (remaining < budget * 0.08) break;
      }
    }
    if (!added) break;
  }

  const totalCost = comboItems.reduce((s, i) => s + i.subtotal, 0);
  const guide = LOCAL_WATER_GUIDES[waterType] || LOCAL_WATER_GUIDES["Nước ngọt"];
  return {
    query: message,
    budget,
    water_type: waterType,
    variant_index: variantIndex,
    total_cost: totalCost,
    remaining_budget: remaining,
    total_creatures: comboItems.reduce((s, i) => s + i.quantity, 0),
    guide,
    items: comboItems,
  };
}

function initAiTankAdvisor() {
  if (window.location.pathname.includes("admin.html")) return;

  // Tạo nút nổi tối giản góc phải dưới
  if (!document.getElementById("aqualife-ai-fab")) {
    const fab = document.createElement("button");
    fab.type = "button";
    fab.id = "aqualife-ai-fab";
    fab.className = "aqualife-ai-fab";
    fab.setAttribute("data-open-advisor", "true");
    fab.textContent = "Tư vấn Build Bể";
    document.body.appendChild(fab);
  }

  // Tạo Modal Chatbot Tư vấn Build Bể tối giản (không icon)
  if (!document.getElementById("aqualife-advisor-modal")) {
    const backdrop = document.createElement("div");
    backdrop.id = "aqualife-advisor-modal";
    backdrop.className = "aq-advisor-backdrop hidden";
    backdrop.innerHTML = `
      <div class="aq-advisor-window" role="dialog" aria-label="Tư vấn Build Bể Aqualife">
        <div class="aq-advisor-header">
          <div>
            <h3 class="aq-advisor-title">Trợ lý Tư vấn Build Bể</h3>
            <p class="aq-advisor-subtitle">Nhập ngân sách và môi trường nước (VD: 500k nước mặn build bể như thế nào)</p>
          </div>
          <button type="button" class="aq-advisor-close" id="aq-advisor-close-btn" title="Đóng">Đóng</button>
        </div>

        <div class="aq-advisor-quickbar">
          <span style="font-size:12px;font-weight:700;color:#475569;">Gợi ý:</span>
          <button type="button" class="aq-advisor-chip" data-prompt="500k nước mặn nên build bể cá như thế nào (gồm cá, ốc, tép, san hô)?">
            500k Nước mặn
          </button>
          <button type="button" class="aq-advisor-chip" data-prompt="300k nước ngọt nên build bể thủy sinh gồm những gì?">
            300k Nước ngọt
          </button>
          <button type="button" class="aq-advisor-chip" data-prompt="400k nước lợ build bể cá gồm những gì?">
            400k Nước lợ
          </button>
          <button type="button" class="aq-advisor-chip" data-prompt="1 triệu nước mặn build bể cá biển và san hô cao cấp">
            1 Triệu Nước mặn
          </button>
        </div>

        <div class="aq-advisor-messages" id="aq-advisor-messages">
          <div class="aq-chat-msg aq-chat-msg--bot">
            <div class="aq-chat-bubble">
              Xin chào! Bạn hãy nhập <strong>ngân sách</strong> (VD: 300k, 500k, 1 triệu) và <strong>môi trường nước</strong> (Nước mặn, Nước ngọt, Nước lợ). Hệ thống sẽ gợi ý cấu hình bể phù hợp gồm Cá cảnh chủ đạo, San hô / Cây thủy sinh, Ốc dọn rêu và Tép vệ sinh.
            </div>
          </div>
        </div>

        <form class="aq-advisor-footer" id="aq-advisor-form">
          <input
            type="text"
            id="aq-advisor-input"
            class="aq-advisor-input"
            placeholder="Nhập yêu cầu... VD: 500k nước mặn nên build bể cá như thế nào?"
            autocomplete="off"
          />
          <button type="submit" class="aq-advisor-send">Gửi</button>
        </form>
      </div>
    `;
    document.body.appendChild(backdrop);
  }

  const modal = document.getElementById("aqualife-advisor-modal");
  const messagesBox = document.getElementById("aq-advisor-messages");
  const form = document.getElementById("aq-advisor-form");
  const input = document.getElementById("aq-advisor-input");

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-open-advisor]");
    if (trigger) {
      e.preventDefault();
      modal?.classList.remove("hidden");
      setTimeout(() => input?.focus(), 100);
    }
  });

  document.getElementById("aq-advisor-close-btn")?.addEventListener("click", () => {
    modal?.classList.add("hidden");
  });
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  async function askAdvisor(promptText, variantIdx = 0) {
    if (!promptText || !messagesBox) return;

    if (variantIdx === 0) {
      const userMsg = document.createElement("div");
      userMsg.className = "aq-chat-msg aq-chat-msg--user";
      userMsg.innerHTML = `<div class="aq-chat-bubble">${promptText.replace(/</g, "&lt;")}</div>`;
      messagesBox.appendChild(userMsg);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }

    let data = null;
    try {
      data = await apiFetch("/advisor/chat", {
        method: "POST",
        body: JSON.stringify({ message: promptText, variant_index: variantIdx }),
      });
    } catch {
      data = await buildComboFallbackClient(promptText, variantIdx);
    }

    if (!data || !Array.isArray(data.items)) return;

    const guide = data.guide || LOCAL_WATER_GUIDES[data.water_type] || LOCAL_WATER_GUIDES["Nước ngọt"];
    const botMsg = document.createElement("div");
    botMsg.className = "aq-chat-msg aq-chat-msg--bot";

    const itemsHtml = data.items
      .map(
        (item, idx) => `
        <div class="aq-combo-item">
          <img src="${normalizeImagePath(item.image)}" alt="${item.name}" />
          <div>
            <div class="aq-combo-role">${item.role_label}</div>
            <div class="aq-combo-name">
              <a href="product-detail.html?id=${encodeURIComponent(item.id)}" style="color:inherit;text-decoration:underline;">
                ${item.name}
              </a>
            </div>
            <div class="aq-combo-meta">
              Kích thước: <strong>${item.selected_size}</strong> | Số lượng: <strong>${item.quantity}</strong> × ${formatCurrency(item.unit_price)}
            </div>
          </div>
          <div class="aq-combo-right">
            <span class="aq-combo-subtotal">${formatCurrency(item.subtotal)}</span>
            <button type="button" class="aq-combo-single-btn" data-combo-idx="${idx}">
              Thêm món này
            </button>
          </div>
        </div>
      `
      )
      .join("");

    botMsg.innerHTML = `
      <div class="aq-chat-bubble">
        <div>
          Với ngân sách <strong>${formatCurrency(data.budget)}</strong> cho môi trường <strong>${data.water_type}</strong>
          ${variantIdx > 0 ? `(Phương án ${variantIdx + 1})` : ""}, gợi ý cấu hình bể gồm
          <strong>${data.items.length} loài (${data.total_creatures} cá thể)</strong>:
        </div>

        <div class="aq-combo-guide">
          <div><strong>Thông số ${data.water_type}:</strong> Nhiệt độ ${guide.temp} | pH ${guide.ph} | Độ mặn ${guide.salinity}</div>
          <div style="margin-top:4px;"><strong>Hướng dẫn setup:</strong> ${guide.setup_tip}</div>
        </div>

        <div class="aq-combo-list">
          ${itemsHtml}
        </div>

        <div class="aq-combo-summary-bar">
          <div>
            <span style="font-size:13px;color:#475569;">Tổng chi phí:</span>
            <strong style="font-size:16px;color:#0b6aa2;margin-left:6px;">${formatCurrency(data.total_cost)}</strong>
          </div>
          <div style="font-size:12.5px;color:#475569;">
            Còn dư: <strong>${formatCurrency(data.remaining_budget)}</strong>
          </div>
        </div>

        <div class="aq-combo-actions">
          <button type="button" class="aq-btn-add-all">
            Thêm toàn bộ vào giỏ hàng
          </button>
          <button type="button" class="aq-btn-alt-combo">
            Gợi ý phương án khác
          </button>
        </div>
      </div>
    `;

    botMsg.querySelectorAll(".aq-combo-single-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = data.items[Number(btn.dataset.comboIdx)];
        if (!item) return;
        addToCart(item.id, item.quantity, item.selected_size);
        showToast(`Đã thêm ${item.quantity}x ${item.name} (${item.selected_size}) vào giỏ hàng!`, "success");
      });
    });

    botMsg.querySelector(".aq-btn-add-all")?.addEventListener("click", () => {
      data.items.forEach((item) => {
        addToCart(item.id, item.quantity, item.selected_size);
      });
      showToast(
        `Đã thêm trọn bộ Combo ${data.water_type} (${data.total_creatures} cá thể) vào giỏ hàng!`,
        "success"
      );
    });

    botMsg.querySelector(".aq-btn-alt-combo")?.addEventListener("click", () => {
      askAdvisor(promptText, variantIdx + 1);
    });

    messagesBox.appendChild(botMsg);
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  modal?.querySelectorAll(".aq-advisor-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt") || "";
      askAdvisor(prompt, 0);
    });
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = input?.value.trim() || "";
    if (!val) return;
    input.value = "";
    askAdvisor(val, 0);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadges();
  renderAuthNav();
  initAiTankAdvisor();

  // Hiệu ứng giọt nước khi click
  document.addEventListener("click", (e) => {
    for (let i = 0; i < 5; i++) {
      createDroplet(e.clientX, e.clientY);
    }
  });
});

function createDroplet(x, y) {
  const drop = document.createElement("div");
  drop.className = "water-drop";
  const size = 12 + Math.round(Math.random() * 10);
  const offsetX = Math.random() * 20 - 10;
  const offsetY = Math.random() * 20 - 10;
  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;
  drop.style.left = `${x - size / 2 + offsetX}px`;
  drop.style.top = `${y - size / 2 + offsetY}px`;
  drop.style.setProperty("--tx", `${offsetX}px`);
  drop.style.setProperty("--ty", `${offsetY}px`);
  drop.style.setProperty("--r", `${Math.random() * 360}deg`);
  document.body.appendChild(drop);
  setTimeout(() => drop.remove(), 900);
}


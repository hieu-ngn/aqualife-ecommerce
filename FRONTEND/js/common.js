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
  if (Number.isInteger(numericId) && numericId > 0) {
    const endpoint = localStorage.getItem("aqualife_user") ? "/cart" : "/cart/session";
    apiFetch(endpoint, {
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
  const qty = Number(newQuantity);
  if (Number.isNaN(qty) || qty < 0) {
    showToast("Số lượng nhập vào không hợp lệ.", "error");
    return false;
  }

  const product = productsCache ? findProductById(productsCache, productId) : null;
  const canonicalId = product ? String(product.id) : String(productId);
  const cart = getCart();
  const numericId = Number(canonicalId);
  const isLoggedIn = Boolean(localStorage.getItem("aqualife_user"));

  // Người dùng nhập số 0 được hiểu là xóa dòng sản phẩm đó khỏi giỏ hàng
  if (qty <= 0) {
    delete cart[canonicalId];
    saveCart(cart);
    showToast(
      product
        ? `Đã xóa "${product.name}" khỏi giỏ hàng (nhập số lượng = 0).`
        : "Đã xóa sản phẩm khỏi giỏ hàng.",
      "success"
    );
    if (Number.isInteger(numericId) && numericId > 0) {
      const endpoint = isLoggedIn ? `/cart/${numericId}` : `/cart/session/${numericId}`;
      apiFetch(endpoint, {
        method: "PUT",
        body: JSON.stringify({ quantity: 0 }),
      }).catch(() => {});
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

  if (Number.isInteger(numericId) && numericId > 0) {
    const endpoint = isLoggedIn ? `/cart/${numericId}` : `/cart/session/${numericId}`;
    apiFetch(endpoint, {
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
  if (Number.isInteger(numericId) && numericId > 0) {
    const endpoint = localStorage.getItem("aqualife_user")
      ? `/cart/${numericId}`
      : `/cart/session/${numericId}`;
    apiFetch(endpoint, { method: "DELETE" }).catch(() => {});
  }
}

async function clearCart() {
  saveCart({});
  saveCartSizes({});
  const endpoint = localStorage.getItem("aqualife_user") ? "/cart" : "/cart/session";
  try {
    await apiFetch(endpoint, { method: "DELETE" });
  } catch {
    // ignore offline
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

const OFF_TOPIC_CLIENT_KEYWORDS = [
  "thời tiết", "thoi tiet", "mưa", "nắng", "bóng đá", "bong da", "world cup", "ngoại hạng",
  "chứng khoán", "chung khoan", "bitcoin", "crypto", "bất động sản",
  "điện thoại", "dien thoai", "iphone", "samsung", "xiaomi", "oppo", "laptop", "macbook",
  "máy tính", "may tinh", "quần áo", "quan ao", "giày dép", "túi xách",
  "mỹ phẩm", "son môi", "nước hoa", "xe máy", "ô tô", "xe hơi", "honda", "yamaha",
  "nấu ăn", "nau an", "cơm rang", "phở bò", "bún chả", "trà sữa", "cà phê", "lẩu",
  "xem phim", "ca nhạc", "ca sĩ", "diễn viên", "bài hát", "game", "liên quân", "lmht", "pubg",
  "lập trình", "lap trinh", "code python", "javascript", "java", "c++", "html", "css",
  "giải toán", "phương trình", "đạo hàm", "tích phân", "vật lý", "hóa học", "lịch sử", "địa lý",
  "tổng thống", "chính trị", "chiến tranh", "người yêu", "tán gái", "bói toán", "tử vi", "xổ số"
];

const AQUARIUM_CLIENT_KEYWORDS = [
  "cá", "tép", "tôm", "ốc", "san hô", "hải quỳ", "thủy sinh", "rong", "rêu", "tảo",
  "dương xỉ", "tiêu thảo", "bể", "hồ", "nước mặn", "nước ngọt", "nước lợ", "cá biển",
  "mặn", "ngọt", "lợ", "nemo", "thia", "hoàng đế", "bướm", "trạng nguyên", "betta",
  "guppy", "bảy màu", "oranda", "đầu lân", "piranha", "cá chuột", "longfin", "mahseer",
  "mương hoa", "chạch", "botia", "thần tiên", "kim sơn", "bống", "mập", "nerita",
  "nerite", "turbo", "trochus", "ramshorn", "ốc táo", "mặt trăng", "amano", "su la",
  "sula", "rili", "fire red", "blue dream", "socola", "ong đỏ", "vàng thái", "vàng đài",
  "peppermint", "bác sĩ", "blood red", "coral banded", "tép ma", "xenia", "toadstool",
  "zoanthid", "hammer", "torch", "lọc", "sủi", "oxy", "đèn", "sưởi", "vi sinh",
  "độ mặn", "nhiệt độ", "thay nước", "nuôi", "thả", "ghép", "cắn", "thức ăn", "cám",
  "size", "combo", "build", "setup", "set up", "aqualife"
];

function stripVietnameseAccents(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function classifyDomainClient(message) {
  const lower = String(message || "").toLowerCase().trim();
  if (!lower) return "greeting";
  if (/^(?:xin chào|chào|chào shop|chào bạn|hello|hi|hey|alo|shop ơi|ad ơi|tư vấn|tư vấn giúp)[!.,?\s]*$/.test(lower)) {
    return "greeting";
  }
  for (const bad of OFF_TOPIC_CLIENT_KEYWORDS) {
    if (lower.includes(bad)) return "off_topic";
  }
  for (const kw of AQUARIUM_CLIENT_KEYWORDS) {
    if (lower.includes(kw)) return "aquarium";
  }
  const ascii = stripVietnameseAccents(lower);
  if (/\b(ca|tep|tom|oc|san ho|hai quy|thuy sinh|be|ho ca|nuoc man|nuoc ngot|nuoc lo|ca bien|setup|build|combo|nemo|betta|guppy|piranha|mahseer|botia|nerita|turbo|trochus|amano|xenia|zoanthid|hammer|torch|ph)\b/.test(ascii)) {
    return "aquarium";
  }
  return "off_topic";
}

function parseVietnameseBudgetClient(text) {
  const lower = String(text || "")
    .toLowerCase()
    .replace(/,/g, ".");
  const mTrCombo = lower.match(/(\d+)\s*(?:tr|triệu|trieu|củ|cu)\s*(\d+)/);
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
  const mShort = lower.match(/\b([2-9]\d|[1-9]\d{2,3})\b(?!\s*(?:cm|mm|lít|lit|l\b|con|cá thể|°|độ|%))/);
  if (mShort) {
    const val = parseInt(mShort[1], 10);
    if (val >= 15 && val <= 9999) return val * 1000;
  }
  return 500000;
}

function parseWaterTypeClient(text) {
  const lower = String(text || "").toLowerCase();
  const ascii = stripVietnameseAccents(lower);
  if (/nước mặn|nuoc man|cá biển|ca bien|san hô|san ho|hải quỳ|nemo|đại dương|hoàng đế|cá bướm|trạng nguyên|thia xanh|mặn/.test(lower) || /nuoc man|ca bien|san ho/.test(ascii)) {
    return "Nước mặn";
  }
  if (/nước lợ|nuoc lo|ngập mặn|cá nóc|bắn tỉa|bống rồng|bống hiệp sĩ|ong mật|lợ/.test(lower) || /nuoc lo/.test(ascii)) {
    return "Nước lợ";
  }
  return "Nước ngọt";
}

function detectRequestedSpeciesClient(text) {
  const lower = String(text || "").toLowerCase();
  const ascii = stripVietnameseAccents(lower);
  if (/build bể|build hồ|setup bể|set up bể|combo bể|trọn bộ|cấu hình bể|gồm những gì|build be|setup be|combo be/.test(lower + " " + ascii)) {
    return null;
  }
  const groups = new Set();
  const cleanedCa = lower.replace(/\b(?:bể|hồ)\s+cá\b/g, "");
  const cleanedCaAscii = ascii.replace(/\b(?:be|ho)\s+ca\b/g, "");
  if (/\bcá\b/.test(cleanedCa) || /\bca\b/.test(cleanedCaAscii)) groups.add("Cá");
  if (/\b(?:tép|tôm)\b/.test(lower) || /\b(?:tep|tom)\b/.test(ascii)) groups.add("Tép");
  if (/\bốc\b/.test(lower) || /\boc\b/.test(ascii)) groups.add("Ốc");
  if (/san hô|cây thủy sinh|rong|dương xỉ|tiêu thảo|san ho/.test(lower + " " + ascii)) groups.add("Thủy Sinh / San hô");
  if (groups.size === 1) return Array.from(groups)[0];
  return null;
}

async function buildComboFallbackClient(message, variantIndex = 0) {
  const domain = classifyDomainClient(message);
  if (domain === "off_topic") {
    return {
      mode: "off_topic",
      query: message,
      reply_html:
        'Xin lỗi, <strong>Chatbox không hỗ trợ</strong> câu hỏi ngoài lĩnh vực bể cá và thủy sinh.<br><br>Trợ lý Aqualife chỉ tư vấn chọn <strong>cá cảnh, tép, ốc, san hô</strong>, thông số môi trường nước (Nước mặn, Nước ngọt, Nước lợ) và thiết lập bể theo ngân sách. Bạn có thể hỏi ví dụ: <em>"Cá 500 nước mặn có thể chọn cá nào?"</em> hoặc <em>"500k nước mặn build bể thế nào?"</em> nhé!',
      items: [],
    };
  }
  if (domain === "greeting") {
    return {
      mode: "greeting",
      query: message,
      reply_html:
        'Xin chào bạn đến với <strong>Trợ lý Tư vấn Bể cá Aqualife</strong>! 🐠<br>Mình có thể giúp bạn:<br>• <strong>Chọn cá / tép / ốc / san hô theo tầm tiền:</strong> VD: <em>"Cá 500 nước mặn có thể chọn cá nào?"</em><br>• <strong>Build trọn bộ hệ sinh thái bể:</strong> VD: <em>"500k nước mặn nên build bể như thế nào?"</em><br>• <strong>Tra cứu giá & tập tính từng loài:</strong> VD: <em>"Cá Nemo giá bao nhiêu?"</em>',
      items: [],
    };
  }

  const budget = parseVietnameseBudgetClient(message);
  const waterType = parseWaterTypeClient(message);
  const targetSpecies = detectRequestedSpeciesClient(message);
  const products = await loadProducts();
  const guide = LOCAL_WATER_GUIDES[waterType] || LOCAL_WATER_GUIDES["Nước ngọt"];

  const minPriceOf = (p) => {
    const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : buildDefaultSizes(p.price);
    return Math.min(...sizes.map((s) => Number(s.price || p.price)));
  };

  if (targetSpecies) {
    const envSpeciesProds = products
      .filter(
        (p) =>
          (p.waterType || p.water_type || "Nước ngọt") === waterType &&
          (p.species || "Cá") === targetSpecies &&
          Number(p.stock ?? 10) > 0
      )
      .sort((a, b) => minPriceOf(a) - minPriceOf(b));

    const affordable = envSpeciesProds.filter((p) => minPriceOf(p) <= budget);
    const catalogOptions = affordable.map((p) => {
      const sizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : buildDefaultSizes(p.price);
      const validSizes = sizes.filter((s) => Number(s.price || p.price) <= budget);
      const bestSize = validSizes[0] || sizes[0];
      const unitP = Number(bestSize.price || p.price);
      const maxQty = Math.max(1, Math.floor(budget / unitP));
      return {
        id: p.id,
        slug: p.slug || String(p.id),
        name: p.name,
        image: p.image || "image/ocean-bg.svg",
        species: targetSpecies,
        role_label: `Lựa chọn ${targetSpecies} ${waterType} (≤ ${formatCurrency(budget)})`,
        water_type: waterType,
        selected_size: bestSize.size,
        unit_price: unitP,
        quantity: 1,
        subtotal: unitP,
        max_qty_in_budget: maxQty,
      };
    });

    const bulletLines = catalogOptions.map(
      (opt) =>
        `• <strong>${opt.name}</strong> — Giá từ <strong>${formatCurrency(opt.unit_price)}</strong> (Với ${formatCurrency(budget)} mua được tối đa <strong>${opt.max_qty_in_budget} cá thể</strong>)`
    );
    const totalCost = catalogOptions.reduce((s, i) => s + i.subtotal, 0);
    return {
      mode: "species_select",
      query: message,
      budget,
      water_type: waterType,
      target_species: targetSpecies,
      variant_index: variantIndex,
      total_cost: totalCost,
      remaining_budget: Math.max(0, budget - totalCost),
      total_creatures: catalogOptions.length,
      guide,
      reply_html: `Với ngân sách <strong>${formatCurrency(budget)}</strong> cho môi trường <strong>${waterType}</strong>, bạn có thể chọn <strong>${catalogOptions.length} dòng ${targetSpecies}</strong> sau:<br><div style="margin:8px 0;line-height:1.6;">${bulletLines.join("<br>")}</div>`,
      items: catalogOptions,
    };
  }

  const envProds = products.filter(
    (p) => (p.waterType || p.water_type || "Nước ngọt") === waterType && Number(p.stock ?? 10) > 0
  );

  const bySpecies = { Cá: [], "Thủy Sinh / San hô": [], Ốc: [], Tép: [] };
  envProds.forEach((p) => {
    const sp = p.species || "Cá";
    if (!bySpecies[sp]) bySpecies[sp] = [];
    bySpecies[sp].push(p);
  });

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
  return {
    mode: "tank_combo",
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

  // Tạo Modal Chatbot Tư vấn Build Bể & Chọn Cá thông minh
  if (!document.getElementById("aqualife-advisor-modal")) {
    const backdrop = document.createElement("div");
    backdrop.id = "aqualife-advisor-modal";
    backdrop.className = "aq-advisor-backdrop hidden";
    backdrop.innerHTML = `
      <div class="aq-advisor-window" role="dialog" aria-label="Tư vấn Build Bể Aqualife">
        <div class="aq-advisor-header">
          <div>
            <h3 class="aq-advisor-title">Trợ lý Tư vấn Bể Cá & Sinh Vật Aqualife</h3>
            <p class="aq-advisor-subtitle">Hỏi chọn cá theo tầm tiền (VD: cá 500 nước mặn chọn cá nào?) hoặc tư vấn build trọn bộ bể</p>
          </div>
          <button type="button" class="aq-advisor-close" id="aq-advisor-close-btn" title="Đóng">Đóng</button>
        </div>

        <div class="aq-advisor-quickbar">
          <span style="font-size:12px;font-weight:700;color:#475569;">Gợi ý:</span>
          <button type="button" class="aq-advisor-chip" data-prompt="Cá 500 nước mặn có thể chọn cá nào?">
            Cá 500k Nước mặn chọn cá nào?
          </button>
          <button type="button" class="aq-advisor-chip" data-prompt="500k nước mặn nên build bể cá như thế nào (gồm cá, ốc, tép, san hô)?">
            Build bể 500k Nước mặn
          </button>
          <button type="button" class="aq-advisor-chip" data-prompt="300k nước ngọt nên build bể thủy sinh gồm những gì?">
            Build bể 300k Nước ngọt
          </button>
          <button type="button" class="aq-advisor-chip" data-prompt="400k nước lợ build bể cá gồm những gì?">
            Build bể 400k Nước lợ
          </button>
        </div>

        <div class="aq-advisor-messages" id="aq-advisor-messages">
          <div class="aq-chat-msg aq-chat-msg--bot">
            <div class="aq-chat-bubble">
              Xin chào! Bạn có thể hỏi chọn <strong>loài cá / tép / ốc / san hô theo tầm giá</strong> (VD: <em>"Cá 500 nước mặn có thể chọn cá nào?"</em>), hỏi <strong>build trọn bộ bể</strong> theo ngân sách, hoặc hỏi <strong>thông tin nuôi ghép từng loài</strong>.<br>
              <span style="font-size:12px;color:#64748b;">(Lưu ý: Chatbox chỉ hỗ trợ các chủ đề liên quan đến bể cá và thủy sinh tại Aqualife).</span>
            </div>
          </div>
        </div>

        <form class="aq-advisor-footer" id="aq-advisor-form">
          <input
            type="text"
            id="aq-advisor-input"
            class="aq-advisor-input"
            placeholder="VD: Cá 500 nước mặn có thể chọn cá nào? hoặc 500k nước ngọt build bể..."
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

    if (!data) return;

    const botMsg = document.createElement("div");
    botMsg.className = "aq-chat-msg aq-chat-msg--bot";

    // Nếu câu hỏi ngoài lĩnh vực bể cá (off_topic) hoặc chào hỏi (greeting) không có danh sách sản phẩm
    if (data.mode === "off_topic" || data.mode === "greeting" || !Array.isArray(data.items) || data.items.length === 0) {
      botMsg.innerHTML = `
        <div class="aq-chat-bubble" style="${
          data.mode === "off_topic" ? "border-left: 4px solid #ef4444; background: #fff5f5;" : ""
        }">
          ${data.reply_html || data.summary_text || "Xin lỗi, Chatbox không hỗ trợ câu hỏi ngoài lĩnh vực bể cá."}
        </div>
      `;
      messagesBox.appendChild(botMsg);
      messagesBox.scrollTop = messagesBox.scrollHeight;
      return;
    }

    const guide = data.guide || LOCAL_WATER_GUIDES[data.water_type] || LOCAL_WATER_GUIDES["Nước ngọt"];

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
              ${
                item.max_qty_in_budget
                  ? `<br><span style="color:#0284c7;font-weight:600;">→ Mua lẻ được tối đa ${item.max_qty_in_budget} cá thể trong tầm ${formatCurrency(data.budget)}</span>`
                  : ""
              }
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

    const headerHtml = data.reply_html
      ? `<div>${data.reply_html}</div>`
      : `<div>
          Với ngân sách <strong>${formatCurrency(data.budget)}</strong> cho môi trường <strong>${data.water_type}</strong>
          ${variantIdx > 0 ? `(Phương án ${variantIdx + 1})` : ""}, gợi ý cấu hình bể gồm
          <strong>${data.items.length} loài (${data.total_creatures} cá thể)</strong>:
        </div>`;

    botMsg.innerHTML = `
      <div class="aq-chat-bubble">
        ${headerHtml}

        <div class="aq-combo-guide">
          <div><strong>Thông số ${data.water_type}:</strong> Nhiệt độ ${guide.temp} | pH ${guide.ph} | Độ mặn ${guide.salinity}</div>
          <div style="margin-top:4px;"><strong>Hướng dẫn setup:</strong> ${guide.setup_tip}</div>
        </div>

        <div class="aq-combo-list">
          ${itemsHtml}
        </div>

        <div class="aq-combo-summary-bar">
          <div>
            <span style="font-size:13px;color:#475569;">Tổng chi phí danh sách trên:</span>
            <strong style="font-size:16px;color:#0b6aa2;margin-left:6px;">${formatCurrency(data.total_cost)}</strong>
          </div>
          ${
            data.mode === "tank_combo" || variantIdx > 0
              ? `<div style="font-size:12.5px;color:#475569;">
                   Còn dư: <strong>${formatCurrency(data.remaining_budget)}</strong>
                 </div>`
              : ""
          }
        </div>

        <div class="aq-combo-actions">
          <button type="button" class="aq-btn-add-all">
            Thêm toàn bộ vào giỏ hàng
          </button>
          <button type="button" class="aq-btn-alt-combo">
            Gợi ý phương án phối khác
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
        `Đã thêm ${data.items.length} dòng sinh vật (${data.water_type}) vào giỏ hàng!`,
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


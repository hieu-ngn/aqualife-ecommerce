const AQUALIFE_CART_KEY = "aqualife_cart_v1";
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

        return {
          id: String(dbItem.id),
          dbId: Number(dbItem.id),
          slug: meta.id || String(dbItem.id),
          name: dbItem.name,
          category_id: dbItem.category_id,
          category_name: dbItem.category_name,
          species,
          waterType,
          price: Number(dbItem.price || 0),
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
    stock: Number(item.stock ?? 20),
    status: "active",
    image: normalizeImagePath(item.image),
  }));
  return productsCache;
}

function addToCart(productId, quantity = 1) {
  const qty = Number(quantity || 1);
  if (!productId || Number.isNaN(qty) || qty <= 0) return false;

  const product = productsCache ? findProductById(productsCache, productId) : null;
  const canonicalId = product ? String(product.id) : String(productId);
  const cart = getCart();
  const currentQty = Number(cart[canonicalId] || 0);

  if (product && typeof product.stock === "number") {
    if (product.stock <= 0) {
      showToast(`Sản phẩm "${product.name}" hiện đã hết hàng.`, "error");
      return false;
    }
    if (currentQty + qty > product.stock) {
      showToast(
        `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm trong kho.`,
        "error"
      );
      return false;
    }
  }

  cart[canonicalId] = currentQty + qty;
  saveCart(cart);
  showToast(
    product
      ? `Đã thêm ${qty} "${product.name}" vào giỏ hàng!`
      : "Đã thêm sản phẩm vào giỏ hàng!",
    "success"
  );

  const numericId = Number(canonicalId);
  if (localStorage.getItem("aqualife_user") && Number.isInteger(numericId) && numericId > 0) {
    apiFetch("/cart", {
      method: "POST",
      body: JSON.stringify({ product_id: numericId, quantity: qty }),
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

  if (product && typeof product.stock === "number" && qty > product.stock) {
    showToast(
      `Sản phẩm "${product.name}" chỉ còn tối đa ${product.stock} sản phẩm trong kho.`,
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
            body: JSON.stringify({ product_id: pid, quantity: qty }),
          });
        } catch {
          // Bỏ qua nếu vượt stock
        }
      }
    }

    const updatedServerCart = await apiFetch("/cart");
    const merged = {};
    for (const item of (updatedServerCart && updatedServerCart.items) || []) {
      merged[String(item.product_id)] = Number(item.quantity);
    }
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
    authLink.firstChild.textContent = `Hồ sơ: ${user.name} `;
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
    window.location.href = "home.html";
  });

  lastInserted.after(logoutLink);

  await syncCartWithServer();
}

window.Aqualife = {
  getCart,
  saveCart,
  addToCart,
  updateCartItemQty,
  removeFromCart,
  clearCart,
  syncCartWithServer,
  loadProducts,
  formatCurrency,
  findProductById,
  updateCartBadges,
  apiFetch,
  showToast,
};

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadges();
  renderAuthNav();

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

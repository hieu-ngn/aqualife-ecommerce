let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    allProducts = await Aqualife.loadProducts();
    renderProducts();
    loadCart();
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
    const list = document.getElementById("product-list");
    if (list) {
      list.innerHTML =
        '<div style="text-align:center;color:#999;">Không thể tải sản phẩm</div>';
    }
  }
});

function renderProducts() {
  const list = document.getElementById("product-list");
  if (!list) return;
  list.innerHTML = "";

  // Lấy 4 sản phẩm đầu tiên còn hàng làm sản phẩm nổi bật
  const available = allProducts.filter((p) => (p.stock ?? 1) > 0);
  const featured = (available.length >= 4 ? available : allProducts).slice(0, 4);

  featured.forEach((p) => {
    const outOfStock = (p.stock ?? 1) <= 0;
    list.innerHTML += `
      <div class="product">
        <a href="product-detail.html?id=${p.id}" style="text-decoration: none; color: inherit;">
          <img src="${p.image}" alt="${p.name}" style="cursor: pointer;">
        </a>
        <h4><a href="product-detail.html?id=${p.id}" style="text-decoration: none; color: inherit; cursor: pointer;">${p.name}</a></h4>
        <p>${Aqualife.formatCurrency(p.price)}</p>
        <button ${outOfStock ? "disabled" : ""} onclick="addProductToCart('${p.id}')">
          ${outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
        </button>
      </div>
    `;
  });
}

function addProductToCart(productId) {
  const added = Aqualife.addToCart(productId, 1);
  if (!added) return;
  updateCartCount();
  renderCart();
  const product = Aqualife.findProductById(allProducts, productId);
  if (product) {
    showNotification(`${product.name} đã thêm vào giỏ`);
  }
}

function renderCart() {
  const list = document.getElementById("cart-items");
  if (!list) return;

  const cart = Aqualife.getCart();
  list.innerHTML = "";

  for (const [productId, quantity] of Object.entries(cart)) {
    const product = Aqualife.findProductById(allProducts, productId);
    if (product) {
      list.innerHTML += `
        <li>
          ${product.name} x${quantity} 
          <br><small>${Aqualife.formatCurrency(product.price * quantity)}</small>
        </li>
      `;
    }
  }
}

function toggleCart() {
  const box = document.getElementById("cartBox");
  if (box) {
    box.style.display = box.style.display === "block" ? "none" : "block";
  }
}

function updateCartCount() {
  Aqualife.updateCartBadges();
}

function loadCart() {
  renderCart();
  updateCartCount();
}

function showNotification(message) {
  console.log(message);
}

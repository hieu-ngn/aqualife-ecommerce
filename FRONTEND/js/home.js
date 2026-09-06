let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    allProducts = await Aqualife.loadProducts();
    renderProducts();
    loadCart();
  } catch (error) {
    console.error("Lỗi tải sản phẩm:", error);
    document.getElementById("product-list").innerHTML = '<div style="text-align:center;color:#999;">Không thể tải sản phẩm</div>';
  }
});

function renderProducts(){
  const list = document.getElementById("product-list");
  if (!list) return;
  list.innerHTML = "";
  
  // Lấy 4 sản phẩm đầu tiên làm sản phẩm nổi bật
  const featured = allProducts.slice(0, 4);
  
  featured.forEach((p) => {
    list.innerHTML += `
      <div class="product">
        <a href="product-detail.html?id=${p.id}" style="text-decoration: none; color: inherit;">
          <img src="${p.image}" alt="${p.name}" style="cursor: pointer;">
        </a>
        <h4><a href="product-detail.html?id=${p.id}" style="text-decoration: none; color: inherit; cursor: pointer;">${p.name}</a></h4>
        <p>${Aqualife.formatCurrency(p.price)}</p>
        <button onclick="addProductToCart('${p.id}')">Thêm vào giỏ</button>
      </div>
    `;
  });
}

function addProductToCart(productId){
  Aqualife.addToCart(productId, 1);
  updateCartCount();
  renderCart();
  const product = allProducts.find(p => p.id === productId);
  if (product) {
    showNotification(`${product.name} đã thêm vào giỏ`);
  }
}

function renderCart(){
  const list = document.getElementById("cart-items");
  if (!list) return;
  
  const cart = Aqualife.getCart();
  list.innerHTML = "";
  
  for (const [productId, quantity] of Object.entries(cart)) {
    const product = allProducts.find(p => p.id === productId);
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

function toggleCart(){
  const box = document.getElementById("cartBox");
  if (box) {
    box.style.display = box.style.display === "block" ? "none" : "block";
  }
}

function updateCartCount(){
  Aqualife.updateCartBadges();
}

function loadCart(){
  renderCart();
  updateCartCount();
}

function showNotification(message){
  console.log(message);
}


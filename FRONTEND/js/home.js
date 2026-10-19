let allProducts = [];
let featuredReviews = [];
let currentReviewPage = 0;
const REVIEWS_PER_PAGE = 2;

document.addEventListener("DOMContentLoaded", async () => {
  loadFeaturedReviews();
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

function escapeReviewHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadFeaturedReviews() {
  try {
    const reviews = await Aqualife.apiFetch("/reviews?limit=20");
    if (!Array.isArray(reviews) || reviews.length === 0) return;

    // Đảm bảo sắp xếp nhiều sao nhất trước, cùng số sao thì đánh giá sớm nhất lên trước
    featuredReviews = reviews
      .filter((r) => Number(r.rating || 0) >= 4 && String(r.comment || "").trim())
      .sort((a, b) => {
        const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return Number(a.id || 0) - Number(b.id || 0);
      });

    if (featuredReviews.length === 0) return;

    currentReviewPage = 0;
    renderTestimonials();

    const prevBtn = document.getElementById("testimonial-prev");
    const nextBtn = document.getElementById("testimonial-next");
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (currentReviewPage > 0) {
          currentReviewPage -= 1;
          renderTestimonials();
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = () => {
        const totalPages = Math.ceil(featuredReviews.length / REVIEWS_PER_PAGE);
        if (currentReviewPage < totalPages - 1) {
          currentReviewPage += 1;
          renderTestimonials();
        } else {
          currentReviewPage = 0;
          renderTestimonials();
        }
      };
    }
  } catch (error) {
    console.warn("Sử dụng đánh giá mặc định trên trang chủ:", error);
  }
}

function renderTestimonials() {
  const wrapper = document.getElementById("testimonial-list");
  if (!wrapper || featuredReviews.length === 0) return;

  const start = currentReviewPage * REVIEWS_PER_PAGE;
  const pageItems = featuredReviews.slice(start, start + REVIEWS_PER_PAGE);

  wrapper.innerHTML = pageItems
    .map((review, index) => {
      const cardClass = index % 2 === 0 ? "testimonial-left" : "testimonial-right";
      const rating = Math.max(1, Math.min(5, Number(review.rating || 5)));
      const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
      const comment = escapeReviewHtml(review.comment || "");
      const authorName = escapeReviewHtml(review.user_name || "Khách hàng Aqualife");
      const productName = escapeReviewHtml(review.product_name || "Sản phẩm Aqualife");
      const productId = encodeURIComponent(review.product_id || "");
      const defaultRoles = {
        "Anh Hoàng Dương": "Người chơi cá lâu năm",
        "Chị Hồng Diệp": "Trưởng phòng BA",
        "Anh Minh Tuấn": "Thành viên Hội Thủy Sinh",
        "Chị Thanh Thảo": "Khách hàng VIP"
      };
      const customerRole = defaultRoles[authorName] || "Khách hàng thân thiết";
      const subtitle = review.product_id
        ? `${customerRole} • Đánh giá: <a class="review-product-link" href="product-detail.html?id=${productId}">${productName}</a>`
        : customerRole;

      return `
        <div class="${cardClass}">
          <div class="stars">${stars}</div>
          <p class="quote">"${comment}"</p>
          <div class="author">
            <strong>${authorName}</strong>
            <span>${subtitle}</span>
          </div>
        </div>
      `;
    })
    .join("");

  const controls = document.getElementById("testimonial-controls");
  const pageInfo = document.getElementById("testimonial-page-info");
  const prevBtn = document.getElementById("testimonial-prev");
  const nextBtn = document.getElementById("testimonial-next");
  const totalPages = Math.ceil(featuredReviews.length / REVIEWS_PER_PAGE);

  if (controls) {
    controls.style.display = totalPages > 1 ? "flex" : "none";
  }
  if (pageInfo) {
    pageInfo.textContent = `${currentReviewPage + 1} / ${totalPages}`;
  }
  if (prevBtn) {
    prevBtn.disabled = currentReviewPage <= 0;
  }
  if (nextBtn) {
    nextBtn.disabled = false;
  }
}

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

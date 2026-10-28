document.addEventListener("DOMContentLoaded", async () => {
  const imageEl = document.getElementById("detail-image");
  const nameEl = document.getElementById("detail-name");
  const priceEl = document.getElementById("detail-price");
  const speciesEl = document.getElementById("detail-species");
  const waterTypeEl = document.getElementById("detail-water-type");
  const descEl = document.getElementById("detail-description");
  const quantityEl = document.getElementById("detail-quantity");
  const addBtn = document.getElementById("detail-add");
  const relatedEl = document.getElementById("related-products");

  if (!imageEl || !nameEl || !priceEl || !descEl || !quantityEl || !addBtn || !relatedEl) {
    return;
  }

  try {
    const products = await Aqualife.loadProducts();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || products[0]?.id;
    const product = Aqualife.findProductById(products, id) || products[0];

    if (!product) {
      nameEl.textContent = "Không tìm thấy sản phẩm";
      return;
    }

    imageEl.src = product.image;
    imageEl.alt = product.name;
    nameEl.textContent = product.name;
    speciesEl.textContent = product.species || "Chưa có thông tin";
    const stockInfo =
      typeof product.stock === "number"
        ? product.stock > 0
          ? ` (Còn ${product.stock} sản phẩm)`
          : " (Hết hàng)"
        : "";
    waterTypeEl.textContent = `${product.waterType || "Chưa có thông tin"}${stockInfo}`;
    descEl.textContent = product.description;

    const sizesList =
      Array.isArray(product.sizes) && product.sizes.length
        ? product.sizes
        : [{ size: "Size Tiêu chuẩn", price: product.price }];

    let selectedSize = Aqualife.getProductSelectedSize
      ? Aqualife.getProductSelectedSize(product)
      : sizesList[0].size;

    const sizeOptionsEl = document.getElementById("detail-size-options");
    function renderSizeOptions() {
      const currentOpt =
        sizesList.find((s) => s.size === selectedSize) || sizesList[0];
      selectedSize = currentOpt.size;
      priceEl.textContent = Aqualife.formatCurrency(currentOpt.price);

      if (!sizeOptionsEl) return;
      sizeOptionsEl.innerHTML = sizesList
        .map(
          (opt) => `
          <button type="button" class="size-option-btn ${
            opt.size === selectedSize ? "active" : ""
          }" data-size="${escapeHtml(opt.size)}" ${typeof opt.stock === "number" && opt.stock <= 0 ? 'aria-disabled="true" style="opacity:.55"' : ""}>
            <span class="size-opt-name">${escapeHtml(opt.size)}</span>
            <span class="size-opt-price">${Aqualife.formatCurrency(opt.price)}</span>
            ${typeof opt.stock === "number" ? `<span class="size-opt-stock" style="display:block;font-size:11px;color:${opt.stock <= 0 ? "#b42318" : "#5b7a8f"};">${opt.stock <= 0 ? "Hết hàng" : `Còn ${opt.stock}`}</span>` : ""}
          </button>
        `
        )
        .join("");

      sizeOptionsEl.querySelectorAll(".size-option-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedSize = btn.dataset.size;
          renderSizeOptions();
        });
      });
      applySizeStock();
    }

    // Số lượng tối đa và nút "Thêm vào giỏ" phụ thuộc tồn kho của kích thước đang chọn
    const addBtnLabel = addBtn.textContent;
    function applySizeStock() {
      const stock = Aqualife.getSizeStock ? Aqualife.getSizeStock(product, selectedSize) : product.stock;
      if (typeof stock !== "number") return;
      if (stock <= 0) {
        addBtn.disabled = true;
        addBtn.textContent = "Size này đã hết hàng";
        quantityEl.disabled = true;
        quantityEl.value = "0";
      } else {
        addBtn.disabled = false;
        addBtn.textContent = addBtnLabel;
        quantityEl.disabled = false;
        quantityEl.max = String(stock);
        if (!Number(quantityEl.value) || Number(quantityEl.value) > stock) quantityEl.value = "1";
      }
    }
    renderSizeOptions();

    addBtn.addEventListener("click", () => {
      const qty = Math.max(1, Number(quantityEl.value || 1));
      const ok = Aqualife.addToCart(product.id, qty, selectedSize);
      if (ok) {
        quantityEl.value = "1";
        const originalText = addBtn.textContent;
        addBtn.textContent = "Đã thêm vào giỏ ✓";
        setTimeout(() => {
          addBtn.textContent = originalText;
        }, 800);
      }
    });

    const related = laySanPhamLienQuan(products, product).slice(0, 3);
    relatedEl.innerHTML = related.map(taoCardSanPhamLienQuan).join("");

    relatedEl.addEventListener("click", (event) => {
      if (event.target.classList.contains("btn-add")) {
        const idCanThem = event.target.dataset.id;
        Aqualife.addToCart(idCanThem, 1);
      }
    });

    // Tải đánh giá sản phẩm (Module M09b)
    const numericProductId = Number(product.dbId || product.id);
    if (Number.isInteger(numericProductId) && numericProductId > 0) {
      await loadAndRenderReviews(numericProductId);
    }
  } catch (error) {
    nameEl.textContent = `Có lỗi: ${error.message}`;
  }
});

function renderStarsText(rating) {
  const rounded = Math.round(Number(rating || 0));
  return "★".repeat(Math.max(0, Math.min(5, rounded))) + "☆".repeat(Math.max(0, 5 - rounded));
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatReviewDate(isoStr) {
  if (!isoStr) return "";
  try {
    return new Date(isoStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

async function loadAndRenderReviews(productId) {
  const summaryBadgeEl = document.getElementById("detail-rating-summary");
  const avgNumEl = document.getElementById("reviews-avg-number");
  const avgStarsEl = document.getElementById("reviews-avg-stars");
  const totalCountEl = document.getElementById("reviews-total-count");
  const actionAreaEl = document.getElementById("review-action-area");
  const listEl = document.getElementById("reviews-list");

  if (!listEl || !actionAreaEl) return;

  try {
    const data = await Aqualife.apiFetch(`/products/${productId}/reviews`);
    const avg = Number(data.average_rating || 0);
    const total = Number(data.total_reviews || 0);
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];

    if (summaryBadgeEl) {
      summaryBadgeEl.textContent =
        total > 0 ? `★ ${avg.toFixed(1)} (${total} đánh giá)` : "★ Chưa có đánh giá";
    }
    if (avgNumEl) avgNumEl.textContent = avg.toFixed(1);
    if (avgStarsEl) avgStarsEl.textContent = renderStarsText(avg);
    if (totalCountEl) totalCountEl.textContent = `${total} đánh giá`;

    let currentUser = null;
    try {
      const rawUser = localStorage.getItem("aqualife_user_info");
      if (rawUser) currentUser = JSON.parse(rawUser);
    } catch {
      currentUser = null;
    }

    // Khu vực form đánh giá
    if (!localStorage.getItem("aqualife_user")) {
      actionAreaEl.innerHTML = `
        <div class="review-notice">
          <span>Bạn đã mua sản phẩm này? Hãy đăng nhập để gửi đánh giá và nhận xét.</span>
          <a class="btn btn-ghost" style="width:auto;" href="auth.html?redirect=${encodeURIComponent(
            `product-detail.html?id=${productId}`
          )}">Đăng nhập ngay</a>
        </div>
      `;
    } else if (data.my_review) {
      const myRev = data.my_review;
      actionAreaEl.innerHTML = buildReviewFormHtml(
        "Đánh giá của bạn (Bạn có thể chỉnh sửa hoặc xóa)",
        myRev.rating,
        myRev.comment,
        true
      );
      bindReviewFormEvents(productId, myRev.id);
    } else if (data.can_review) {
      actionAreaEl.innerHTML = buildReviewFormHtml(
        "Viết đánh giá của bạn (Đã xác thực mua hàng ✓)",
        5,
        "",
        false
      );
      bindReviewFormEvents(productId, null);
    } else {
      actionAreaEl.innerHTML = `
        <div class="review-notice">
          <span><i class="fa-solid fa-circle-check"></i> Chỉ khách hàng đã đặt mua sản phẩm này tại Aqualife mới có thể gửi đánh giá nhằm đảm bảo tính khách quan.</span>
        </div>
      `;
    }

    // Danh sách đánh giá
    if (!reviews.length) {
      listEl.innerHTML = `<p class="empty">Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm và chia sẻ!</p>`;
      return;
    }

    const isAdmin = currentUser && currentUser.role === "admin";
    listEl.innerHTML = reviews
      .map((rev) => {
        const initial = (rev.user_name || "K").trim().charAt(0).toUpperCase();
        const canDelete =
          isAdmin || (currentUser && Number(currentUser.id) === Number(rev.user_id));
        return `
          <article class="review-item">
            <div class="review-item-top">
              <div class="review-author">
                <div class="review-avatar">${escapeHtml(initial)}</div>
                <div>
                  <strong>${escapeHtml(rev.user_name)}</strong>
                  <span class="verified-pill">Đã mua tại Aqualife</span>
                  <div class="review-date">${formatReviewDate(rev.created_at)}</div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="review-item-stars" title="${rev.rating}/5 sao">${renderStarsText(
          rev.rating
        )}</span>
                ${
                  canDelete
                    ? `<button type="button" class="btn btn-danger btn-delete-review" data-review-id="${rev.id}" style="padding:5px 10px;font-size:12px;">Xóa</button>`
                    : ""
                }
              </div>
            </div>
            ${
              rev.comment
                ? `<p class="review-comment">${escapeHtml(rev.comment)}</p>`
                : `<p class="review-comment muted"><em>Khách hàng đánh giá ${rev.rating} sao.</em></p>`
            }
          </article>
        `;
      })
      .join("");

    listEl.querySelectorAll(".btn-delete-review").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const revId = Number(btn.dataset.reviewId);
        if (!revId) return;
        btn.disabled = true;
        try {
          await Aqualife.apiFetch(`/reviews/${revId}`, { method: "DELETE" });
          if (Aqualife.showToast) Aqualife.showToast("Đã xóa đánh giá.", "success");
          await loadAndRenderReviews(productId);
        } catch (err) {
          if (Aqualife.showToast) Aqualife.showToast(err.message, "error");
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    listEl.innerHTML = `<p class="empty">Không thể tải đánh giá lúc này.</p>`;
  }
}

function buildReviewFormHtml(title, initialRating, initialComment, isUpdate) {
  const starsHtml = [1, 2, 3, 4, 5]
    .map(
      (num) => `
      <button type="button" class="star-btn ${
        num <= initialRating ? "active" : ""
      }" data-star="${num}">
        ${num} ★
      </button>
    `
    )
    .join("");

  return `
    <form id="product-review-form" class="review-form-card" novalidate>
      <h3>${escapeHtml(title)}</h3>
      <input type="hidden" id="review-rating-input" value="${initialRating}" />
      <div class="star-picker" id="review-star-picker">
        ${starsHtml}
      </div>
      <div class="field-group">
        <textarea id="review-comment-input" class="textarea" rows="3" placeholder="Chia sẻ cảm nhận của bạn về sức khỏe cá/tép, đóng gói, màu sắc thực tế...">${escapeHtml(
          initialComment
        )}</textarea>
      </div>
      <div class="review-form-actions">
        <button type="submit" id="review-submit-btn" class="btn btn-primary">
          ${isUpdate ? "Cập nhật đánh giá" : "Gửi đánh giá"}
        </button>
      </div>
      <div id="review-form-alert" class="alert hidden"></div>
    </form>
  `;
}

function bindReviewFormEvents(productId, existingReviewId) {
  const form = document.getElementById("product-review-form");
  const ratingInput = document.getElementById("review-rating-input");
  const commentInput = document.getElementById("review-comment-input");
  const starPicker = document.getElementById("review-star-picker");
  const alertEl = document.getElementById("review-form-alert");
  const submitBtn = document.getElementById("review-submit-btn");

  if (!form || !ratingInput || !starPicker) return;

  starPicker.querySelectorAll(".star-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const selected = Number(btn.dataset.star || 5);
      ratingInput.value = String(selected);
      starPicker.querySelectorAll(".star-btn").forEach((b) => {
        b.classList.toggle("active", Number(b.dataset.star) <= selected);
      });
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    alertEl.classList.add("hidden");
    const rating = Number(ratingInput.value || 5);
    const comment = commentInput.value.trim();

    submitBtn.disabled = true;
    try {
      if (existingReviewId) {
        await Aqualife.apiFetch(`/reviews/${existingReviewId}`, {
          method: "PUT",
          body: JSON.stringify({ rating, comment }),
        });
        if (Aqualife.showToast) Aqualife.showToast("Đã cập nhật đánh giá!", "success");
      } else {
        await Aqualife.apiFetch(`/products/${productId}/reviews`, {
          method: "POST",
          body: JSON.stringify({ rating, comment }),
        });
        if (Aqualife.showToast) Aqualife.showToast("Cảm ơn bạn đã gửi đánh giá!", "success");
      }
      await loadAndRenderReviews(productId);
    } catch (err) {
      alertEl.className = "alert alert-error";
      alertEl.textContent = err.message || "Không thể gửi đánh giá.";
      alertEl.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function taoCardSanPhamLienQuan(product) {
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;
  return `
    <article class="product-card related-product-card">
      <a href="product-detail.html?id=${product.id}" class="product-image">
        <img src="${product.image}" alt="${product.name}" />
      </a>
      <div class="product-info">
        <h3>
          <a href="product-detail.html?id=${product.id}">
            ${product.name}
          </a>
        </h3>
        <p class="species">${product.species}</p>
        <p class="environment">${product.waterType}</p>
        <p class="description">${product.shortDescription}</p>

        <div class="product-footer">
          <span class="price">${Aqualife.formatCurrency(product.price)}</span>
          <button class="btn-add" data-id="${product.id}" type="button" ${outOfStock ? "disabled" : ""}>
            ${outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function laySanPhamLienQuan(products, product) {
  const sanPhamKhac = products.filter((item) => String(item.id) !== String(product.id));
  const cungLoai = sanPhamKhac.filter((item) => item.species === product.species);
  const cungMoiTruong = sanPhamKhac.filter(
    (item) => item.species !== product.species && item.waterType === product.waterType
  );
  const conLai = sanPhamKhac.filter(
    (item) => item.species !== product.species && item.waterType !== product.waterType
  );

  return [...cungLoai, ...cungMoiTruong, ...conLai];
}

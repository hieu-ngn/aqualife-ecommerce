document.addEventListener("DOMContentLoaded", async () => {
  const orderListEl = document.getElementById("order-list");
  const orderTotalEl = document.getElementById("order-total");
  const placeOrderBtn = document.getElementById("place-order");
  const feedbackEl = document.getElementById("order-feedback");

  const formFields = {
    firstName: document.getElementById("first-name"),
    lastName: document.getElementById("last-name"),
    address: document.getElementById("address"),
    province: document.getElementById("province"),
    phone: document.getElementById("phone"),
    email: document.getElementById("email"),
    notes: document.getElementById("notes"),
    paymentMethod: document.getElementById("payment-method"),
  };

  // =========================
  // Render đơn hàng
  // =========================
  async function renderOrder() {
    try {
      const cart = Aqualife.getCart();
      const entries = Object.entries(cart).filter(([, qty]) => Number(qty) > 0);
      const products = await Aqualife.loadProducts();

      if (!entries.length) {
        orderListEl.innerHTML = "<p class='empty'>Giỏ hàng không có sản phẩm.</p>";
        orderTotalEl.textContent = Aqualife.formatCurrency(0);
        placeOrderBtn.disabled = true;
        return;
      }

      placeOrderBtn.disabled = false;

      let total = 0;

      const html = entries.map(([productId, qty]) => {
        const product = Aqualife.findProductById(products, productId);
        if (!product) return "";

        const quantity = Number(qty);
        const amount = product.price * quantity;
        total += amount;

        return `
          <div class="order-item">
            <div>${product.name} x ${quantity}</div>
            <div>${Aqualife.formatCurrency(amount)}</div>
          </div>
        `;
      });

      orderListEl.innerHTML = html.join("");
      orderTotalEl.textContent = Aqualife.formatCurrency(total);
    } catch (err) {
      console.error(err);
      orderListEl.innerHTML = "<p class='error'>Lỗi tải dữ liệu sản phẩm.</p>";
    }
  }

  // =========================
  // Validate form
  // =========================
  function validateForm() {
    let isValid = true;

    const requiredFields = ["firstName", "lastName", "address", "province", "phone", "email"];

    requiredFields.forEach((key) => {
      const el = formFields[key];
      if (!el) return;

      const value = el.value.trim();
      const ok = value.length > 0;

      el.style.borderColor = ok ? "#d7e4ef" : "#c83b3b";

      if (!ok) isValid = false;
    });

    return isValid;
  }

  function resetFieldStyles() {
    Object.values(formFields).forEach((el) => {
      if (el) el.style.borderColor = "";
    });
  }

  
  function showFeedback(type, message) {
    if (!feedbackEl) return;
    feedbackEl.className = `alert alert-${type}`;
    feedbackEl.textContent = message;
    feedbackEl.classList.remove("hidden");
  }

  function hideFeedback() {
    if (!feedbackEl) return;
    feedbackEl.className = "alert hidden";
    feedbackEl.textContent = "";
  }

  await renderOrder();

  // =========================
  // Handle đặt hàng
  // =========================
  placeOrderBtn.addEventListener("click", () => {
    resetFieldStyles();
    hideFeedback();

    // validate
    if (!validateForm()) {
      showFeedback("error", "Vui lòng nhập đúng và đầy đủ thông tin.");
      return;
    }

    // disable tránh spam click
    placeOrderBtn.disabled = true;

    // dùng confirm
    if (!confirm("Bạn có chắc chắn muốn đặt hàng không?")) {
      placeOrderBtn.disabled = false;
      return;
    }

    handleOrderSuccess();
  });

  function handleOrderSuccess() {
    Aqualife.saveCart({});
    Aqualife.updateCartBadges();

    showFeedback(
      "success",
      `Cảm ơn ${formFields.lastName.value.trim()} ${formFields.firstName.value.trim()}! Đơn hàng đã được ghi nhận.`
    );

    setTimeout(() => {
      window.location.href = "home.html";
    }, 3000);
  }
});

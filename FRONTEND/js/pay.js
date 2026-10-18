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
  };

  let products = [];

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

  async function prefillUserInfo() {
    try {
      const user = await Aqualife.apiFetch("/auth/me");
      if (!user) return;

      if (user.name && formFields.lastName && formFields.firstName) {
        const parts = user.name.trim().split(/\s+/);
        if (parts.length > 1) {
          formFields.lastName.value = parts.slice(0, -1).join(" ");
          formFields.firstName.value = parts[parts.length - 1];
        } else {
          formFields.firstName.value = user.name.trim();
        }
      }
      if (user.email && formFields.email) {
        formFields.email.value = user.email;
      }
      if (user.phone && formFields.phone) {
        formFields.phone.value = user.phone;
      }
      if (user.address && formFields.address) {
        formFields.address.value = user.address;
      }
    } catch {
      showFeedback(
        "error",
        "Bạn chưa đăng nhập. Vui lòng đăng nhập để đặt hàng."
      );
      setTimeout(() => {
        window.location.href = "auth.html?redirect=pay.html";
      }, 1500);
    }
  }

  async function renderOrder() {
    try {
      products = await Aqualife.loadProducts();
      if (Aqualife.syncCartWithServer) {
        await Aqualife.syncCartWithServer();
      }
      const cart = Aqualife.getCart();
      const entries = Object.entries(cart).filter(([, qty]) => Number(qty) > 0);

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

  function validateForm() {
    let isValid = true;
    const requiredFields = [
      "firstName",
      "lastName",
      "address",
      "province",
      "phone",
      "email",
    ];

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

  await prefillUserInfo();
  await renderOrder();

  placeOrderBtn.addEventListener("click", async () => {
    resetFieldStyles();
    hideFeedback();

    if (!validateForm()) {
      showFeedback("error", "Vui lòng nhập đúng và đầy đủ thông tin giao hàng.");
      return;
    }

    const cart = Aqualife.getCart();
    const entries = Object.entries(cart).filter(([, qty]) => Number(qty) > 0);
    if (!entries.length) {
      showFeedback("error", "Giỏ hàng của bạn đang trống.");
      return;
    }

    if (!confirm("Bạn có chắc chắn muốn đặt đơn hàng này không?")) {
      return;
    }

    placeOrderBtn.disabled = true;

    const firstName = formFields.firstName.value.trim();
    const lastName = formFields.lastName.value.trim();
    const shippingName = `${lastName} ${firstName}`.trim();
    const shippingPhone = formFields.phone.value.trim();
    const rawAddress = formFields.address.value.trim();
    const province = formFields.province.value.trim();
    const notes = formFields.notes ? formFields.notes.value.trim() : "";
    const shippingAddress = notes
      ? `${rawAddress}, ${province} (Ghi chú: ${notes})`
      : `${rawAddress}, ${province}`;

    const selectedRadio = document.querySelector('input[name="payment"]:checked');
    const rawPayment = selectedRadio ? selectedRadio.value : "cash";
    const paymentMethod = rawPayment === "transfer" ? "bank_transfer" : "cod";

    const itemsPayload = entries
      .map(([rawId, qty]) => {
        const prod = Aqualife.findProductById(products, rawId);
        const pid = prod ? Number(prod.id) : Number(rawId);
        return { product_id: pid, quantity: Number(qty) };
      })
      .filter((item) => Number.isInteger(item.product_id) && item.product_id > 0);

    try {
      const order = await Aqualife.apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          shipping_name: shippingName,
          shipping_phone: shippingPhone,
          shipping_address: shippingAddress,
          payment_method: paymentMethod,
          items: itemsPayload,
        }),
      });

      Aqualife.saveCart({});
      Aqualife.updateCartBadges();

      showFeedback(
        "success",
        `Đặt hàng thành công! Mã đơn hàng #${order.id} của ${shippingName} đã được ghi nhận. Đang chuyển đến trang Đơn hàng...`
      );

      setTimeout(() => {
        window.location.href = "orders.html";
      }, 1500);
    } catch (err) {
      showFeedback("error", err.message || "Không thể đặt hàng, vui lòng thử lại.");
      placeOrderBtn.disabled = false;
    }
  });
});

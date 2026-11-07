document.addEventListener("DOMContentLoaded", async () => {
  const orderListEl = document.getElementById("order-list");
  const orderTotalEl = document.getElementById("order-total");
  const placeOrderBtn = document.getElementById("place-order");
  const feedbackEl = document.getElementById("order-feedback");
  const vietqrBoxEl = document.getElementById("vietqr-box");
  const vietqrImgEl = document.getElementById("vietqr-img");
  const vietqrNoteEl = document.getElementById("vietqr-note");

  // Shipping elements
  const shippingCardStandard = document.getElementById("shipping-card-standard");
  const shippingCardExpress = document.getElementById("shipping-card-express");
  const shippingPriceStandardEl = document.getElementById("shipping-price-standard");

  // Voucher elements
  const voucherInputEl = document.getElementById("voucher-input");
  const btnApplyVoucher = document.getElementById("btn-apply-voucher");
  const btnRemoveVoucher = document.getElementById("btn-remove-voucher");
  const voucherChipsContainer = document.getElementById("voucher-chips-container");
  const voucherAppliedBox = document.getElementById("voucher-applied-box");
  const voucherAppliedCode = document.getElementById("voucher-applied-code");
  const voucherAppliedText = document.getElementById("voucher-applied-text");
  const voucherFeedbackEl = document.getElementById("voucher-feedback");

  // Breakdown summary elements
  const summarySubtotalEl = document.getElementById("summary-subtotal");
  const summaryShippingEl = document.getElementById("summary-shipping");
  const summaryDiscountEl = document.getElementById("summary-discount");
  const breakdownDiscountRow = document.getElementById("breakdown-discount-row");

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
  let currentSubtotal = 0;
  let currentShippingMethod = "standard";
  let currentShippingFee = 30000;
  let appliedVoucher = null;
  let currentDiscount = 0;
  let currentTotalAmount = 0;

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

  function showVoucherFeedback(type, message) {
    if (!voucherFeedbackEl) return;
    voucherFeedbackEl.className = `alert alert-${type}`;
    voucherFeedbackEl.textContent = message;
    voucherFeedbackEl.classList.remove("hidden");
  }

  function hideVoucherFeedback() {
    if (!voucherFeedbackEl) return;
    voucherFeedbackEl.className = "alert hidden";
    voucherFeedbackEl.textContent = "";
  }

  function calculateShippingFee(method, subtotal) {
    if (method === "express") {
      return 50000;
    }
    // Standard: 30k, or free if subtotal >= 500k
    return subtotal >= 500000 ? 0 : 30000;
  }

  function updateTotalsDisplay() {
    // 1. Calculate shipping fee
    currentShippingFee = calculateShippingFee(currentShippingMethod, currentSubtotal);

    // Update standard shipping label display
    if (shippingPriceStandardEl) {
      if (currentSubtotal >= 500000) {
        shippingPriceStandardEl.innerHTML = `<span style="color:#16a34a;font-weight:700;">Miễn phí</span> <small style="text-decoration:line-through;color:#94a3b8;font-weight:normal;">30.000 ₫</small>`;
      } else {
        shippingPriceStandardEl.textContent = "30.000 ₫";
      }
    }

    // 2. Calculate voucher discount if applied
    if (appliedVoucher) {
      if (appliedVoucher.min_order_amount && currentSubtotal < appliedVoucher.min_order_amount) {
        showVoucherFeedback(
          "error",
          `Mã ${appliedVoucher.code} yêu cầu đơn tối thiểu ${Aqualife.formatCurrency(appliedVoucher.min_order_amount)}`
        );
        removeVoucher(true);
      } else {
        const dtype = appliedVoucher.discount_type;
        const dval = Number(appliedVoucher.discount_value || 0);
        const maxD = appliedVoucher.max_discount ? Number(appliedVoucher.max_discount) : null;

        if (dtype === "percent") {
          let disc = (currentSubtotal * dval) / 100;
          if (maxD !== null) disc = Math.min(disc, maxD);
          currentDiscount = disc;
        } else if (dtype === "fixed") {
          currentDiscount = Math.min(dval, currentSubtotal);
        } else if (dtype === "free_shipping") {
          currentDiscount = maxD !== null ? Math.min(currentShippingFee, maxD) : currentShippingFee;
        } else {
          currentDiscount = 0;
        }
      }
    } else {
      currentDiscount = 0;
    }

    // 3. Final total calculation
    currentTotalAmount = Math.max(0, currentSubtotal + currentShippingFee - currentDiscount);

    // 4. Update DOM breakdown
    if (summarySubtotalEl) {
      summarySubtotalEl.textContent = Aqualife.formatCurrency(currentSubtotal);
    }
    if (summaryShippingEl) {
      summaryShippingEl.textContent =
        currentShippingFee === 0 ? "Miễn phí" : Aqualife.formatCurrency(currentShippingFee);
    }
    if (summaryDiscountEl && breakdownDiscountRow) {
      if (currentDiscount > 0) {
        breakdownDiscountRow.classList.remove("hidden");
        summaryDiscountEl.textContent = `-${Aqualife.formatCurrency(currentDiscount)}`;
      } else {
        breakdownDiscountRow.classList.add("hidden");
        summaryDiscountEl.textContent = "-0 ₫";
      }
    }
    if (orderTotalEl) {
      orderTotalEl.textContent = Aqualife.formatCurrency(currentTotalAmount);
    }

    // 5. Update VietQR dynamic amount
    updateVietQRPreview();
  }

  function updateVietQRPreview() {
    if (!vietqrBoxEl || !vietqrImgEl) return;
    const selectedRadio = document.querySelector('input[name="payment"]:checked');
    const isTransfer = selectedRadio && selectedRadio.value === "transfer";

    if (!isTransfer || currentTotalAmount <= 0) {
      vietqrBoxEl.classList.add("hidden");
      return;
    }

    const phoneVal = (formFields.phone?.value || "").replace(/\D/g, "") || "KHACHHANG";
    const addInfo = encodeURIComponent(`AQUALIFE ${phoneVal}`);
    const accountName = encodeURIComponent("AQUALIFE OCEAN CURATOR");
    vietqrImgEl.src = `https://img.vietqr.io/image/MB-0867817946-compact2.png?amount=${currentTotalAmount}&addInfo=${addInfo}&accountName=${accountName}`;
    if (vietqrNoteEl) {
      vietqrNoteEl.textContent = `MB Bank • 0867817946 • Số tiền: ${Aqualife.formatCurrency(
        currentTotalAmount
      )}`;
    }
    vietqrBoxEl.classList.remove("hidden");
  }

  async function loadSuggestedVouchers() {
    if (!voucherChipsContainer) return;
    try {
      const res = await Aqualife.apiFetch("/vouchers");
      const vouchers = Array.isArray(res) ? res : res?.data || [];
      if (!vouchers.length) {
        voucherChipsContainer.innerHTML = "";
        return;
      }

      voucherChipsContainer.innerHTML = `
        <span style="font-size:12px;color:#64748b;display:inline-flex;align-items:center;">Gợi ý mã:</span>
        ${vouchers
          .map(
            (v) => `
          <button type="button" class="voucher-chip" data-code="${v.code}" title="${v.description}">
            🏷️ <strong>${v.code}</strong>
          </button>
        `
          )
          .join("")}
      `;

      voucherChipsContainer.querySelectorAll(".voucher-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const code = chip.dataset.code;
          if (voucherInputEl) voucherInputEl.value = code;
          applyVoucher(code);
        });
      });
    } catch {
      // Vouchers load failure shouldn't block checkout
    }
  }

  async function applyVoucher(code) {
    hideVoucherFeedback();
    const cleanCode = (code || (voucherInputEl ? voucherInputEl.value : "")).trim().toUpperCase();
    if (!cleanCode) {
      showVoucherFeedback("error", "Vui lòng nhập mã giảm giá.");
      return;
    }

    if (currentSubtotal <= 0) {
      showVoucherFeedback("error", "Giỏ hàng trống, không thể áp dụng mã.");
      return;
    }

    if (btnApplyVoucher) btnApplyVoucher.disabled = true;

    try {
      const res = await Aqualife.apiFetch("/vouchers/apply", {
        method: "POST",
        body: JSON.stringify({
          code: cleanCode,
          subtotal: currentSubtotal,
          shipping_method: currentShippingMethod,
        }),
      });

      const voucherData = res.data || res;
      appliedVoucher = voucherData;

      if (voucherAppliedBox && voucherAppliedCode && voucherAppliedText) {
        voucherAppliedCode.textContent = voucherData.code;
        voucherAppliedText.textContent = voucherData.message || `Giảm ${Aqualife.formatCurrency(voucherData.discount_amount)}`;
        voucherAppliedBox.classList.remove("hidden");
      }

      if (voucherInputEl) voucherInputEl.value = "";
      showVoucherFeedback("success", voucherData.message || `Đã áp dụng mã ${voucherData.code}!`);
      updateTotalsDisplay();
    } catch (err) {
      showVoucherFeedback("error", err.message || `Mã giảm giá '${cleanCode}' không hợp lệ hoặc đã hết hạn.`);
    } finally {
      if (btnApplyVoucher) btnApplyVoucher.disabled = false;
    }
  }

  function removeVoucher(silent = false) {
    appliedVoucher = null;
    currentDiscount = 0;
    if (voucherAppliedBox) voucherAppliedBox.classList.add("hidden");
    if (!silent) {
      hideVoucherFeedback();
      showVoucherFeedback("info", "Đã gỡ mã giảm giá.");
    }
    updateTotalsDisplay();
  }

  function setupShippingMethods() {
    const shippingRadios = document.querySelectorAll('input[name="shipping_method"]');
    shippingRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        currentShippingMethod = e.target.value;
        if (shippingCardStandard) {
          shippingCardStandard.classList.toggle("selected", currentShippingMethod === "standard");
        }
        if (shippingCardExpress) {
          shippingCardExpress.classList.toggle("selected", currentShippingMethod === "express");
        }
        updateTotalsDisplay();
      });
    });
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
      showFeedback("error", "Bạn chưa đăng nhập. Vui lòng đăng nhập để đặt hàng.");
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
        currentSubtotal = 0;
        updateTotalsDisplay();
        placeOrderBtn.disabled = true;
        return;
      }

      placeOrderBtn.disabled = false;
      let total = 0;

      const html = entries.map(([productId, qty]) => {
        const product = Aqualife.findProductById(products, productId);
        if (!product) return "";

        const selectedSize = Aqualife.getProductSelectedSize
          ? Aqualife.getProductSelectedSize(product)
          : "";
        const unitPrice = Aqualife.getProductEffectivePrice
          ? Aqualife.getProductEffectivePrice(product, selectedSize)
          : product.price;
        const quantity = Number(qty);
        const amount = unitPrice * quantity;
        total += amount;

        return `
          <div class="order-item">
            <div>${product.name}${selectedSize ? ` <small class="muted">(${selectedSize})</small>` : ""} x ${quantity}</div>
            <div>${Aqualife.formatCurrency(amount)}</div>
          </div>
        `;
      });

      currentSubtotal = total;
      orderListEl.innerHTML = html.join("");
      updateTotalsDisplay();
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

  // Setup shipping choices and vouchers
  setupShippingMethods();
  if (btnApplyVoucher) {
    btnApplyVoucher.addEventListener("click", () => applyVoucher());
  }
  if (voucherInputEl) {
    voucherInputEl.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        applyVoucher();
      }
    });
  }
  if (btnRemoveVoucher) {
    btnRemoveVoucher.addEventListener("click", () => removeVoucher());
  }

  await prefillUserInfo();
  await renderOrder();
  await loadSuggestedVouchers();

  document.querySelectorAll('input[name="payment"]').forEach((radio) => {
    radio.addEventListener("change", updateVietQRPreview);
  });
  if (formFields.phone) {
    formFields.phone.addEventListener("input", updateVietQRPreview);
  }

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
        const selSize =
          prod && Aqualife.getProductSelectedSize
            ? Aqualife.getProductSelectedSize(prod)
            : "";
        return { product_id: pid, quantity: Number(qty), selected_size: selSize };
      })
      .filter((item) => Number.isInteger(item.product_id) && item.product_id > 0);

    const orderPayload = {
      shipping_name: shippingName,
      shipping_phone: shippingPhone,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      shipping_method: currentShippingMethod,
      voucher_code: appliedVoucher ? appliedVoucher.code : null,
      items: itemsPayload,
    };

    try {
      const order = await Aqualife.apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
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

// Ham hien thi modal thong bao
function showModal(message, onConfirm, showCancel = true) {
  const modal = document.getElementById("custom-modal");
  const messageEl = document.getElementById("modal-message");
  const confirmBtn = document.getElementById("modal-confirm");
  const cancelBtn = document.getElementById("modal-cancel");

  if (!modal || !messageEl || !confirmBtn || !cancelBtn) return;

  messageEl.textContent = message;
  modal.classList.remove("hidden");

  const handleConfirm = () => {
    modal.classList.add("hidden");
    onConfirm();
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
  };

  const handleCancel = () => {
    modal.classList.add("hidden");
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
  };

  confirmBtn.addEventListener("click", handleConfirm);
  if (showCancel) {
    cancelBtn.style.display = "inline-block";
    cancelBtn.addEventListener("click", handleCancel);
  } else {
    cancelBtn.style.display = "none";
  }
}

// Ham render giao dien gio hang, xu ly su kien tang giam so luong, xoa san pham va xoa toan bo gio hang
function renderCart(products) {
  const listEl = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const emptyEl = document.getElementById("cart-empty");

  if (!listEl || !totalEl || !emptyEl) return;

  const cart = Aqualife.getCart();
  const entries = Object.entries(cart).filter(([, qty]) => Number(qty) > 0);

  if (!entries.length) {
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
    totalEl.textContent = Aqualife.formatCurrency(0);
    return;
  }

  emptyEl.classList.add("hidden");

  let total = 0;

  listEl.innerHTML = entries
    .map(([id, qty]) => {
      const product = Aqualife.findProductById(products, id);
      if (!product) return "";
      const selectedSize = Aqualife.getProductSelectedSize
        ? Aqualife.getProductSelectedSize(product)
        : "";
      const unitPrice = Aqualife.getProductEffectivePrice
        ? Aqualife.getProductEffectivePrice(product, selectedSize)
        : product.price;
      const subtotal = unitPrice * Number(qty);
      total += subtotal;
      const stockInfo =
        typeof product.stock === "number" ? `Kho: ${product.stock}` : "";

      const sizesList =
        Array.isArray(product.sizes) && product.sizes.length ? product.sizes : [];
      const sizeControlHtml = sizesList.length
        ? `<div style="margin:6px 0;">
            <label style="font-size:12.5px;color:#063954;font-weight:600;margin-right:6px;">Kích thước:</label>
            <select class="cart-size-select" data-id="${product.id}" style="padding:4px 8px;border-radius:6px;border:1px solid #b8d8ee;font-size:12.5px;color:#073b5a;background:#f4faff;">
              ${sizesList
                .map(
                  (s) =>
                    `<option value="${s.size}" ${
                      s.size === selectedSize ? "selected" : ""
                    }>${s.size} — ${Aqualife.formatCurrency(s.price)}</option>`
                )
                .join("")}
            </select>
          </div>`
        : "";

      return `
        <article class="card cart-item" data-id="${product.id}">
          <div class="cart-item__thumb">
            <img src="${product.image}" alt="${product.name}" />
          </div>
          <div>
            <h3><a href="product-detail.html?id=${product.id}">${product.name}</a></h3>
            <p class="muted">${product.shortDescription || ""} ${stockInfo ? `(${stockInfo})` : ""}</p>
            ${sizeControlHtml}
            <p class="price">${Aqualife.formatCurrency(unitPrice)}</p>
          </div>
          <div>
            <div class="cart-item__actions">
              <button class="btn btn-ghost" data-action="minus">-</button>
              <p class="quantity"> ${qty.toString().padStart(2, "0")} </p>
              <button class="btn btn-ghost" data-action="plus">+</button>
              <button class="btn btn-danger" data-action="remove">Xoá</button>
            </div>
            <div class="cart-item__actions">
              <p><strong>Tạm tính:</strong></p>
              <p class="price" style="text-align:right">${Aqualife.formatCurrency(subtotal)}</p>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  totalEl.textContent = Aqualife.formatCurrency(total);

  listEl.querySelectorAll(".cart-size-select").forEach((selectEl) => {
    selectEl.addEventListener("change", () => {
      const id = selectEl.dataset.id;
      if (id && Aqualife.setCartItemSize) {
        Aqualife.setCartItemSize(id, selectEl.value);
        renderCart(products);
      }
    });
  });

  listEl.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const itemEl = button.closest("[data-id]");
      const id = itemEl?.dataset.id;
      if (!id) return;

      const cartState = Aqualife.getCart();
      const current = Number(cartState[id] || 0);
      const action = button.dataset.action;

      if (action === "plus") {
        Aqualife.updateCartItemQty(id, current + 1);
      } else if (action === "minus") {
        Aqualife.updateCartItemQty(id, Math.max(0, current - 1));
      } else if (action === "remove") {
        Aqualife.removeFromCart(id);
      }

      renderCart(products);
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("cart-items");
  if (!listEl) return;

  try {
    const products = await Aqualife.loadProducts();
    if (Aqualife.syncCartWithServer) {
      await Aqualife.syncCartWithServer();
    }
    renderCart(products);

    const clearBtn = document.getElementById("clear-cart");
    const checkoutBtn = document.getElementById("checkout");

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        showModal(
          "Bạn có chắc muốn xóa toàn bộ giỏ hàng?",
          async () => {
            await Aqualife.clearCart();
            renderCart(products);
          },
          true
        );
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", async () => {
        const count = Object.keys(Aqualife.getCart()).length;
        if (!count) {
          showModal("Giỏ hàng đang rỗng.", () => {}, false);
          return;
        }

        // Kiểm tra đăng nhập trước khi sang trang thanh toán
        let user = null;
        try {
          user = await Aqualife.apiFetch("/auth/me");
        } catch {
          user = null;
        }

        if (!user) {
          showModal(
            "Vui lòng đăng nhập để tiến hành đặt hàng và thanh toán.",
            () => {
              window.location.href = "auth.html?redirect=pay.html";
            },
            true
          );
          return;
        }

        showModal(
          "Xác nhận chuyển đến trang thanh toán?",
          () => {
            window.location.href = "pay.html";
          },
          true
        );
      });
    }
  } catch (error) {
    if (listEl) listEl.innerHTML = `<div class="empty">${error.message}</div>`;
  }
});

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
  // Lay cac phan tu HTML can thiet
  const listEl = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");
  const emptyEl = document.getElementById("cart-empty");

  // Neu khong tim thay cac phan tu, thoat ham
  if (!listEl || !totalEl || !emptyEl) return;

  // Lay du lieu gio hang tu Aqualife
  const cart = Aqualife.getCart();
  // Loc ra cac san pham co so luong > 0
  const entries = Object.entries(cart).filter(([, qty]) => Number(qty) > 0);

  // Neu gio hang rong, hien thi thong bao rong va set tong tien = 0
  if (!entries.length) {
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
    totalEl.textContent = Aqualife.formatCurrency(0);
    return;
  }

  // An thong bao rong
  emptyEl.classList.add("hidden");

  // Khoi tao tong tien
  let total = 0;

  // Render danh sach san pham trong gio hang
  listEl.innerHTML = entries
    .map(([id, qty]) => {
      // Tim san pham theo id
      const product = Aqualife.findProductById(products, id);
      if (!product) return "";
      // Tinh tien cho san pham nay
      const subtotal = product.price * Number(qty);
      total += subtotal;

      return `
        <article class="card cart-item" data-id="${id}">
          <div class="cart-item__thumb">
            <img src="${product.image}" alt="${product.name}" />
          </div>
          <div>
            <h3><a href="product-detail.html?id=${id}">${product.name}</a></h3>
            <p class="muted">${product.shortDescription}</p>
            <p class="price">${Aqualife.formatCurrency(product.price)}</p>

          </div>
          <div>
            <div class="cart-item__actions">
              <button class="btn btn-ghost" data-action="minus">-</button>
              <p class="quantity"> ${qty.toString().padStart(2, '0')} </p>
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

  // Hien thi tong tien
  totalEl.textContent = Aqualife.formatCurrency(total);

  // Them su kien cho cac nut trong gio hang
  listEl.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      // Lay id cua san pham tu phan tu cha
      const itemEl = button.closest("[data-id]");
      const id = itemEl?.dataset.id;
      if (!id) return;

      // Lay trang thai gio hang hien tai
      const cartState = Aqualife.getCart();
      const current = Number(cartState[id] || 0);
      const action = button.dataset.action;

      // Xu ly theo hanh dong
      if (action === "plus") {
        cartState[id] = current + 1;
      } else if (action === "minus") {
        cartState[id] = Math.max(0, current - 1);
        if (cartState[id] === 0) delete cartState[id];
      } else if (action === "remove") {
        delete cartState[id];
      }

      // Luu lai gio hang va render lai
      Aqualife.saveCart(cartState);
      renderCart(products);
    });
  });
}

// Khi trang web da tai xong, thuc thi cac hanh dong sau
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Tai danh sach san pham tu Aqualife
    const products = await Aqualife.loadProducts();
    // Render gio hang voi danh sach san pham
    renderCart(products);

    // Lay cac nut xoa toan bo gio hang va thanh toan
    const clearBtn = document.getElementById("clear-cart");
    const checkoutBtn = document.getElementById("checkout");

    // Cho clear cart
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        showModal("Bạn có chắc muốn xóa toàn bộ giỏ hàng?", () => {
          Aqualife.saveCart({});
          renderCart(products);
        }, true);
      });
    }

    // Cho checkout
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        const count = Object.keys(Aqualife.getCart()).length;
        if (count) {
          showModal("Xác nhận thanh toán?", () => {
            window.location.href = "pay.html";
          }, true);
        } else {
          showModal("Giỏ hàng đang rỗng.", () => {}, false);
        }
      });
    }
  } catch (error) {
    // Neu co loi, hien thi thong bao loi
    const listEl = document.getElementById("cart-items");
    if (listEl) listEl.innerHTML = `<div class="empty">${error.message}</div>`;
  }
});

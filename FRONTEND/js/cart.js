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

function getWaterPillClass(waterType) {
  const w = (waterType || "").toLowerCase();
  if (w.includes("mặn")) return "water-pill--salt";
  if (w.includes("lợ")) return "water-pill--brackish";
  return "water-pill--fresh";
}

// Phân tích độ tương thích sinh học giữa các loài trong giỏ hàng
function analyzeBioCompatibility(cartItemsWithProducts) {
  const boxEl = document.getElementById("bio-compatibility-box");
  const badgeEl = document.getElementById("tank-recommended-badge");
  if (!boxEl) return 0;

  if (!cartItemsWithProducts.length) {
    boxEl.className = "bio-advisor hidden";
    boxEl.innerHTML = "";
    if (badgeEl) badgeEl.textContent = "Khuyến nghị cho giỏ hàng: 0 Lít";
    return 0;
  }

  const waterGroups = new Map();
  let hasShrimp = false;
  const predatorNames = [];
  let recommendedLiters = 0;

  const PREDATOR_KEYWORDS = [
    "betta",
    "rồng",
    "đĩa",
    "vàng",
    "koi",
    "thần tiên",
    "ali",
    "la hán",
    "tai tượng",
    "nhám",
    "nemo",
    "blue tang",
  ];

  cartItemsWithProducts.forEach(({ product, qty }) => {
    const wt = product.waterType || "Nước ngọt";
    if (!waterGroups.has(wt)) waterGroups.set(wt, []);
    waterGroups.get(wt).push(product.name);

    const speciesLower = (product.species || "").toLowerCase();
    const nameLower = (product.name || "").toLowerCase();

    if (speciesLower.includes("tép") || nameLower.includes("tép")) {
      hasShrimp = true;
      recommendedLiters += qty * 1.5;
    } else if (speciesLower.includes("ốc") || nameLower.includes("ốc")) {
      recommendedLiters += qty * 2;
    } else {
      recommendedLiters += qty * 6;
    }

    if (PREDATOR_KEYWORDS.some((kw) => nameLower.includes(kw))) {
      predatorNames.push(product.name);
    }
  });

  recommendedLiters = Math.max(15, Math.ceil(recommendedLiters / 5) * 5);
  if (badgeEl) {
    badgeEl.textContent = `Khuyến nghị cho giỏ hàng: ≥ ${recommendedLiters} Lít`;
  }

  const messages = [];
  let level = "info";

  if (waterGroups.size > 1) {
    level = "danger";
    const groupSummary = Array.from(waterGroups.entries())
      .map(([wt, names]) => `<strong>${wt}</strong> (${names.slice(0, 2).join(", ")}${names.length > 2 ? "..." : ""})`)
      .join(" và ");
    messages.push(
      `⚠️ <strong>Cảnh báo môi trường nước không tương thích:</strong> Giỏ hàng đang có cả sinh vật ${groupSummary}. Tuyệt đối <strong>không thả chung một bể</strong> vì độ mặn và pH khác nhau sẽ gây sốc nước!`
    );
  }

  if (hasShrimp && predatorNames.length > 0) {
    if (level !== "danger") level = "warning";
    messages.push(
      `💡 <strong>Tư vấn ghép bể sinh học:</strong> Bạn đang chọn <strong>Tép cảnh</strong> cùng với dòng cá có kích thước lớn/tập tính săn mồi (<em>${predatorNames.slice(0, 2).join(", ")}</em>). Nên bố trí nhiều rêu, lũa ẩn nấp hoặc nuôi tách bể để bảo vệ đàn tép.`
    );
  }

  if (messages.length === 0) {
    const onlyWater = Array.from(waterGroups.keys())[0] || "Nước ngọt";
    messages.push(
      `✅ <strong>Tương thích sinh học tốt:</strong> Tất cả sinh vật trong giỏ hàng đều thuộc môi trường <strong>${onlyWater}</strong>. Nhiệt độ nước lý tưởng: <strong>24°C – 28°C</strong>, nên ngâm bịch cân bằng nhiệt 15 phút trước khi thả.`
    );
  }

  boxEl.className = `bio-advisor ${
    level === "danger"
      ? "bio-advisor--danger"
      : level === "warning"
      ? "bio-advisor--warning"
      : ""
  }`;
  boxEl.innerHTML = `
    <h4>🔬 Trợ lý Sinh học Aqualife (Kiểm tra tương thích tự động)</h4>
    <ul>
      ${messages.map((m) => `<li>${m}</li>`).join("")}
    </ul>
  `;

  return recommendedLiters;
}

function updateTankCalculatorUI(recommendedLiters) {
  const lengthEl = document.getElementById("tank-length");
  const widthEl = document.getElementById("tank-width");
  const heightEl = document.getElementById("tank-height");
  const resultEl = document.getElementById("tank-calc-result");

  if (!lengthEl || !widthEl || !heightEl || !resultEl) return;

  const l = Math.max(0, Number(lengthEl.value || 0));
  const w = Math.max(0, Number(widthEl.value || 0));
  const h = Math.max(0, Number(heightEl.value || 0));

  const grossLiters = Math.round((l * w * h) / 1000);
  const netLiters = Math.round(grossLiters * 0.85);
  const filterFlow = netLiters * 5;
  const heaterWatts = netLiters;

  let statusHtml = "";
  if (recommendedLiters <= 0) {
    statusHtml = `<span style="color:#0369a1;font-weight:600;">Hãy thêm cá/tép vào giỏ hàng để đối chiếu mật độ nuôi.</span>`;
  } else if (netLiters >= recommendedLiters) {
    statusHtml = `<span style="color:#15803d;font-weight:700;">✔ Bể ${netLiters}L hoàn toàn đáp ứng tốt cho giỏ hàng hiện tại (yêu cầu ≥ ${recommendedLiters}L).</span>`;
  } else {
    statusHtml = `<span style="color:#b91c1c;font-weight:700;">⚠ Thể tích nước thực tế (${netLiters}L) đang nhỏ hơn mức khuyến nghị (${recommendedLiters}L). Nên tăng kích thước bể hoặc trang bị thêm sủi oxy/lọc vi sinh mạnh.</span>`;
  }

  resultEl.innerHTML = `
    <p style="margin:0 0 6px 0;">
      <strong>Thể tích tổng:</strong> ${grossLiters} Lít &nbsp;|&nbsp;
      <strong>Thể tích nước thực tế (-15% nền/lũa):</strong> ${netLiters} Lít &nbsp;|&nbsp;
      <strong>Công suất lọc khuyên dùng:</strong> ${filterFlow} L/h &nbsp;|&nbsp;
      <strong>Sưởi:</strong> ${heaterWatts}W
    </p>
    <p style="margin:0;">${statusHtml}</p>
  `;
}

// Ham render giao dien gio hang, cho phep nhap so luong truc tiep qua textbox (nhap 0 de xoa), tang/giam hoac xoa
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
    const rec = analyzeBioCompatibility([]);
    updateTankCalculatorUI(rec);
    return;
  }

  emptyEl.classList.add("hidden");

  let total = 0;
  const cartItemsWithProducts = [];

  listEl.innerHTML = entries
    .map(([id, qty]) => {
      const product = Aqualife.findProductById(products, id);
      if (!product) return "";
      const numQty = Number(qty);
      const selectedSize = Aqualife.getProductSelectedSize
        ? Aqualife.getProductSelectedSize(product)
        : "";
      const unitPrice = Aqualife.getProductEffectivePrice
        ? Aqualife.getProductEffectivePrice(product, selectedSize)
        : product.price;
      const subtotal = unitPrice * numQty;
      total += subtotal;
      cartItemsWithProducts.push({ product, qty: numQty });

      const stockInfo =
        typeof product.stock === "number" ? `Kho: ${product.stock}` : "";
      const waterType = product.waterType || "Nước ngọt";
      const pillClass = getWaterPillClass(waterType);

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
            <h3>
              <a href="product-detail.html?id=${product.id}">${product.name}</a>
              <span class="water-pill ${pillClass}">${waterType}</span>
            </h3>
            <p class="muted">Mã SP: #${product.id} — ${product.shortDescription || ""} ${stockInfo ? `(${stockInfo})` : ""}</p>
            ${sizeControlHtml}
            <p class="price">Đơn giá: ${Aqualife.formatCurrency(unitPrice)}</p>
          </div>
          <div>
            <div class="cart-item__actions">
              <button class="btn btn-ghost" data-action="minus" type="button" title="Giảm 1">-</button>
              <input
                type="number"
                min="0"
                max="${product.stock ?? 999}"
                value="${numQty}"
                class="cart-qty-input"
                data-action="input-qty"
                title="Nhập số lượng thay thế (Nhập 0 để xóa)"
                aria-label="Số lượng sản phẩm ${product.name}"
              />
              <button class="btn btn-ghost" data-action="plus" type="button" title="Tăng 1">+</button>
              <button class="btn btn-danger" data-action="remove" type="button">Xoá</button>
            </div>
            <div class="cart-item__actions" style="margin-top: 6px;">
              <p style="margin:0;"><strong>Tạm tính:</strong></p>
              <p class="price" style="text-align:right;margin:0;">${Aqualife.formatCurrency(subtotal)}</p>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  totalEl.textContent = Aqualife.formatCurrency(total);

  const recommendedLiters = analyzeBioCompatibility(cartItemsWithProducts);
  updateTankCalculatorUI(recommendedLiters);

  listEl.querySelectorAll(".cart-size-select").forEach((selectEl) => {
    selectEl.addEventListener("change", () => {
      const id = selectEl.dataset.id;
      if (id && Aqualife.setCartItemSize) {
        Aqualife.setCartItemSize(id, selectEl.value);
        renderCart(products);
      }
    });
  });

  // Sự kiện bấm nút +, -, Xoá
  listEl.querySelectorAll("button[data-action]").forEach((button) => {
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

  // Sự kiện nhập số trực tiếp vào Textbox (Nhập 0 được hiểu là xóa dòng đó)
  listEl.querySelectorAll('input[data-action="input-qty"]').forEach((inputEl) => {
    const applyNewQty = () => {
      const itemEl = inputEl.closest("[data-id]");
      const id = itemEl?.dataset.id;
      if (!id) return;

      const rawVal = inputEl.value.trim();
      if (rawVal === "") {
        renderCart(products);
        return;
      }

      const parsed = Number(rawVal);
      if (Number.isNaN(parsed) || parsed < 0) {
        Aqualife.showToast("Vui lòng nhập số lượng hợp lệ (≥ 0).", "error");
        renderCart(products);
        return;
      }

      Aqualife.updateCartItemQty(id, Math.floor(parsed));
      renderCart(products);
    };

    inputEl.addEventListener("change", applyNewQty);
    inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        inputEl.blur();
      }
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

    ["tank-length", "tank-width", "tank-height"].forEach((inputId) => {
      const el = document.getElementById(inputId);
      if (el) {
        el.addEventListener("input", () => renderCart(products));
      }
    });

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

const STATUS_LABELS = {
  pending: { text: "Chờ xác nhận", color: "#d97706", bg: "#fef3c7" },
  confirmed: { text: "Đã xác nhận", color: "#2563eb", bg: "#dbeafe" },
  processing: { text: "Đang chuẩn bị hàng", color: "#7c3aed", bg: "#ede9fe" },
  shipping: { text: "Đang giao hàng", color: "#0284c7", bg: "#e0f2fe" },
  completed: { text: "Hoàn thành", color: "#16a34a", bg: "#dcfce7" },
  cancelled: { text: "Đã hủy", color: "#dc2626", bg: "#fee2e2" },
};

const PAYMENT_LABELS = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank_transfer: "Chuyển khoản ngân hàng (VietQR)",
};

function formatDateTime(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
}

function normalizeOrderThumb(img) {
  if (!img) return "../image/ocean-bg.svg";
  if (img.startsWith("../") || img.startsWith("http") || img.startsWith("/")) {
    return img.startsWith("/image/") ? `..${img}` : img;
  }
  return `../${img}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("orders-list");
  const emptyEl = document.getElementById("orders-empty");
  const feedbackEl = document.getElementById("orders-feedback");
  const detailModalEl = document.getElementById("order-detail-modal");
  const detailBodyEl = document.getElementById("order-detail-body");
  const closeModalBtn = document.getElementById("btn-close-order-modal");
  const printOrderBtn = document.getElementById("btn-print-order");

  if (!listEl || !emptyEl) return;

  function showFeedback(type, message) {
    if (!feedbackEl) return;
    feedbackEl.className = `alert alert-${type}`;
    feedbackEl.textContent = message;
    feedbackEl.classList.remove("hidden");
  }

  if (closeModalBtn && detailModalEl) {
    closeModalBtn.addEventListener("click", () => {
      detailModalEl.classList.add("hidden");
    });
    detailModalEl.addEventListener("click", (e) => {
      if (e.target === detailModalEl) {
        detailModalEl.classList.add("hidden");
      }
    });
  }

  if (printOrderBtn) {
    printOrderBtn.addEventListener("click", () => {
      window.print();
    });
  }

  // Gọi API GET /api/orders/:id để lấy chi tiết Order + OrderDetail (JOIN bảng products)
  async function openOrderDetailModal(orderId) {
    if (!detailModalEl || !detailBodyEl) return;
    detailBodyEl.innerHTML = `<p class="muted">Đang tải chi tiết đơn hàng #${orderId}...</p>`;
    detailModalEl.classList.remove("hidden");

    try {
      const order = await Aqualife.apiFetch(`/orders/${orderId}`);
      const st = STATUS_LABELS[order.status] || {
        text: order.status,
        color: "#374151",
        bg: "#f3f4f6",
      };

      const rowsHtml = (order.items || [])
        .map(
          (item, idx) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${idx + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">#${item.product_id || "-"}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:10px;">
              <img src="${normalizeOrderThumb(item.image)}" alt="${item.product_name}" style="width:46px;height:36px;object-fit:cover;border-radius:6px;border:1px solid #cbd5e1;" />
              <a href="product-detail.html?id=${item.product_id}" style="font-weight:600;color:#0369a1;">${item.product_name}</a>
            </td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${Aqualife.formatCurrency(item.unit_price)}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0284c7;">${Aqualife.formatCurrency(item.subtotal)}</td>
          </tr>
        `
        )
        .join("");

      detailBodyEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e2e8f0;padding-bottom:12px;margin-bottom:14px;">
          <div>
            <h2 style="margin:0;color:#0c4a6e;">Chi tiết Đơn hàng #${order.id}</h2>
            <p class="muted" style="margin:4px 0 0 0;font-size:0.9rem;">Mã User: #${order.user_id} • Thời gian tạo: ${formatDateTime(order.created_at)}</p>
          </div>
          <span style="padding:6px 14px;border-radius:999px;font-weight:700;color:${st.color};background:${st.bg};">
            ${st.text}
          </span>
        </div>

        <div style="background:#f8fafc;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:0.94rem;">
          <p style="margin:4px 0;"><strong>Người nhận:</strong> ${order.shipping_name} &nbsp;|&nbsp; <strong>SĐT:</strong> ${order.shipping_phone}</p>
          <p style="margin:4px 0;"><strong>Địa chỉ giao hàng:</strong> ${order.shipping_address}</p>
          <p style="margin:4px 0;">
            <strong>Phương thức thanh toán:</strong> ${PAYMENT_LABELS[order.payment_method] || order.payment_method}
            &nbsp;|&nbsp;
            <strong>Vận chuyển:</strong> ${order.shipping_method === "express" ? "⚡ Giao hỏa tốc" : "🚚 Giao tiêu chuẩn"} (${Number(order.shipping_fee) === 0 ? "Miễn phí" : Aqualife.formatCurrency(order.shipping_fee || 0)})
          </p>
          ${
            order.voucher_code
              ? `<p style="margin:4px 0;color:#0284c7;"><strong>Mã voucher đã dùng:</strong> <span style="font-weight:700;background:#e0f2fe;padding:2px 8px;border-radius:4px;">${order.voucher_code}</span> (Tiết kiệm ${Aqualife.formatCurrency(order.discount_amount || 0)})</p>`
              : ""
          }
        </div>

        <h4 style="margin:0 0 8px 0;">Danh sách Chi tiết Sản phẩm (OrderDetail JOIN Product)</h4>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:0.92rem;">
            <thead>
              <tr style="background:#e0f2fe;color:#0369a1;">
                <th style="padding:8px;text-align:left;">STT</th>
                <th style="padding:8px;text-align:left;">Mã SP</th>
                <th style="padding:8px;text-align:left;">Sản phẩm</th>
                <th style="padding:8px;text-align:right;">Đơn giá</th>
                <th style="padding:8px;text-align:center;">SL</th>
                <th style="padding:8px;text-align:right;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div style="display:flex;flex-direction:column;align-items:flex-end;margin-top:14px;gap:4px;font-size:0.94rem;">
          <div>Tạm tính hàng: <strong>${Aqualife.formatCurrency(order.subtotal_amount || order.total_amount)}</strong></div>
          <div>Phí vận chuyển: <strong>${Number(order.shipping_fee) === 0 ? "Miễn phí" : Aqualife.formatCurrency(order.shipping_fee || 0)}</strong></div>
          ${
            order.voucher_code
              ? `<div style="color:#16a34a;">Giảm giá (${order.voucher_code}): <strong>-${Aqualife.formatCurrency(order.discount_amount || 0)}</strong></div>`
              : ""
          }
          <div style="font-size:1.15rem;margin-top:4px;border-top:1px solid #cbd5e1;padding-top:6px;">
            <strong>Tổng cộng đơn hàng: &nbsp;</strong>
            <span class="price">${Aqualife.formatCurrency(order.total_amount)}</span>
          </div>
        </div>

        <div style="margin-top:16px;padding:12px 16px;border-radius:8px;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;font-size:0.88rem;">
          <strong>🛡️ Chứng nhận Bảo hành Sống 100% (DOA) &amp; Quy trình thả cá an toàn:</strong>
          <ol style="margin:6px 0 0 0;padding-left:18px;">
            <li><strong>Bước 1 (Cân bằng nhiệt):</strong> Ngâm nguyên túi cá chưa mở vào bể khoảng 15–20 phút.</li>
            <li><strong>Bước 2 (Quen nước):</strong> Mở túi, châm thêm từng chút nước trong bể vào túi mỗi 5 phút (lặp lại 3 lần).</li>
            <li><strong>Bước 3 (Thả cá):</strong> Dùng vợt vớt nhẹ cá thả vào bể, không đổ nước trong túi vận chuyển vào bể.</li>
          </ol>
        </div>
      `;
    } catch (err) {
      detailBodyEl.innerHTML = `<div class="alert alert-error">${err.message || "Không thể tải chi tiết đơn hàng."}</div>`;
    }
  }

  async function loadOrders() {
    try {
      const orders = await Aqualife.apiFetch("/orders");

      if (!Array.isArray(orders) || orders.length === 0) {
        listEl.innerHTML = "";
        emptyEl.classList.remove("hidden");
        return;
      }

      emptyEl.classList.add("hidden");

      listEl.innerHTML = orders
        .map((order) => {
          const st = STATUS_LABELS[order.status] || {
            text: order.status,
            color: "#374151",
            bg: "#f3f4f6",
          };
          const canCancel =
            order.status === "pending" || order.status === "confirmed";

          const itemsHtml = (order.items || [])
            .map(
              (item) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #e2e8f0;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <img src="${normalizeOrderThumb(item.image)}" alt="${item.product_name}" style="width:44px;height:34px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;" />
                  <div>
                    <strong>${item.product_name}</strong>
                    <span class="muted"> (Mã SP: #${item.product_id || "-"}) x ${item.quantity} (${Aqualife.formatCurrency(item.unit_price)}/sp)</span>
                  </div>
                </div>
                <div class="price">${Aqualife.formatCurrency(item.subtotal)}</div>
              </div>
            `
            )
            .join("");

          return `
            <article class="card" style="padding:20px;margin-bottom:16px;" data-order-id="${order.id}">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
                <div>
                  <h3 style="margin:0;">Đơn hàng #${order.id}</h3>
                  <p class="muted" style="margin:4px 0 0 0;font-size:0.9rem;">
                    Ngày đặt: ${formatDateTime(order.created_at)}
                  </p>
                </div>
                <span style="padding:6px 14px;border-radius:999px;font-weight:600;font-size:0.9rem;color:${st.color};background:${st.bg};">
                  ${st.text}
                </span>
              </div>

              <div style="background:#f8fafc;padding:12px 16px;border-radius:8px;margin-bottom:12px;font-size:0.95rem;">
                <p style="margin:4px 0;"><strong>Người nhận:</strong> ${order.shipping_name} — <strong>SĐT:</strong> ${order.shipping_phone}</p>
                <p style="margin:4px 0;"><strong>Địa chỉ giao hàng:</strong> ${order.shipping_address}</p>
                <p style="margin:4px 0;">
                  <strong>Phương thức thanh toán:</strong> ${PAYMENT_LABELS[order.payment_method] || order.payment_method}
                  &nbsp;|&nbsp;
                  <strong>Vận chuyển:</strong> ${order.shipping_method === "express" ? "⚡ Hỏa tốc" : "🚚 Tiêu chuẩn"} (${Number(order.shipping_fee) === 0 ? "Miễn phí" : Aqualife.formatCurrency(order.shipping_fee || 0)})
                </p>
                ${
                  order.voucher_code
                    ? `<p style="margin:4px 0;color:#0284c7;"><strong>Voucher:</strong> <span style="font-weight:700;background:#e0f2fe;padding:2px 8px;border-radius:4px;">${order.voucher_code}</span> (Giảm -${Aqualife.formatCurrency(order.discount_amount || 0)})</p>`
                    : ""
                }
              </div>

              <div style="margin-bottom:14px;">
                ${itemsHtml}
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div>
                  <strong>Tổng thanh toán:</strong>
                  <span class="price" style="font-size:1.15rem;margin-left:8px;">
                    ${Aqualife.formatCurrency(order.total_amount)}
                  </span>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  <button class="btn btn-ghost btn-view-order" data-id="${order.id}" type="button">
                    🔍 Xem chi tiết &amp; Hóa đơn
                  </button>
                  ${
                    canCancel
                      ? `<button class="btn btn-danger btn-cancel-order" data-id="${order.id}" type="button">Hủy đơn hàng</button>`
                      : ""
                  }
                </div>
              </div>
            </article>
          `;
        })
        .join("");

      listEl.querySelectorAll(".btn-view-order").forEach((btn) => {
        btn.addEventListener("click", () => {
          const orderId = btn.dataset.id;
          if (orderId) openOrderDetailModal(orderId);
        });
      });

      listEl.querySelectorAll(".btn-cancel-order").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const orderId = btn.dataset.id;
          if (!orderId) return;
          if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId} không?`)) {
            return;
          }

          btn.disabled = true;
          try {
            await Aqualife.apiFetch(`/orders/${orderId}/cancel`, {
              method: "PATCH",
            });
            showFeedback(
              "success",
              `Đã hủy đơn hàng #${orderId} và hoàn lại số lượng tồn kho.`
            );
            await loadOrders();
          } catch (err) {
            showFeedback("error", err.message || "Không thể hủy đơn hàng.");
            btn.disabled = false;
          }
        });
      });
    } catch (err) {
      if (err.message && err.message.includes("Chưa đăng nhập")) {
        showFeedback("error", "Vui lòng đăng nhập để xem lịch sử đơn hàng.");
        setTimeout(() => {
          window.location.href = "auth.html?redirect=orders.html";
        }, 1200);
        return;
      }
      listEl.innerHTML = `<div class="empty">${err.message}</div>`;
    }
  }

  await loadOrders();
});

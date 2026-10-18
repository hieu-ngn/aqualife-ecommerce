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
  bank_transfer: "Chuyển khoản ngân hàng",
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

document.addEventListener("DOMContentLoaded", async () => {
  const listEl = document.getElementById("orders-list");
  const emptyEl = document.getElementById("orders-empty");
  const feedbackEl = document.getElementById("orders-feedback");

  if (!listEl || !emptyEl) return;

  function showFeedback(type, message) {
    if (!feedbackEl) return;
    feedbackEl.className = `alert alert-${type}`;
    feedbackEl.textContent = message;
    feedbackEl.classList.remove("hidden");
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
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #e2e8f0;">
                <div>
                  <strong>${item.product_name}</strong>
                  <span class="muted"> x ${item.quantity} (${Aqualife.formatCurrency(item.unit_price)}/sp)</span>
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
                <p style="margin:4px 0;"><strong>Phương thức thanh toán:</strong> ${PAYMENT_LABELS[order.payment_method] || order.payment_method}</p>
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
                <div>
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

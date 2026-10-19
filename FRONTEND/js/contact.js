const CONTACT_HISTORY_KEY = "aqualife_contact_history_v1";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{8,15}$/;

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("contact-form");
  const result = document.getElementById("contact-result");
  const messageEl = document.getElementById("contact-message");
  const charCountEl = document.getElementById("char-count");
  const submitBtn = document.getElementById("contact-submit");
  const recentBox = document.getElementById("recent-contacts-box");
  const recentList = document.getElementById("recent-contacts-list");

  // 1. Tự động điền thông tin nếu khách đã đăng nhập
  async function prefillContactUser() {
    if (!form) return;
    let user = null;
    try {
      const cached = localStorage.getItem("aqualife_user_info");
      if (cached) user = JSON.parse(cached);
    } catch {
      user = null;
    }

    if (!user && window.Aqualife && window.Aqualife.apiFetch) {
      try {
        user = await window.Aqualife.apiFetch("/auth/me");
      } catch {
        user = null;
      }
    }

    if (!user) return;
    const nameInput = form.elements.namedItem("name");
    const emailInput = form.elements.namedItem("email");
    const phoneInput = form.elements.namedItem("phone");

    if (nameInput && !nameInput.value && user.name) {
      nameInput.value = user.name;
    }
    if (emailInput && !emailInput.value && user.email) {
      emailInput.value = user.email;
    }
    if (phoneInput && !phoneInput.value && user.phone) {
      phoneInput.value = user.phone;
    }
  }

  // 2. Bộ đếm ký tự nội dung tin nhắn
  if (messageEl && charCountEl) {
    const updateCounter = () => {
      const len = messageEl.value.length;
      charCountEl.textContent = `${len} / 500 ký tự`;
      charCountEl.style.color = len >= 450 ? "#d97706" : "";
    };
    messageEl.addEventListener("input", updateCounter);
    updateCounter();
  }

  // 3. Hiển thị lịch sử yêu cầu hỗ trợ đã gửi trên trình duyệt
  function getRecentContacts() {
    try {
      const raw = localStorage.getItem(CONTACT_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveContactTicket(ticket) {
    const list = getRecentContacts();
    list.unshift(ticket);
    localStorage.setItem(CONTACT_HISTORY_KEY, JSON.stringify(list.slice(0, 3)));
    renderRecentContacts();
  }

  function renderRecentContacts() {
    if (!recentBox || !recentList) return;
    const list = getRecentContacts();
    if (!list.length) {
      recentBox.classList.add("hidden");
      return;
    }
    recentBox.classList.remove("hidden");
    recentList.innerHTML = list
      .map(
        (item) => `
        <li>
          <div class="ticket-head">
            <span>Mã phiếu: #${item.ticketId} — ${item.subject}</span>
            <span class="muted" style="font-weight:400;">${item.createdAt}</span>
          </div>
          <div class="muted">${item.message}</div>
        </li>
      `
      )
      .join("");
  }

  function showMessage(type, text) {
    if (!result) return;
    result.className = `alert alert-${type}`;
    result.textContent = text;
    result.classList.remove("hidden");
  }

  // 4. Xử lý gửi biểu mẫu liên hệ
  if (form && result) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const nameEl = form.elements.namedItem("name");
      const phoneEl = form.elements.namedItem("phone");
      const emailEl = form.elements.namedItem("email");
      const orderCodeEl = form.elements.namedItem("order_code");
      const subjectEl = form.elements.namedItem("subject");

      const name = String(nameEl?.value || "").trim();
      const phone = String(phoneEl?.value || "").trim();
      const email = String(emailEl?.value || "").trim();
      const orderCode = String(orderCodeEl?.value || "").trim();
      const subject = String(subjectEl?.value || "Tư vấn chung").trim();
      const message = String(messageEl?.value || "").trim();

      // Reset border
      [nameEl, phoneEl, emailEl, messageEl].forEach((el) => {
        if (el) el.style.borderColor = "";
      });

      if (!name || !phone || !email || !message) {
        [nameEl, phoneEl, emailEl, messageEl].forEach((el) => {
          if (el && !String(el.value || "").trim()) {
            el.style.borderColor = "#c83b3b";
          }
        });
        showMessage("error", "Vui lòng điền đầy đủ các trường bắt buộc (*).");
        return;
      }

      if (!PHONE_REGEX.test(phone)) {
        if (phoneEl) phoneEl.style.borderColor = "#c83b3b";
        showMessage("error", "Số điện thoại không hợp lệ (cần từ 8 - 15 chữ số).");
        return;
      }

      if (!EMAIL_REGEX.test(email)) {
        if (emailEl) emailEl.style.borderColor = "#c83b3b";
        showMessage("error", "Địa chỉ email không hợp lệ.");
        return;
      }

      if (message.length < 10) {
        if (messageEl) messageEl.style.borderColor = "#c83b3b";
        showMessage("error", "Nội dung liên hệ cần ít nhất 10 ký tự để chúng tôi hỗ trợ tốt nhất.");
        return;
      }

      if (submitBtn) submitBtn.disabled = true;

      const ticketId = `AQ-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowStr = new Date().toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      saveContactTicket({
        ticketId,
        name,
        phone,
        email,
        orderCode,
        subject,
        message,
        createdAt: nowStr,
      });

      showMessage(
        "success",
        `Cảm ơn ${name}! Yêu cầu "${subject}" (Mã phiếu #${ticketId}) đã được ghi nhận. Chuyên viên Aqualife sẽ phản hồi qua SĐT ${phone} hoặc email ${email} trong thời gian sớm nhất.`
      );

      if (messageEl) messageEl.value = "";
      if (orderCodeEl) orderCodeEl.value = "";
      if (charCountEl) charCountEl.textContent = "0 / 500 ký tự";
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  // 5. Xử lý đóng/mở FAQ Accordion
  const faqItems = document.querySelectorAll("#faq-list .faq-item");
  faqItems.forEach((item) => {
    const btn = item.querySelector(".faq-question");
    btn?.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");
      faqItems.forEach((other) => other.classList.remove("active"));
      if (!isOpen) {
        item.classList.add("active");
      }
    });
  });

  // 6. Xử lý đăng ký Newsletter ở Footer
  const newsletterBtn = document.getElementById("newsletter-btn");
  const newsletterEmail = document.getElementById("newsletter-email");
  if (newsletterBtn && newsletterEmail) {
    newsletterBtn.addEventListener("click", () => {
      const val = newsletterEmail.value.trim();
      if (!EMAIL_REGEX.test(val)) {
        alert("Vui lòng nhập email hợp lệ để đăng ký nhận bản tin Aqualife.");
        return;
      }
      alert(`Cảm ơn bạn! Email ${val} đã được đăng ký nhận ưu đãi từ Aqualife.`);
      newsletterEmail.value = "";
    });
  }

  // 7. Đồng bộ 4 thẻ thông tin liên hệ theo thông tin Admin
  async function loadAdminContactInfo() {
    let info = null;
    try {
      const cached = localStorage.getItem("aqualife_store_info_v1");
      if (cached) info = JSON.parse(cached);
    } catch {
      info = null;
    }

    if (window.Aqualife && window.Aqualife.apiFetch) {
      try {
        const fresh = await window.Aqualife.apiFetch("/store-info");
        if (fresh) {
          info = fresh;
          localStorage.setItem("aqualife_store_info_v1", JSON.stringify(fresh));
        }
      } catch {
        // Giữ dữ liệu cache hoặc mặc định
      }
    }

    if (!info) return;

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.textContent = val;
    };

    // Thẻ 1: Showroom & Studio (Địa chỉ Admin)
    setText("contact-studio-title", info.studio_title);
    setText("contact-address", info.address);
    setText("contact-address-sub", info.address_sub);

    // Thẻ 2: Hotline & Zalo 24/7 (Số điện thoại Admin)
    setText("contact-hotline-title", info.hotline_title);
    const phoneLink = document.getElementById("contact-phone-link");
    if (phoneLink && info.phone) {
      phoneLink.textContent = info.phone;
      phoneLink.href = `tel:${String(info.phone).replace(/\s+/g, "")}`;
    }
    setText("contact-hotline-sub", info.hotline_sub);

    // Thẻ 3: Hộp thư Điện tử (Email Admin)
    setText("contact-email-title", info.email_title);
    const emailLink = document.getElementById("contact-email-link");
    if (emailLink && info.email) {
      emailLink.textContent = info.email;
      emailLink.href = `mailto:${info.email}`;
    }
    setText("contact-email-sub", info.email_sub);

    // Thẻ 4: Giờ Mở Cửa
    setText("contact-hours-title", info.hours_title);
    setText("contact-hours", info.open_hours);
    setText("contact-hours-sub", info.open_hours_sub);

    // Bản đồ & Footer
    setText("contact-map-address", info.address);
    const mapLink = document.getElementById("contact-map-link");
    if (mapLink && info.address) {
      mapLink.href = `https://maps.google.com/?q=${encodeURIComponent(info.address)}`;
    }
    setText("footer-store-address", info.address);
    setText("footer-store-phone", info.phone);
    setText("footer-store-email", info.email);
  }

  await loadAdminContactInfo();
  await prefillContactUser();
  renderRecentContacts();
});


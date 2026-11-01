const HASH_ALIAS_MAP = {
  "#doa": "muc-01",
  "#shipping": "muc-02",
  "#warranty": "muc-03",
  "#privacy": "muc-04",
  "#terms": "muc-05",
  "#muc-01": "muc-01",
  "#muc-02": "muc-02",
  "#muc-03": "muc-03",
  "#muc-04": "muc-04",
  "#muc-05": "muc-05",
};

document.addEventListener("DOMContentLoaded", () => {
  const tocLinks = Array.from(document.querySelectorAll("#policy-toc-nav .toc-link"));
  const sections = Array.from(document.querySelectorAll(".policy-section"));

  function setActiveToc(sectionId) {
    tocLinks.forEach((link) => {
      const isMatch = link.getAttribute("data-section") === sectionId;
      link.classList.toggle("active", isMatch);
    });
  }

  function scrollToSection(sectionId, smooth = true) {
    const targetEl = document.getElementById(sectionId);
    if (!targetEl) return;
    setActiveToc(sectionId);
    targetEl.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "start",
    });
  }

  // 1. Click trên Mục lục văn bản
  tocLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sectionId = link.getAttribute("data-section");
      if (!sectionId) return;
      history.replaceState(null, "", `#${sectionId}`);
      scrollToSection(sectionId, true);
    });
  });

  // 2. Tự động cập nhật mục lục khi cuộn trang (ScrollSpy)
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const scrollThreshold = window.scrollY + 150;
      let currentId = sections[0]?.id || "muc-01";
      for (const sec of sections) {
        if (sec.offsetTop <= scrollThreshold) {
          currentId = sec.id;
        }
      }
      setActiveToc(currentId);
      ticking = false;
    });
  });

  // 3. Xử lý hash trên URL khi mở từ Footer các trang khác
  function handleInitialHash() {
    const rawHash = (window.location.hash || "").toLowerCase();
    const mappedId = HASH_ALIAS_MAP[rawHash];
    if (mappedId) {
      setTimeout(() => scrollToSection(mappedId, true), 80);
    }
  }
  handleInitialHash();
  window.addEventListener("hashchange", handleInitialHash);

  // 4. Modal Khiếu nại kiện hàng khẩn cấp (DOA Claim)
  const modalBackdrop = document.getElementById("claim-modal-backdrop");
  const openModalBtn = document.getElementById("open-claim-modal-btn");
  const floatingBtn = document.getElementById("floating-support-btn");
  const closeModalBtn = document.getElementById("close-claim-modal-btn");
  const claimForm = document.getElementById("quick-claim-form");
  const claimFeedback = document.getElementById("claim-feedback");
  const claimPhoneInput = document.getElementById("claim-phone");

  function openClaimModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("hidden");
    try {
      const cached = localStorage.getItem("aqualife_user_info");
      if (cached && claimPhoneInput && !claimPhoneInput.value) {
        const user = JSON.parse(cached);
        if (user && user.phone) {
          claimPhoneInput.value = user.phone;
        }
      }
    } catch {
      // ignore
    }
  }

  function closeClaimModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.add("hidden");
  }

  openModalBtn?.addEventListener("click", openClaimModal);
  floatingBtn?.addEventListener("click", openClaimModal);
  closeModalBtn?.addEventListener("click", closeClaimModal);
  modalBackdrop?.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) {
      closeClaimModal();
    }
  });

  claimForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const orderId = document.getElementById("claim-order-id")?.value.trim() || "";
    const phone = claimPhoneInput?.value.trim() || "";
    const note = document.getElementById("claim-note")?.value.trim() || "";

    if (!orderId || !phone || !note) {
      if (claimFeedback) {
        claimFeedback.className = "alert alert-error";
        claimFeedback.textContent = "Vui lòng nhập đầy đủ Mã đơn hàng, Số điện thoại và Mô tả tình trạng.";
        claimFeedback.classList.remove("hidden");
      }
      return;
    }

    const claimCode = `DOA-${Math.floor(1000 + Math.random() * 9000)}`;
    if (claimFeedback) {
      claimFeedback.className = "alert alert-success";
      claimFeedback.textContent = `Đã tiếp nhận hồ sơ bảo hành #${claimCode} cho đơn ${orderId}. Chuyên viên DOA sẽ gọi tới ${phone} trong ít phút!`;
      claimFeedback.classList.remove("hidden");
    }
    if (window.Aqualife && window.Aqualife.showToast) {
      window.Aqualife.showToast(`Đã gửi yêu cầu bảo hành #${claimCode} thành công!`, "success");
    }
    claimForm.reset();
  });

  // 5. Đăng ký Newsletter ở Footer
  const newsletterBtn = document.getElementById("policy-newsletter-btn");
  const newsletterEmail = document.getElementById("policy-newsletter-email");
  newsletterBtn?.addEventListener("click", () => {
    const val = (newsletterEmail?.value || "").trim();
    if (!val || !val.includes("@")) {
      if (window.Aqualife && window.Aqualife.showToast) {
        window.Aqualife.showToast("Vui lòng nhập địa chỉ email hợp lệ.", "error");
      }
      return;
    }
    if (window.Aqualife && window.Aqualife.showToast) {
      window.Aqualife.showToast(`Cảm ơn bạn! Email ${val} đã được đăng ký nhận tin.`, "success");
    }
    if (newsletterEmail) newsletterEmail.value = "";
  });
});

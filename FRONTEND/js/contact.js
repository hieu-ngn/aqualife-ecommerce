document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const result = document.getElementById("contact-result");

  if (!form || !result) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = String(form.elements.namedItem("name")?.value || "").trim();
    const email = String(form.elements.namedItem("email")?.value || "").trim();
    const message = String(form.elements.namedItem("message")?.value || "").trim();

    if (!name || !email || !message) {
      result.className = "alert alert-error";
      result.textContent = "Vui lòng điền đầy đủ thông tin.";
      result.classList.remove("hidden");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      result.className = "alert alert-error";
      result.textContent = "Email không hợp lệ.";
      result.classList.remove("hidden");
      return;
    }

    result.className = "alert alert-success";
    result.textContent = "Đã gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm.";
    result.classList.remove("hidden");
    form.reset();
  });
});

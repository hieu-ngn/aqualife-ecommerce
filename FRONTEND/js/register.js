document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const result = document.getElementById("register-result");
  if (!form || !result) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = String(form.elements.namedItem("name")?.value || "").trim();
    const email = String(form.elements.namedItem("email")?.value || "").trim();
    const password = String(form.elements.namedItem("password")?.value || "");
    const confirm = String(form.elements.namedItem("confirm")?.value || "");

    if (!name || !email || !password || !confirm) {
      result.className = "alert alert-error";
      result.textContent = "Vui lòng nhập đầy đủ thông tin.";
      result.classList.remove("hidden");
      return;
    }

    if (password.length < 6) {
      result.className = "alert alert-error";
      result.textContent = "Mật khẩu cần ít nhất 6 ký tự.";
      result.classList.remove("hidden");
      return;
    }

    if (password !== confirm) {
      result.className = "alert alert-error";
      result.textContent = "Xác nhận mật khẩu không khớp.";
      result.classList.remove("hidden");
      return;
    }

    result.className = "alert alert-success";
    result.textContent = "Đăng ký thành công. Bạn có thể đăng nhập ngay.";
    result.classList.remove("hidden");
    form.reset();
  });
});

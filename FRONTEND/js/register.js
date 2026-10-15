document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("register-form");
  const result = document.getElementById("register-result");
  if (!form || !result) return;

  function showMessage(type, text) {
    result.className = `alert alert-${type}`;
    result.textContent = text;
    result.classList.remove("hidden");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = String(form.elements.namedItem("name")?.value || "").trim();
    const email = String(form.elements.namedItem("email")?.value || "").trim();
    const password = String(form.elements.namedItem("password")?.value || "");
    const confirm = String(form.elements.namedItem("confirm")?.value || "");

    if (!name || !email || !password || !confirm) {
      showMessage("error", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    if (password.length < 6) {
      showMessage("error", "Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirm) {
      showMessage("error", "Xác nhận mật khẩu không khớp.");
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      await window.Aqualife.apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          confirm_password: confirm,
        }),
      });
      form.reset();
      showMessage("success", "Đăng ký thành công! Chuyển đến trang đăng nhập...");
      setTimeout(() => {
        window.location.href = "auth.html";
      }, 1000);
    } catch (error) {
      showMessage("error", error.message);
      if (button) button.disabled = false;
    }
  });
});
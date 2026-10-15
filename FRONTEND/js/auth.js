document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("auth-form");
  const result = document.getElementById("auth-result");
  if (!form || !result) return;

  function showMessage(type, text) {
    result.className = `alert alert-${type}`;
    result.textContent = text;
    result.classList.remove("hidden");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = String(form.elements.namedItem("email")?.value || "").trim();
    const password = String(form.elements.namedItem("password")?.value || "");

    if (!email || !password) {
      showMessage("error", "Vui lòng nhập email và mật khẩu.");
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      const user = await window.Aqualife.apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("aqualife_user", user.email);
      showMessage("success", "Đăng nhập thành công! Chuyển hướng đến trang chủ...");
      setTimeout(() => {
        window.location.href = "home.html";
      }, 700);
    } catch (error) {
      showMessage("error", error.message);
      if (button) button.disabled = false;
    }
  });
});
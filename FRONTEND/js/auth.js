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
      localStorage.setItem("aqualife_user_info", JSON.stringify(user));

      if (window.Aqualife.syncCartWithServer) {
        await window.Aqualife.syncCartWithServer();
      }

      const params = new URLSearchParams(window.location.search);
      const defaultTarget = user.role === "admin" ? "admin.html" : "home.html";
      const redirectTarget = params.get("redirect") || defaultTarget;

      showMessage(
        "success",
        user.role === "admin"
          ? "Đăng nhập Quản trị viên thành công! Đang mở Aqualife Admin..."
          : "Đăng nhập thành công! Đang chuyển hướng..."
      );
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 600);
    } catch (error) {
      showMessage("error", error.message);
      if (button) button.disabled = false;
    }
  });
});
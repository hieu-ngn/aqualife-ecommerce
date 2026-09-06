document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("auth-form");
  const result = document.getElementById("auth-result");
  if (!form || !result) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = String(form.elements.namedItem("email")?.value || "").trim();
    const password = String(form.elements.namedItem("password")?.value || "");

    if (!email || !password) {
      result.className = "alert alert-error";
      result.textContent = "Vui lòng nhập email và mật khẩu.";
      result.classList.remove("hidden");
      return;
    }

    localStorage.setItem("aqualife_user", email);
    result.className = "alert alert-success";
    result.textContent = "Đăng nhập thành công! Chuyển hướng đến trang chủ...";
    result.classList.remove("hidden");

    setTimeout(() => {
      window.location.href = "home.html";
    }, 700);
  });
});

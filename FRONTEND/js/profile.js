document.addEventListener("DOMContentLoaded", async () => {
  const displayNameEl = document.getElementById("profile-display-name");
  const displayEmailEl = document.getElementById("profile-display-email");
  const displayRoleEl = document.getElementById("profile-display-role");
  const avatarEl = document.getElementById("profile-avatar");
  const adminBtnEl = document.getElementById("profile-admin-btn");

  const emailInput = document.getElementById("profile-email");
  const nameInput = document.getElementById("profile-name");
  const phoneInput = document.getElementById("profile-phone");
  const addressInput = document.getElementById("profile-address");
  const profileForm = document.getElementById("profile-form");
  const profileAlert = document.getElementById("profile-alert");
  const profileSaveBtn = document.getElementById("profile-save-btn");

  const passwordForm = document.getElementById("password-form");
  const passwordAlert = document.getElementById("password-alert");
  const passwordSaveBtn = document.getElementById("password-save-btn");

  function showAlert(el, type, message) {
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = message;
    el.classList.remove("hidden");
  }

  function renderProfile(user) {
    if (!user) return;
    displayNameEl.textContent = user.name || "Khách hàng";
    displayEmailEl.textContent = user.email || "";
    displayRoleEl.textContent = user.role === "admin" ? "Quản trị viên" : "Khách hàng";
    avatarEl.textContent = (user.name || "A").trim().charAt(0).toUpperCase();

    if (user.role === "admin" && adminBtnEl) {
      adminBtnEl.classList.remove("hidden");
    }

    emailInput.value = user.email || "";
    nameInput.value = user.name || "";
    phoneInput.value = user.phone || "";
    addressInput.value = user.address || "";

    localStorage.setItem("aqualife_user", user.email);
    localStorage.setItem("aqualife_user_info", JSON.stringify(user));
  }

  try {
    const profile = await window.Aqualife.apiFetch("/users/me");
    renderProfile(profile);
  } catch (err) {
    window.location.href = "auth.html?redirect=profile.html";
    return;
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      profileAlert.classList.add("hidden");

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();
      const address = addressInput.value.trim();

      if (!name) {
        showAlert(profileAlert, "error", "Vui lòng nhập họ và tên.");
        return;
      }

      profileSaveBtn.disabled = true;
      try {
        const updated = await window.Aqualife.apiFetch("/users/me", {
          method: "PUT",
          body: JSON.stringify({ name, phone, address }),
        });
        renderProfile(updated);
        showAlert(profileAlert, "success", "Đã cập nhật hồ sơ cá nhân thành công!");
        if (window.Aqualife.showToast) {
          window.Aqualife.showToast("Cập nhật hồ sơ thành công!", "success");
        }
      } catch (err) {
        showAlert(profileAlert, "error", err.message || "Không thể lưu hồ sơ.");
      } finally {
        profileSaveBtn.disabled = false;
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      passwordAlert.classList.add("hidden");

      const currentPassword = document.getElementById("current-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      if (!currentPassword || !newPassword) {
        showAlert(passwordAlert, "error", "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
        return;
      }
      if (newPassword.length < 6) {
        showAlert(passwordAlert, "error", "Mật khẩu mới phải có ít nhất 6 ký tự.");
        return;
      }
      if (newPassword !== confirmPassword) {
        showAlert(passwordAlert, "error", "Mật khẩu xác nhận không khớp.");
        return;
      }

      passwordSaveBtn.disabled = true;
      try {
        await window.Aqualife.apiFetch("/users/me/password", {
          method: "PUT",
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword,
          }),
        });
        passwordForm.reset();
        showAlert(passwordAlert, "success", "Đổi mật khẩu thành công!");
        if (window.Aqualife.showToast) {
          window.Aqualife.showToast("Đổi mật khẩu thành công!", "success");
        }
      } catch (err) {
        showAlert(passwordAlert, "error", err.message || "Không thể đổi mật khẩu.");
      } finally {
        passwordSaveBtn.disabled = false;
      }
    });
  }
});

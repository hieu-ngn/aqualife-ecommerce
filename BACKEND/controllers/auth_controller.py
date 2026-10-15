import re

from flask import request

from services import auth_service
from utils.responses import success, error

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def register():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    name_value = body.get("name")
    email_value = body.get("email")
    password_value = body.get("password")
    name = name_value.strip() if isinstance(name_value, str) else ""
    email = email_value.strip().lower() if isinstance(email_value, str) else ""
    password = password_value if isinstance(password_value, str) else ""
    confirm = body.get("confirm_password") or body.get("confirmPassword")

    if not name:
        return error("Vui lòng nhập họ tên", 422)
    if len(name) > 100:
        return error("Họ tên không được vượt quá 100 ký tự", 422)
    if not EMAIL_RE.match(email):
        return error("Email không hợp lệ", 422)
    if len(email) > 255:
        return error("Email không được vượt quá 255 ký tự", 422)
    if len(password) < 6:
        return error("Mật khẩu phải có ít nhất 6 ký tự", 422)
    if confirm is not None and confirm != password:
        return error("Mật khẩu xác nhận không khớp", 422)

    try:
        user = auth_service.register_user(name, email, password)
    except auth_service.EmailExistsError:
        return error("Email đã được đăng ký", 409)

    return success(user, 201)
import re

from flask import g, request, session

from services import auth_service
from middleware.auth import login_required
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


def login():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    email_value = body.get("email")
    password_value = body.get("password")
    email = email_value.strip().lower() if isinstance(email_value, str) else ""
    password = password_value if isinstance(password_value, str) else ""

    if not email or not password:
        return error("Vui lòng nhập email và mật khẩu", 422)

    try:
        user = auth_service.authenticate_user(email, password)
    except auth_service.InvalidCredentialsError:
        return error("Email hoặc mật khẩu không đúng", 401)
    except auth_service.InactiveUserError:
        return error("Tài khoản đã bị khóa", 403)

    session.clear()
    session["user_id"] = user["id"]
    return success(user)


def logout():
    session.clear()
    return success({"message": "Đã đăng xuất"})


@login_required
def me():
    return success(g.current_user)
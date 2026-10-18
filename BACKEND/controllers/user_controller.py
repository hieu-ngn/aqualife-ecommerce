import re
from flask import g, request
from middleware.auth import login_required
from services import user_service
from utils.responses import success, error

PHONE_RE = re.compile(r"^[0-9+\-\s()]{8,20}$")


@login_required
def get_me():
    try:
        profile = user_service.get_profile(g.current_user["id"])
        return success(profile)
    except user_service.UserNotFoundError:
        return error("Không tìm thấy người dùng", 404)


@login_required
def update_me():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    name = str(body.get("name") if "name" in body else g.current_user.get("name") or "").strip()
    phone = str(body.get("phone") if "phone" in body else g.current_user.get("phone") or "").strip()
    address = str(body.get("address") if "address" in body else g.current_user.get("address") or "").strip()

    if not name:
        return error("Vui lòng nhập họ tên", 422)
    if len(name) > 100:
        return error("Họ tên không vượt quá 100 ký tự", 422)
    if phone and not PHONE_RE.match(phone):
        return error("Số điện thoại không hợp lệ", 422)

    try:
        updated = user_service.update_profile(
            user_id=g.current_user["id"],
            name=name,
            phone=phone,
            address=address,
        )
        return success(updated)
    except user_service.UserNotFoundError:
        return error("Không tìm thấy người dùng", 404)


@login_required
def update_password():
    body = request.get_json(silent=True) or {}
    if not isinstance(body, dict):
        return error("Dữ liệu gửi lên không hợp lệ", 400)

    current_password = str(body.get("current_password") or "")
    new_password = str(body.get("new_password") or "")
    confirm_password = body.get("confirm_password")

    if not current_password or not new_password:
        return error("Vui lòng nhập mật khẩu hiện tại và mật khẩu mới", 422)
    if len(new_password) < 6:
        return error("Mật khẩu mới phải có ít nhất 6 ký tự", 422)
    if confirm_password is not None and str(confirm_password) != new_password:
        return error("Mật khẩu xác nhận không khớp", 422)

    try:
        user_service.change_password(
            user_id=g.current_user["id"],
            current_password=current_password,
            new_password=new_password,
        )
        return success({"message": "Đổi mật khẩu thành công"})
    except user_service.InvalidPasswordError:
        return error("Mật khẩu hiện tại không đúng", 400)
    except user_service.UserNotFoundError:
        return error("Không tìm thấy người dùng", 404)

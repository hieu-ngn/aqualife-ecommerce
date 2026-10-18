from functools import wraps

from flask import g, session

from services import auth_service
from utils.responses import error


def login_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        user_id = session.get("user_id")
        if not user_id:
            return error("Chưa đăng nhập", 401)

        user = auth_service.get_user_by_id(user_id)
        if not user or user["status"] != "active":
            session.clear()
            return error("Chưa đăng nhập", 401)

        g.current_user = user
        return view(*args, **kwargs)

    return wrapper


def admin_required(view):
    @wraps(view)
    @login_required
    def wrapper(*args, **kwargs):
        if g.current_user.get("role") != "admin":
            return error("Chỉ quản trị viên mới có quyền thực hiện thao tác này", 403)
        return view(*args, **kwargs)

    return wrapper
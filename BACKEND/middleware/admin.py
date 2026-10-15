from functools import wraps

from flask import g

from middleware.auth import login_required
from utils.responses import error


def admin_required(view):
    @login_required
    @wraps(view)
    def wrapper(*args, **kwargs):
        if g.current_user["role"] != "admin":
            return error("Bạn không có quyền truy cập", 403)
        return view(*args, **kwargs)

    return wrapper
from flask import Blueprint
from controllers import user_controller

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

user_bp.get("/me")(user_controller.get_me)
user_bp.put("/me")(user_controller.update_me)
user_bp.put("/me/password")(user_controller.update_password)

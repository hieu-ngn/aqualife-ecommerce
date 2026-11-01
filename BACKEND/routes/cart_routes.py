from flask import Blueprint
from controllers import cart_controller

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")

# Giỏ hàng gắn với user đăng nhập (đồng bộ giữa Database và Flask Session)
cart_bp.add_url_rule("", view_func=cart_controller.get_cart, methods=["GET"])
cart_bp.add_url_rule("", view_func=cart_controller.add_to_cart, methods=["POST"])
cart_bp.add_url_rule(
    "/<int:item_id>", view_func=cart_controller.update_cart_item, methods=["PUT"]
)
cart_bp.add_url_rule(
    "/<int:item_id>", view_func=cart_controller.remove_cart_item, methods=["DELETE"]
)
cart_bp.add_url_rule("", view_func=cart_controller.clear_cart, methods=["DELETE"])

# Giỏ hàng lưu trực tiếp trên Flask Session (hỗ trợ cả phiên làm việc chưa đăng nhập)
cart_bp.add_url_rule("/session", view_func=cart_controller.get_session_cart, methods=["GET"])
cart_bp.add_url_rule("/session", view_func=cart_controller.add_to_session_cart, methods=["POST"])
cart_bp.add_url_rule(
    "/session/<int:product_id>",
    view_func=cart_controller.update_session_cart_item,
    methods=["PUT"],
)
cart_bp.add_url_rule(
    "/session/<int:product_id>",
    view_func=cart_controller.remove_session_cart_item,
    methods=["DELETE"],
)
cart_bp.add_url_rule(
    "/session", view_func=cart_controller.clear_session_cart, methods=["DELETE"]
)

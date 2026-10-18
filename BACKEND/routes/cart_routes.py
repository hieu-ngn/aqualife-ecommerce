from flask import Blueprint
from controllers import cart_controller

cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")

cart_bp.add_url_rule("", view_func=cart_controller.get_cart, methods=["GET"])
cart_bp.add_url_rule("", view_func=cart_controller.add_to_cart, methods=["POST"])
cart_bp.add_url_rule(
    "/<int:item_id>", view_func=cart_controller.update_cart_item, methods=["PUT"]
)
cart_bp.add_url_rule(
    "/<int:item_id>", view_func=cart_controller.remove_cart_item, methods=["DELETE"]
)
cart_bp.add_url_rule("", view_func=cart_controller.clear_cart, methods=["DELETE"])

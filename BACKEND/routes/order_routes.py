from flask import Blueprint
from controllers import order_controller

order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

order_bp.add_url_rule("", view_func=order_controller.create_order, methods=["POST"])
order_bp.add_url_rule("", view_func=order_controller.list_orders, methods=["GET"])
order_bp.add_url_rule(
    "/<int:order_id>", view_func=order_controller.get_order, methods=["GET"]
)
order_bp.add_url_rule(
    "/<int:order_id>/cancel", view_func=order_controller.cancel_order, methods=["PATCH"]
)

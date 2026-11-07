from flask import Blueprint
from controllers import order_controller

voucher_bp = Blueprint("vouchers", __name__, url_prefix="/api/vouchers")

voucher_bp.add_url_rule("", view_func=order_controller.list_vouchers, methods=["GET"])
voucher_bp.add_url_rule("/apply", view_func=order_controller.apply_voucher, methods=["POST"])


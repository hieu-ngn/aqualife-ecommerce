from flask import Blueprint
from controllers import product_controller

product_bp = Blueprint("products", __name__, url_prefix="/api/products")

product_bp.add_url_rule("", view_func=product_controller.list_products, methods=["GET"])
product_bp.add_url_rule(
    "/<int:product_id>", view_func=product_controller.get_product, methods=["GET"]
)

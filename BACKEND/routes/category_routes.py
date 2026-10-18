from flask import Blueprint
from controllers import category_controller

category_bp = Blueprint("categories", __name__, url_prefix="/api/categories")

category_bp.add_url_rule("", view_func=category_controller.list_categories, methods=["GET"])
category_bp.add_url_rule(
    "/<int:category_id>", view_func=category_controller.get_category, methods=["GET"]
)

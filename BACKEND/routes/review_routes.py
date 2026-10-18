from flask import Blueprint
from controllers import review_controller

review_bp = Blueprint("reviews", __name__, url_prefix="/api")

review_bp.get("/products/<int:product_id>/reviews")(review_controller.list_product_reviews)
review_bp.post("/products/<int:product_id>/reviews")(review_controller.create_product_review)
review_bp.put("/reviews/<int:review_id>")(review_controller.update_review)
review_bp.delete("/reviews/<int:review_id>")(review_controller.delete_review)

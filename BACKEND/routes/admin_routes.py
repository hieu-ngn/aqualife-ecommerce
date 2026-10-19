from flask import Blueprint
from controllers import admin_controller

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# Overview & Revenue
admin_bp.get("/dashboard")(admin_controller.get_dashboard)
admin_bp.get("/revenue")(admin_controller.get_revenue)

# Categories (M10)
admin_bp.get("/categories")(admin_controller.list_categories)
admin_bp.post("/categories")(admin_controller.create_category)
admin_bp.put("/categories/<int:category_id>")(admin_controller.update_category)
admin_bp.delete("/categories/<int:category_id>")(admin_controller.delete_category)

# Products (M10)
admin_bp.get("/products")(admin_controller.list_products)
admin_bp.post("/products")(admin_controller.create_product)
admin_bp.post("/products/bulk")(admin_controller.bulk_update_products)
admin_bp.put("/products/<int:product_id>")(admin_controller.update_product)
admin_bp.delete("/products/<int:product_id>")(admin_controller.delete_product)

# Orders (M11)
admin_bp.get("/orders")(admin_controller.list_orders)
admin_bp.patch("/orders/<int:order_id>/status")(admin_controller.update_order_status)

# Users (M12)
admin_bp.get("/users")(admin_controller.list_users)
admin_bp.patch("/users/<int:user_id>/status")(admin_controller.update_user_status)
admin_bp.patch("/users/<int:user_id>/role")(admin_controller.update_user_role)

# Store & Contact Settings (synced with Admin info)
admin_bp.get("/settings")(admin_controller.get_settings)
admin_bp.put("/settings")(admin_controller.update_settings)


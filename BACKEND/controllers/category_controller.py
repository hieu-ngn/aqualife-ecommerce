from services import product_service
from utils.responses import success, error


def list_categories():
    categories = product_service.list_categories()
    return success(categories)


def get_category(category_id: int):
    category = product_service.get_category_by_id(category_id)
    if not category:
        return error("Không tìm thấy danh mục", 404)
    return success(category)

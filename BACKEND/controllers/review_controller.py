from flask import g, request, session
from middleware.auth import login_required
from services import review_service
from services.cart_service import ProductNotFoundError
from utils.responses import success, error


def _validate_rating_and_comment(body: dict):
    if not isinstance(body, dict):
        return None, None, error("Dữ liệu gửi lên không hợp lệ", 400)

    raw_rating = body.get("rating")
    try:
        rating = int(raw_rating)
    except (TypeError, ValueError):
        return None, None, error("Số sao đánh giá (rating) phải từ 1 đến 5", 422)

    if rating < 1 or rating > 5:
        return None, None, error("Số sao đánh giá (rating) phải từ 1 đến 5", 422)

    comment = str(body.get("comment") or "").strip()
    if len(comment) > 2000:
        return None, None, error("Nội dung nhận xét không vượt quá 2000 ký tự", 422)

    return rating, comment, None


def list_featured_reviews():
    raw_limit = request.args.get("limit", "20")
    limit = int(raw_limit) if raw_limit.isdigit() and int(raw_limit) > 0 else 20
    return success(review_service.list_featured_reviews(limit=min(limit, 50)))


def list_product_reviews(product_id: int):
    current_user_id = session.get("user_id")
    try:
        data = review_service.list_reviews_for_product(product_id, current_user_id)
        return success(data)
    except ProductNotFoundError:
        return error("Không tìm thấy sản phẩm", 404)


@login_required
def create_product_review(product_id: int):
    body = request.get_json(silent=True) or {}
    rating, comment, err_resp = _validate_rating_and_comment(body)
    if err_resp:
        return err_resp

    try:
        review = review_service.create_review(
            user_id=g.current_user["id"],
            product_id=product_id,
            rating=rating,
            comment=comment,
        )
        return success(review, 201)
    except ProductNotFoundError:
        return error("Không tìm thấy sản phẩm", 404)
    except review_service.PurchaseRequiredError as exc:
        return error(str(exc), 403)
    except review_service.ReviewAlreadyExistsError as exc:
        return error(str(exc), 409)


@login_required
def update_review(review_id: int):
    body = request.get_json(silent=True) or {}
    rating, comment, err_resp = _validate_rating_and_comment(body)
    if err_resp:
        return err_resp

    try:
        review = review_service.update_review(
            user_id=g.current_user["id"],
            review_id=review_id,
            rating=rating,
            comment=comment,
        )
        return success(review)
    except review_service.ReviewNotFoundError:
        return error("Không tìm thấy đánh giá", 404)
    except review_service.ReviewForbiddenError:
        return error("Bạn không có quyền sửa đánh giá này", 403)


@login_required
def delete_review(review_id: int):
    is_admin = g.current_user.get("role") == "admin"
    try:
        review_service.delete_review(
            user_id=g.current_user["id"],
            is_admin=is_admin,
            review_id=review_id,
        )
        return success({"message": "Đã xóa đánh giá"})
    except review_service.ReviewNotFoundError:
        return error("Không tìm thấy đánh giá", 404)
    except review_service.ReviewForbiddenError:
        return error("Bạn không có quyền xóa đánh giá này", 403)

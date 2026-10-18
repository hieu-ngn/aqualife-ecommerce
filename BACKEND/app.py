import os
from pathlib import Path

from flask import Flask, jsonify, redirect, send_from_directory
from flask_cors import CORS

from config.database import get_db_cursor, init_pool

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "FRONTEND"


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["DATABASE_URL"] = os.getenv("DATABASE_URL")

    default_origins = (
        "http://127.0.0.1:5500,http://localhost:5500,"
        "http://127.0.0.1:5000,http://localhost:5000"
    )
    origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", default_origins).split(",")
        if origin.strip()
    ]
    CORS(app, supports_credentials=True, origins=origins)

    init_pool(app)

    from routes.auth_routes import auth_bp
    from routes.category_routes import category_bp
    from routes.product_routes import product_bp
    from routes.cart_routes import cart_bp
    from routes.order_routes import order_bp
    from routes.user_routes import user_bp
    from routes.review_routes import review_bp
    from routes.admin_routes import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(review_bp)
    app.register_blueprint(admin_bp)

    @app.get("/api/health")
    def health():
        try:
            with get_db_cursor() as cur:
                cur.execute("SELECT COUNT(*) AS total FROM users")
                row = cur.fetchone()
            return jsonify(
                {
                    "success": True,
                    "data": {
                        "status": "ok",
                        "db": "connected",
                        "users": row["total"],
                    },
                }
            )
        except Exception:
            app.logger.exception("Database health check failed")
            return jsonify(
                {"success": False, "message": "Database connection failed"}
            ), 500

    # Unified Frontend Serving (chạy như web thật tại http://localhost:5000)
    @app.get("/")
    def index_redirect():
        return redirect("/html/home.html")

    @app.get("/admin")
    @app.get("/admin/")
    def admin_redirect():
        return redirect("/html/admin.html")

    @app.get("/<path:asset_path>")
    def serve_frontend(asset_path: str):
        if asset_path.startswith("api/"):
            return jsonify({"success": False, "message": "API endpoint not found"}), 404
        target = (FRONTEND_DIR / asset_path).resolve()
        if not str(target).startswith(str(FRONTEND_DIR.resolve())) or not target.is_file():
            return jsonify({"success": False, "message": "File not found"}), 404
        return send_from_directory(FRONTEND_DIR, asset_path)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host=os.getenv("HOST", "0.0.0.0"),
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
        port=int(os.getenv("PORT", 5000)),
    )
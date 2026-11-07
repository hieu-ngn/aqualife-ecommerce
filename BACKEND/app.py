import os
from pathlib import Path

from flask import Flask, jsonify, redirect, send_from_directory
from flask_cors import CORS

from config.database import get_db_cursor, init_pool

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "FRONTEND"


def _ensure_schema():
    """Nâng cấp CSDL cũ không cần chạy tay: thêm cột size_label và bảng support_tickets."""
    from services.dashboard_service import _ensure_support_tickets_table

    with get_db_cursor(commit=True) as cur:
        cur.execute(
            "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size_label VARCHAR(100) NOT NULL DEFAULT ''"
        )
        _ensure_support_tickets_table(cur)

        # Vouchers table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS vouchers (
                id              BIGSERIAL PRIMARY KEY,
                code            VARCHAR(50) UNIQUE NOT NULL,
                discount_type   VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed', 'free_shipping')),
                discount_value  NUMERIC(12, 2) NOT NULL CHECK (discount_value >= 0),
                max_discount    NUMERIC(12, 2) DEFAULT NULL,
                min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
                usage_limit     INTEGER DEFAULT NULL,
                used_count      INTEGER NOT NULL DEFAULT 0,
                starts_at       TIMESTAMP DEFAULT NOW(),
                expires_at      TIMESTAMP DEFAULT NULL,
                status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
                created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
                updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
            )
        """)
        # Shipping & voucher columns on orders
        for col_sql in [
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(30) NOT NULL DEFAULT 'standard'",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 0",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code VARCHAR(50) DEFAULT NULL",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0",
        ]:
            cur.execute(col_sql)
        # Seed default vouchers
        cur.execute("""
            INSERT INTO vouchers (code, discount_type, discount_value, max_discount, min_order_amount, usage_limit)
            VALUES
                ('AQUALIFE10', 'percent', 10, 50000, 200000, NULL),
                ('FREESHIP', 'free_shipping', 0, 50000, 0, NULL),
                ('AQUANEW', 'fixed', 30000, NULL, 100000, 100),
                ('VIP50K', 'fixed', 50000, NULL, 500000, NULL),
                ('OCEAN20', 'percent', 20, 100000, 300000, 50)
            ON CONFLICT (code) DO NOTHING
        """)


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
    _ensure_schema()

    from routes.auth_routes import auth_bp
    from routes.category_routes import category_bp
    from routes.product_routes import product_bp
    from routes.cart_routes import cart_bp
    from routes.order_routes import order_bp
    from routes.user_routes import user_bp
    from routes.review_routes import review_bp
    from routes.admin_routes import admin_bp
    from routes.voucher_routes import voucher_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(category_bp)
    app.register_blueprint(product_bp)
    app.register_blueprint(cart_bp)
    app.register_blueprint(order_bp)
    app.register_blueprint(voucher_bp)
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

    @app.get("/api/store-info")
    def public_store_info():
        from controllers.admin_controller import get_public_store_info

        return get_public_store_info()

    @app.post("/api/contacts")
    def public_submit_contact():
        from controllers.admin_controller import submit_public_contact

        return submit_public_contact()

    @app.post("/api/advisor/chat")
    def advisor_chat_endpoint():
        from controllers.advisor_controller import chat_advisor

        return chat_advisor()

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

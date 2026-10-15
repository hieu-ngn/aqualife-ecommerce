import os

from flask import Flask, jsonify
from flask_cors import CORS

from config.database import get_db_cursor, init_pool


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["DATABASE_URL"] = os.getenv("DATABASE_URL")

    origins = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://127.0.0.1:5500").split(",")
        if origin.strip()
    ]
    CORS(app, supports_credentials=True, origins=origins)

    init_pool(app)

    from routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)

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

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        debug=os.getenv("FLASK_DEBUG", "0") == "1",
        port=int(os.getenv("PORT", 5000)),
    )
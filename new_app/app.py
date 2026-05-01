from flask import Flask, redirect
from flask_restx import Api, Resource
from sqlalchemy import text
from .config import Config
from .exts import db, mail, cache
from flask_migrate import Migrate

# NOTE: The .env file should be in this location because the root directory .env is deprecated.
# DATABASE_URL="database@link.com"
# this URL can be obtained on the Neon dashboard: "Connect" -> "Connection string"
# do not upload database url to github, it is a secret (see settings)
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    mail.init_app(app)
    cache.init_app(app, config={
        "CACHE_TYPE": "SimpleCache",
        "CACHE_DEFAULT_TIMEOUT": 300  # 5 minutes
    })

    migrate = Migrate(app, db)

    # Warm up the DB connection pool on first request so the user never
    # pays Neon's cold-start latency during an actual search.
    _db_warmed_up = False

    @app.before_request
    def warmup_db():
        nonlocal _db_warmed_up
        if not _db_warmed_up:
            try:
                db.session.execute(text("SELECT 1"))
                db.session.commit()
            except Exception:
                pass
            _db_warmed_up = True

    api = Api(
        app,
        doc="/swagger",
        prefix="/api",
    )

    from .resources.test import api as test_namespace
    from .resources.auth import api as auth_namespace
    from .resources.search import api as search_namespace
    from .resources.detail import api as detail_namespace
    from .resources.dashboard import api as dashboard_namespace

    api.add_namespace(test_namespace)
    api.add_namespace(auth_namespace)
    api.add_namespace(search_namespace)
    api.add_namespace(detail_namespace)
    api.add_namespace(dashboard_namespace)

    @api.route("/test")
    class TestResource(Resource):
        def get(self):
            return {"message": "simple test api"}, 200

    # temporarily reroutes to swagger view for dev help
    @app.route("/")
    def home():
        return redirect("/swagger")

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
    
from flask import Flask, redirect
from flask_restx import Api, Resource
from .config import Config
from .exts import db

# NOTE: The .env file should be in this location because the root directory .env is deprecated.
# DATABASE_URL="database@link.com"
# this URL can be obtained on the Neon dashboard: "Connect" -> "Connection string"
# do not upload database url to github, it is a secret (see settings)
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)

    api = Api(
        app,
        doc="/swagger",
        prefix="/api",
    )

    from .resources.test import api as test_namespace
    api.add_namespace(test_namespace)

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
    app.run(debug=True, host='0.0.0.0', port=8080)
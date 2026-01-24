from .auth import auth_bp
from .chat import chat_bp
from .rooms import rooms_bp
from .watchparty import watchparty_bp
from .admin import admin_bp
from .static_routes import static_bp


def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(watchparty_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(static_bp)

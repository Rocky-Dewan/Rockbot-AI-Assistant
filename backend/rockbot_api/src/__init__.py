import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from .extensions import db, migrate


def create_app():
    app = Flask(__name__)

    # --------------------
    # Config
    # --------------------
    app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    # Instance folder and SQLite DB
    instance_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'instance')
    os.makedirs(instance_dir, exist_ok=True)
    db_path = os.path.join(instance_dir, 'rockbot.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --------------------
    # Enable CORS
    # --------------------
    CORS(app)

    # --------------------
    # Initialize extensions
    # --------------------
    db.init_app(app)
    migrate.init_app(app, db)

    # --------------------
    # Import models AFTER db.init_app
    # --------------------
    from .models.user import User
    from .models.conversation import Conversation, Message

    # --------------------
    # Register blueprints
    # --------------------
    from .routes.user import user_bp
    from .routes.chat import chat_bp
    from .routes.export import export_bp
    from .routes.multimodal import multimodal_bp

    app.register_blueprint(user_bp, url_prefix='/api')
    app.register_blueprint(chat_bp, url_prefix='/api')
    app.register_blueprint(export_bp, url_prefix='/api')
    app.register_blueprint(multimodal_bp, url_prefix='/api')

    # --------------------
    # Serve frontend (Vite build)
    # --------------------
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../frontend/rockbot-ui/dist'))

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        # If the requested file exists (e.g. JS, CSS, image), serve it
        requested_path = os.path.join(dist_dir, path)
        index_path = os.path.join(dist_dir, 'index.html')

        if path != "" and os.path.exists(requested_path):
            return send_from_directory(dist_dir, path)
        elif os.path.exists(index_path):
            return send_from_directory(dist_dir, 'index.html')
        else:
            return "Frontend build not found. Please run 'npm run build' inside frontend/rockbot-ui.", 404

    return app

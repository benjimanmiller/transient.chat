from flask import Blueprint, send_from_directory

static_bp = Blueprint("static", __name__)


@static_bp.route("/")
def index():
    return send_from_directory("static", "index.html")


@static_bp.route("/<path:path>")
def serve_static_files(path):
    return send_from_directory("static", path)

from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import random
import string

from models.state import user_sessions, user_ips, banned_ips, banned_usernames

auth_bp = Blueprint("auth", __name__)


def generate_user_key(length=16):
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get("username")
    user_ip = request.remote_addr

    if not username:
        return jsonify({"error": "No username provided"}), 400
    if username in user_sessions:
        return jsonify({"error": "Username taken"}), 409
    if user_ip in banned_ips:
        return jsonify({"error": "IP banned"}), 403
    if username in banned_usernames:
        return jsonify({"error": "Username banned"}), 403

    user_key = generate_user_key()
    user_sessions[username] = {
        "key": user_key,
        "last_active": datetime.utcnow().isoformat(),
    }
    user_ips[username] = user_ip

    return jsonify({"username": username, "key": user_key})


@auth_bp.route("/validate", methods=["POST"])
def validate():
    data = request.get_json()
    username = data.get("username")
    key = data.get("key")

    session = user_sessions.get(username)
    if session and session["key"] == key:
        session["last_active"] = datetime.utcnow().isoformat()
        return jsonify({"status": "valid"})
    return jsonify({"error": "Invalid credentials"}), 403

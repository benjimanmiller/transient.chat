from flask import Blueprint, request, jsonify, Response
from functools import wraps
from datetime import datetime
import os

from models.state import (
    user_sessions,
    user_ips,
    room_users,
    messages,
    banned_ips,
    banned_usernames,
    kicked_users,
    video_state,
)

admin_bp = Blueprint("admin", __name__)


def check_auth(username, password):
    return username == os.getenv("ADMIN_USERNAME") and password == os.getenv(
        "ADMIN_PASSWORD"
    )


def authenticate():
    return Response(
        "Access Denied", 401, {"WWW-Authenticate": 'Basic realm="Login Required"'}
    )


def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)

    return decorated


@admin_bp.route("/admin")
@requires_auth
def admin_panel():
    try:
        return open("static/admin.html").read()
    except FileNotFoundError:
        return "admin.html not found", 404


@admin_bp.route("/admin/users", methods=["GET"])
@requires_auth
def admin_users():
    return jsonify(
        [
            {
                "username": u,
                "ip": user_ips.get(u, "unknown"),
                "last_active": s["last_active"],
            }
            for u, s in user_sessions.items()
        ]
    )


@admin_bp.route("/admin/rooms", methods=["GET"])
@requires_auth
def admin_rooms():
    return jsonify(
        [
            {
                "name": r,
                "users": list(room_users.get(r, {}).keys()),
                "type": "watchparty" if r in video_state else "chat",
            }
            for r in list(messages.keys())
        ]
    )


@admin_bp.route("/admin/banip", methods=["POST"])
@requires_auth
def admin_ban_ip():
    data = request.get_json()
    username = data.get("username")
    ip_to_ban = user_ips.get(username)

    if not ip_to_ban:
        return jsonify({"error": "no ip"}), 400

    banned_ips.add(ip_to_ban)
    user_sessions.pop(username, None)

    for room in room_users:
        room_users[room].pop(username, None)

    return jsonify({"banned": ip_to_ban})


@admin_bp.route("/admin/banusername", methods=["POST"])
@requires_auth
def admin_ban_username():
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"error": "no username"}), 400

    banned_usernames.add(username)
    user_sessions.pop(username, None)

    for room in room_users:
        room_users[room].pop(username, None)

    return jsonify({"banned": username})


@admin_bp.route("/admin/banrawip", methods=["POST"])
@requires_auth
def admin_ban_raw_ip():
    data = request.get_json()
    ip = data.get("ip")

    if not ip:
        return jsonify({"error": "no ip"}), 400

    banned_ips.add(ip)
    return jsonify({"banned": ip})


@admin_bp.route("/admin/banned", methods=["GET"])
@requires_auth
def admin_banned_list():
    banned = [{"type": "ip", "value": ip} for ip in banned_ips]
    banned += [{"type": "username", "value": uname} for uname in banned_usernames]
    return jsonify(banned)


@admin_bp.route("/admin/releaseuser", methods=["POST"])
@requires_auth
def admin_release_user():
    data = request.get_json()
    username = data.get("username")

    if not username:
        return jsonify({"error": "no username"}), 400

    user_sessions.pop(username, None)
    user_ips.pop(username, None)

    for room in room_users:
        room_users[room].pop(username, None)

    return jsonify({"released": username})

from flask import Blueprint, request, jsonify, Response, send_from_directory
from functools import wraps
from datetime import datetime
import os
import time

from models.state import (
    user_sessions,
    user_ips,
    room_users,
    messages,
    banned_ips,
    banned_usernames,
    kicked_users,
    video_state,
    room_owners,
    nuked_rooms,
    public_chat_rooms,
)

admin_bp = Blueprint("admin", __name__)

SERVER_START_TIME = time.time()


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
    """Serves the static admin HTML file."""
    return send_from_directory("static", "admin.html")


@admin_bp.route("/admin/stats", methods=["GET"])
@requires_auth
def admin_stats():
    total_messages = sum(len(msgs) for msgs in messages.values())
    return jsonify({
        "uptime": int(time.time() - SERVER_START_TIME),
        "active_users": len(user_sessions),
        "active_rooms": len(room_users),
        "total_messages": total_messages,
        "banned_count": len(banned_ips) + len(banned_usernames)
    })


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
                "owner": room_owners.get(r, "System"),
                "msg_count": len(messages.get(r, [])),
                "is_public": r in public_chat_rooms,
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


@admin_bp.route("/admin/broadcast", methods=["POST"])
@requires_auth
def admin_broadcast():
    """Sends a system message to all active rooms."""
    data = request.get_json()
    text = data.get("text")

    if not text:
        return jsonify({"error": "no text"}), 400

    timestamp = datetime.utcnow().isoformat()
    message = {"username": "SYSTEM", "text": text, "timestamp": timestamp}

    count = 0
    for room in messages:
        messages[room].append(message)
        count += 1

    return jsonify({"status": "sent", "rooms_affected": count})


@admin_bp.route("/admin/nukeroom", methods=["POST"])
@requires_auth
def admin_nuke_room():
    """Instantly deletes a room and clears its state."""
    data = request.get_json()
    room = data.get("room")

    # Lock the room for 10 seconds to force all clients to disconnect
    nuked_rooms[room] = time.time() + 10

    messages.pop(room, None)
    room_users.pop(room, None)
    room_owners.pop(room, None)
    video_state.pop(room, None)
    
    if room in public_chat_rooms:
        public_chat_rooms.remove(room)

    return jsonify({"status": "nuked", "room": room})

from flask import Blueprint, request, jsonify
from datetime import datetime

from models.state import (
    messages,
    room_users,
    kicked_users,
    room_owners,
    banned_ips,
    banned_usernames,
    user_ips,
)

chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat", methods=["GET", "POST"])
def general_chat():
    if request.method == "POST":
        new_message = request.json.get("message")
        if new_message:
            messages.setdefault("global", []).append(
                {"text": new_message, "timestamp": datetime.utcnow().isoformat()}
            )
            if len(messages["global"]) > 100:
                messages["global"] = messages["global"][-100:]
    return jsonify(messages.get("global", []))


@chat_bp.route("/chat/<room>", methods=["GET", "POST"])
def chat_room(room):
    room = room.strip()

    if request.method == "POST":
        data = request.json
        username = data.get("username")
        text = data.get("text")
        user_ip = request.remote_addr

        if (
            user_ip in banned_ips
            or username in banned_usernames
            or (username in user_ips and user_ips[username] in banned_ips)
        ):
            return jsonify({"error": "banned"}), 403

        message = {
            "username": username,
            "text": text,
            "timestamp": datetime.utcnow().isoformat(),
        }
        messages.setdefault(room, []).append(message)
        if len(messages[room]) > 100:
            messages[room] = messages[room][-100:]

    since = request.args.get("since")
    room_messages = messages.setdefault(room, [])

    if since:
        try:
            since_time = datetime.fromisoformat(since)
            new_msgs = [
                m
                for m in room_messages
                if datetime.fromisoformat(m["timestamp"]) > since_time
            ]
            return jsonify(new_msgs)
        except ValueError:
            pass  # Ignore bad timestamp

    return jsonify(room_messages)


@chat_bp.route("/chat/<room>/users", methods=["GET", "POST"])
def room_user_list(room):
    room = room.strip()
    if request.method == "POST":
        data = request.json
        username = data.get("username")
        if not username:
            return jsonify({"error": "No username"}), 400

        if username in kicked_users.get(room, set()):
            return jsonify({"error": "Kicked from room"}), 403

        room_users.setdefault(room, {})
        if room not in room_owners and username not in room_users[room]:
            room_owners[room] = username  # First user becomes the owner

        room_users[room][username] = datetime.utcnow().isoformat()

    users = room_users.get(room, {})
    response = {"users": list(users.keys())}
    if room in room_owners:
        response["owner"] = room_owners[room]
    return jsonify(response)


@chat_bp.route("/chat/<room>/kick", methods=["POST"])
def kick_user(room):
    data = request.json
    owner = data.get("owner")
    target = data.get("target")

    if not owner or not target:
        return jsonify({"error": "Missing owner or target"}), 400
    if room_owners.get(room) != owner:
        return jsonify({"error": "Not authorized"}), 403

    kicked_users.setdefault(room, set()).add(target)
    room_users.get(room, {}).pop(target, None)
    return jsonify({"kicked": target})

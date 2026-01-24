from flask import Blueprint, request, jsonify
from models.state import (
    room_users,
    messages,
    public_chat_rooms,
    regional_chat_rooms,
    topical_chat_rooms,
    video_state,
)

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.route("/rooms", methods=["GET", "POST"])
def get_or_create_rooms():
    if request.method == "POST":
        data = request.get_json()
        room_name = data.get("name", "").strip()

        if not room_name:
            return jsonify({"error": "Room name required"}), 400

        all_rooms = regional_chat_rooms + topical_chat_rooms + public_chat_rooms
        if room_name in all_rooms:
            return jsonify({"error": "Room already exists"}), 400

        public_chat_rooms.append(room_name)
        return jsonify({"name": room_name})

    active_only = request.args.get("activeOnly") == "true"

    def build_room_data(room_list, active=False):
        result = []
        for room in room_list:
            users = room_users.get(room, {})
            if active and not users:
                continue
            result.append(
                {
                    "name": room,
                    "users": len(users),
                    "type": "watchparty" if room in video_state else "chat",
                }
            )
        return result

    all_users = set()
    for users in room_users.values():
        all_users.update(users.keys())

    return jsonify(
        {
            "regional": build_room_data(regional_chat_rooms, active_only),
            "topical": build_room_data(topical_chat_rooms, active_only),
            "public": build_room_data(public_chat_rooms, active_only),
            "unique_users": len(all_users),
        }
    )

from flask import Blueprint, request, jsonify
from datetime import datetime

from models.state import video_state, public_chat_rooms

watchparty_bp = Blueprint("watchparty", __name__)


@watchparty_bp.route("/watchparty/<room>/video", methods=["GET", "POST"])
def watchparty_video_control(room):
    room = room.strip()

    # Ensure it's tracked as a public room
    if room not in public_chat_rooms:
        public_chat_rooms.append(room)

    # Ensure video_state storage is initialized
    video_state.setdefault(room, {})

    if request.method == "POST":
        data = request.get_json()
        url = data.get("url")
        if not url:
            return jsonify({"error": "No video URL"}), 400

        video_state[room] = {"url": url, "started_at": datetime.utcnow().isoformat()}

        return jsonify({"status": "started"})

    # Handle GET: return URL + elapsed time
    video_data = video_state.get(room)
    if not video_data or "url" not in video_data:
        return jsonify({"error": "No video"}), 404

    try:
        start_time = datetime.fromisoformat(video_data["started_at"])
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        return jsonify({"url": video_data["url"], "elapsed": int(elapsed)})
    except ValueError:
        return jsonify({"error": "Invalid timestamp"}), 500


@watchparty_bp.route("/watchparty/<room>/video/clear", methods=["POST"])
def clear_watchparty_video(room):
    room = room.strip()
    video_state.pop(room, None)
    return jsonify({"status": "cleared"})

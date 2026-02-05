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

        video_state[room] = {
            "url": url,
            "started_at": datetime.utcnow().isoformat(),
            "is_paused": False,
        }

        return jsonify({"status": "started"})

    # Handle GET: return URL + elapsed time
    video_data = video_state.get(room)
    if not video_data or "url" not in video_data:
        return jsonify({"error": "No video"}), 404

    try:
        is_paused = video_data.get("is_paused", False)
        if is_paused:
            elapsed = video_data.get("elapsed_at_pause", 0)
        else:
            start_time = datetime.fromisoformat(video_data["started_at"])
            elapsed = (datetime.utcnow() - start_time).total_seconds()
        return jsonify(
            {"url": video_data["url"], "elapsed": int(elapsed), "is_paused": is_paused}
        )
    except ValueError:
        return jsonify({"error": "Invalid timestamp"}), 500


@watchparty_bp.route("/watchparty/<room>/video/clear", methods=["POST"])
def clear_watchparty_video(room):
    room = room.strip()
    video_state.pop(room, None)
    return jsonify({"status": "cleared"})


@watchparty_bp.route("/watchparty/<room>/video/pause", methods=["POST"])
def watchparty_pause_video(room):
    room = room.strip()
    state = video_state.get(room)
    if not state or state.get("is_paused"):
        return jsonify({"status": "ignored"})

    # Calculate elapsed time and freeze it
    start_time = datetime.fromisoformat(state["started_at"])
    elapsed = (datetime.utcnow() - start_time).total_seconds()

    state["is_paused"] = True
    state["elapsed_at_pause"] = elapsed

    return jsonify({"status": "paused"})


@watchparty_bp.route("/watchparty/<room>/video/resume", methods=["POST"])
def watchparty_resume_video(room):
    room = room.strip()
    state = video_state.get(room)
    if not state or not state.get("is_paused"):
        return jsonify({"status": "ignored"})

    # Adjust started_at so that (now - started_at) == elapsed_at_pause
    # This effectively shifts the start time forward by the duration of the pause
    elapsed = state.get("elapsed_at_pause", 0)
    new_start_timestamp = datetime.utcnow().timestamp() - elapsed

    state["started_at"] = datetime.fromtimestamp(new_start_timestamp).isoformat()
    state["is_paused"] = False
    state.pop("elapsed_at_pause", None)

    return jsonify({"status": "resumed"})

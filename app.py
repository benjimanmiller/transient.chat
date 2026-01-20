from flask import *
from flask_cors import CORS
import random
import string
import threading
import time
from datetime import datetime, timedelta
from functools import wraps
import os
from flask import request, Response

app = Flask(__name__)
CORS(app)

user_sessions = {}
regional_chat_rooms = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
]

topical_chat_rooms = [
    "Tech",
    "Science",
    "Gaming",
    "Movies",
    "Music",
    "Books",
    "Current Events",
    "Sports",
    "Travel",
    "Food & Cooking",
    "Health & Fitness",
    "History",
    "Programming",
    "Investing",
    "Cryptocurrency",
    "Parenting",
    "DIY & Home Improvement",
    "Photography",
    "Fashion",
    "Automotive",
    "Theater & Performing Arts",
    "Pets & Animals",
    "Space Exploration",
    "Climate Change",
    "Entrepreneurship",
    "Relationships",
    "Comics & Manga",
    "Anime",
    "Board Games",
    "Card Games",
    "Tabletop RPGs",
    "Language Learning",
    "Economics",
    "Politics",
    "Fan Theories",
    "Science Fiction",
    "Fantasy",
    "Artificial Intelligence",
    "Web Development",
    "Mobile Apps",
    "Cybersecurity",
    "3D Printing",
    "Virtual Reality",
    "Augmented Reality",
    "Biohacking",
    "Home Automation",
    "Sustainable Living",
]

public_chat_rooms = []

messages = {}

room_users = {}

banned_ips = set()

banned_usernames = set()

user_ips = {}


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


@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/<path:path>")
def serve_static_files(path):
    return send_from_directory("static", path)


@app.route("/chat", methods=["GET", "POST"])
def chat():
    global messages
    if request.method == "POST":
        new_message = request.json.get("message")
        if new_message:
            messages.append(new_message)

            # Limit the chat history to the last 11 messages
            if len(messages) > 100:
                messages = messages[-100:]

    return jsonify(messages)


def generate_user_key(length=16):
    return "".join(random.choices(string.ascii_letters + string.digits, k=length))


@app.route("/register", methods=["POST"])
def register():
    data = request.json
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


@app.route("/validate", methods=["POST"])
def validate():
    data = request.json
    username = data.get("username")
    key = data.get("key")

    session = user_sessions.get(username)
    if session and session["key"] == key:
        session["last_active"] = datetime.utcnow().isoformat()
        return jsonify({"status": "valid"})
    return jsonify({"error": "Invalid credentials"}), 403


@app.route("/rooms", methods=["GET", "POST"])
def get_or_create_rooms():
    if request.method == "POST":
        data = request.json
        room_name = data.get("name", "").strip()
        if not room_name:
            return jsonify({"error": "Room name required"}), 400
        if (
            room_name in regional_chat_rooms
            or room_name in topical_chat_rooms
            or room_name in public_chat_rooms
        ):
            return jsonify({"error": "Room already exists"}), 400
        public_chat_rooms.append(room_name)
        return jsonify({"name": room_name})

    def build_room_data(room_list):
        return [
            {
                "name": room,
                "users": len(room_users.get(room, {})),
                "type": "watchparty" if room in video_state else "chat",
            }
            for room in room_list
        ]

    all_users = set()
    for users in room_users.values():
        all_users.update(users.keys())

    return jsonify(
        {
            "regional": build_room_data(regional_chat_rooms),
            "topical": build_room_data(topical_chat_rooms),
            "public": build_room_data(public_chat_rooms),
            "unique_users": len(all_users),
        }
    )


@app.route("/chat/<room>", methods=["GET", "POST"])
def chat_room(room):
    room = room.strip()

    # Reject banned IPs or users
    if request.method == "POST":
        data = request.json
        username = data.get("username")
        user_ip = request.remote_addr

        if (
            user_ip in banned_ips
            or username in banned_usernames
            or username in user_ips
            and user_ips[username] in banned_ips
        ):
            return jsonify({"error": "banned"}), 403

        message = {
            "username": username,
            "text": data.get("text"),
            "timestamp": datetime.utcnow().isoformat(),
        }
        messages.setdefault(room, []).append(message)
        if len(messages[room]) > 100:
            messages[room] = messages[room][-100:]

    # ✅ Ensure room exists in `messages` before accessing
    room_messages = messages.setdefault(room, [])

    since = request.args.get("since")
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
            pass  # Invalid timestamp format

    return jsonify(room_messages)


room_owners = {}  # Tracks room owner username


@app.route("/chat/<room>/users", methods=["POST", "GET"])
def room_user_list(room):
    room = room.strip()
    if request.method == "POST":
        data = request.json
        username = data.get("username")
        if not username:
            return jsonify({"error": "No username"}), 400

        room_users.setdefault(room, {})
        if room not in room_owners and username not in room_users[room]:
            room_owners[room] = username  # First user becomes the owner

        room_users[room][username] = datetime.utcnow().isoformat()

    users = room_users.get(room, {})
    response = {"users": list(users.keys())}
    if room in room_owners:
        response["owner"] = room_owners[room]
    return jsonify(response)


@app.route("/admin/users", methods=["GET"])
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


@app.route("/admin/rooms", methods=["GET"])
@requires_auth
def admin_rooms():
    return jsonify(
        [
            {"name": r, "users": list(room_users.get(r, {}).keys())}
            for r in list(messages.keys())
        ]
    )


@app.route("/admin/banip", methods=["POST"])
@requires_auth
def admin_ban_ip():
    data = request.json
    username = data.get("username")
    ip_to_ban = user_ips.get(username)
    if not ip_to_ban:
        return jsonify({"error": "no ip"}), 400

    banned_ips.add(ip_to_ban)
    # Optionally kick user or clear data
    user_sessions.pop(username, None)
    for room in room_users:
        room_users[room].pop(username, None)

    return jsonify({"banned": ip_to_ban})


@app.route("/admin/banusername", methods=["POST"])
@requires_auth
def admin_ban_username():
    data = request.json
    username = data.get("username")
    if not username:
        return jsonify({"error": "no username"}), 400

    banned_usernames.add(username)
    user_sessions.pop(username, None)
    for room in room_users:
        room_users[room].pop(username, None)

    return jsonify({"banned": username})


@app.route("/admin/banned", methods=["GET"])
@requires_auth
def admin_banned_list():
    banned = [{"type": "ip", "value": ip} for ip in banned_ips]
    banned += [{"type": "username", "value": uname} for uname in banned_usernames]
    return jsonify(banned)


@app.route("/admin")
@requires_auth
def admin_panel():
    try:
        return open("static/admin.html").read()
    except FileNotFoundError:
        return "admin.html not found", 404


@app.route("/admin/banrawip", methods=["POST"])
@requires_auth
def admin_ban_raw_ip():
    data = request.json
    ip = data.get("ip")
    if not ip:
        return jsonify({"error": "no ip"}), 400

    banned_ips.add(ip)
    return jsonify({"banned": ip})


@app.route("/admin/releaseuser", methods=["POST"])
@requires_auth
def admin_release_user():
    data = request.json
    username = data.get("username")
    if not username:
        return jsonify({"error": "no username"}), 400

    user_sessions.pop(username, None)
    user_ips.pop(username, None)
    for room in room_users:
        room_users[room].pop(username, None)
    return jsonify({"released": username})


video_state = {}  # 🧠 Tracks YouTube video and start time for each watchparty room


@app.route("/watchparty/<room>/video", methods=["GET", "POST"])
def watchparty_video_control(room):
    room = room.strip()

    # ✅ Ensure it's tracked as a public room
    if room not in public_chat_rooms:
        public_chat_rooms.append(room)

    # ✅ Mark it as a watchparty even if no video yet
    video_state.setdefault(room, {})

    if request.method == "POST":
        data = request.json
        url = data.get("url")
        if not url:
            return jsonify({"error": "No video URL"}), 400

        video_state[room] = {"url": url, "started_at": datetime.utcnow().isoformat()}
        return jsonify({"status": "started"})

    # GET: Return video and current playback position
    video_data = video_state.get(room)
    if not video_data or "url" not in video_data:
        return jsonify({"error": "No video"})

    try:
        start_time = datetime.fromisoformat(video_data["started_at"])
        elapsed = (datetime.utcnow() - start_time).total_seconds()
        return jsonify({"url": video_data["url"], "elapsed": int(elapsed)})
    except ValueError:
        return jsonify({"error": "Invalid timestamp"}), 500

@app.route("/watchparty/<room>/video/clear", methods=["POST"])
def clear_watchparty_video(room):
    room = room.strip()
    video_state.pop(room, None)
    return jsonify({"status": "cleared"})

# Background cleanup thread
def cleanup_messages():
    while True:

        # Culls chat messages
        message_cutoff = datetime.utcnow() - timedelta(hours=1)
        for room, room_messages in messages.items():
            messages[room] = [
                msg
                for msg in room_messages
                if datetime.fromisoformat(msg["timestamp"]) > message_cutoff
            ]

        # Removes inactive users from rooms
        inactive_cutoff = datetime.utcnow() - timedelta(minutes=1)
        for room in list(room_users.keys()):
            room_users[room] = {
                u: t
                for u, t in room_users[room].items()
                if datetime.fromisoformat(t) > inactive_cutoff
            }

        # Culls inactive chat rooms
        for room in list(public_chat_rooms):
            last_active_times = room_users.get(room, {}).values()
            if not last_active_times or all(
                datetime.fromisoformat(ts) < inactive_cutoff for ts in last_active_times
            ):
                public_chat_rooms.remove(room)
                messages.pop(room, None)
                room_users.pop(room, None)
                video_state.pop(room, None)

        # Remove inactive user sessions
        user_cutoff = datetime.utcnow() - timedelta(days=3)
        for user, session in list(user_sessions.items()):
            last_seen = datetime.fromisoformat(session["last_active"])
            if last_seen < user_cutoff:
                user_sessions.pop(user, None)

        time.sleep(60)  # Run every 60 seconds


# Start the cleanup thread on app launch
threading.Thread(target=cleanup_messages, daemon=True).start()

if __name__ == "__main__":
    app.run(debug=True)

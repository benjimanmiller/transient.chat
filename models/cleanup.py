import threading
import time
from datetime import datetime, timedelta

from models.state import (
    messages,
    room_users,
    public_chat_rooms,
    kicked_users,
    user_sessions,
    video_state,
)


def cleanup_loop():
    while True:
        # Remove chat messages older than 1 hour
        message_cutoff = datetime.utcnow() - timedelta(hours=1)
        for room, room_messages in messages.items():
            messages[room] = [
                msg
                for msg in room_messages
                if datetime.fromisoformat(msg["timestamp"]) > message_cutoff
            ]

        # Remove inactive users from rooms (after 1 min)
        inactive_cutoff = datetime.utcnow() - timedelta(minutes=1)
        for room in list(room_users.keys()):
            room_users[room] = {
                user: ts
                for user, ts in room_users[room].items()
                if datetime.fromisoformat(ts) > inactive_cutoff
            }

        # Remove inactive public rooms
        for room in list(public_chat_rooms):
            last_active = room_users.get(room, {}).values()
            if not last_active or all(
                datetime.fromisoformat(ts) < inactive_cutoff for ts in last_active
            ):
                public_chat_rooms.remove(room)
                messages.pop(room, None)
                room_users.pop(room, None)
                kicked_users.pop(room, None)
                video_state.pop(room, None)

        # Remove stale user sessions
        user_cutoff = datetime.utcnow() - timedelta(days=3)
        for user, session in list(user_sessions.items()):
            if datetime.fromisoformat(session["last_active"]) < user_cutoff:
                user_sessions.pop(user, None)

        time.sleep(60)  # Run every 60 seconds


def start_cleanup_thread():
    thread = threading.Thread(target=cleanup_loop, daemon=True)
    thread.start()

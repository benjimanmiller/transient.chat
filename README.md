# Transient Chat

> Everything is ephemeral.

**Transient.chat** is a lightweight, in-memory chat platform designed for real-time, impermanent conversation.

There are no profiles. No feeds. No likes.  
Just temporary rooms, simple handles, message expiration, and live synced watchrooms.

---

## About

- All messages automatically disappear after **1 hour**
- Empty rooms are purged — nothing is saved
- Users are identified by transient handles, released when inactive
- No databases, no disk writes, no persistence of any kind
- **Watchrooms** allow embedded synced YouTube viewing and conversation
- Works without WebSockets using traditional HTTP polling

This project is a throwback to early internet chatrooms — lightweight, anonymous, and inherently temporary.

Perfect for those who miss casual chat with no expectations or archives.

---

## Features

- Regional and topical chatroom lists
- Synchronized YouTube playback in "watchparty" mode
- Ephemeral message and session design
- Audio indicators and user join/leave sounds
- Owner moderation (kick users from rooms)
- Admin panel for IP/username bans
- Admin routes protected by environment-based Basic Auth
- No database dependency (runs entirely in volatile memory)

---

## Deployment

This app is intended to be deployed on **[DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform/)**  
as a Python Flask application.

You should:

- Point DigitalOcean to this repo
- Specify Python as the runtime
- Set environment variables for your admin login:

```env
ADMIN_USERNAME=your_admin_name
ADMIN_PASSWORD=your_secure_password
```

---

## Project Structure

```
transient.chat/
├── app.py             # Flask app factory and launcher
├── config.py          # Loads environment variables
├── models/
│   ├── state.py       # In-memory shared state
│   └── cleanup.py     # Background cleanup thread
├── blueprints/        # Modular route definitions
│   ├── auth.py
│   ├── chat.py
│   ├── rooms.py
│   ├── admin.py
│   ├── watchparty.py
│   └── static_routes.py
├── static/
│   ├── index.html
│   ├── chat.html
│   ├── watchparty_chat.html
│   ├── server_list.html
│   ├── faq.html
│   ├── admin.html
│   └── assets/        # Frontend resources
│       ├── css/       # Stylesheets
│       │   └── styles.css
│       ├── js/        # JavaScript files
│       │   ├── admin.js
│       │   ├── chat.js
│       │   ├── faq.js
│       │   ├── index.js
│       │   ├── server_list.js
│       │   └── watchparty_chat.js
│       ├── sounds/    # .wav audio clips
│       │   ├── user-in.wav
│       │   ├── user-out.wav
│       │   └── message.wav
│       └── favicon.ico
└── requirements.txt   # Python dependencies
```

---

## Contributing

Pull requests and issues are welcome.

If you'd like to add features, improve styling, or help build out exportable modules, feel free to fork and contribute to the project.

---

Nothing is archived.  
Nothing is retained.  
**Everything is ephemeral.**
const params = new URLSearchParams(window.location.search);
const room = params.get("room");
if (room) {
    document.title = `${room}`;
}

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    const username = localStorage.getItem("username");
    const userKey = localStorage.getItem("userKey");

    if (!room || !username || !userKey) {
        alert("Missing room or user credentials.");
        const url = `/index.html${room ? '?room=' + encodeURIComponent(room) : ''}`;
        window.location.href = url;
        return;
    }

    // Validate credentials
    try {
        const res = await fetch('/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, key: userKey })
        });
        if (!res.ok) {
            localStorage.clear();
            alert("User validation failed.");
            window.location.href = '/';
            return;
        }
    } catch (err) {
        console.error('Validation error:', err);
        localStorage.clear();
        alert("Validation failed.");
        const redirectUrl = `/index.html${room ? '?room=' + encodeURIComponent(room) : ''}`;
        window.location.href = redirectUrl;
        return;
    }

    document.getElementById("room-title").textContent = `Room: ${room}`;

    const messagesDiv = document.getElementById("messages");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("message-input");
    const usersDiv = document.getElementById("user-list");

    async function refreshUserPresence() {
        await fetch(`/chat/${encodeURIComponent(room)}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
    }

    async function loadUsers() {
        const res = await fetch(`/chat/${encodeURIComponent(room)}/users`);
        const userList = await res.json();
        usersDiv.innerHTML = "";
        userList.forEach(user => {
            const div = document.createElement("div");
            div.textContent = user;
            usersDiv.appendChild(div);
        });
    }

    let lastTimestamp = null;
    let windowFocused = true;
    let unreadCount = 0;

    window.addEventListener('focus', () => {
        windowFocused = true;
        unreadCount = 0;
        document.title = `${room}`;
    });

    window.addEventListener('blur', () => {
        windowFocused = false;
    });

    function linkify(text) {
        return text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }

    function cleanExpiredMessages() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const messageDivs = document.querySelectorAll("#messages .message");

        messageDivs.forEach(msgDiv => {
            const ts = msgDiv.getAttribute("data-timestamp");
            if (!ts) return;

            const cleanedTs = ts.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}).+$/, '$1Z');
            const parsedTimestamp = Date.parse(cleanedTs);
            if (isNaN(parsedTimestamp)) return;

            if (parsedTimestamp < oneHourAgo) {
                msgDiv.remove();
            }
        });
    }

    function loadMessages() {
        const url = `/chat/${encodeURIComponent(room)}` + (lastTimestamp ? `?since=${encodeURIComponent(lastTimestamp)}` : "");
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (!Array.isArray(data)) return;

                const now = Date.now();
                const oneHourAgo = now - 60 * 60 * 1000;

                const newMessages = data.filter(msg => {
                    const msgTime = new Date(msg.timestamp).getTime();
                    return msgTime >= oneHourAgo;
                });

                newMessages.forEach(msg => {
                    const div = document.createElement("div");
                    div.classList.add("message");
                    div.setAttribute("data-timestamp", msg.timestamp);
                    if (msg.username === username) {
                        div.classList.add("my-message");
                    }
                    div.innerHTML = `<strong>${msg.username}:</strong> ${linkify(msg.text)}`;
                    messagesDiv.appendChild(div);
                });

                if (newMessages.length > 0) {
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                    lastTimestamp = newMessages[newMessages.length - 1].timestamp;
                }

                if (!windowFocused && newMessages.length > 0) {
                    unreadCount += newMessages.length;
                    document.title = `${room} (${unreadCount})`;
                }
            });
    }

    form.addEventListener("submit", e => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        fetch(`/chat/${encodeURIComponent(room)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, text })
        }).then(() => {
            input.value = "";
        });
    });

    async function refresh() {
        await refreshUserPresence();
        loadMessages();
        loadUsers();
        cleanExpiredMessages();
    }

    await refresh();
    setInterval(refresh, 1000); // Poll every second
});
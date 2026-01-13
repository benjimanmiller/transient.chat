document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    const username = localStorage.getItem("username");
    const userKey = localStorage.getItem("userKey");

    if (!room || !username || !userKey) {
        alert("Missing room or user credentials.");
        window.location.href = '/';
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
        window.location.href = '/';
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

    function loadMessages() {
        fetch(`/chat/${encodeURIComponent(room)}`)
            .then(res => res.json())
            .then(data => {
                messagesDiv.innerHTML = "";
                data.forEach(msg => {
                    const div = document.createElement("div");
                    div.classList.add("message");
                    if (msg.username === username) {
                        div.classList.add("my-message");
                    }
                    div.textContent = `${msg.username}: ${msg.text}`;
                    messagesDiv.appendChild(div);
                });
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
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
            loadMessages();
        });
    });

    async function refresh() {
        await refreshUserPresence();
        loadMessages();
        loadUsers();
    }

    await refresh();
    setInterval(refresh, 5000); // Poll every 5s
});
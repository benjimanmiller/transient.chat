document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    const username = localStorage.getItem("username");

    if (!room || !username) {
        alert("Missing room or username.");
        return;
    }

    document.getElementById("room-title").textContent = `Room: ${room}`;

    const messagesDiv = document.getElementById("messages");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("message-input");

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

    loadMessages();
    setInterval(loadMessages, 5000); // Poll every 5s
});
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
    let firstLoad = true;
    let isRefreshing = false;

    if (!room || !username || !userKey) {
        alert("Missing room or user credentials.");
        const url = `/index.html${room ? '?room=' + encodeURIComponent(room) : ''}`;
        window.location.href = url;
        return;
    }

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
    const soundToggleBtn = document.getElementById("sound-toggle");
    const externalToggleBtn = document.getElementById("external-toggle");

    // Audio setup
    const sounds = {
        message: new Audio('message.wav'),
        in: new Audio('user-in.wav'),
        out: new Audio('user-out.wav'),
    };

    let soundEnabled = true;
    soundToggleBtn.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        soundToggleBtn.textContent = soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off";
        soundToggleBtn.style.backgroundColor = soundEnabled ? "" : "gray";
    });

    let externalContentEnabled = false;

    const updateExternalToggleBtn = () => {
        externalToggleBtn.textContent = externalContentEnabled
            ? "🖼️ External Content: On"
            : "🖼️ External Content: Off";
        externalToggleBtn.style.backgroundColor = externalContentEnabled ? "" : "gray";
    };

    updateExternalToggleBtn(); // Set initial text + style

    externalToggleBtn.addEventListener("click", () => {
        externalContentEnabled = !externalContentEnabled;
        updateExternalToggleBtn();
    });

    async function refreshUserPresence() {
        await fetch(`/chat/${encodeURIComponent(room)}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
    }

    let lastUserList = [];
    let lastTimestamp = null;
    const seenMessageTimestamps = new Set();

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
        return text.replace(/(https?:\/\/[^\s]+)/g, (url) => {
            const imagePattern = /\.(png|jpe?g|gif)$/i;
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;

            const id = `preview-${Math.random().toString(36).substr(2, 9)}`;

            // ✅ YouTube Video
            const ytMatch = url.match(youtubeRegex);
            if (ytMatch) {
                const videoId = ytMatch[1];
                const embedUrl = `https://www.youtube.com/embed/${videoId}`;

                if (externalContentEnabled) {
                    return `
                    <div style="padding: 0.5em; text-align: center;">
                        <iframe 
                            src="${embedUrl}" 
                            title="YouTube video player"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerpolicy="strict-origin-when-cross-origin"
                            allowfullscreen
                            style="width: 640px; height: 360px; max-width: 100%; border-radius: 4px;"
                        ></iframe>
                    </div>
                `;
                } else {
                    return `
                    <div class="external-image-placeholder" style="padding: 0.5em; text-align: center;">
                        <button onclick="
                            this.style.display='none';
                            const iframe = document.createElement('iframe');
                            iframe.src = '${embedUrl}';
                            iframe.title = 'YouTube video player';
                            iframe.frameBorder = 0;
                            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
                            iframe.allowFullscreen = true;
                            iframe.style.width = '640px';
                            iframe.style.height = '360px';
                            iframe.style.maxWidth = '100%';
                            iframe.style.borderRadius = '4px';
                            document.getElementById('${id}').appendChild(iframe);
                        ">
                            Show external content
                        </button>
                        <div id="${id}" style="margin-top: 0.5em;"></div>
                    </div>
                `;
                }
            }

            // ✅ Image
            if (imagePattern.test(url)) {
                if (externalContentEnabled) {
                    return `
                    <div style="padding: 0.5em; text-align: center;">
                        <img src="${url}" style="width: 100%; height: auto; border-radius: 4px;" />
                    </div>
                `;
                } else {
                    return `
                    <div class="external-image-placeholder" style="padding: 0.5em; text-align: center;">
                        <button onclick="
                            this.style.display='none';
                            const img = document.createElement('img');
                            img.src = '${url}';
                            img.style.width = '100%';
                            img.style.height = 'auto';
                            img.style.borderRadius = '4px';
                            document.getElementById('${id}').appendChild(img);
                        ">
                            Show external content
                        </button>
                        <div id="${id}" style="margin-top: 0.5em;"></div>
                    </div>
                `;
                }
            }

            // 🔗 Default fallback: plain link
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
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
                seenMessageTimestamps.delete(ts);
            }
        });
    }

    async function loadUsers() {
        const res = await fetch(`/chat/${encodeURIComponent(room)}/users`);
        const userList = await res.json();
        usersDiv.innerHTML = "";

        const joined = userList.filter(user => !lastUserList.includes(user));
        const left = lastUserList.filter(user => !userList.includes(user));

        if (!firstLoad && soundEnabled) {
            if (joined.length > 0) sounds.in.play();
            if (left.length > 0) sounds.out.play();
        }

        lastUserList = userList;

        userList.forEach(user => {
            const div = document.createElement("div");
            div.textContent = user;
            usersDiv.appendChild(div);
        });
    }

    async function loadMessages() {
        const url = `/chat/${encodeURIComponent(room)}` + (lastTimestamp ? `?since=${encodeURIComponent(lastTimestamp)}` : "");
        const res = await fetch(url);
        const data = await res.json();

        if (!Array.isArray(data)) return;

        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;

        const newMessages = data.filter(msg => {
            const msgTime = new Date(msg.timestamp).getTime();
            if (isNaN(msgTime)) return false;
            if (firstLoad) return true;
            return msgTime >= oneHourAgo;
        });

        newMessages.forEach(msg => {
            // Skip if already rendered
            if (seenMessageTimestamps.has(msg.timestamp)) return;

            const div = document.createElement("div");
            div.classList.add("message");
            div.setAttribute("data-timestamp", msg.timestamp);
            seenMessageTimestamps.add(msg.timestamp);

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

        if (!firstLoad && soundEnabled && newMessages.some(msg => msg.username !== username)) {
            sounds.message.play();
        }

        if (!windowFocused && newMessages.length > 0) {
            unreadCount += newMessages.length;
            document.title = `${room} (${unreadCount})`;
        }
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
            refresh(); // force fetch after post to ensure sync
        });
    });

    async function refresh() {
        if (isRefreshing) return;
        isRefreshing = true;

        try {
            await refreshUserPresence();
            await loadMessages();
            await loadUsers();
            cleanExpiredMessages();
        } catch (e) {
            console.error("Refresh error:", e);
        } finally {
            firstLoad = false;
            isRefreshing = false;
        }
    }

    // First full load, then enable polling
    await refresh();
    setInterval(refresh, 1000);
});
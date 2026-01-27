document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    const username = localStorage.getItem("username");
    const userKey = localStorage.getItem("userKey");

    if (!room || !username || !userKey) {
        alert("Missing room or user credentials.");
        window.location.href = `/index.html${room ? `?room=${encodeURIComponent(room)}&watchparty=1` : ""}`;
        return;
    }

    try {
        const res = await fetch("/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, key: userKey }),
        });
        if (!res.ok) throw new Error("User not validated");
    } catch (err) {
        localStorage.clear();
        alert("Validation failed.");
        window.location.href = `/index.html${room ? `?room=${encodeURIComponent(room)}&watchparty=1` : ""}`;
        return;
    }

        document.getElementById("room-title").innerHTML = `
      <div class="title-row">
        <img src="/assets/images/transientchat-blue.png" alt="Transient.chat" style="height: 60px;"/>
        Room: ${room}
      </div>
    `;;

    const videoControls = document.getElementById("video-controls");
    const videoInput = document.getElementById("video-url-input");
    const videoButton = document.getElementById("start-video-button");
    const clearButton = document.getElementById("clear-video-button");
    const iframe = document.getElementById("video-iframe");

    let videoExpireAt = null;
    let videoStarted = false;
    let lastVideoId = null;
    let isRoomOwner = false;

    function extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([\w-]{11})/);
        return match ? match[1] : null;
    }

    async function fetchYouTubeDuration(videoId) {
        return 24 * 60 * 60; // 24 hours in seconds
    }

    function loadYouTubeVideo(videoId, startSeconds = 0) {
        if (lastVideoId === videoId) return;
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startSeconds}`;
        iframe.style.display = "block";
        lastVideoId = videoId;
    }

    function clearVideoUI() {
        iframe.src = "";
        iframe.style.display = "none";
        videoExpireAt = null;
        videoStarted = false;
        lastVideoId = null;
        updateControlVisibility({ isPlaying: false, isOwner: isRoomOwner });
    }

    function updateControlVisibility({ isPlaying, isOwner }) {
        if (isOwner) {
            if (isPlaying) {
                videoInput.style.display = "none";
                videoButton.style.display = "none";
                clearButton.style.display = "inline-block";
            } else {
                videoInput.style.display = "inline-block";
                videoButton.style.display = "inline-block";
                clearButton.style.display = "none";
            }
            videoControls.style.display = "block";
        } else {
            videoControls.style.display = "none";
        }
    }

    async function checkRoomOwnership() {
        try {
            const res = await fetch(`/chat/${encodeURIComponent(room)}/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
            const data = await res.json();
            isRoomOwner = data.owner && data.owner === username;
        } catch (err) {
            console.error("Failed to determine ownership", err);
            isRoomOwner = false;
        }
    }

    videoButton.addEventListener("click", async () => {
        const url = videoInput.value.trim();
        const videoId = extractYouTubeId(url);
        if (!videoId) return alert("Invalid YouTube URL.");

        await fetch(`/watchparty/${encodeURIComponent(room)}/video`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });

        const duration = await fetchYouTubeDuration(videoId);
        videoExpireAt = Date.now() + duration * 1000;
        videoStarted = true;

        loadYouTubeVideo(videoId);
        updateControlVisibility({ isPlaying: true, isOwner: isRoomOwner });
    });

    clearButton.addEventListener("click", async () => {
        try {
            await fetch(`/watchparty/${encodeURIComponent(room)}/video/clear`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            clearVideoUI();
        } catch (err) {
            console.error("Failed to clear video", err);
        }
    });

    async function syncVideoFromServer() {
        try {
            const res = await fetch(`/watchparty/${encodeURIComponent(room)}/video`);
            if (!res.ok) throw new Error("video fetch failed");

            const { url, elapsed } = await res.json();
            const videoId = extractYouTubeId(url);
            if (!videoId) {
                clearVideoUI();
                return;
            }

            const duration = await fetchYouTubeDuration(videoId);
            videoExpireAt = Date.now() + ((duration - elapsed) * 1000);
            videoStarted = true;

            loadYouTubeVideo(videoId, elapsed);
            updateControlVisibility({ isPlaying: true, isOwner: isRoomOwner });
        } catch (err) {
            // Fallback: video was likely cleared
            if (videoStarted || iframe.style.display !== "none") {
                clearVideoUI();
            }
        }
    }

    setInterval(async () => {
        if (videoExpireAt && Date.now() > videoExpireAt) {
            clearVideoUI();

            if (isRoomOwner) {
                try {
                    await fetch(`/watchparty/${encodeURIComponent(room)}/video/clear`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username }),
                    });
                } catch (err) {
                    console.error("Failed to auto-clear video", err);
                }
            }
        } else {
            await syncVideoFromServer();
        }
    }, 1000);

    async function initialize() {
        await checkRoomOwnership();
        await syncVideoFromServer();
        if (!videoStarted) {
            updateControlVisibility({ isPlaying: false, isOwner: isRoomOwner });
        }
    }

    await initialize();
});
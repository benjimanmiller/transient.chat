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

    // Note: We rely on chat.js (loaded in the HTML) to handle the server-side
    // /validate call and the rendering of the #room-title header.
    // This script focuses solely on the video synchronization logic.

    const videoControls = document.getElementById("video-controls");
    const videoInput = document.getElementById("video-url-input");
    const videoButton = document.getElementById("start-video-button");
    const pauseButton = document.getElementById("pause-video-button");
    const resumeButton = document.getElementById("resume-video-button");
    const clearButton = document.getElementById("clear-video-button");
    const iframe = document.getElementById("video-iframe");
    const pausedOverlay = document.getElementById("paused-overlay");

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
        iframe.classList.remove("hidden");
        lastVideoId = videoId;
    }

    function clearVideoUI() {
        iframe.src = "";
        iframe.classList.add("hidden");
        videoExpireAt = null;
        videoStarted = false;
        lastVideoId = null;
        pausedOverlay.classList.add("hidden");
        updateControlVisibility({ hasVideo: false, isPaused: false, isOwner: isRoomOwner });
    }

    function updateControlVisibility({ hasVideo, isPaused, isOwner }) {
        if (isOwner) {
            if (hasVideo) {
                videoInput.classList.add("hidden");
                videoButton.classList.add("hidden");
                clearButton.classList.remove("hidden");

                if (isPaused) {
                    pauseButton.classList.add("hidden");
                    resumeButton.classList.remove("hidden");
                } else {
                    pauseButton.classList.remove("hidden");
                    resumeButton.classList.add("hidden");
                }
            } else {
                videoInput.classList.remove("hidden");
                videoButton.classList.remove("hidden");
                clearButton.classList.add("hidden");
                pauseButton.classList.add("hidden");
                resumeButton.classList.add("hidden");
            }
            videoControls.classList.remove("hidden");
        } else {
            videoControls.classList.add("hidden");
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
        updateControlVisibility({ hasVideo: true, isPaused: false, isOwner: isRoomOwner });
    });

    pauseButton.addEventListener("click", async () => {
        try {
            await fetch(`/watchparty/${encodeURIComponent(room)}/video/pause`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
        } catch (err) {
            console.error("Failed to pause video", err);
        }
    });

    resumeButton.addEventListener("click", async () => {
        try {
            await fetch(`/watchparty/${encodeURIComponent(room)}/video/resume`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });
        } catch (err) {
            console.error("Failed to resume video", err);
        }
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

            const { url, elapsed, is_paused } = await res.json();
            const videoId = extractYouTubeId(url);
            if (!videoId) {
                clearVideoUI();
                return;
            }

            if (is_paused) {
                if (!iframe.classList.contains("hidden")) {
                    iframe.classList.add("hidden");
                    iframe.src = ""; // Stop audio
                    pausedOverlay.classList.remove("hidden");
                    lastVideoId = null; // Force reload on resume
                }
                videoStarted = true;
                updateControlVisibility({ hasVideo: true, isPaused: true, isOwner: isRoomOwner });
                return;
            }

            pausedOverlay.classList.add("hidden");
            const duration = await fetchYouTubeDuration(videoId);
            videoExpireAt = Date.now() + ((duration - elapsed) * 1000);
            videoStarted = true;

            loadYouTubeVideo(videoId, elapsed);
            updateControlVisibility({ hasVideo: true, isPaused: false, isOwner: isRoomOwner });
        } catch (err) {
            // Fallback: video was likely cleared
            if (videoStarted || !iframe.classList.contains("hidden")) {
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
            updateControlVisibility({ hasVideo: false, isPaused: false, isOwner: isRoomOwner });
        }
    }

    await initialize();
});
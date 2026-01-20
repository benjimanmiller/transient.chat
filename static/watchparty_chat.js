document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");
  const username = localStorage.getItem("username");
  const userKey = localStorage.getItem("userKey");

  if (!room || !username || !userKey) {
    alert("Missing room or user credentials.");
    window.location.href = `/index.html${room ? `?room=${encodeURIComponent(room)}` : ""}`;
    return;
  }

  // Validate user
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
    window.location.href = "/";
    return;
  }

  document.getElementById("room-title").textContent = `Room: ${room}`;

  // Video controls
  const videoInput = document.getElementById("video-url-input");
  const videoButton = document.getElementById("start-video-button");
  const iframe = document.getElementById("video-iframe");
  const videoControls = document.getElementById("video-controls");
  let videoExpireAt = null;
  let videoStarted = false;
  let lastVideoId = null;

  function extractYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
  }

  async function fetchYouTubeDuration(videoId) {
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await res.json();
      return data.duration || 300; // fallback 5 minutes
    } catch {
      return 300;
    }
  }

  function loadYouTubeVideo(videoId, startSeconds = 0) {
    if (lastVideoId === videoId) return;
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startSeconds}`;
    iframe.style.display = "block";
    lastVideoId = videoId;
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

    videoControls.style.display = "none";
    loadYouTubeVideo(videoId);
  });

  async function syncVideoFromServer() {
    try {
      const res = await fetch(`/watchparty/${encodeURIComponent(room)}/video`);
      if (!res.ok) return;

      const { url, elapsed } = await res.json();
      const videoId = extractYouTubeId(url);
      if (!videoId) return;

      const duration = await fetchYouTubeDuration(videoId);
      videoExpireAt = Date.now() + ((duration - elapsed) * 1000);
      videoStarted = true;

      videoControls.style.display = "none";
      loadYouTubeVideo(videoId, elapsed);
    } catch {
      // No active video
    }
  }

  // Monitor if video ended
  setInterval(() => {
    if (videoStarted && videoExpireAt && Date.now() > videoExpireAt) {
      iframe.src = "";
      iframe.style.display = "none";
      videoControls.style.display = "block";
      videoStarted = false;
      videoExpireAt = null;
      lastVideoId = null;
    }
  }, 1000);

  // Attempt to sync video on entry
  await syncVideoFromServer();
});
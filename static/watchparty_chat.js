const params = new URLSearchParams(window.location.search);
const room = params.get("room");
if (room) {
  document.title = `${room}`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const username = localStorage.getItem("username");
  const userKey = localStorage.getItem("userKey");
  let firstLoad = true;
  let isRefreshing = false;
  let videoExpireAt = null;
  let videoStarted = false;

  if (!room || !username || !userKey) {
    alert("Missing room or user credentials.");
    window.location.href = `/index.html${room ? `?room=${encodeURIComponent(room)}` : ""}`;
    return;
  }

  try {
    const res = await fetch("/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, key: userKey }),
    });
    if (!res.ok) {
      localStorage.clear();
      alert("User validation failed.");
      window.location.href = "/";
      return;
    }
  } catch (err) {
    console.error("Validation error:", err);
    localStorage.clear();
    alert("Validation failed.");
    window.location.href = `/index.html${room ? `?room=${encodeURIComponent(room)}` : ""}`;
    return;
  }

  document.getElementById("room-title").textContent = `Room: ${room}`;

  const messagesDiv = document.getElementById("messages");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("message-input");
  const usersDiv = document.getElementById("user-list");
  const soundToggleBtn = document.getElementById("sound-toggle");
  const externalToggleBtn = document.getElementById("external-toggle");

  const videoInput = document.getElementById("video-url-input");
  const videoButton = document.getElementById("start-video-button");
  const iframe = document.getElementById("video-iframe");
  const videoControls = document.getElementById("video-controls");

  const sounds = {
    message: new Audio("message.wav"),
    in: new Audio("user-in.wav"),
    out: new Audio("user-out.wav"),
  };

  let soundEnabled = true;
  let externalContentEnabled = false;
  let lastTimestamp = null;
  const seenMessageTimestamps = new Set();
  let lastUserList = [];
  let windowFocused = true;
  let unreadCount = 0;

  soundToggleBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.textContent = soundEnabled ? "🔊 Sound: On" : "🔇 Sound: Off";
    soundToggleBtn.style.backgroundColor = soundEnabled ? "" : "gray";
  });

  externalToggleBtn.addEventListener("click", () => {
    externalContentEnabled = !externalContentEnabled;
    externalToggleBtn.textContent = externalContentEnabled
      ? "🖥️ External Content: On"
      : "🔒 External Content: Off";
    externalToggleBtn.style.backgroundColor = externalContentEnabled ? "" : "gray";
  });

  window.addEventListener("focus", () => {
    windowFocused = true;
    unreadCount = 0;
    document.title = `${room}`;
  });

  window.addEventListener("blur", () => {
    windowFocused = false;
  });

  function extractYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : null;
  }

  async function fetchYouTubeDuration(videoId) {
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
      const data = await res.json();
      let duration = data.duration || 0;
      if (duration <= 0) {
        duration = 300; // fallback to 5 minutes
      }
      return duration;
    } catch (err) {
      console.warn("Could not fetch duration", err);
      return 300; // fallback duration
    }
  }

  videoButton.addEventListener("click", async () => {
    const url = videoInput.value.trim();
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      alert("Invalid YouTube URL.");
      return;
    }

    await fetch(`/watchparty/${encodeURIComponent(room)}/video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const duration = await fetchYouTubeDuration(videoId);
    videoExpireAt = Date.now() + duration * 1000;
    videoStarted = true;

    videoControls.style.display = "none";
    loadYouTubeVideo(videoId, 0);
  });

  let lastVideoId = null;
  function loadYouTubeVideo(videoId, startSeconds) {
    if (lastVideoId === videoId) return;
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startSeconds}`;
    iframe.src = embedUrl;
    iframe.style.display = "block";
    lastVideoId = videoId;
  }

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
    } catch (e) {
      console.warn("No active video or failed to sync.");
    }
  }

  setInterval(() => {
    if (videoStarted && videoExpireAt && Date.now() > videoExpireAt) {
      // Video finished
      videoExpireAt = null;
      videoStarted = false;
      lastVideoId = null;

      iframe.src = "";
      iframe.style.display = "none";
      videoControls.style.display = "block";
    }
  }, 1000);

  async function refreshUserPresence() {
    await fetch(`/chat/${encodeURIComponent(room)}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
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
    const url =
      `/chat/${encodeURIComponent(room)}` +
      (lastTimestamp ? `?since=${encodeURIComponent(lastTimestamp)}` : "");
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) return;

    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const newMessages = data.filter((msg) => {
      const msgTime = new Date(msg.timestamp).getTime();
      if (isNaN(msgTime)) return false;
      if (firstLoad) return true;
      return msgTime >= oneHourAgo;
    });

    newMessages.forEach((msg) => {
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

    if (!firstLoad && soundEnabled && newMessages.some((msg) => msg.username !== username)) {
      sounds.message.play();
    }

    if (!windowFocused && newMessages.length > 0) {
      unreadCount += newMessages.length;
      document.title = `${room} (${unreadCount})`;
    }
  }

  function linkify(text) {
    return text.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      const isImage = /\.(png|jpe?g|gif)$/i.test(url);
      if (isImage) {
        return `<a href="${url}" target="_blank">${url}</a><div style="padding-top:0.5em;"><img src="${url}" style="width:100%; border-radius:4px;" /></div>`;
      }

      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
      if (ytMatch) {
        const embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
        return `<a href="${url}" target="_blank">${url}</a><div style="padding-top:0.5em;"><iframe src="${embedUrl}" allowfullscreen frameborder="0" style="width:100%; height:300px; border-radius:4px;"></iframe></div>`;
      }

      return `<a href="${url}" target="_blank">${url}</a>`;
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    fetch(`/chat/${encodeURIComponent(room)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, text }),
    }).then(() => {
      input.value = "";
      refresh();
    });
  });

  async function refresh() {
    if (isRefreshing) return;
    isRefreshing = true;

    try {
      const res = await fetch("/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, key: userKey }),
      });

      if (!res.ok) {
        localStorage.clear();
        alert("Session expired or removed.");
        window.location.href = "/";
        return;
      }

      await refreshUserPresence();
      await loadMessages();
      await loadUsers();
    } catch (e) {
      console.error("Refresh error:", e);
    } finally {
      firstLoad = false;
      isRefreshing = false;
    }
  }

  await refresh();
  await syncVideoFromServer(); // sync once on load if a video is active
});
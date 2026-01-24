document.addEventListener("DOMContentLoaded", async () => {
    const username = localStorage.getItem('username');
    const userKey = localStorage.getItem('userKey');

    if (!username || !userKey) {
        window.location.href = '/';
        return;
    }

    try {
        const response = await fetch('/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, key: userKey })
        });
        if (!response.ok) {
            localStorage.clear();
            window.location.href = '/';
            return;
        }
    } catch (err) {
        console.error('Validation failed:', err);
        localStorage.clear();
        window.location.href = '/';
        return;
    }

    const userInfoEl = document.getElementById('user-info');
    userInfoEl.textContent = `Logged in as: ${username}`;

    document.querySelectorAll('.collapsible').forEach(heading => {
        heading.addEventListener('click', () => {
            const content = heading.nextElementSibling;
            const isOpen = content.style.display === 'block';
            content.style.display = isOpen ? 'none' : 'block';
            heading.textContent = (isOpen ? '▶' : '▼') + heading.textContent.slice(1);
        });
    });

    fetch("/rooms")
        .then(response => response.json())
        .then(data => {
            const { regional, topical, public: publicRooms, unique_users } = data;

            const regionalList = document.getElementById('regional-rooms');
            const topicalList = document.getElementById('topical-rooms');
            const publicList = document.getElementById('public-rooms');
            const watchpartyList = document.getElementById('watchparty-rooms');

            // Helper to create a room <li>
            function createRoomItem({ name, users, type }) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                const isWatchParty = type && type.startsWith('watchparty');
                a.href = isWatchParty
                    ? `/watchparty_chat.html?room=${encodeURIComponent(name)}`
                    : `/chat.html?room=${encodeURIComponent(name)}`;
                a.textContent = `${name}  ( ${users} )`;
                li.appendChild(a);
                return { li, isWatchParty };
            }

            // Add regional rooms
            regional.forEach(room => {
                regionalList.appendChild(createRoomItem(room).li);
            });

            // Add topical rooms
            topical.forEach(room => {
                topicalList.appendChild(createRoomItem(room).li);
            });

            // Add public/watchparty rooms
            publicRooms.forEach(room => {
                const { li, isWatchParty } = createRoomItem(room);
                if (isWatchParty) {
                    watchpartyList.appendChild(li);
                } else {
                    publicList.appendChild(li);
                }
            });

            // Show total unique user count
            document.getElementById('user-count').textContent = `Users Chatting ( ${unique_users} )`;

            // 🧠 Load and render Active Rooms (regional, topical, public w/ users)
            fetch("/rooms?activeOnly=true")
                .then(response => response.json())
                .then(({ regional, topical, public: publicRooms }) => {
                    const activeList = document.getElementById("active-rooms");
                    let count = 0;

                    function createActiveRoomItem({ name, users, type }) {
                        const li = document.createElement("li");
                        const a = document.createElement("a");

                        a.href = type === "watchparty"
                            ? `/watchparty_chat.html?room=${encodeURIComponent(name)}`
                            : `/chat.html?room=${encodeURIComponent(name)}`;
                        a.textContent = `${name}  ( ${users} )`;
                        li.appendChild(a);
                        return li;
                    }

                    [...regional, ...topical, ...publicRooms].forEach(room => {
                        activeList.appendChild(createActiveRoomItem(room));
                        count++;
                    });

                    // Update Active Rooms heading with count
                    const activeHeadingEl = [...document.querySelectorAll("h2.collapsible")].find(
                        el => el.textContent.includes("Active Rooms")
                    );
                    if (activeHeadingEl) {
                        const baseText = activeHeadingEl.textContent.replace(/▶|▼|\(\d+\)/g, "").trim();
                        activeHeadingEl.textContent = `▶ ${baseText} ( ${count} )`;
                    }
                })
                .catch(err => {
                    console.error("Failed to load active rooms:", err);
                });
        })
        .catch(err => {
            console.error("Failed to load rooms:", err);
            alert("Failed to load rooms.");
        });

    document.getElementById('create-room-btn').addEventListener('click', () => {
        const roomName = document.getElementById('new-room-name').value.trim();
        if (!roomName) return alert('Room name cannot be empty.');

        fetch('/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: roomName })
        })
            .then(response => {
                if (!response.ok) throw new Error('Room creation failed.');
                return response.json();
            })
            .then(data => {
                window.location.href = `/chat.html?room=${encodeURIComponent(data.name)}`;
            })
            .catch(err => alert(err.message));
    });

    document.getElementById('create-unlisted-room-btn').addEventListener('click', () => {
        const roomName = document.getElementById('new-room-name').value.trim();
        window.location.href = `/chat.html?room=${encodeURIComponent(roomName)}`;
    });

    // 🔥 Watch Party creation
    document.getElementById('create-watchparty-btn').addEventListener('click', () => {
        const roomName = document.getElementById('new-watchparty-name').value.trim();
        if (!roomName) return alert('Room name cannot be empty.');

        fetch('/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: roomName })
        })
            .then(response => {
                if (!response.ok) throw new Error('Watch party creation failed.');
                return response.json();
            })
            .then(data => {
                window.location.href = `/watchparty_chat.html?room=${encodeURIComponent(data.name)}`;
            })
            .catch(err => alert(err.message));
    });
});

// Enable Enter key for room creation
document.getElementById('new-room-name').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('create-room-btn').click();
    }
});

// Enable Enter key for watch party creation
document.getElementById('new-watchparty-name').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        document.getElementById('create-watchparty-btn').click();
    }
});

window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});
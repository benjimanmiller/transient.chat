document.addEventListener("DOMContentLoaded", async () => {
    const username = localStorage.getItem('username');
    const userKey = localStorage.getItem('userKey');

    // Validate credentials before proceeding
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
    userInfoEl.textContent = `Logged in as: ${username} (Key: ${userKey})`;

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
    .then(async data => {
        const { regional, topical, public: publicRooms } = data;

        const regionalList = document.getElementById('regional-rooms');
        const topicalList = document.getElementById('topical-rooms');
        const publicList = document.getElementById('public-rooms');

        // Helper to create room list item with user count
        const createRoomItem = async (room) => {
            let userCount = 0;
            try {
                const res = await fetch(`/chat/${encodeURIComponent(room)}/users`);
                const users = await res.json();
                userCount = Array.isArray(users) ? users.length : 0;
            } catch (e) {
                console.error(`Failed to fetch users for room ${room}:`, e);
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `/chat.html?room=${encodeURIComponent(room)}`;
            a.textContent = `${room}  ( ${userCount} )`;
            li.appendChild(a);
            return li;
        };

        // Populate all room categories with user counts
        for (const room of regional) {
            const li = await createRoomItem(room);
            regionalList.appendChild(li);
        }

        for (const room of topical) {
            const li = await createRoomItem(room);
            topicalList.appendChild(li);
        }

        for (const room of publicRooms) {
            const li = await createRoomItem(room);
            publicList.appendChild(li);
        }
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
            const publicList = document.getElementById('public-rooms');
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `/chat.html?room=${encodeURIComponent(data.name)}`;
            a.textContent = data.name;
            li.appendChild(a);
            publicList.appendChild(li);
            document.getElementById('new-room-name').value = '';

            // Automatically redirect to new room
            window.location.href = `/chat.html?room=${encodeURIComponent(data.name)}`;
        })
        .catch(err => alert(err.message));
    });
});


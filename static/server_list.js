document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem('username');
    const userKey = localStorage.getItem('userKey');
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
    .then(data => {
        const { regional, topical, public: publicRooms } = data;

        const regionalList = document.getElementById('regional-rooms');
        regional.forEach(room => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `/chat.html?room=${encodeURIComponent(room)}`;
            a.textContent = room;
            li.appendChild(a);
            regionalList.appendChild(li);
        });

        const topicalList = document.getElementById('topical-rooms');
        topical.forEach(room => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `/chat.html?room=${encodeURIComponent(room)}`;
            a.textContent = room;
            li.appendChild(a);
            topicalList.appendChild(li);
        });

        const publicList = document.getElementById('public-rooms');
        publicRooms.forEach(room => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `/chat.html?room=${encodeURIComponent(room)}`;
            a.textContent = room;
            li.appendChild(a);
            publicList.appendChild(li);
        });
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


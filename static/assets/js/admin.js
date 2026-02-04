async function loadUsers() {
    const res = await fetch('/admin/users');
    const users = await res.json();
    const div = document.getElementById('userList');
    const countDisplay = document.getElementById('activeUserCount');
    div.innerHTML = '';
    users.forEach(user => {
        const item = document.createElement('div');
        const label = document.createElement('span');
        label.textContent = `${user.username} (${user.ip})`;

        const banIpBtn = document.createElement('button');
        banIpBtn.textContent = 'Ban IP';
        banIpBtn.style.marginLeft = '10px';
        banIpBtn.onclick = () => banUser(user.username);

        const banUserBtn = document.createElement('button');
        banUserBtn.textContent = 'Ban Username';
        banUserBtn.style.marginLeft = '5px';
        banUserBtn.onclick = () => banUsername(user.username);

        const releaseUserBtn = document.createElement('button');
        releaseUserBtn.textContent = 'Release Username';
        releaseUserBtn.style.marginLeft = '5px';
        releaseUserBtn.onclick = () => releaseUser(user.username);

        item.append(label, banIpBtn, banUserBtn, releaseUserBtn);
        div.appendChild(item);

        const br = document.createElement('br');
        div.appendChild(br);
    });

    countDisplay.textContent = `(${users.length})`;
}

async function loadRooms() {
    const res = await fetch('/admin/rooms');
    const rooms = await res.json();
    const div = document.getElementById('roomList');
    const countDisplay = document.getElementById('activeRoomCount');

    const activeRooms = rooms.filter(r => r.users.length > 0); // Filter active only

    div.innerHTML = ''; // Clear previous content

    activeRooms.forEach(r => {
        const container = document.createElement('div');
        const link = document.createElement('a');
        link.href = r.type === 'watchparty'
            ? `/watchparty_chat.html?room=${encodeURIComponent(r.name)}`
            : `/chat.html?room=${encodeURIComponent(r.name)}`;
        link.target = "_blank";
        link.textContent = r.name;

        const text = document.createTextNode(`: ${r.users.join(', ')}`);

        const nukeBtn = document.createElement('button');
        nukeBtn.textContent = 'Nuke';
        nukeBtn.style.marginLeft = '10px';
        nukeBtn.style.backgroundColor = '#d9534f'; // Red warning color
        nukeBtn.onclick = () => nukeRoom(r.name);

        container.append(link, text, nukeBtn);
        div.appendChild(container);
        div.appendChild(document.createElement('br'));
    });
    countDisplay.textContent = `(${activeRooms.length})`;
}

async function banUser(username) {
    if (!confirm(`Ban user ${username}?`)) return;
    const res = await fetch('/admin/banip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    const result = await res.json();
    alert(JSON.stringify(result));
    loadUsers();
    loadRooms();
    loadBanned();
}

async function banUsername(username) {
    if (!confirm(`Ban username ${username}?`)) return;
    const res = await fetch('/admin/banusername', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    const result = await res.json();
    alert(JSON.stringify(result));
    loadUsers();
    loadRooms();
    loadBanned();
}

async function loadBanned() {
    const res = await fetch('/admin/banned');
    const banned = await res.json();
    const div = document.getElementById('bannedList');
    div.innerHTML = '';
    banned.forEach(item => {
        const el = document.createElement('div');
        el.textContent = `${item.type}: ${item.value}`;
        div.appendChild(el);
    });
}

async function bulkBanIPs() {
    const lines = document.getElementById('bulkInput').value
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

    for (const ip of lines) {
        const res = await fetch('/admin/banrawip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip })
        });

        const result = await res.json();
        if (!res.ok) {
            console.warn(`Failed to ban IP: ${ip} — ${result.error}`);
        } else {
            console.log(`Banned IP: ${ip}`, result);
        }
    }

    alert("Raw IP ban requests completed.");
    loadUsers();
    loadRooms();
    loadBanned();
}

async function bulkBanUsernames() {
    const lines = document.getElementById('bulkInput').value.split('\n').map(s => s.trim()).filter(Boolean);
    for (const username of lines) {
        const res = await fetch('/admin/banusername', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const result = await res.json();
        console.log(result);
    }
    alert("Username ban requests completed.");
    loadUsers();
    loadRooms();
    loadBanned();
}

async function releaseUser(username) {
    if (!confirm(`Release user ${username}?`)) return;
    const res = await fetch('/admin/releaseuser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });
    const result = await res.json();
    alert(JSON.stringify(result));
    loadUsers();
    loadRooms();
    loadBanned();
}

async function broadcastSystemMessage() {
    const input = document.getElementById('broadcastInput');
    const text = input.value.trim();
    if (!text) return;

    if (!confirm(`Broadcast to ALL rooms: "${text}"?`)) return;

    const res = await fetch('/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });
    const result = await res.json();
    alert(`Broadcast sent to ${result.rooms_affected} rooms.`);
    input.value = '';
}

async function nukeRoom(room) {
    if (!confirm(`Are you sure you want to NUKE room: "${room}"? This will delete all history and kick users.`)) return;
    await fetch('/admin/nukeroom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room })
    });
    loadRooms();
}

// Initial load
loadUsers();
loadRooms();
loadBanned();

// Refresh every 5 seconds
setInterval(() => {
    loadUsers();
    loadRooms();
    loadBanned();
}, 5000);

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".collapsible").forEach(header => {
        const countSpan = header.querySelector('span');
        const labelText = header.childNodes[0].textContent.trim(); // original text

        // Set initial state
        if (countSpan) {
            header.childNodes[0].textContent = '▶ ' + labelText + ' ';
        } else {
            header.textContent = '▶ ' + labelText;
        }

        const content = header.nextElementSibling;
        if (content && content.classList.contains("collapsible-content")) {
            content.style.display = 'none';

            header.style.cursor = "pointer";
            header.addEventListener("click", () => {
                const isOpen = content.style.display === 'block';
                content.style.display = isOpen ? 'none' : 'block';

                if (countSpan) {
                    header.childNodes[0].textContent = (isOpen ? '▶ ' : '▼ ') + labelText + ' ';
                } else {
                    header.textContent = (isOpen ? '▶ ' : '▼ ') + labelText;
                }
            });
        }
    });
});
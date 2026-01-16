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

        item.append(label, banIpBtn, banUserBtn);
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

    const roomLines = rooms.map(r => {
        const users = r.users.join(', ');
        return `<div><a href="/chat.html?room=${encodeURIComponent(r.name)}" target="_blank">${r.name}</a>: ${users}</div><br />`;
    });

    div.innerHTML = roomLines.join('');
    countDisplay.textContent = `(${rooms.length})`;
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
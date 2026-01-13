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
            const { regional, topical } = data;

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
        });
});

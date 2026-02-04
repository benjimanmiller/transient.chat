document.addEventListener('DOMContentLoaded', async () => {
    const storedUsername = localStorage.getItem('username');
    const storedKey = localStorage.getItem('userKey');

    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    const isWatchParty = params.has('watchparty'); // Use explicit watchparty URL flag

    function redirectToRoom(roomName) {
        if (!roomName) {
            window.location.href = '/server_list.html';
        } else {
            window.location.href = isWatchParty
                ? `/watchparty_chat.html?room=${encodeURIComponent(roomName)}`
                : `/chat.html?room=${encodeURIComponent(roomName)}`;
        }
    }

    // Auto-forward if valid session is stored
    if (storedUsername && storedKey) {
        try {
            const response = await fetch('/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: storedUsername, key: storedKey }),
            });

            if (response.ok) {
                redirectToRoom(room);
                return;
            } else {
                // Session expired or invalid; clear storage but pre-fill username
                localStorage.clear();
                const input = document.getElementById('username-input');
                if (input) input.value = storedUsername;
            }
        } catch (err) {
            console.error('Validation error:', err);
        }
    }

    const startButton = document.getElementById('start-chat-button');
    const usernameInput = document.getElementById('username-input');

    if (usernameInput) {
        usernameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                startButton.click();
            }
        });
    }

    if (startButton) {
        startButton.addEventListener('click', async () => {
            const username = usernameInput.value.trim();

            if (!username) {
                alert('Please enter a username.');
                return;
            }

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username }),
                });

                if (!response.ok) {
                    const err = await response.json();
                    alert(err.error || 'Username registration failed.');
                    return;
                }

                const data = await response.json();
                localStorage.setItem('username', data.username);
                localStorage.setItem('userKey', data.key);

                redirectToRoom(room);
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred.');
            }
        });
    }
});
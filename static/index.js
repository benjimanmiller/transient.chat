document.addEventListener('DOMContentLoaded', async () => {
    const storedUsername = localStorage.getItem('username');
    const storedKey = localStorage.getItem('userKey');

    // Auto-forward if valid session is stored
    if (storedUsername && storedKey) {
        try {
            const response = await fetch('/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: storedUsername, key: storedKey }),
            });

            if (response.ok) {
                window.location.href = '/server_list.html';
                return;
            }
        } catch (err) {
            console.error('Validation error:', err);
        }
    }

    // If not validated, set up login as normal
    const startButton = document.getElementById('start-chat-button');

    const usernameInput = document.getElementById('username-input');
    if (usernameInput) {
        usernameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Optional: prevent default form submit
                startButton.click();
            }
        });
    }

    if (startButton) {
        startButton.addEventListener('click', async () => {
            const usernameInput = document.getElementById('username-input');
            const username = usernameInput.value.trim();

            if (!username) {
                alert('Please enter a username.');
                return;
            }

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });

                if (!response.ok) {
                    const err = await response.json();
                    alert(err.error || 'Username registration failed.');
                    return;
                }

                const data = await response.json();
                localStorage.setItem('username', data.username);
                localStorage.setItem('userKey', data.key);
                window.location.href = '/server_list.html';
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred.');
            }
        });
    }
});
async function fetchMessages() {
    try {
        const response = await fetch('/chat');
        const messages = await response.json();
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = '';

        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.innerText = message;
            messagesContainer.appendChild(messageElement);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error fetching messages:', error);
    }
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (message) {
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        })
        .then(response => response.json())
        .then(fetchMessages)
        .catch(error => console.error('Error sending message:', error));
        
        messageInput.value = '';
    }
}

document.getElementById('send-button').onclick = sendMessage;

document.getElementById('start-chat-button').onclick = () => {
    const usernameInput = document.getElementById('username-input');
    const username = usernameInput.value.trim();
    if (username) {
        document.getElementById('login-container').classList.add('active');
        document.getElementById('chat-container').classList.remove('hidden');
        fetchMessages();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('chat-container').classList.add('hidden');
    fetchMessages();
    setInterval(fetchMessages, 2000);
});

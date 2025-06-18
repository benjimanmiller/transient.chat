// Define the function in the global scope
function toggleThread(threadId) {
    const threadElement = document.getElementById(threadId);
    if (threadElement) {
        threadElement.classList.toggle('hidden');
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const intervalsMap = new Map();

    function fetchThreads() {
        fetch('get-threads.php')
            .then(response => response.json())
            .then(threads => {
                const tableBody = document.getElementById('threadsTable');
                tableBody.innerHTML = `
                    <tr>
                        <th>Thread Title</th>
                        <th>Time Left</th>
                    </tr>
                `;

                threads.forEach((thread, index) => {
                    const postTime = new Date(thread.timestamp).getTime();
                    let timeLeftInSeconds = Math.floor(((postTime + 86400000) - Date.now()) / 1000);
                    const uniqueId = `${thread.threadId}-${index}`;

                    function updateTime() {
                        let timeLeft;
                        let timeLeftClass = '';

                        if (timeLeftInSeconds > 0) {
                            const hours = Math.floor(timeLeftInSeconds / 3600);
                            const minutes = Math.floor((timeLeftInSeconds % 3600) / 60);

                            timeLeft = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

                            if (timeLeftInSeconds <= 14400) {
                                timeLeftClass = 'time-left-red';
                            } else if (timeLeftInSeconds <= 28800) {
                                timeLeftClass = 'time-left-orange';
                            } else if (timeLeftInSeconds <= 43200) {
                                timeLeftClass = 'time-left-green';
                            }
                        } else {
                            timeLeft = 'Expired';
                            timeLeftClass = 'expired';
                            clearInterval(intervalsMap.get(uniqueId));  // Stop the interval once expired
                        }

                        const timeLeftCell = document.querySelector(`#thread-${CSS.escape(uniqueId)} .time-left-cell`);
                        timeLeftCell.textContent = timeLeft;
                        timeLeftCell.parentElement.className = timeLeftClass;
                    }

                    const threadRow = `
                        <tr id="thread-${uniqueId}" class="time-left-class">
                            <td>
                                <a href="#" onclick="toggleThread('${uniqueId}'); return false;">${thread.threadTitle}</a>
                            </td>
                            <td class="time-left-cell"></td>
                        </tr>
                        <tr id="${uniqueId}" class="hidden">
                            <td colspan="2">
                                <strong>Posted by:</strong> ${thread.user}
                                <strong>Last Timestamp:</strong> ${new Date(postTime).toLocaleString()}<br>
                                <strong>Thread Post:</strong> ${thread.content}<br><br>
                                <strong>Comments:</strong>
                                <ul>
                                    ${thread.comments.map(comment => `
                                        <li>
                                            <strong>${comment.user}</strong>: ${comment.comment}
                                            <span class="comment-date">
                                                ${new Date(comment.timestamp).toLocaleString()}
                                            </span>
                                        </li>
                                    `).join('')}
                                </ul>
                                <form class="commentForm" data-thread-id="${thread.threadId}">
                                    <textarea name="newComment" required></textarea>
                                    <br>
                                    <button type="submit">Add Comment</button>
                                </form>
                            </td>
                        </tr>
                    `;

                    tableBody.insertAdjacentHTML('beforeend', threadRow);

                    // Clear existing interval if already present
                    if (intervalsMap.has(uniqueId)) {
                        clearInterval(intervalsMap.get(uniqueId));
                    }

                    // Set a new interval and store it in the map
                    const interval = setInterval(() => {
                        timeLeftInSeconds -= 1;
                        updateTime();
                    }, 1000);
                    intervalsMap.set(uniqueId, interval);

                    updateTime(); // Initial update to set the initial time
                });

                attachSubmitListeners(); // Re-attach listeners to newly inserted forms
            })
            .catch(error => console.error('Error:', error));
    }

    function attachSubmitListeners() {
        document.querySelectorAll('.commentForm').forEach(form => {
            form.addEventListener('submit', function (event) {
                event.preventDefault();

                const formData = new FormData(this);
                const threadId = this.getAttribute('data-thread-id');

                formData.append('threadId', threadId);

                fetch('add-comment-ajax.php', {
                    method: 'POST',
                    body: formData
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            fetchThreads(); // Reload all threads
                        } else {
                            console.error('Error adding comment:', data.message);
                        }
                    })
                    .catch(error => console.error('Error:', error));
            });
        });
    }

    fetchThreads(); // Load threads when the page loads
});
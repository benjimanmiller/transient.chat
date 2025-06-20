// Global toggle function
function toggleThread(threadId) {
    const threadElement = document.getElementById(threadId);
    if (threadElement) {
        threadElement.classList.toggle('hidden');
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const intervalsMap = new Map();

    // Instead of completely rebuilding the threads,
    // we update the dynamic parts while leaving active comment fields intact.
    function updateDynamicParts(threads) {
        threads.forEach((thread, index) => {
            const uniqueId = `${thread.threadId}-${index}`;
            const threadHeader = document.getElementById(`thread-${uniqueId}`);
            const detailRow = document.getElementById(uniqueId);
            if (!threadHeader || !detailRow) return;

            // Update the active time display (if the field is not inside a currently active comment form)
            const timeActiveCell = threadHeader.querySelector('.time-active-cell');
            if (timeActiveCell) {
            // Calculate active time
            const postTime = new Date(thread.created).getTime();
            let timeActiveInSeconds = Math.floor((Date.now() - postTime) / 1000);
            let timeActive = '';

            if (timeActiveInSeconds >= 0) {
                const days = Math.floor(timeActiveInSeconds / (3600 * 24));
                const hours = Math.floor((timeActiveInSeconds % (3600 * 24)) / 3600);
                const minutes = Math.floor((timeActiveInSeconds % 3600) / 60);
                timeActive = `${days} days ${hours} hours ${minutes} minutes`;
            } else {
                timeActive = 'Inactive';
            }

            timeActiveCell.textContent = timeActive;
            }

            // Update the countdown timer (if the field is not inside a currently active comment form)
            const timeLeftCell = threadHeader.querySelector('.time-left-cell');
            if (timeLeftCell) {
                // Recalculate time left
                const postTime = new Date(thread.timestamp).getTime();
                let timeLeftInSeconds = Math.floor(((postTime + 86400000) - Date.now()) / 1000);
                let timeLeft, timeLeftClass = '';
                if (timeLeftInSeconds > 0) {
                    const hours = Math.floor(timeLeftInSeconds / 3600);
                    const minutes = Math.floor((timeLeftInSeconds % 3600) / 60);
                    timeLeft = `${hours.toString().padStart(2, '0')} hours ${minutes.toString().padStart(2, '0')} minutes`;
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
                }
                timeLeftCell.textContent = timeLeft;
                timeLeftCell.parentElement.className = timeLeftClass;
            }
        });
    }

    // Full refresh updates threads if none of the important comment fields are focused.
    function fetchThreads() {
        // Check if any comment textarea is active
        const activeTextarea = document.activeElement;
        if (activeTextarea && activeTextarea.tagName === 'TEXTAREA' && activeTextarea.closest('.commentForm')) {
            // If a user is typing in a comment, skip the full refresh.
            // Instead, only update dynamic parts (e.g., countdowns).
            fetch('get-threads.php')
                .then(response => response.json())
                .then(threads => {
                    updateDynamicParts(threads);
                })
                .catch(error => console.error('Error:', error));
            return;
        }

        // Save scroll and any drafts before rebuilding
        const scrollPosition = window.scrollY;
        document.querySelectorAll('.commentForm').forEach(form => {
            const threadId = form.getAttribute('data-thread-id');
            const commentBox = form.querySelector('textarea[name="newComment"]');
            localStorage.setItem(`comment-draft-${threadId}`, commentBox.value);
        });

        // Record which detail rows are currently expanded so we can reapply that state.
        const openThreads = [...document.querySelectorAll('tr:not([id^="thread-"]):not(.hidden)')].map(row => row.id);

        fetch('get-threads.php')
            .then(response => response.json())
            .then(threads => {
                const tableBody = document.getElementById('threadsTable');
                // Rebuild table header
                tableBody.innerHTML = `
                    <tr>
                        <th>Thread Title</th>
                        <th>Time Active</th>
                        <th>Time Left</th>
                    </tr>
                `;

                threads.forEach((thread, index) => {
                    const postTime = new Date(thread.timestamp).getTime();
                    let timeLeftInSeconds = Math.floor(((postTime + 86400000) - Date.now()) / 1000);
                    const uniqueId = `${thread.threadId}-${index}`;

                    function updateTime() {
                        let timeActive = '';
                        const postTime = new Date(thread.created).getTime();
                        let timeActiveInSeconds = Math.floor((Date.now() - postTime) / 1000);

                        if (timeActiveInSeconds >= 0) {
                        const days = Math.floor(timeActiveInSeconds / (3600 * 24));
                        const hours = Math.floor((timeActiveInSeconds % (3600 * 24)) / 3600);
                        const minutes = Math.floor((timeActiveInSeconds % 3600) / 60);
                        timeActive = `${days} days ${hours} hours ${minutes} minutes`;
                        } else {
                        timeActive = 'Inactive';
                        clearInterval(intervalsMap.get(uniqueId));
                        }

                        const timeActiveCell = document.querySelector(`#thread-${CSS.escape(uniqueId)} .time-active-cell`);
                        if (timeActiveCell) {
                        timeActiveCell.textContent = timeActive;
                        }

                        let timeLeft, timeLeftClass = '';
                        if (timeLeftInSeconds > 0) {
                            const hours = Math.floor(timeLeftInSeconds / 3600);
                            const minutes = Math.floor((timeLeftInSeconds % 3600) / 60);
                            timeLeft = `${hours.toString().padStart(2, '0')} hours ${minutes.toString().padStart(2, '0')} minutes`;
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
                            clearInterval(intervalsMap.get(uniqueId));
                        }

                        const timeLeftCell = document.querySelector(`#thread-${CSS.escape(uniqueId)} .time-left-cell`);
                        if (timeLeftCell) {
                            timeLeftCell.textContent = timeLeft;
                            timeLeftCell.parentElement.className = timeLeftClass;
                        }
                    }

                    const threadRow = `
                        <tr id="thread-${uniqueId}" class="time-left-class">
                            <td>
                                <a href="#" onclick="toggleThread('${uniqueId}'); return false;">${thread.threadTitle}</a>
                            </td>
                            <td class="time-active-cell"></td>
                            <td class="time-left-cell"></td>
                        </tr>
                        <tr id="${uniqueId}" class="hidden">
                            <td colspan="3">
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
                                <br>
                                <form class="commentForm" data-thread-id="${thread.threadId}">
                                    <textarea name="newComment" required></textarea>
                                    <br>
                                    <button type="submit">Add Comment</button>
                                </form>
                            </td>
                        </tr>
                    `;

                    tableBody.insertAdjacentHTML('beforeend', threadRow);

                    // Restore expanded state for detail row if it was open before the refresh
                    if (openThreads.includes(uniqueId)) {
                        toggleThread(uniqueId);
                    }

                    const commentBox = document.querySelector(`#${CSS.escape(uniqueId)} .commentForm textarea[name="newComment"]`);
                    const savedDraft = localStorage.getItem(`comment-draft-${thread.threadId}`);
                    if (commentBox && savedDraft !== null) {
                        commentBox.value = savedDraft;
                    }

                    if (intervalsMap.has(uniqueId)) {
                        clearInterval(intervalsMap.get(uniqueId));
                    }

                    const interval = setInterval(() => {
                        timeLeftInSeconds -= 1;
                        updateTime();
                    }, 1000);
                    intervalsMap.set(uniqueId, interval);

                    updateTime();
                });

                attachSubmitListeners();
                window.scrollTo(0, scrollPosition);
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
                        localStorage.removeItem(`comment-draft-${threadId}`);
                        const commentBox = this.querySelector('textarea[name="newComment"]');
                        if (commentBox) {
                            commentBox.value = "";
                        }
                        fetchThreads();
                    } else {
                        console.error('Error adding comment:', data.message);
                    }
                })
                .catch(error => console.error('Error:', error));
            });
        });
    }

    // Refresh every 20 seconds
    setInterval(fetchThreads, 20000);
    fetchThreads();
});
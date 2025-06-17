document.addEventListener("DOMContentLoaded", function () {

  function toggleThread(threadId) {
    const threadElement = document.getElementById(threadId);
    if (threadElement) {
      threadElement.classList.toggle('hidden');
    }
  }

  function refreshData() {
    const openThreads = new Set(
      [...document.querySelectorAll('tr:not(.hidden)')]
        .filter(row => row.id)
        .map(row => row.id)
    );

    const unsavedComments = {};
    document.querySelectorAll('.commentForm').forEach(form => {
      const threadId = form.getAttribute('data-thread-id');
      const comment = form.querySelector('textarea[name="newComment"]').value;
      if (comment) {
        unsavedComments[threadId] = comment;
      }
    });

    fetch('get-updates.php')
      .then(response => response.json())
      .then(data => {
        const table = document.querySelector('table');
        const tableHeader = `
          <tr>
            <th>Thread Title</th>
            <th>Time Left</th>
          </tr>
        `;
        table.innerHTML = tableHeader;

        data.forEach((thread, index) => {
          const postTime = new Date(thread.timestamp);
          const timeLeftInSeconds = Math.max(0, (postTime.getTime() + 86400 * 1000 - Date.now()) / 1000);
          const timeLeft = timeLeftInSeconds > 0 ?
            `${Math.floor(timeLeftInSeconds / 3600)}:${Math.floor((timeLeftInSeconds % 3600) / 60)}:${Math.floor(timeLeftInSeconds % 60)}` :
            "Expired";

          const uniqueId = `${thread.threadId}-${index}`;
          const isOpen = openThreads.has(uniqueId);

          const threadRow = document.createElement('tr');
          threadRow.innerHTML = `
            <td><a href="#" onclick="toggleThread('${uniqueId}'); return false;">${thread.threadTitle}</a></td>
            <td>${timeLeft}</td>
          `;
          table.appendChild(threadRow);

          const commentsRow = document.createElement('tr');
          commentsRow.className = isOpen ? '' : 'hidden';
          commentsRow.id = uniqueId;
          commentsRow.innerHTML = `
            <td colspan="2">
              <strong>Posted by:</strong> ${thread.user}<br>
              <strong>Last Timestamp:</strong> ${postTime.toLocaleString()}<br>
              <strong>Content:</strong> ${thread.content}<br><br>
              <strong>Comments:</strong>
              <ul>${thread.comments.map(comment => 
                `<li><strong>${comment.user}</strong>: ${comment.comment} <span class="comment-date">${new Date(comment.timestamp).toLocaleString()}</span></li>`
              ).join('')}</ul>
              <form class="commentForm" data-thread-id="${thread.threadId}">
                <textarea name="newComment" required>${unsavedComments[thread.threadId] || ''}</textarea>
                <button type="submit">Add Comment</button>
              </form>
            </td>
          `;
          table.appendChild(commentsRow);
        });

        attachSubmitListeners();
      })
      .catch(error => console.error('Error fetching updates:', error));
  }

  setInterval(refreshData, 30000);

  function attachSubmitListeners() {
    document.querySelectorAll('.commentForm').forEach(function(form) {
      form.addEventListener('submit', function(event) {
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
            const parentRow = this.closest('tr').previousElementSibling;
            const commentsSection = parentRow.nextElementSibling;
            const commentsList = commentsSection.querySelector('ul');

            if (commentsList) {
              const newCommentElement = document.createElement('li');
              newCommentElement.innerHTML = `
                <strong>${data.comment.user}</strong>: ${data.comment.comment}
              `;
              commentsList.appendChild(newCommentElement);
            }

            if (commentsSection.classList.contains('hidden')) {
              commentsSection.classList.remove('hidden');
            }

            this.querySelector('textarea[name="newComment"]').value = '';
          } else {
            console.error('Error adding comment:', data.message);
          }
        })
        .catch(error => console.error('Error:', error));
      });
    });
  }

  attachSubmitListeners();
});
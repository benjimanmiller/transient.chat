document.addEventListener("DOMContentLoaded", function () {
  // Define the toggleThread function
  function toggleThread(threadId) {
    const threadElement = document.getElementById(threadId);
    if (threadElement) {
      threadElement.classList.toggle('hidden');
    }
  }
  
  document.querySelectorAll('.commentForm').forEach(function(form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevents page refresh

      const formData = new FormData(this);
      const threadId = this.getAttribute('data-thread-id'); // Get the threadId in a variable

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

          // Clear the textarea after the comment is posted
          this.querySelector('textarea[name="newComment"]').value = '';
        } else {
          console.error('Error adding comment:', data.message);
        }
      })
      .catch(error => console.error('Error:', error));
    });
  });
});
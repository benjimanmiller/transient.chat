document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll('.commentForm').forEach(function(form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevents page refresh

      const formData = new FormData(this);

      // Debug: Log the threadId to ensure correctness
      console.log('Submitting comment for threadId:', this.getAttribute('data-thread-id'));

      formData.append('threadId', this.getAttribute('data-thread-id')); // Check if this is correct

      fetch('add-comment-ajax.php', {  // Ensure this points to the correct file handling AJAX
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // existing success code
        } else {
          console.error('Error adding comment:', data.message);
        }
      })
      .catch(error => console.error('Error:', error));
    });
  });
});
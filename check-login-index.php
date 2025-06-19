<?php
    if ((isset($_SESSION["username"]))) {
        header("Location: dashboard.php?success=Welcome In");
        exit();
    }
    
?>

<script>
// Check if the username exists in localStorage
const localUsername = localStorage.getItem('username');

if (localUsername) {
    // If a local username exists, send it to a PHP script to set the session
    fetch('set-session-username.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'username=' + encodeURIComponent(localUsername)
    })
    .then(response => {
        if (response.ok) {
            window.location.href = 'dashboard.php?success=Welcome In';
        } else {
            // Handle errors (e.g., display an error message)
        }
    });
}
</script>

<?php
session_start();

// Clear session data and destroy session
$_SESSION = array();
session_destroy();
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta http-equiv="refresh" content="0;url=index.php?success=Logged Out">
    <script>
        // Clear the username from localStorage
        localStorage.removeItem('username');

        window.location.href = 'index.php?success=Logged Out';
    </script>
</head>

<body>
    <p>Logging out...</p>
</body>

</html>
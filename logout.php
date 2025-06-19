<?php
session_start();

// Function to remove user from users.json
function removeUserFromFile($username) {
    $filePath = 'users.json';
    $users = json_decode(file_get_contents($filePath), true);

    // Filter out the logged-out user
    $updatedUsers = array_filter($users, function($user) use ($username) {
        return strtolower($user['user']) !== strtolower($username);
    });

    // Save updated data back to the file
    file_put_contents($filePath, json_encode(array_values($updatedUsers), JSON_PRETTY_PRINT));
}

if (isset($_SESSION['username'])) {
    removeUserFromFile($_SESSION['username']); 
}

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
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

// Redirect to index.php
header("Location: index.php?success=Logged Out");
exit();
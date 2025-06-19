<?php
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["username"])) {
    $username = trim($_POST["username"]);
    if ($username) {
        $_SESSION["username"] = $username;

        // Load existing users
        $usersFile = 'users.json';
        $users = file_exists($usersFile)
            ? json_decode(file_get_contents($usersFile), true)
            : [];

        // Add the new user to the users.json, irrespective of existing entries
        $newUser = [
            'user' => $username,
            'timestamp' => date('c'),
        ];
        $users[] = $newUser;
        file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));

        http_response_code(200);
    } else {
        // Handle invalid username case
        header("Location: index.php?error=Invalid Username");
        exit();
    }
} else {
    http_response_code(405); // Method not allowed
}
?>
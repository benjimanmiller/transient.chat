<?php
session_start();
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["username"])) {
    $username = trim($_POST["username"]);
    if (!$username) {
        header("Location: index.php?error=Username cannot be empty.");
        exit();
    }

    $usersFile = 'users.json';
    $users = file_exists($usersFile)
        ? json_decode(file_get_contents($usersFile), true)
        : [];

    // Debug: Log loaded users
    error_log("Users loaded: " . print_r($users, true));

    // Check for duplicate username (case-sensitive) with extra logging
    foreach ($users as $user) {
        error_log("Comparing input username (" . $username . ") with stored value (" . $user['user'] . ")");
        if ($user['user'] === $username) {
            error_log("Duplicate username detected: " . $username);
            header("Location: index.php?error=Username already in use. Please choose another name.");
            exit();
        }
    }

    $newUser = [
        'user' => $username,
        'timestamp' => date('c')
    ];
    $users[] = $newUser;
    file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));

    if (isset($_SESSION["user_type"]) && $_SESSION["user_type"] === "admin") {
        header("Location: admin-panel.php?success=Logged In");
        exit();
    }
    $_SESSION["username"] = $username;
    $_SESSION["user_type"] = "unverified";
    header("Location: dashboard.php");
    exit();
} else {
    header("Location: index.php?error=Unable to Login");
    exit();
}
?>
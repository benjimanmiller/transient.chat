<?php
session_start();
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST["username"])) {
    $username = $_POST["username"];
    $_SESSION["username"] = $username;
    $_SESSION["user_type"] = "unverified";

    $usersFile = 'users.json';
    if (file_exists(filename: $usersFile)) {
        $users = json_decode(json: file_get_contents(filename: $usersFile), associative: true);
    } else {
        $users = [];
    }

    foreach ($users as $user) {
        if ($user['user'] === $username) {
            header(header: "Location: index.php?error=Username already logged in. Please choose another name.");
            exit();
        }
    }

    $newUser = [
        'user' => $username,
        'timestamp' => date(format: 'c')
    ];
    $users[] = $newUser;
    file_put_contents(filename: $usersFile, data: json_encode(value: $users, flags: JSON_PRETTY_PRINT));

    if (isset($_SESSION["user_type"]) && $_SESSION["user_type"] === "admin") {
        header(header: "Location: admin-panel.php?success=Logged In");
        exit();
    }
    header(header: "Location: dashboard.php?success=Logged In");
    exit();
} else {
    header(header: "Location: index.php?error=Unable to Login");
    exit();
}
?>
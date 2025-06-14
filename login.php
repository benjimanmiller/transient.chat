<?php
session_start();
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $_SESSION["username"] = $POST["username"];
    $_SESSION["user_type"] = "unverified";
    if (isset($_SESSION["user_type"]) && $_SESSION["user_type"] === "admin") {
        header("Location: admin-panel.php?success=Logged In");
        exit();
    }
    header("Location: dashboard.php?success=Logged In");
    exit();
} else {
    header("Location: login.php?error=Unable to Login");
    exit();
}
?>
<?php
session_start();
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = $_POST["email"];
    $password = $_POST["password"];
    $sql = "SELECT * FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    if ($user) {
        if (password_verify($password, $user["password"])) {
            $_SESSION["user_id"] = $user["user_id"];
            $_SESSION["email"] = $user["email"];
            $_SESSION["user_type"] = $user["usertype"];
            if (isset($_SESSION["user_type"]) && $_SESSION["user_type"] === "admin") {
                header("Location: ../admin-panel.php?success=Logged In");
                exit();
            }
            header("Location: ../dashboard.php?success=Logged In");
            exit();
        } else {
            header("Location: ../login.php?error=Invalid email or password");
            exit();
        }
    } else {
        header("Location: ../login.php?error=Invalid email or password");
        exit();
    }
}
?>
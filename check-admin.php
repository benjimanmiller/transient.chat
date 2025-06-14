<?php
    if (isset($_SESSION["user_type"]) && ($_SESSION["user_type"] !== "admin")) {
        header("Location: admin-login.php?error=No Permisson");
        exit();
    }
?>
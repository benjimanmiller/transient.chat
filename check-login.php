<?php
    if (!(isset($_SESSION["user_type"]))) {
        header("Location: index.php?error=Not Logged In");
        exit();
    } else {
        header("Location: dashboard.php?success=Welcome In");
        exit();
    }
?>
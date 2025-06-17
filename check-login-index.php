<?php
    if ((isset($_SESSION["user_type"]))) {
        header("Location: dashboard.php?success=Welcome In");
        exit();
    }
?>
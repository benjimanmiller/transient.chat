<?php
if (!(isset($_SESSION["username"]))) {
    header("Location: index.php?error=Not Logged In");
    exit();
}
?>
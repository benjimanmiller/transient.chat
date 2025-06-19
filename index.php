<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transient - Login</title>
    <link rel="stylesheet" href="css/styles.css">
</head>

<body>
    <div class="wrap">
        <?php include 'header.php'; ?>
        <?php include 'sidebar-left.php'; ?>
        <?php include 'sidebar-right.php'; ?>
        <?php include 'popup-status.php'; ?>
        <?php include 'check-login-index.php'; ?>


        <div class="content">
            <div class="container">
                <h1>Welcome In!</h1>
                <br>
                <form action="login.php" method="post">
                    <label for="username">Username</label>
                    <input type="text" name="username" required>
                    <input type="submit" value="Login">
                </form>

            </div>
        </div>
    </div>
</body>

</html>
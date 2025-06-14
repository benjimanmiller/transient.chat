<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ephemera - Login</title>
    <link rel="stylesheet" href="css/styles.css">
</head>

<body>
    <div class="wrap">
        <?php session_start(); ?>
        <?php include 'header.php'; ?>
        <?php include 'sidebar-left.php'; ?>
        <?php include 'sidebar-right.php'; ?>
        
        <div class="content">
            <div class="container">
                <h1>Login</h1>
                <br>
                <form action="backend/login-process.php" method="post">
                    <label for="username">Username:</label>
                    <input type="username" name="username" required>
                    <input type="submit" value="Login">
                </form>

            </div>
        </div>
    </div>
</body>

</html>
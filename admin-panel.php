<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ephemera - Admin Panel</title>
    <link rel="stylesheet" href="css/styles.css">
</head>

<body>
    <div class="wrap">
        <?php include 'check-admin.php'; ?>
        <?php include 'check-login.php'; ?>
        <?php include 'header.php'; ?>
        <?php include 'sidebar-left.php'; ?>
        <?php include 'sidebar-right.php'; ?>
        <?php include 'popup-status.php'; ?>
        
        <div class="content">
            <div class="container">
                <h1>Admin Panel</h1>
                <?php
                $num_files = count(glob("$save_path/sess_*"));
                echo "Number of active sessions: $num_files.<br>";
                ?>
                <ul>
                    <li><a href="manage-users.php">Manage Users</a></li>
                    <li><a href="manage-threads.php">Manage Threads</a></li>
                </ul>
            </div>
        </div>
    </div>
</body>

</html>
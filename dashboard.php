<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ephermera - Boards</title>
    <link rel="stylesheet" href="css/styles.css">
</head>

<body>
    <div class="wrap">
        <?php include 'header.php'; ?>
        <?php include 'sidebar-left.php'; ?>
        <?php include 'sidebar-right.php'; ?>
        <?php include 'popup-status.php'; ?>
        <?php include 'check-login.php'; ?>

        <?php
        // Function to update the user's timestamp in users.json
        function updateUserTimestamp($username) {
            $filePath = 'users.json';
            $users = json_decode(file_get_contents($filePath), true);

            foreach ($users as &$user) {
                if (strtolower($user['user']) === strtolower($username)) {
                    $user['timestamp'] = date('c'); // Update to current time in ISO 8601 format
                    break;
                }
            }

            file_put_contents($filePath, json_encode(array_values($users), JSON_PRETTY_PRINT));
        }

        if (isset($_SESSION['username'])) {
            updateUserTimestamp($_SESSION['username']);
        }
        ?>

        <div class="content">
            <div class="container">
                <?php
                $username = $_SESSION["username"];
                echo "<h1>Welcome to The Ephermera Board, $username.</h1>";
                ?>
                <ul>
                    <li>Green boards have 12 to 8 hours left.</li>
                    <li>Yellow boards have 8 to 4 hours left.</li>
                    <li>Red boards have less than 4 hours left.</li>
                    <li>If a board reaches 24 hours with no engagement, it gets deleted!</li>
                    <li>If you logout or don't come back, your username gets recycled.</li>
                </ul>

                <!-- Create Thread Button and Form -->
                <button onclick="toggleThreadForm()">Create a Thread</button>

                <div id="threadForm" class="hidden">
                    <form method="post" action="create-thread.php">
                        <h3>Title</h3>
                        <input type="text" name="threadTitle" placeholder="Enter thread title" required>
                        <h3>Post</h3>
                        <textarea name="threadContent" placeholder="Enter thread content" required rows="3"></textarea><br>
                        <button type="submit">Submit</button>
                    </form>
                </div>

                <script>
                    function toggleThreadForm() {
                        const formElement = document.getElementById('threadForm');
                        if (formElement) {
                            formElement.classList.toggle('hidden');
                        }
                    }
                </script>

                <script>
                    localStorage.setItem('username', '<?php echo $username; ?>');
                </script>

                <br>
                <br>
                <table id="threadsTable">
                    <tr>
                        <th>Thread Title</th>
                        <th>Time Left</th>
                    </tr>
                    <!-- Dynamic table content will be inserted here by dashboard.js -->
                </table>
            </div>
        </div>
    </div>

    <script src="js/dashboard.js"></script>
</body>

</html>
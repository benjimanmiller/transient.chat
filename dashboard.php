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
        <script src="js/dashboard.js"></script>

        <div class="content">
            <div class="container">
                <?php
                $username = $_SESSION["username"];
                echo "<h1>Welcome to The Ephermera Board, $username.</h1><br>";
                ?>

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
                
                <?php
                $dataFile = 'data.json';

                if (file_exists($dataFile)) {
                    $threads = json_decode(file_get_contents($dataFile), true);
                        // Calculate the time left for each thread and sort by it
                    foreach ($threads as &$thread) {
                        $postTime = strtotime($thread['timestamp']);
                        $currentTime = time();
                        $thread['timeLeftInSeconds'] = ($postTime + 86400) - $currentTime;
                    }
                    unset($thread);

                    // Sort threads by time left (ascending)
                    usort($threads, function($a, $b) {
                        return $a['timeLeftInSeconds'] <=> $b['timeLeftInSeconds'];
                    });
                } else {
                    $threads = [];
                }
                ?>

                <br>
                <br>
                <table>
                    <tr>
                        <th>Thread Title</th>
                        <th>Time Left</th>
                    </tr>
                    <?php foreach ($threads as $index => $thread): ?>
                        <?php
                        $postTime = strtotime($thread['timestamp']);
                        $currentTime = time();
                        $timeLeftInSeconds = ($postTime + 86400) - $currentTime;

                        if ($timeLeftInSeconds > 0) {
                            $hours = floor($timeLeftInSeconds / 3600);
                            $minutes = floor(($timeLeftInSeconds % 3600) / 60);
                            $seconds = $timeLeftInSeconds % 60;
                            $timeLeft = sprintf("%02d:%02d", $hours, $minutes,);
                        } else {
                            $timeLeft = "Expired";
                        }

                        $formattedTimestamp = date("m/d/Y h:i A", $postTime);
                        $uniqueId = $thread['threadId'] . '-' . $index; // Ensure unique ID
                        ?>
                        <tr>
                            <td>
                                <a href="#" onclick="toggleThread('<?php echo $uniqueId; ?>'); return false;">
                                    <?php echo $thread['threadTitle']; ?>
                                </a>
                            </td>
                            <td><?php echo $timeLeft; ?></td>
                        </tr>
                        <tr id="<?php echo $uniqueId; ?>" class="hidden">
                            <td colspan="2">
                                <strong>Posted by:</strong> <?php echo htmlspecialchars($thread['user']); ?> 
                                <strong>Last Timestamp:</strong> <?php echo $formattedTimestamp; ?><br>
                                <strong>Thread Post:</strong> <?php echo htmlspecialchars($thread['content']); ?><br><br>
                                <strong>Comments:</strong>

                                <ul> <!-- Ensure this unordered list is present -->
                                    <?php foreach ($thread['comments'] as $comment): ?>
                                        <li>
                                            <strong><?php echo htmlspecialchars($comment['user']); ?></strong>:
                                            <?php echo htmlspecialchars($comment['comment']); ?>
                                            <span class="comment-date">
                                                <?php echo date("m/d/Y h:i A", strtotime($comment['timestamp'])); ?>
                                            </span>
                                        </li>
                                    <?php endforeach; ?>
                                </ul>

                                <form class="commentForm" data-thread-id="<?php echo $thread['threadId']; ?>">
                                    <input type="hidden" name="threadId" value="<?php echo $thread['threadId']; ?>"> <!-- This input could be omitted since we're using the data attribute -->
                                    <textarea name="newComment" required></textarea>
                                    <button type="submit">Add Comment</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            </div>
        </div>
    </div>

    <script>
        function toggleThread(threadId) {
            const threadElement = document.getElementById(threadId);
            if (threadElement) {
                threadElement.classList.toggle('hidden');
            }
        }
    </script>
</body>

</html>
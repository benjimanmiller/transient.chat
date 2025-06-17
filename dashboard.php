<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ephemera - Boards</title>
    <link rel="stylesheet" href="css/styles.css">
</head>

<body>
    <div class="wrap">
        <?php include 'header.php'; ?>
        <?php include 'sidebar-left.php'; ?>
        <?php include 'sidebar-right.php'; ?>
        <?php include 'popup-status.php'; ?>

        <div class="content">
            <div class="container">
                <?php
                $username = $_SESSION["username"];
                echo "<h1>Welcome to The Ephemera Board, $username.</h1><br>";
                ?>

                <!-- Create Thread Button and Form -->
                <button onclick="toggleThreadForm()">Create a Thread</button>

                <div id="threadForm" class="hidden">
                    <form method="post" action="create-thread.php">
                        <input type="text" name="threadTitle" placeholder="Enter thread title" required>
                        <textarea name="threadContent" placeholder="Enter thread content" required></textarea>
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
                            $timeLeft = sprintf("%02d:%02d:%02d", $hours, $minutes, $seconds);
                        } else {
                            $timeLeft = "Expired";
                        }

                        $formattedTimestamp = date("m/d/Y h:i A", $postTime);
                        $uniqueId = $thread['threadId'] . '-' . $index; // Ensure unique ID
                        ?>
                        <tr>
                            <td>
                                <a href="#" onclick="toggleThread('<?php echo $uniqueId; ?>'); return false;">
                                    <?php echo htmlspecialchars($thread['threadTitle']); ?>
                                </a>
                            </td>
                            <td><?php echo $timeLeft; ?></td>
                        </tr>
                        <tr id="<?php echo $uniqueId; ?>" class="hidden">
                            <td colspan="2">
                                <strong>Posted by:</strong> <?php echo htmlspecialchars($thread['user']); ?><br>
                                <strong>Last Timestamp:</strong> <?php echo $formattedTimestamp; ?><br>
                                <strong>Content:</strong> <?php echo htmlspecialchars($thread['content']); ?><br>
                                <strong>Comments:</strong>
                                <ul>
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

                                <!-- Comment form -->
                                <form method="post" action="add-comment.php">
                                    <input type="hidden" name="threadId" value="<?php echo $thread['threadId']; ?>">
                                    <input type="text" name="newComment" placeholder="Enter your comment..." required>
                                    <button type="submit">Comment</button>
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
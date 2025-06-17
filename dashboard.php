<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ephemera - Boards</title>
    <link rel="stylesheet" href="css/styles.css">
    <style>
        .hidden {
            display: none;
        }
    </style>
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
                echo "<h1>Welcome to The Ephemera Board, $username.</h1>";
                ?>

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

                <table>
                    <tr>
                        <th>Thread Title</th>
                        <th>Time Left</th>
                    </tr>
                    <?php foreach ($threads as $thread): ?>
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
                        ?>
                        <tr>
                            <td>
                                <a href="#" onclick="toggleThread('<?php echo $thread['threadId']; ?>'); return false;">
                                    <?php echo htmlspecialchars($thread['threadTitle']); ?>
                                </a>
                            </td>
                            <td><?php echo $timeLeft; ?></td>
                        </tr>
                        <tr id="<?php echo $thread['threadId']; ?>" class="hidden">
                            <td colspan="2">
                                <strong>Posted by:</strong> <?php echo htmlspecialchars($thread['user']); ?><br>
                                <strong>Posted on:</strong> <?php echo $formattedTimestamp; ?><br>
                                <strong>Comments:</strong>
                                <ul>
                                    <?php foreach ($thread['comments'] as $comment): ?>
                                        <li>
                                            <?php echo htmlspecialchars($comment['user']); ?>: 
                                            <?php echo htmlspecialchars($comment['comment']); ?> 
                                            <em>(<?php echo date("m/d/Y h:i A", strtotime($comment['timestamp'])); ?>)</em>
                                        </li>
                                    <?php endforeach; ?>
                                </ul>
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
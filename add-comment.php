<?php
session_start();

$username = $_SESSION['username'];  // Assuming the user is logged in and username is in the session
$threadId = $_POST['threadId'];
$newComment = $_POST['newComment'];
$dataFile = 'data.json';

if (file_exists($dataFile)) {
    $threads = json_decode(file_get_contents($dataFile), true) ?? [];

    $currentTimestamp = gmdate('Y-m-d\TH:i:s\Z');

    foreach ($threads as &$thread) {
        if ($thread['threadId'] === $threadId) {
            $thread['comments'][] = [
                'user' => $username,
                'comment' => htmlspecialchars($newComment),
                'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
            ];
            $thread['timestamp'] = $currentTimestamp;
            break;
        }
    }

    file_put_contents($dataFile, json_encode($threads, JSON_PRETTY_PRINT));
}

header('Location: dashboard.php');
exit();
<?php
session_start();

$username = $_SESSION['username'];
$threadId = $_POST['threadId'];
$newComment = $_POST['newComment'];
$dataFile = 'data.json';

if (file_exists($dataFile)) {
    $threads = json_decode(file_get_contents($dataFile), true) ?? [];

    $currentTimestamp = gmdate('Y-m-d\TH:i:s\Z');

    header('Content-Type: application/json');  // Ensure the response is JSON formatted

    $threadFound = false;
    foreach ($threads as &$thread) {
        if ($thread['threadId'] === $threadId) {
            $thread['comments'][] = [
                'user' => $username,
                'comment' => htmlspecialchars($newComment),
                'timestamp' => $currentTimestamp
            ];
            $thread['timestamp'] = $currentTimestamp;
            $threadFound = true;
            break;
        }
    }

    if ($threadFound) {
        file_put_contents($dataFile, json_encode($threads, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'comment' => ['user' => $username, 'comment' => $newComment]]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Thread not found']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Data file not found']);
}
exit();
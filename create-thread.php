<?php
session_start();

$username = $_SESSION['username'];
$threadTitle = $_POST['threadTitle'];
$threadContent = $_POST['threadContent'];
$dataFile = 'data.json';

if (file_exists($dataFile)) {
    $threads = json_decode(file_get_contents($dataFile), true) ?? [];

    $newThread = [
        'threadTitle' => htmlspecialchars($threadTitle),
        'threadId' => uniqid(),
        'user' => $username,
        'content' => htmlspecialchars($threadContent),
        'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
        'comments' => []
    ];

    $threads[] = $newThread;
    file_put_contents($dataFile, json_encode($threads, JSON_PRETTY_PRINT));
}

header('Location: dashboard.php');
exit();
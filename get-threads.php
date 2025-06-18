<?php
header('Content-Type: application/json');

$dataFile = 'data.json'; // Path to your data file

if (file_exists($dataFile)) {
    $threads = json_decode(file_get_contents($dataFile), true);

    // Ensure each thread has a unique ID and necessary structured data
    foreach ($threads as &$thread) {
        $postTime = strtotime($thread['timestamp']);
        $currentTime = time();
        $thread['timeLeftInSeconds'] = ($postTime + 86400) - $currentTime;
    }
    unset($thread);

    // Echo the JSON-encoded data
    echo json_encode($threads);
} else {
    echo json_encode([]);
}
?>
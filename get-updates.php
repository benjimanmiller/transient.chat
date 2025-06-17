<?php
$dataFile = 'data.json';

if (file_exists($dataFile)) {
    $threads = json_decode(file_get_contents($dataFile), true);

    foreach ($threads as &$thread) {
        $postTime = strtotime($thread['timestamp']);
        $thread['timeLeftInSeconds'] = ($postTime + 86400) - time();
    }
    unset($thread);

    // Sort threads by time left (ascending)
    usort($threads, function($a, $b) {
        return $a['timeLeftInSeconds'] <=> $b['timeLeftInSeconds'];
    });

    echo json_encode($threads);
} else {
    echo json_encode([]);
}
?>
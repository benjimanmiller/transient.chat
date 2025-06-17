<?php

function removeOldThreads($filePath)
{
    // Load the JSON file
    $jsonData = file_get_contents($filePath);
    $data = json_decode($jsonData, true);

    // Get the current time
    $currentTime = time();

    // Filter out threads older than 24 hours
    $filteredThreads = array_filter($data, function($thread) use ($currentTime) {
        $threadTime = strtotime($thread['timestamp']); // Assuming 'timestamp' contains the date
        return ($currentTime - $threadTime) <= 86400; // 86400 seconds = 24 hours
    });

    // Save the updated threads back to the file
    file_put_contents($filePath, json_encode(array_values($filteredThreads), JSON_PRETTY_PRINT));
}

$filePath = 'data.json';
removeOldThreads($filePath);
<?php

function removeOldUsers($filePath)
{
    // Load the JSON file
    $jsonData = file_get_contents($filePath);
    $data = json_decode($jsonData, true);

    // Get the current time
    $currentTime = time();

    // Filter out users who haven't been updated in the last 30 days
    $filteredUsers = array_filter($data, function($user) use ($currentTime) {
        $userTime = strtotime($user['timestamp']); 
        return ($currentTime - $userTime) <= 30 * 86400; // 30 days in seconds
    });

    // Save the updated users back to the file
    file_put_contents($filePath, json_encode(array_values($filteredUsers), JSON_PRETTY_PRINT));
}

$filePath = 'users.json';
removeOldUsers($filePath);
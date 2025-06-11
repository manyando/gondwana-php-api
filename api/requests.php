<?php

function remoteApiCall($payload, $unitTypeId) {
    $payload["Unit Type Id"] = $unitTypeId;
    $remoteApiUrl = "https://dev.gondwana-collection.com/Web-Store/Rates/Rates.php";

    $ch = curl_init($remoteApiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        "code" => $httpCode === 200,
        "status" => "SUCCESS",
        "Data" => json_decode($response, true)
    ];
}

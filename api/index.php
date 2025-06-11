<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
require_once 'helperFunctions.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit;
}

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

if(json_last_error() !== JSON_ERROR_NONE){
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON format"]);
    exit;
}

if(empty($rawInput)){
    http_response_code(400);
    echo json_encode(["error" => "No input provided"]);
    exit;
}

$errors = validateInput($input);

if(!empty($errors)){
    http_response_code(422);
    echo json_encode(["errors" => $errors]);
    exit;
}

if($_SERVER['REQUEST_METHOD'] !== 'POST'){
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}


if(!$input) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON"]);
    exit;
}


$remoteApiUrl = "https://dev.gondwana-collection.com/Web-Store/Rates/Rates.php";
$unitTypeIds = [-2147483637, -2147483456];
$responsePayloads = [];

foreach($unitTypeIds as $unitId) {
    $payload = transformPayload($input, $unitId);
    $ch = curl_init($remoteApiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode($result, true);

    if($httpCode !== 200 || !$decoded){
        $responsePayloads[] = [
            "Unit Name" => $input["Unit Name"],
            "Rate" => "Unavailable",
            "Date Range" => "{$input["Arrival"]} to {$input["Departure"]}",
            "Availability" => "Unavailable",
            "Unit ID" => $unitId
        ];
        continue;
    }

    $responsePayloads[] = [
        "Unit Name" => $input["Unit Name"],
        "Rate" => $decoded["Rate"] ?? "Unavailable",
        "Date Range" => "{$input["Arrival"]} to {$input["Departure"]}",
        "Availability" => $decoded["Availability"] ?? "Unknown",
        "Unit ID" => $unitId
    ];
}

echo json_encode($responsePayloads);

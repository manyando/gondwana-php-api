<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
require_once './utilities/helperFunctions.php';
require_once './requests/requests.php';

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

$responsePayloads = sendRateRequests($input, $remoteApiUrl, $unitTypeIds);

echo json_encode($responsePayloads);

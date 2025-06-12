<?php

require __DIR__ . '/../../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->load();

$apiUrl = $_ENV['API_URL'];

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

$unitTypeIds = [-2147483637, -2147483456];

$responsePayloads = sendRateRequests($input, $apiUrl, $unitTypeIds);

echo json_encode($responsePayloads);

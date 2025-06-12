<?php

function sendRateRequests(array $input, string $remoteApiUrl, array $unitTypeIds): array {
    $responsePayloads = [];

    foreach ($unitTypeIds as $unitId) {
        $payload = transformPayload($input, $unitId);

        $ch = curl_init($remoteApiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $decoded = json_decode($result, true);

        if ($httpCode !== 200 || !$decoded) {
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

    return $responsePayloads;
}

<?php

function validateInput($data) {
    $errors = [];
    $requiredFields = ["Arrival", "Departure", "Unit Name", "Ages", "Occupants"];

    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || $data[$field] === "") {
            $errors[] = "Field '$field' cannot be empty";
        }
    }

    if (!empty($errors)) return $errors;

    if (!is_string($data["Unit Name"]) || trim($data["Unit Name"]) === "") {
        $errors[] = "Unit Name must be a non-empty string";
    }

    $arrival = DateTime::createFromFormat('d/m/Y', $data["Arrival"]);
    $departure = DateTime::createFromFormat('d/m/Y', $data["Departure"]);

    if (!$arrival || $arrival->format('d/m/Y') !== $data["Arrival"]) {
        $errors[] = "Arrival must be a valid date in dd/mm/yyyy format";
    }

    if (!$departure || $departure->format('d/m/Y') !== $data["Departure"]) {
        $errors[] = "Departure must be a valid date in dd/mm/yyyy format";
    }

    if ($arrival && $departure && $departure <= $arrival) {
        $errors[] = "Departure date must be after Arrival date";
    }

    if (!is_int($data["Occupants"]) || $data["Occupants"] < 1) {
        $errors[] = "Occupants must be a positive integer";
    }

    if (!is_array($data["Ages"])) {
        $errors[] = "Ages must be an array";
    } else {
        foreach ($data["Ages"] as $age) {
            if (!is_int($age) || $age < 0) {
                $errors[] = "All ages must be positive integers";
            }
        }

        if (count($data["Ages"]) !== $data["Occupants"]) {
            $errors[] = "Number of ages must match number of occupants";
        }
    }

    return $errors;
}

function transformPayload($input, $unitTypeId) {
    $arrival = DateTime::createFromFormat('d/m/Y', $input["Arrival"]);
    $departure = DateTime::createFromFormat('d/m/Y', $input["Departure"]);

    $guestAges = array_map(function($age) {
        return ["Age Group" => ($age >= 18 ? "Adult": "Child")];
    }, $input["Ages"]);

    return [
        "Unit Type Id" => $unitTypeId,
        "Arrival" => $arrival->format('Y-m-d'),
        "Departure" => $departure->format('Y-m-d'),
        "Guest ages" => $guestAges
    ];
}

<?php

function validateInput($data) {
    $errors = [];

    $errors = array_merge($errors, validateRequiredFields($data));
    if (!empty($errors)) {
        return $errors;
    }

    $errors = array_merge($errors, validateUnitName($data["Unit Name"]));
    $errors = array_merge($errors, validateDates($data["Arrival"], $data["Departure"]));
    $errors = array_merge($errors, validateOccupants($data["Occupants"]));
    $errors = array_merge($errors, validateAges($data["Ages"], $data["Occupants"]));

    return $errors;
}

function validateRequiredFields($data) {
    $errors = [];
    $requiredFields = ["Arrival", "Departure", "Unit Name", "Ages", "Occupants"];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || $data[$field] === "") {
            $errors[] = "Field '$field' cannot be empty";
        }
    }
    return $errors;
}

function validateUnitName($unitName) {
    $errors = [];
    if (!is_string($unitName) || trim($unitName) === "") {
        $errors[] = "Unit Name must be a non-empty string";
    }
    return $errors;
}

function validateDates($arrivalStr, $departureStr) {
    $errors = [];
    $arrival = DateTime::createFromFormat('d/m/Y', $arrivalStr);
    $departure = DateTime::createFromFormat('d/m/Y', $departureStr);

    if (!$arrival || $arrival->format('d/m/Y') !== $arrivalStr) {
        $errors[] = "Arrival must be a valid date in dd/mm/yyyy format";
    }
    if (!$departure || $departure->format('d/m/Y') !== $departureStr) {
        $errors[] = "Departure must be a valid date in dd/mm/yyyy format";
    }
    if ($arrival && $departure && $departure <= $arrival) {
        $errors[] = "Departure date must be after Arrival date";
    }
    return $errors;
}

function validateOccupants($occupants) {
    $errors = [];
    if (!is_int($occupants) || $occupants < 1) {
        $errors[] = "Occupants must be a positive integer";
    }
    return $errors;
}

function validateAges($ages, $occupants) {
    $errors = [];
    if (!is_array($ages)) {
        $errors[] = "Ages must be an array";
        return $errors;
    }
    foreach ($ages as $age) {
        if (!is_int($age) || $age < 0) {
            $errors[] = "All ages must be positive integers";
            break;
        }
    }
    if (count($ages) !== $occupants) {
        $errors[] = "Number of ages must match number of occupants";
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
        "Unit Type ID" => $unitTypeId,
        "Arrival" => $arrival->format('Y-m-d'),
        "Departure" => $departure->format('Y-m-d'),
        "Guests" => $guestAges
    ];
}

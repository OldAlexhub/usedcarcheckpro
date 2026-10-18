import hashlib
import re
from typing import Any

import httpx

VIN_PATTERN = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")
TRANSLITERATION = {
    **{str(number): number for number in range(10)},
    "A": 1,
    "B": 2,
    "C": 3,
    "D": 4,
    "E": 5,
    "F": 6,
    "G": 7,
    "H": 8,
    "J": 1,
    "K": 2,
    "L": 3,
    "M": 4,
    "N": 5,
    "P": 7,
    "R": 9,
    "S": 2,
    "T": 3,
    "U": 4,
    "V": 5,
    "W": 6,
    "X": 7,
    "Y": 8,
    "Z": 9,
}
POSITION_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]


class VinValidationError(ValueError):
    pass


def normalize_and_validate_vin(value: str) -> str:
    vin = value.strip().upper()
    if not VIN_PATTERN.fullmatch(vin):
        raise VinValidationError(
            "VIN must contain 17 valid characters and cannot include I, O, or Q"
        )

    total = sum(
        TRANSLITERATION[char] * weight
        for char, weight in zip(vin, POSITION_WEIGHTS, strict=True)
    )
    expected = "X" if total % 11 == 10 else str(total % 11)
    if vin[8] != expected:
        raise VinValidationError("VIN check digit is invalid")
    return vin


def vin_hash(vin: str) -> str:
    return hashlib.sha256(vin.encode("ascii")).hexdigest()


def _clean(value: Any) -> str | None:
    if value is None:
        return None
    cleaned = str(value).strip()
    return cleaned or None


def parse_nhtsa_result(payload: dict[str, Any]) -> dict[str, Any]:
    results = payload.get("Results")
    if not isinstance(results, list) or not results:
        raise ValueError("NHTSA returned no VIN result")

    result = results[0]
    if not isinstance(result, dict):
        raise ValueError("NHTSA returned an invalid VIN result")

    return {
        "valid": str(result.get("ErrorCode", "")) in {"0", "0.0"},
        "year": _clean(result.get("ModelYear")),
        "make": _clean(result.get("Make")),
        "model": _clean(result.get("Model")),
        "trim": _clean(result.get("Trim")),
        "vehicle_type": _clean(result.get("VehicleType")),
        "body_class": _clean(result.get("BodyClass")),
        "fuel_type": _clean(result.get("FuelTypePrimary")),
        "electrification_level": _clean(result.get("ElectrificationLevel")),
        "engine_cylinders": _clean(result.get("EngineCylinders")),
        "displacement_liters": _clean(result.get("DisplacementL")),
        "error_code": _clean(result.get("ErrorCode")),
        "error_text": _clean(result.get("ErrorText")),
    }


async def decode_with_nhtsa(vin: str, timeout_seconds: float) -> dict[str, Any]:
    url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/{vin}"
    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.get(url, params={"format": "json"})
        response.raise_for_status()
    return parse_nhtsa_result(response.json())


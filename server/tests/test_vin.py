import pytest

from app.services.vin import VinValidationError, normalize_and_validate_vin, parse_nhtsa_result


def test_valid_vin_is_normalized() -> None:
    assert normalize_and_validate_vin("1hgcm82633a004352") == "1HGCM82633A004352"


@pytest.mark.parametrize(
    "vin",
    [
        "1HGCM82633A00435",
        "1HGCM82633A00435I",
        "1HGCM82643A004352",
    ],
)
def test_invalid_vin_is_rejected(vin: str) -> None:
    with pytest.raises(VinValidationError):
        normalize_and_validate_vin(vin)


def test_nhtsa_response_is_reduced_to_supported_fields() -> None:
    decoded = parse_nhtsa_result(
        {
            "Results": [
                {
                    "ErrorCode": "0",
                    "ErrorText": "0 - VIN decoded clean. Check Digit (9th position) is correct",
                    "ModelYear": "2003",
                    "Make": "HONDA",
                    "Model": "Accord",
                    "Trim": "EX",
                    "FuelTypePrimary": "Gasoline",
                }
            ]
        }
    )
    assert decoded["valid"] is True
    assert decoded["make"] == "HONDA"
    assert decoded["model"] == "Accord"
    assert "VIN" not in decoded


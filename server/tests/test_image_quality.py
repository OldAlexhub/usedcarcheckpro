import cv2
import numpy as np

from app.services.image_quality import analyze_image_quality


def encode(image: np.ndarray) -> bytes:
    ok, encoded = cv2.imencode(".jpg", image)
    assert ok
    return encoded.tobytes()


def test_dark_image_is_rejected() -> None:
    image = np.zeros((720, 1280, 3), dtype=np.uint8)
    result = analyze_image_quality(encode(image))
    assert result["acceptable"] is False
    assert any("dark" in warning.lower() for warning in result["warnings"])


def test_detailed_well_lit_image_is_accepted() -> None:
    pattern = np.indices((720, 1280)).sum(axis=0) % 2
    gray = (pattern * 100 + 80).astype(np.uint8)
    image = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    result = analyze_image_quality(encode(image))
    assert result["acceptable"] is True
    assert result["quality_score"] >= 65


import cv2
import numpy as np


class InvalidImageError(ValueError):
    pass


def analyze_image_quality(content: bytes) -> dict[str, object]:
    encoded = np.frombuffer(content, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
    if image is None:
        raise InvalidImageError("The uploaded file is not a readable image")

    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())
    glare_percent = float((gray >= 245).mean() * 100)
    dark_percent = float((gray <= 25).mean() * 100)

    warnings: list[str] = []
    score = 100

    if width < 960 or height < 720:
        warnings.append("Photo resolution is low")
        score -= 20
    if blur_score < 70:
        warnings.append("Photo appears blurry; hold the camera steady and retake")
        score -= 35
    if brightness < 55:
        warnings.append("Photo is too dark; add light or enable the flash")
        score -= 25
    elif brightness > 215:
        warnings.append("Photo is overexposed")
        score -= 20
    if glare_percent > 12:
        warnings.append("Strong glare is hiding part of the subject")
        score -= 15
    if dark_percent > 35:
        warnings.append("Large areas of the photo contain little visible detail")
        score -= 15

    score = max(0, score)
    return {
        "width": width,
        "height": height,
        "blur_score": round(blur_score, 2),
        "brightness": round(brightness, 2),
        "glare_percent": round(glare_percent, 2),
        "dark_percent": round(dark_percent, 2),
        "quality_score": score,
        "acceptable": score >= 65,
        "warnings": warnings,
    }


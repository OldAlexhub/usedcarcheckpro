from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.config import Settings, get_settings
from app.schemas import ImageQualityResponse
from app.services.image_quality import InvalidImageError, analyze_image_quality

router = APIRouter(prefix="/images", tags=["images"])


@router.post("/quality", response_model=ImageQualityResponse)
async def image_quality(
    image: Annotated[UploadFile, File(description="JPEG, PNG, or WebP inspection photo")],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ImageQualityResponse:
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, and WebP images are accepted",
        )

    content = await image.read(settings.max_upload_bytes + 1)
    await image.close()
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image is too large",
        )

    try:
        result = analyze_image_quality(content)
    except InvalidImageError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    return ImageQualityResponse(**result)


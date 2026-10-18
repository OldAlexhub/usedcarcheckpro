from datetime import timedelta
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.models import VinCache, utc_now
from app.schemas import VinDecodeRequest, VinDecodeResponse
from app.services.vin import (
    VinValidationError,
    decode_with_nhtsa,
    normalize_and_validate_vin,
    vin_hash,
)

router = APIRouter(prefix="/vin", tags=["vin"])


@router.post("/decode", response_model=VinDecodeResponse)
async def decode_vin(
    request: VinDecodeRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> VinDecodeResponse:
    try:
        vin = normalize_and_validate_vin(request.vin)
    except VinValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exc),
        ) from exc

    cache_key = vin_hash(vin)
    cached = await session.get(VinCache, cache_key)
    now = utc_now()
    if cached is not None and cached.expires_at > now:
        return VinDecodeResponse(**cached.decoded, cached=True)

    try:
        decoded = await decode_with_nhtsa(vin, settings.nhtsa_timeout_seconds)
    except (httpx.HTTPError, ValueError) as exc:
        if cached is not None:
            return VinDecodeResponse(**cached.decoded, cached=True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Vehicle data provider is temporarily unavailable",
        ) from exc

    expires_at = now + timedelta(days=settings.vin_cache_days)
    if cached is None:
        cached = VinCache(vin_hash=cache_key, decoded=decoded, expires_at=expires_at)
        session.add(cached)
    else:
        cached.decoded = decoded
        cached.created_at = now
        cached.expires_at = expires_at
    await session.commit()

    return VinDecodeResponse(**decoded, cached=False)


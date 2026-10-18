from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.models import AnalyticsEvent, DataInstallation, utc_now
from app.schemas import AnalyticsBatchRequest, AnalyticsBatchResponse
from app.security import require_data_installation

router = APIRouter(prefix="/events", tags=["analytics"])

ALLOWED_PROPERTIES: dict[str, set[str]] = {
    "app_opened": set(),
    "onboarding_completed": set(),
    "vin_lookup_completed": {"result", "cached", "powertrain"},
    "inspection_started": {
        "powertrain",
        "section_count",
        "item_count",
        "used_vin_lookup",
    },
    "inspection_completed": {
        "powertrain",
        "completion_percent",
        "critical_count",
        "concern_count",
        "not_checked_count",
    },
    "report_exported": {"format"},
    "comparison_created": {"vehicle_count"},
}


def property_is_valid(event_name: str, key: str, value: object) -> bool:
    if key == "powertrain":
        return value in {"gasoline", "diesel", "hybrid", "electric"}
    if key == "result":
        return value in {"success", "error"}
    if key in {"cached", "used_vin_lookup"}:
        return isinstance(value, bool)
    if key == "format":
        return value in {"pdf", "json", "comparison_pdf"}
    if key == "vehicle_count":
        return isinstance(value, int) and not isinstance(value, bool) and 2 <= value <= 3
    if key == "completion_percent":
        return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 100
    if key.endswith("_count"):
        return isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 500
    return event_name in {"app_opened", "onboarding_completed"}


@router.post("/batch", response_model=AnalyticsBatchResponse)
async def collect_events(
    request: AnalyticsBatchRequest,
    installation: Annotated[DataInstallation, Depends(require_data_installation)],
    session: Annotated[AsyncSession, Depends(get_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AnalyticsBatchResponse:
    for event in request.events:
        unexpected = set(event.properties) - ALLOWED_PROPERTIES[event.name]
        if unexpected:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Unsupported analytics properties: {', '.join(sorted(unexpected))}",
            )
        invalid = [
            key
            for key, value in event.properties.items()
            if not property_is_valid(event.name, key, value)
        ]
        if invalid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Invalid analytics properties: {', '.join(sorted(invalid))}",
            )

    cutoff = utc_now() - timedelta(days=settings.analytics_retention_days)
    await session.execute(delete(AnalyticsEvent).where(AnalyticsEvent.received_at < cutoff))

    accepted = 0
    for event in request.events:
        if await session.get(AnalyticsEvent, event.id) is not None:
            continue
        session.add(
            AnalyticsEvent(
                id=event.id,
                install_id=installation.id,
                name=event.name,
                occurred_at=event.occurred_at,
                app_version=request.app_version,
                platform=request.platform,
                properties=event.properties,
            )
        )
        accepted += 1

    installation.app_version = request.app_version
    installation.platform = request.platform
    installation.consent_version = request.consent_version
    await session.commit()
    return AnalyticsBatchResponse(accepted=accepted)


import hashlib
import hmac
from collections import Counter
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_session
from app.models import DataInstallation, InspectionDatasetRecord, utc_now
from app.schemas import (
    InspectionDatasetBatchRequest,
    InspectionDatasetBatchResponse,
    InspectionDatasetUpsert,
)
from app.security import require_data_installation

router = APIRouter(prefix="/datasets", tags=["datasets"])


def source_key(install_id: str, source_id: str) -> str:
    return hmac.new(
        install_id.encode("utf-8"), source_id.encode("utf-8"), hashlib.sha256
    ).hexdigest()


def derived_counts(record: InspectionDatasetUpsert) -> tuple[Counter[str], int]:
    counts = Counter(item.status for item in record.item_results)
    applicable = len(record.item_results) - counts["not_applicable"]
    checked = applicable - counts["not_checked"]
    completion = round((checked / applicable) * 100) if applicable else 0
    return counts, completion


@router.post(
    "/inspection-outcomes/batch",
    response_model=InspectionDatasetBatchResponse,
)
async def collect_inspection_outcomes(
    request: InspectionDatasetBatchRequest,
    installation: Annotated[DataInstallation, Depends(require_data_installation)],
    session: Annotated[AsyncSession, Depends(get_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> InspectionDatasetBatchResponse:
    cutoff = utc_now() - timedelta(days=settings.dataset_retention_days)
    await session.execute(
        delete(InspectionDatasetRecord).where(
            InspectionDatasetRecord.received_at < cutoff
        )
    )

    installation.app_version = request.app_version
    installation.platform = request.platform
    installation.consent_version = request.consent_version
    now = utc_now()

    for incoming in request.records:
        key = source_key(installation.id, incoming.source_id)
        record = await session.get(InspectionDatasetRecord, key)
        counts, completion = derived_counts(incoming)
        values = {
            "install_id": installation.id,
            "schema_version": request.schema_version,
            "consent_version": request.consent_version,
            "app_version": request.app_version,
            "platform": request.platform,
            "vehicle_year": incoming.vehicle_year,
            "vehicle_make": incoming.vehicle_make,
            "vehicle_model": incoming.vehicle_model,
            "vehicle_trim": incoming.vehicle_trim,
            "powertrain": incoming.powertrain,
            "seller_type": incoming.seller_type,
            "odometer_band": incoming.odometer_band,
            "asking_price_band": incoming.asking_price_band,
            "decision_status": incoming.decision_status,
            "completion_percent": completion,
            "good_count": counts["good"],
            "concern_count": counts["concern"],
            "critical_count": counts["critical"],
            "not_checked_count": counts["not_checked"],
            "not_applicable_count": counts["not_applicable"],
            "item_results": [item.model_dump() for item in incoming.item_results],
            "inspection_updated_at": incoming.inspection_updated_at,
            "updated_at": now,
        }
        if record is None:
            session.add(
                InspectionDatasetRecord(
                    source_key=key,
                    received_at=now,
                    **values,
                )
            )
        else:
            for field, value in values.items():
                setattr(record, field, value)

    await session.commit()
    return InspectionDatasetBatchResponse(upserted=len(request.records))

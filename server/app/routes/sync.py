import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import InspectionRecord, Vault, utc_now
from app.schemas import SyncInspection, SyncRequest, SyncResponse
from app.security import require_vault

router = APIRouter(prefix="/sync", tags=["sync"])


def serialize_record(record: InspectionRecord) -> SyncInspection:
    return SyncInspection(
        id=record.id,
        revision=record.revision,
        client_updated_at=record.client_updated_at,
        server_updated_at=record.server_updated_at,
        deleted=record.deleted_at is not None,
        payload=None if record.deleted_at is not None else record.payload,
    )


async def get_record(
    session: AsyncSession, vault_id: uuid.UUID, inspection_id: str
) -> InspectionRecord | None:
    return await session.get(InspectionRecord, (inspection_id, vault_id))


@router.post("", response_model=SyncResponse)
async def sync(
    request: SyncRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
    vault: Annotated[Vault, Depends(require_vault)],
) -> SyncResponse:
    operation_time = utc_now()

    for item in request.upserts:
        record = await get_record(session, vault.id, item.id)
        if record is None:
            session.add(
                InspectionRecord(
                    id=item.id,
                    vault_id=vault.id,
                    client_updated_at=item.client_updated_at,
                    server_updated_at=operation_time,
                    payload=item.payload,
                )
            )
        elif item.client_updated_at >= record.client_updated_at:
            record.client_updated_at = item.client_updated_at
            record.server_updated_at = operation_time
            record.deleted_at = None
            record.payload = item.payload
            record.revision += 1

    for inspection_id in request.deletions:
        record = await get_record(session, vault.id, inspection_id)
        if record is not None and record.deleted_at is None:
            record.deleted_at = operation_time
            record.server_updated_at = operation_time
            record.revision += 1

    await session.flush()

    query = select(InspectionRecord).where(InspectionRecord.vault_id == vault.id)
    if request.since is not None:
        query = query.where(InspectionRecord.server_updated_at > request.since)
    query = query.order_by(InspectionRecord.server_updated_at, InspectionRecord.id)
    records = (await session.scalars(query)).all()

    await session.commit()
    return SyncResponse(
        cursor=operation_time,
        inspections=[serialize_record(record) for record in records],
    )


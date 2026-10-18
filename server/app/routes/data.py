from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import AnalyticsEvent, DataInstallation, InspectionDatasetRecord
from app.schemas import DataInstallationCreateRequest, DataInstallationCreateResponse
from app.security import create_secret, hash_secret, require_data_installation

router = APIRouter(prefix="/data", tags=["data"])


@router.post(
    "/installations",
    response_model=DataInstallationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_data_installation(
    request: DataInstallationCreateRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DataInstallationCreateResponse:
    install_id = create_secret()
    secret = create_secret()
    session.add(
        DataInstallation(
            id=install_id,
            secret_hash=hash_secret(secret),
            app_version=request.app_version,
            platform=request.platform,
            consent_version=request.consent_version,
        )
    )
    await session.commit()
    return DataInstallationCreateResponse(install_id=install_id, secret=secret)


@router.delete("/installation", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collected_data(
    installation: Annotated[DataInstallation, Depends(require_data_installation)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Response:
    await session.execute(
        delete(InspectionDatasetRecord).where(
            InspectionDatasetRecord.install_id == installation.id
        )
    )
    await session.execute(
        delete(AnalyticsEvent).where(AnalyticsEvent.install_id == installation.id)
    )
    await session.delete(installation)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

import csv
import hmac
import io
import json
import secrets
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Annotated

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import APIRouter, Depends, Form, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse, StreamingResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_session
from app.models import (
    AdminUser,
    AnalyticsEvent,
    DataInstallation,
    InspectionDatasetRecord,
    InspectionRecord,
    Vault,
    VinCache,
    utc_now,
)

router = APIRouter(prefix="/admin", tags=["admin"], include_in_schema=False)
templates = Jinja2Templates(directory=Path(__file__).parent.parent / "templates")
password_hasher = PasswordHasher()


def new_csrf_token(request: Request) -> str:
    token = secrets.token_urlsafe(24)
    request.session["csrf"] = token
    return token


def valid_csrf(request: Request, supplied: str) -> bool:
    expected = request.session.get("csrf")
    return isinstance(expected, str) and hmac.compare_digest(expected, supplied)


async def signed_in_admin(
    request: Request, session: AsyncSession
) -> AdminUser | None:
    raw_id = request.session.get("admin_id")
    signed_in_at = request.session.get("signed_in_at")
    if not isinstance(raw_id, str) or not isinstance(signed_in_at, str):
        return None

    try:
        admin_id = uuid.UUID(raw_id)
        signed_in = datetime.fromisoformat(signed_in_at)
    except (ValueError, TypeError):
        request.session.clear()
        return None

    max_age = timedelta(hours=get_settings().admin_session_hours)
    if utc_now() - signed_in > max_age:
        request.session.clear()
        return None
    return await session.get(AdminUser, admin_id)


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if request.session.get("admin_id"):
        return RedirectResponse("/admin", status_code=status.HTTP_303_SEE_OTHER)
    return templates.TemplateResponse(
        request=request,
        name="admin_login.html",
        context={"csrf": new_csrf_token(request), "error": None},
    )


@router.post("/login", response_class=HTMLResponse)
async def login(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
    username: Annotated[str, Form(max_length=64)],
    password: Annotated[str, Form(max_length=256)],
    csrf: Annotated[str, Form(max_length=128)],
):
    admin = await session.scalar(select(AdminUser).where(AdminUser.username == username))
    authenticated = False
    if admin is not None and valid_csrf(request, csrf):
        try:
            authenticated = password_hasher.verify(admin.password_hash, password)
        except (VerifyMismatchError, InvalidHashError):
            authenticated = False

    if not authenticated or admin is None:
        return templates.TemplateResponse(
            request=request,
            name="admin_login.html",
            context={
                "csrf": new_csrf_token(request),
                "error": "Invalid username or password.",
            },
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    if password_hasher.check_needs_rehash(admin.password_hash):
        admin.password_hash = password_hasher.hash(password)
    admin.last_login_at = utc_now()
    request.session.clear()
    request.session["admin_id"] = str(admin.id)
    request.session["signed_in_at"] = utc_now().isoformat()
    await session.commit()
    return RedirectResponse("/admin", status_code=status.HTTP_303_SEE_OTHER)


@router.get("", response_class=HTMLResponse)
async def dashboard(
    request: Request, session: Annotated[AsyncSession, Depends(get_session)]
):
    admin = await signed_in_admin(request, session)
    if admin is None:
        return RedirectResponse("/admin/login", status_code=status.HTTP_303_SEE_OTHER)

    vault_count = await session.scalar(select(func.count()).select_from(Vault))
    inspection_count = await session.scalar(
        select(func.count()).select_from(InspectionRecord).where(InspectionRecord.deleted_at.is_(None))
    )
    vin_cache_count = await session.scalar(select(func.count()).select_from(VinCache))
    event_count = await session.scalar(select(func.count()).select_from(AnalyticsEvent))
    dataset_count = await session.scalar(
        select(func.count()).select_from(InspectionDatasetRecord)
    )
    install_count = await session.scalar(
        select(func.count()).select_from(DataInstallation)
    )
    return templates.TemplateResponse(
        request=request,
        name="admin_dashboard.html",
        context={
            "admin": admin,
            "csrf": new_csrf_token(request),
            "vault_count": vault_count or 0,
            "inspection_count": inspection_count or 0,
            "vin_cache_count": vin_cache_count or 0,
            "event_count": event_count or 0,
            "dataset_count": dataset_count or 0,
            "install_count": install_count or 0,
            "public_base_url": get_settings().public_base_url,
        },
    )


@router.get("/datasets", response_class=HTMLResponse)
async def datasets_page(
    request: Request, session: Annotated[AsyncSession, Depends(get_session)]
):
    admin = await signed_in_admin(request, session)
    if admin is None:
        return RedirectResponse("/admin/login", status_code=status.HTTP_303_SEE_OTHER)

    record_count = await session.scalar(
        select(func.count()).select_from(InspectionDatasetRecord)
    )
    contributing_installs = await session.scalar(
        select(func.count(func.distinct(InspectionDatasetRecord.install_id)))
    )
    last_received = await session.scalar(select(func.max(InspectionDatasetRecord.received_at)))
    year_range = (
        await session.execute(
            select(
                func.min(InspectionDatasetRecord.vehicle_year),
                func.max(InspectionDatasetRecord.vehicle_year),
            )
        )
    ).one()
    powertrain_rows = (
        await session.execute(
            select(InspectionDatasetRecord.powertrain, func.count())
            .group_by(InspectionDatasetRecord.powertrain)
            .order_by(func.count().desc())
        )
    ).all()
    event_count = await session.scalar(select(func.count()).select_from(AnalyticsEvent))

    return templates.TemplateResponse(
        request=request,
        name="admin_datasets.html",
        context={
            "admin": admin,
            "record_count": record_count or 0,
            "contributing_installs": contributing_installs or 0,
            "last_received": last_received,
            "min_year": year_range[0],
            "max_year": year_range[1],
            "powertrains": powertrain_rows,
            "event_count": event_count or 0,
            "dataset_retention_days": get_settings().dataset_retention_days,
        },
    )


def csv_cell(value: object) -> object:
    if isinstance(value, str) and value.startswith(("=", "+", "-", "@")):
        return f"'{value}"
    return value


@router.get("/datasets/inspection-outcomes.csv")
async def export_inspection_dataset(
    request: Request, session: Annotated[AsyncSession, Depends(get_session)]
):
    admin = await signed_in_admin(request, session)
    if admin is None:
        return RedirectResponse("/admin/login", status_code=status.HTTP_303_SEE_OTHER)

    columns = [
        "source_key",
        "schema_version",
        "consent_version",
        "app_version",
        "platform",
        "vehicle_year",
        "vehicle_make",
        "vehicle_model",
        "vehicle_trim",
        "powertrain",
        "seller_type",
        "odometer_band",
        "asking_price_band",
        "decision_status",
        "completion_percent",
        "good_count",
        "concern_count",
        "critical_count",
        "not_checked_count",
        "not_applicable_count",
        "item_results_json",
        "inspection_updated_at",
        "received_at",
        "updated_at",
    ]

    async def rows():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(columns)
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)

        stream = await session.stream_scalars(
            select(InspectionDatasetRecord).order_by(
                InspectionDatasetRecord.received_at.asc()
            )
        )
        async for record in stream:
            writer.writerow(
                [
                    record.source_key,
                    record.schema_version,
                    record.consent_version,
                    record.app_version,
                    record.platform,
                    record.vehicle_year,
                    csv_cell(record.vehicle_make),
                    csv_cell(record.vehicle_model),
                    csv_cell(record.vehicle_trim or ""),
                    record.powertrain,
                    record.seller_type or "",
                    record.odometer_band,
                    record.asking_price_band,
                    record.decision_status,
                    record.completion_percent,
                    record.good_count,
                    record.concern_count,
                    record.critical_count,
                    record.not_checked_count,
                    record.not_applicable_count,
                    json.dumps(record.item_results, separators=(",", ":")),
                    record.inspection_updated_at.isoformat(),
                    record.received_at.isoformat(),
                    record.updated_at.isoformat(),
                ]
            )
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

    return StreamingResponse(
        rows(),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                'attachment; filename="proveh-inspection-outcomes-v1.csv"'
            )
        },
    )


@router.post("/logout")
async def logout(
    request: Request,
    csrf: Annotated[str, Form(max_length=128)],
):
    if valid_csrf(request, csrf):
        request.session.clear()
    return RedirectResponse("/admin/login", status_code=status.HTTP_303_SEE_OTHER)


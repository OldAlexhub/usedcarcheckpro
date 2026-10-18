import re
import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models import AdminUser
from app.routes.admin import password_hasher


@pytest.mark.asyncio
async def test_root_opens_admin_portal(api_client: AsyncClient) -> None:
    response = await api_client.get("/", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"] == "/admin"

    portal = await api_client.get("/", follow_redirects=True)
    assert portal.status_code == 200
    assert "Administrator portal" in portal.text
    assert "Sign in" in portal.text


@pytest.mark.asyncio
async def test_health_and_authenticated_sync(api_client: AsyncClient) -> None:
    live = await api_client.get("/api/v1/health/live")
    assert live.status_code == 200
    assert live.json()["status"] == "ok"

    created = await api_client.post(
        "/api/v1/vaults", json={"app_version": "1.1.0"}
    )
    assert created.status_code == 201
    credentials = created.json()

    inspection_id = str(uuid.uuid4())
    synced = await api_client.post(
        "/api/v1/sync",
        headers={
            "X-Vault-ID": credentials["vault_id"],
            "Authorization": f"Bearer {credentials['secret']}",
        },
        json={
            "upserts": [
                {
                    "id": inspection_id,
                    "client_updated_at": datetime.now(UTC).isoformat(),
                    "payload": {"vehicle": {"make": "Honda"}},
                }
            ],
            "deletions": [],
        },
    )
    assert synced.status_code == 200, synced.text
    result = synced.json()
    assert len(result["inspections"]) == 1
    assert result["inspections"][0]["id"] == inspection_id
    assert result["inspections"][0]["payload"]["vehicle"]["make"] == "Honda"


@pytest.mark.asyncio
async def test_sync_rejects_invalid_secret(api_client: AsyncClient) -> None:
    response = await api_client.post(
        "/api/v1/sync",
        headers={
            "X-Vault-ID": str(uuid.uuid4()),
            "Authorization": "Bearer invalid",
        },
        json={"upserts": [], "deletions": []},
    )
    assert response.status_code == 401


async def create_data_credentials(api_client: AsyncClient) -> dict[str, str]:
    response = await api_client.post(
        "/api/v1/data/installations",
        json={
            "app_version": "1.0.0",
            "platform": "android",
            "consent_version": "2026-10-18",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def data_headers(credentials: dict[str, str]) -> dict[str, str]:
    return {
        "X-Install-ID": credentials["install_id"],
        "Authorization": f"Bearer {credentials['secret']}",
    }


def inspection_dataset_payload() -> dict[str, object]:
    return {
        "schema_version": 1,
        "app_version": "1.0.0",
        "platform": "android",
        "consent_version": "2026-10-18",
        "records": [
            {
                "source_id": "inspection_12345",
                "inspection_updated_at": datetime.now(UTC).isoformat(),
                "vehicle_year": 2020,
                "vehicle_make": "Honda",
                "vehicle_model": "Civic",
                "vehicle_trim": "EX",
                "powertrain": "gasoline",
                "seller_type": "dealer",
                "odometer_band": "50,000-74,999",
                "asking_price_band": "15,000-24,999",
                "decision_status": "considering",
                "item_results": [
                    {"item_id": "brakes", "status": "good"},
                    {"item_id": "tires", "status": "concern"},
                    {"item_id": "rust", "status": "not_checked"},
                ],
            }
        ],
    }


@pytest.mark.asyncio
async def test_dataset_ingestion_is_authenticated_and_upserts(
    api_client: AsyncClient,
) -> None:
    credentials = await create_data_credentials(api_client)
    payload = inspection_dataset_payload()

    missing_auth = await api_client.post(
        "/api/v1/datasets/inspection-outcomes/batch", json=payload
    )
    assert missing_auth.status_code == 401

    created = await api_client.post(
        "/api/v1/datasets/inspection-outcomes/batch",
        headers=data_headers(credentials),
        json=payload,
    )
    assert created.status_code == 200, created.text
    assert created.json() == {"upserted": 1}

    payload["records"][0]["decision_status"] = "purchased"  # type: ignore[index]
    updated = await api_client.post(
        "/api/v1/datasets/inspection-outcomes/batch",
        headers=data_headers(credentials),
        json=payload,
    )
    assert updated.status_code == 200, updated.text
    assert updated.json() == {"upserted": 1}


@pytest.mark.asyncio
async def test_dataset_rejects_sensitive_or_unversioned_fields(
    api_client: AsyncClient,
) -> None:
    credentials = await create_data_credentials(api_client)
    payload = inspection_dataset_payload()
    payload["records"][0]["vin"] = "1HGCM82633A004352"  # type: ignore[index]

    response = await api_client.post(
        "/api/v1/datasets/inspection-outcomes/batch",
        headers=data_headers(credentials),
        json=payload,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_allowlisted_analytics_and_remote_deletion(api_client: AsyncClient) -> None:
    credentials = await create_data_credentials(api_client)
    headers = data_headers(credentials)
    event_payload = {
        "app_version": "1.0.0",
        "platform": "android",
        "consent_version": "2026-10-18",
        "events": [
            {
                "id": "event_123456",
                "name": "inspection_completed",
                "occurred_at": datetime.now(UTC).isoformat(),
                "properties": {
                    "powertrain": "gasoline",
                    "completion_percent": 67,
                    "critical_count": 0,
                    "concern_count": 1,
                    "not_checked_count": 1,
                },
            }
        ],
    }
    collected = await api_client.post(
        "/api/v1/events/batch", headers=headers, json=event_payload
    )
    assert collected.status_code == 200, collected.text
    assert collected.json() == {"accepted": 1}

    deleted = await api_client.delete("/api/v1/data/installation", headers=headers)
    assert deleted.status_code == 204

    after_delete = await api_client.post(
        "/api/v1/events/batch", headers=headers, json=event_payload
    )
    assert after_delete.status_code == 401


@pytest.mark.asyncio
async def test_analytics_rejects_unbounded_categorical_values(
    api_client: AsyncClient,
) -> None:
    credentials = await create_data_credentials(api_client)
    response = await api_client.post(
        "/api/v1/events/batch",
        headers=data_headers(credentials),
        json={
            "app_version": "1.0.0",
            "platform": "android",
            "consent_version": "2026-10-18",
            "events": [
                {
                    "id": "event_123456",
                    "name": "report_exported",
                    "occurred_at": datetime.now(UTC).isoformat(),
                    "properties": {"format": "arbitrary-user-text"},
                }
            ],
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_dataset_admin_requires_login(api_client: AsyncClient) -> None:
    response = await api_client.get("/admin/datasets", follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"] == "/admin/login"


@pytest.mark.asyncio
async def test_admin_can_view_and_export_dataset(
    api_client: AsyncClient,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    async with test_session_factory() as session:
        session.add(
            AdminUser(
                username="test-admin",
                password_hash=password_hasher.hash("test-only-password"),
            )
        )
        await session.commit()

    credentials = await create_data_credentials(api_client)
    collected = await api_client.post(
        "/api/v1/datasets/inspection-outcomes/batch",
        headers=data_headers(credentials),
        json=inspection_dataset_payload(),
    )
    assert collected.status_code == 200

    login_page = await api_client.get("/admin/login")
    csrf_match = re.search(r'name="csrf" value="([^"]+)"', login_page.text)
    assert csrf_match is not None
    signed_in = await api_client.post(
        "/admin/login",
        data={
            "username": "test-admin",
            "password": "test-only-password",
            "csrf": csrf_match.group(1),
        },
        follow_redirects=False,
    )
    assert signed_in.status_code == 303
    assert signed_in.headers["location"] == "/admin"

    datasets = await api_client.get("/admin/datasets")
    assert datasets.status_code == 200
    assert "Inspection outcomes" in datasets.text
    assert ">1<" in datasets.text

    exported = await api_client.get("/admin/datasets/inspection-outcomes.csv")
    assert exported.status_code == 200
    assert "vehicle_make" in exported.text
    assert "Honda" in exported.text
    assert "1HGCM82633A004352" not in exported.text


from types import SimpleNamespace

import pytest
from pydantic import SecretStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

import app.bootstrap_admin as bootstrap_module
from app.models import AdminUser
from app.routes.admin import password_hasher


@pytest.mark.asyncio
async def test_bootstrap_admin_creates_and_updates_configured_account(
    monkeypatch,
    test_session_factory: async_sessionmaker[AsyncSession],
) -> None:
    configured = SimpleNamespace(
        environment="production",
        admin_username="mohamedgad",
        admin_password=SecretStr("first-test-password"),
    )
    monkeypatch.setattr(bootstrap_module, "SessionFactory", test_session_factory)
    monkeypatch.setattr(bootstrap_module, "get_settings", lambda: configured)

    await bootstrap_module.bootstrap_admin()

    async with test_session_factory() as session:
        admin = await session.scalar(
            select(AdminUser).where(AdminUser.username == "mohamedgad")
        )
        assert admin is not None
        assert password_hasher.verify(admin.password_hash, "first-test-password")

    configured.admin_password = SecretStr("updated-test-password")
    await bootstrap_module.bootstrap_admin()

    async with test_session_factory() as session:
        admin = await session.scalar(
            select(AdminUser).where(AdminUser.username == "mohamedgad")
        )
        assert admin is not None
        assert password_hasher.verify(admin.password_hash, "updated-test-password")

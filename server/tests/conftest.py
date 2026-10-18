import os
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

# Never let a developer or deployment .env point tests at production services.
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite://"

from app.database import Base, get_session
from app.main import app


@pytest_asyncio.fixture
async def test_session_factory() -> AsyncIterator[async_sessionmaker[AsyncSession]]:
    test_engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = async_sessionmaker(test_engine, expire_on_commit=False)

    async with test_engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    yield session_factory
    await test_engine.dispose()


@pytest_asyncio.fixture
async def api_client(
    test_session_factory: async_sessionmaker[AsyncSession],
) -> AsyncIterator[AsyncClient]:

    async def override_session() -> AsyncIterator[AsyncSession]:
        async with test_session_factory() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


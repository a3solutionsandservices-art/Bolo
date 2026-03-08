from __future__ import annotations
import os
from typing import AsyncGenerator

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool, NullPool

from app.db.base import Base, get_db
from app.core.security import hash_password, create_access_token

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "sqlite+aiosqlite:///:memory:",
)

_IS_SQLITE = TEST_DATABASE_URL.startswith("sqlite")


@pytest_asyncio.fixture(scope="session")
async def engine():
    kwargs: dict = {}
    if _IS_SQLITE:
        kwargs = {
            "connect_args": {"check_same_thread": False},
            "poolclass": StaticPool,
        }
    else:
        kwargs = {"poolclass": NullPool}

    _engine = create_async_engine(TEST_DATABASE_URL, **kwargs)

    if _IS_SQLITE:
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    else:
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    yield _engine

    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture(scope="session")
async def app(engine):
    from app.main import app as fastapi_app

    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def override_get_db():
        async with session_factory() as session:
            yield session

    fastapi_app.dependency_overrides[get_db] = override_get_db
    yield fastapi_app
    fastapi_app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="session")
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac


@pytest_asyncio.fixture(scope="session")
async def registered_user(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "test@vaaniai.com",
        "password": "TestPass1",
        "full_name": "Test User",
        "tenant_name": "Test Tenant",
        "tenant_slug": "test-tenant",
    })
    assert resp.status_code == 201, resp.text
    data = resp.json()
    return {
        "email": "test@vaaniai.com",
        "password": "TestPass1",
        "access_token": data["access_token"],
        "refresh_token": data["refresh_token"],
    }


@pytest_asyncio.fixture(scope="session")
async def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['access_token']}"}

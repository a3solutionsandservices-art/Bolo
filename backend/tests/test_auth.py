import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio


async def test_register_success(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "newuser@vaaniai.com",
        "password": "NewPass1",
        "full_name": "New User",
        "tenant_name": "New Tenant",
        "tenant_slug": "new-tenant",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_register_duplicate_email(client: AsyncClient, registered_user):
    resp = await client.post("/api/v1/auth/register", json={
        "email": registered_user["email"],
        "password": "TestPass1",
        "full_name": "Duplicate",
        "tenant_name": "Dupe Tenant",
        "tenant_slug": "dupe-tenant",
    })
    assert resp.status_code == 400
    assert "Email already registered" in resp.json()["detail"]


async def test_register_duplicate_slug(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "unique@vaaniai.com",
        "password": "TestPass1",
        "full_name": "User",
        "tenant_name": "Another",
        "tenant_slug": "test-tenant",
    })
    assert resp.status_code == 400
    assert "slug" in resp.json()["detail"].lower()


async def test_register_weak_password(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "weak@vaaniai.com",
        "password": "weak",
        "full_name": "User",
        "tenant_name": "Weak Tenant",
        "tenant_slug": "weak-tenant",
    })
    assert resp.status_code == 422


async def test_register_password_no_uppercase(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "lower@vaaniai.com",
        "password": "lowercase1",
        "full_name": "User",
        "tenant_name": "Lower Tenant",
        "tenant_slug": "lower-tenant",
    })
    assert resp.status_code == 422


async def test_register_password_no_digit(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "nodigit@vaaniai.com",
        "password": "NoDigitPass",
        "full_name": "User",
        "tenant_name": "NoDigit Tenant",
        "tenant_slug": "nodigit-tenant",
    })
    assert resp.status_code == 422


async def test_register_invalid_slug(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json={
        "email": "slug@vaaniai.com",
        "password": "TestPass1",
        "full_name": "User",
        "tenant_name": "Slug",
        "tenant_slug": "INVALID SLUG!",
    })
    assert resp.status_code == 422


async def test_login_success(client: AsyncClient, registered_user):
    resp = await client.post("/api/v1/auth/login", json={
        "email": registered_user["email"],
        "password": registered_user["password"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_wrong_password(client: AsyncClient, registered_user):
    resp = await client.post("/api/v1/auth/login", json={
        "email": registered_user["email"],
        "password": "WrongPass1",
    })
    assert resp.status_code == 401


async def test_login_nonexistent_user(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={
        "email": "nobody@vaaniai.com",
        "password": "TestPass1",
    })
    assert resp.status_code == 401


async def test_token_refresh(client: AsyncClient, registered_user):
    resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": registered_user["refresh_token"],
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


async def test_token_refresh_invalid(client: AsyncClient):
    resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": "notavalidtoken",
    })
    assert resp.status_code == 401


async def test_create_api_key(client: AsyncClient, auth_headers):
    resp = await client.post("/api/v1/auth/api-keys", json={
        "name": "Test Key",
    }, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Test Key"
    assert data["key"].startswith("vai_")
    assert len(data["key"]) > 10


async def test_list_api_keys(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/auth/api-keys", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_create_and_revoke_api_key(client: AsyncClient, auth_headers):
    create_resp = await client.post("/api/v1/auth/api-keys", json={
        "name": "Revoke Me",
    }, headers=auth_headers)
    assert create_resp.status_code == 200
    key_id = create_resp.json()["id"]

    del_resp = await client.delete(f"/api/v1/auth/api-keys/{key_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    list_resp = await client.get("/api/v1/auth/api-keys", headers=auth_headers)
    ids = [k["id"] for k in list_resp.json()]
    assert key_id not in ids


async def test_protected_endpoint_no_token(client: AsyncClient):
    resp = await client.get("/api/v1/auth/api-keys")
    assert resp.status_code == 401


async def test_protected_endpoint_bad_token(client: AsyncClient):
    resp = await client.get("/api/v1/auth/api-keys",
                            headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401

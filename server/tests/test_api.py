import asyncio
import sqlite3
import httpx
import pytest
from app.database import initialize_database, reset_demo_fixture
from app.main import app


def get(path: str) -> httpx.Response:
    async def request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.get(path)

    return asyncio.run(request())


def post(path: str) -> httpx.Response:
    async def request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transport,
            base_url="http://testserver",
        ) as client:
            return await client.post(path)

    return asyncio.run(request())


def test_health_endpoint() -> None:
    response = get("/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "vishraampath-api",
    }


def test_metadata_is_honest_about_field_data() -> None:
    response = get("/api/v1/meta")
    assert response.status_code == 200
    assert response.json() == {
        "environment": "local",
        "data_status": "demo_fixture_only",
        "field_data_status": "not_collected",
        "field_capture_enabled": False,
    }


def test_demo_marker_is_explicit_and_reset_is_idempotent(tmp_path, monkeypatch) -> None:
    database_file = tmp_path / "demo-nagpur-test.sqlite3"
    monkeypatch.setenv("VISHRAAMPATH_DB", str(database_file))
    initialize_database()
    initialize_database()

    response = get("/api/v1/surveys")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["id"] == "demo-nagpur-corridor"
    assert items[0]["label"] == "DEMO DATA / Nagpur corridor placeholder"
    assert items[0]["capture_mode"] == "demo_fixture"
    assert items[0]["permission_status"] == "unknown"
    assert items[0]["length_m"] is None
    assert items[0]["demo_data"] is True

    with sqlite3.connect(database_file) as connection:
        with pytest.raises(sqlite3.IntegrityError, match="demo_data is immutable"):
            connection.execute(
                "UPDATE survey SET demo_data = 0 WHERE id = ?",
                ("demo-nagpur-corridor",),
            )

    reset_response = post("/api/v1/demo/reset")
    assert reset_response.status_code == 200
    assert reset_response.json()["field_data_status"] == "not_collected"

    reset_demo_fixture()
    after_reset = get("/api/v1/surveys").json()["items"]
    assert len(after_reset) == 1
    assert after_reset[0]["demo_data"] is True
    assert after_reset[0]["length_m"] is None

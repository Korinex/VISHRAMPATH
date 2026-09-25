from contextlib import asynccontextmanager
from typing import AsyncIterator
from fastapi import FastAPI
from app.database import initialize_database, list_surveys, reset_demo_fixture
@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    initialize_database()
    yield
app = FastAPI(
    title="VishraamPath local API",
    version="0.1.0",
    description="Hour 1 foundation. Field capture is not enabled.",
    lifespan=lifespan,
)
@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "vishraampath-api"}
@app.get("/api/v1/meta")
def metadata() -> dict[str, str | bool]:
    return {
        "environment": "local",
        "data_status": "demo_fixture_only",
        "field_data_status": "not_collected",
        "field_capture_enabled": False,
    }
@app.get("/api/v1/surveys")
def surveys() -> dict[str, list[dict[str, str | int | float | bool | None]]]:
    return {"items": list_surveys()}
@app.post("/api/v1/demo/reset")
def reset_demo() -> dict[str, str]:
    reset_demo_fixture()
    return {
        "status": "reset",
        "data_status": "demo_fixture_only",
        "field_data_status": "not_collected",
    }

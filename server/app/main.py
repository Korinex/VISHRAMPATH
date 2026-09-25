from contextlib import asynccontextmanager
from typing import AsyncIterator
from fastapi import FastAPI
from app.database import initialize_database, list_surveys, reset_demo_fixture
from app.survey_routes import initialize_survey_schema, router as survey_router
from app.review_routes import initialize_review_schema, router as review_router
from app.route_routes import router as route_router
from app.repair_routes import initialize_repair_schema, router as repair_router

@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    initialize_database()
    initialize_survey_schema()
    initialize_review_schema()
    initialize_repair_schema()
    yield
app = FastAPI(
    title="VishraamPath local API",
    version="0.1.0",
    description="Hour 1 foundation. Field capture is not enabled.",
    lifespan=lifespan,
    
)
app.include_router(survey_router)
app.include_router(review_router)
app.include_router(route_router)
app.include_router(repair_router)
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
import json
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["routes"])
FIXTURE = Path(__file__).resolve().parents[2] / "data" / "demo" / "routes.json"


class RouteRequest(BaseModel):
    origin_id: str
    destination_id: str
    profile_id: Literal["walking_stick", "wheelchair"]
    language: Literal["mr", "hi"]


@router.post("/routes/plan")
def plan_route(request: RouteRequest) -> dict:
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    routes = [
        item for item in fixture["options"]
        if item["origin_id"] == request.origin_id
        and item["destination_id"] == request.destination_id
    ]
    if not routes:
        raise HTTPException(status_code=404, detail="No demo route for that pair")
    route = routes[0]

    def present(item: dict) -> dict:
        return {
            "route_id": item["id"],
            "label": item["label"],
            "selection_reason": item["selection_reason"],
            "segments": item["segments"],
            "warnings": item["limitations"],
            "instructions": item["instructions"][request.language],
        }

    return {
        "route_id": route["id"],
        "profile_id": request.profile_id,
        "language": request.language,
        "route_source": fixture["route_source"],
        "geometry": fixture["geometry"],
        "segments": route["segments"],
        "warnings": route["limitations"],
        "instructions": route["instructions"][request.language],
        "estimated": True,
        "demo_data": True,
        "limitations": [fixture["notice"], "Screening is decision support, not a safety guarantee."],
        "options": [present(item) for item in routes],
    }

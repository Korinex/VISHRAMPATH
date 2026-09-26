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
    origin_label: str = "Starting point"
    destination_label: str = "Destination"


@router.post("/routes/plan")
def plan_route(request: RouteRequest) -> dict:
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    routes = fixture["options"]
    profile_label = "walking with a stick" if request.profile_id == "walking_stick" else "using a wheelchair"
    origin_label = request.origin_label.strip() or "Starting point"
    destination_label = request.destination_label.strip() or "Destination"

    def present(item: dict) -> dict:
        base_instructions = item["instructions"][request.language]
        profile_instruction = (
            f"This sample is prepared for {profile_label}. Check the surface and rest points before a real journey."
            if request.language == "en"
            else base_instructions[0]
        )
        return {
            "route_id": item["id"],
            "label": f"{item['label']} · {profile_label}",
            "selection_reason": f"{item['selection_reason']} This is a simulated comparison for {profile_label}.",
            "segments": item["segments"],
            "warnings": item["limitations"],
            "instructions": [profile_instruction, *base_instructions],
        }

    route = routes[0]
    presented_routes = [present(item) for item in routes]

    return {
        "route_id": route["id"],
        "profile_id": request.profile_id,
        "language": request.language,
        "origin_label": origin_label,
        "destination_label": destination_label,
        "route_source": fixture["route_source"],
        "geometry": fixture["geometry"],
        "segments": route["segments"],
        "warnings": [*route["limitations"], f"Simulated for {profile_label}; this is not live navigation."],
        "instructions": presented_routes[0]["instructions"],
        "demo_data": True,
        "limitations": [fixture["notice"], "Your place names change this demonstration label only; no geocoding or live navigation is performed."],
        "options": presented_routes,
        "corridor": {**fixture["corridor"], "title": f"Simulated path: {origin_label} → {destination_label}"},
        "rule_pack": fixture["rule_pack"],
    }

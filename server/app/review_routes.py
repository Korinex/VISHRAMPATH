import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import database_path

router = APIRouter(prefix="/api/v1", tags=["review"])
MIGRATION = Path(__file__).resolve().parents[2] / "server" / "migrations" / "003_review_scoring.sql"


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(database_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_review_schema() -> None:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as connection:
        connection.executescript(MIGRATION.read_text(encoding="utf-8"))
        connection.execute(
            """INSERT OR IGNORE INTO rule_pack
               (id, version, title, status, standard_edition, rules_json, created_at)
               VALUES ('draft-screening', 'draft-0.1', 'Screening rules pending review',
                       'draft', NULL, '{}', ?)""",
            (now,),
        )
        connection.execute(
            """INSERT OR IGNORE INTO observation
               (id, segment_id, evidence_id, class_code, description, source,
                confidence, suggested_severity, demo_data, created_at)
               VALUES ('demo-review-card', 'demo-segment-01', 'demo-evidence-01',
                       'fixture_example',
                       'Illustrative card to demonstrate review controls only; no road condition was observed.',
                       'fixture', NULL, NULL, 1, ?)""",
            (now,),
        )


class DecisionInput(BaseModel):
    decision: str
    severity: str | None = None
    note: str | None = Field(default=None, max_length=500)


@router.get("/surveys/{survey_id}/suggestions")
def suggestions(survey_id: str) -> dict:
    with connect() as connection:
        rows = connection.execute(
            """SELECT o.id, o.segment_id, o.class_code, o.description, o.source,
                      o.confidence, o.suggested_severity, o.demo_data,
                      d.decision AS latest_decision, d.severity AS reviewed_severity
               FROM observation o
               JOIN segment s ON s.id = o.segment_id
               LEFT JOIN review_decision d ON d.id = (
                   SELECT id FROM review_decision
                   WHERE observation_id = o.id ORDER BY decided_at DESC, rowid DESC LIMIT 1
               )
               WHERE s.survey_id = ? ORDER BY o.created_at""",
            (survey_id,),
        ).fetchall()
    return {"items": [dict(row) for row in rows]}


@router.post("/suggestions/{observation_id}/review", status_code=201)
def review(observation_id: str, payload: DecisionInput) -> dict:
    if payload.decision not in {"confirmed", "rejected", "uncertain"}:
        raise HTTPException(status_code=422, detail="Choose confirmed, rejected, or uncertain")
    if payload.decision == "confirmed" and payload.severity not in {"low", "medium", "high"}:
        raise HTTPException(status_code=422, detail="Confirmed findings need low, medium, or high severity")
    if payload.decision != "confirmed" and payload.severity is not None:
        raise HTTPException(status_code=422, detail="Only a confirmed finding has reviewer-set severity")

    decision_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as connection:
        observation = connection.execute(
            "SELECT id FROM observation WHERE id = ?", (observation_id,)
        ).fetchone()
        if observation is None:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        previous = connection.execute(
            "SELECT id FROM review_decision WHERE observation_id = ? ORDER BY decided_at DESC, rowid DESC LIMIT 1",
            (observation_id,),
        ).fetchone()
        connection.execute(
            """INSERT INTO review_decision
               (id, observation_id, reviewer_id, decision, severity, note,
                decided_at, supersedes_decision_id)
               VALUES (?, ?, 'demo-reviewer', ?, ?, ?, ?, ?)""",
            (decision_id, observation_id, payload.decision, payload.severity,
             payload.note, now, previous["id"] if previous else None),
        )
    return {"id": decision_id, "observation_id": observation_id,
            "decision": payload.decision, "severity": payload.severity,
            "demo_data": True}


@router.get("/segments/{segment_id}/screening")
def screening(segment_id: str, profile_id: str = "walking_stick") -> dict:
    if profile_id not in {"walking_stick", "wheelchair"}:
        raise HTTPException(status_code=422, detail="Unsupported route profile")
    with connect() as connection:
        segment = connection.execute(
            "SELECT id, demo_data FROM segment WHERE id = ?", (segment_id,)
        ).fetchone()
        if segment is None:
            raise HTTPException(status_code=404, detail="Segment not found")
        rows = connection.execute(
            """SELECT o.class_code, o.description, o.source, d.decision, d.severity
               FROM observation o
               LEFT JOIN review_decision d ON d.id = (
                   SELECT id FROM review_decision WHERE observation_id = o.id
                   ORDER BY decided_at DESC, rowid DESC LIMIT 1
               ) WHERE o.segment_id = ?""",
            (segment_id,),
        ).fetchall()
    confirmed = [row for row in rows if row["decision"] == "confirmed"]
    unknown = sorted({row["class_code"] for row in rows if row["decision"] != "confirmed"})
    if not confirmed:
        return {"segment_id": segment_id, "profile_id": profile_id,
                "score": None, "label": "Not assessed",
                "explanation": "No eligible confirmed field observations are available.",
                "unknown_dimensions": unknown or ["surface", "clear_width", "level_change"],
                "rule_pack_version": "draft-0.1", "demo_data": bool(segment["demo_data"])}
    return {"segment_id": segment_id, "profile_id": profile_id,
            "score": None, "label": "Not assessed",
            "explanation": "This prototype fixture is not field evidence and no verified rule pack is active. Numerical screening is withheld.",
            "unknown_dimensions": unknown or ["verified rule pack", "field evidence"],
            "rule_pack_version": "draft-0.1", "demo_data": bool(segment["demo_data"])}

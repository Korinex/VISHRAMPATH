import sqlite3
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import database_path

router = APIRouter(prefix="/api/v1", tags=["surveys"])
MIGRATION = "server/migrations/002_survey_evidence.sql"


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(database_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_survey_schema() -> None:
    from pathlib import Path

    project_root = Path(__file__).resolve().parents[2]
    with connect() as connection:
        connection.executescript((project_root / MIGRATION).read_text(encoding="utf-8"))
        connection.execute(
            """
            INSERT OR IGNORE INTO segment
                (id, survey_id, sequence_no, length_m, street_label,
                 alignment_status, demo_data)
            VALUES (?, ?, 1, NULL, 'Demo segment 01', 'uncertain', 1)
            """,
            ("demo-segment-01", "hour-1-demo-corridor"),
        )
        connection.execute(
            """
            INSERT OR IGNORE INTO evidence_record
                (id, survey_id, segment_id, evidence_type, description,
                 blur_status, qa_status, demo_data, created_at)
            VALUES (?, ?, ?, 'note', ?, 'not_applicable', 'passed', 1, ?)
            """,
            (
                "demo-evidence-01",
                "hour-1-demo-corridor",
                "demo-segment-01",
                "DEMO DATA. Placeholder note only. No street condition was observed.",
                datetime.now(timezone.utc).isoformat(timespec="seconds"),
            ),
        )


class SurveyCreate(BaseModel):
    label: str = Field(min_length=3, max_length=120)
    surveyed_by: str = Field(min_length=2, max_length=80)
    permission_status: Literal["unknown", "pending", "authorised", "denied"] = "unknown"


class SegmentCreate(BaseModel):
    sequence_no: int = Field(gt=0)
    street_label: str = Field(min_length=2, max_length=120)
    length_m: float | None = Field(default=None, gt=0, le=100)
    gps_accuracy_m: float | None = Field(default=None, ge=0)
    alignment_status: Literal["reviewed", "approximate", "uncertain"] = "uncertain"


class EvidenceCreate(BaseModel):
    segment_id: str | None = None
    description: str = Field(min_length=3, max_length=500)
    captured_at: str | None = None


@router.get("/surveys")
def list_surveys() -> dict:
    with connect() as connection:
        rows = connection.execute(
            """SELECT id, label, status, permission_status, capture_mode,
                      length_m, demo_data FROM survey ORDER BY created_at"""
        ).fetchall()
    return {"items": [{**dict(row), "demo_data": bool(row["demo_data"])} for row in rows]}


@router.get("/surveys/{survey_id}/segments")
def list_segments(survey_id: str) -> dict:
    with connect() as connection:
        rows = connection.execute(
            """SELECT id, sequence_no, length_m, gps_accuracy_m, street_label,
                      alignment_status, demo_data FROM segment
               WHERE survey_id = ? ORDER BY sequence_no""",
            (survey_id,),
        ).fetchall()
    return {"items": [{**dict(row), "demo_data": bool(row["demo_data"])} for row in rows]}


@router.get("/surveys/{survey_id}/evidence")
def list_evidence(survey_id: str) -> dict:
    with connect() as connection:
        rows = connection.execute(
            """SELECT id, segment_id, evidence_type, description, captured_at,
                      blur_status, qa_status, demo_data FROM evidence_record
               WHERE survey_id = ? ORDER BY created_at""",
            (survey_id,),
        ).fetchall()
    return {"items": [{**dict(row), "demo_data": bool(row["demo_data"])} for row in rows]}


@router.post("/surveys", status_code=201)
def create_survey(payload: SurveyCreate) -> dict:
    if payload.permission_status == "authorised":
        raise HTTPException(
            status_code=400,
            detail="Do not mark a survey authorised without written permission recorded by the team.",
        )
    survey_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as connection:
        connection.execute(
            """INSERT INTO survey
               (id, label, status, permission_status, capture_mode, surveyed_by,
                length_m, demo_data, created_at)
               VALUES (?, ?, 'draft', ?, 'demo_fixture', ?, NULL, 1, ?)""",
            (survey_id, payload.label, payload.permission_status, payload.surveyed_by, now),
        )
    return {"id": survey_id, "label": payload.label, "demo_data": True,
            "permission_status": payload.permission_status}


@router.post("/surveys/{survey_id}/segments", status_code=201)
def create_segment(survey_id: str, payload: SegmentCreate) -> dict:
    segment_id = str(uuid4())
    with connect() as connection:
        parent = connection.execute(
            "SELECT id FROM survey WHERE id = ? AND demo_data = 1", (survey_id,)
        ).fetchone()
        if parent is None:
            raise HTTPException(status_code=404, detail="Demo survey not found")
        connection.execute(
            """INSERT INTO segment
               (id, survey_id, sequence_no, length_m, gps_accuracy_m, street_label,
                alignment_status, demo_data)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1)""",
            (segment_id, survey_id, payload.sequence_no, payload.length_m,
             payload.gps_accuracy_m, payload.street_label, payload.alignment_status),
        )
    return {"id": segment_id, **payload.model_dump(), "demo_data": True}


@router.post("/surveys/{survey_id}/evidence", status_code=201)
def create_evidence(survey_id: str, payload: EvidenceCreate) -> dict:
    evidence_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as connection:
        parent = connection.execute(
            "SELECT id FROM survey WHERE id = ? AND demo_data = 1", (survey_id,)
        ).fetchone()
        if parent is None:
            raise HTTPException(status_code=404, detail="Demo survey not found")
        if payload.segment_id:
            segment = connection.execute(
                "SELECT id FROM segment WHERE id = ? AND survey_id = ?",
                (payload.segment_id, survey_id),
            ).fetchone()
            if segment is None:
                raise HTTPException(status_code=400, detail="Segment does not belong to this survey")
        connection.execute(
            """INSERT INTO evidence_record
               (id, survey_id, segment_id, evidence_type, description, captured_at,
                blur_status, qa_status, demo_data, created_at)
               VALUES (?, ?, ?, 'note', ?, ?, 'not_applicable', 'passed', 1, ?)""",
            (evidence_id, survey_id, payload.segment_id, payload.description,
             payload.captured_at, now),
        )
    return {"id": evidence_id, **payload.model_dump(), "evidence_type": "note",
            "demo_data": True}

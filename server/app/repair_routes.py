import csv
import html
import io
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from app.database import database_path

router = APIRouter(prefix="/api/v1", tags=["repairs"])
MIGRATION = Path(__file__).resolve().parents[2] / "server" / "migrations" / "004_repair_repeat.sql"


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(database_path())
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_repair_schema() -> None:
    with connect() as connection:
        connection.executescript(MIGRATION.read_text(encoding="utf-8"))


class RepairCreate(BaseModel):
    observation_id: str
    suggested_action: str = Field(min_length=5, max_length=300)


class InterventionInput(BaseModel):
    description: str = Field(min_length=5, max_length=500)
    recorded_by: str = Field(min_length=2, max_length=80)


class RepeatInput(BaseModel):
    baseline_segment_id: str
    repeat_segment_id: str | None = None
    alignment_status: str
    comparison_note: str = Field(min_length=5, max_length=500)


def latest_confirmed(connection: sqlite3.Connection, observation_id: str):
    return connection.execute(
        """SELECT o.id, o.segment_id, o.class_code, o.demo_data,
                  d.severity, d.decision
           FROM observation o JOIN review_decision d ON d.id = (
             SELECT id FROM review_decision WHERE observation_id = o.id
             ORDER BY decided_at DESC, rowid DESC LIMIT 1
           ) WHERE o.id = ?""",
        (observation_id,),
    ).fetchone()


@router.get("/confirmed-observations")
def confirmed_observations() -> dict:
    with connect() as connection:
        rows = connection.execute(
            """SELECT o.id, o.segment_id, o.class_code, o.description, o.demo_data,
                      d.severity, d.decision
               FROM observation o JOIN review_decision d ON d.id = (
                   SELECT id FROM review_decision WHERE observation_id = o.id
                   ORDER BY decided_at DESC, rowid DESC LIMIT 1
               ) WHERE d.decision = 'confirmed'
                 AND NOT EXISTS (
                   SELECT 1 FROM repair_item r WHERE r.observation_id = o.id
                 ) ORDER BY o.created_at"""
        ).fetchall()
    return {"items": [dict(row) for row in rows],
            "notice": "Demo review actions only. Queue entries are illustrative, not field recommendations."}


@router.post("/repair-items", status_code=201)
def create_repair(payload: RepairCreate) -> dict:
    repair_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as connection:
        finding = latest_confirmed(connection, payload.observation_id)
        if finding is None or finding["decision"] != "confirmed":
            raise HTTPException(status_code=400, detail="Only a human-confirmed finding can enter the queue")
        points = {"high": 1, "medium": 2, "low": 3}
        priority = points[finding["severity"]]
        connection.execute(
            """INSERT INTO repair_item
               (id, segment_id, observation_id, issue_code, severity,
                suggested_action, priority_rank, priority_method,
                indicative_cost_amount, cost_source_name, uncertainty_note,
                demo_data, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'severity-only advisory order',
                       NULL, NULL, 'No verified quantity, rate, or cost estimate.', ?, ?)""",
            (repair_id, finding["segment_id"], finding["id"], finding["class_code"],
             finding["severity"], payload.suggested_action, priority,
             int(finding["demo_data"]), now),
        )
    return {"id": repair_id, "priority_rank": priority,
            "priority_method": "severity-only advisory order",
            "indicative_cost_amount": None, "status": "for_review",
            "demo_data": bool(finding["demo_data"])}


@router.get("/repair-queue")
def list_queue() -> dict:
    with connect() as connection:
        rows = connection.execute(
            """SELECT r.id, r.segment_id, r.issue_code, r.severity,
                      r.suggested_action, r.priority_rank, r.priority_method,
                      r.indicative_cost_amount, r.cost_source_name,
                      r.uncertainty_note, r.status, r.demo_data,
                      o.description AS evidence_description
               FROM repair_item r JOIN observation o ON o.id = r.observation_id
               ORDER BY r.priority_rank, r.created_at"""
        ).fetchall()
    return {"items": [dict(row) for row in rows],
            "notice": "Advisory planning list only. Not a tender or engineering estimate."}


@router.post("/repair-items/{repair_id}/interventions", status_code=201)
def add_intervention(repair_id: str, payload: InterventionInput) -> dict:
    intervention_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as connection:
        item = connection.execute(
            "SELECT id, demo_data FROM repair_item WHERE id = ?", (repair_id,)
        ).fetchone()
        if item is None:
            raise HTTPException(status_code=404, detail="Repair item not found")
        connection.execute(
            """INSERT INTO intervention
               (id, repair_item_id, description, recorded_by, recorded_at, demo_data)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (intervention_id, repair_id, payload.description,
             payload.recorded_by, now, item["demo_data"]),
        )
        connection.execute(
            "UPDATE repair_item SET status = 'action_recorded' WHERE id = ?",
            (repair_id,),
        )
    return {"id": intervention_id, "repair_item_id": repair_id,
            "status": "action_recorded", "verified_repair": False,
            "demo_data": bool(item["demo_data"])}


@router.get("/repair-queue.csv")
def export_queue() -> Response:
    rows = list_queue()["items"]
    output = io.StringIO()
    columns = ["id", "segment_id", "issue_code", "severity", "suggested_action",
               "priority_rank",
               "priority_method", "indicative_cost_amount", "cost_source_name",
               "uncertainty_note", "status", "demo_data", "evidence_description"]
    writer = csv.DictWriter(output, fieldnames=columns)
    writer.writeheader()
    writer.writerows(rows)
    return Response(
        content=output.getvalue(), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vishraampath-fix-first-demo.csv"},
    )


@router.get("/repair-queue/report.html")
def report_queue() -> Response:
    rows = list_queue()["items"]

    def cell(value: object) -> str:
        return html.escape("Not entered" if value is None or value == "" else str(value))

    cards = "".join(
        f"""<article class=\"item\"><h2>Priority {cell(row['priority_rank'])}: {cell(row['issue_code'])}</h2>
        <p><strong>Segment:</strong> {cell(row['segment_id'])}</p>
        <p><strong>Evidence:</strong> {cell(row['evidence_description'])}</p>
        <p><strong>Suggested action:</strong> {cell(row['suggested_action'])}</p>
        <p><strong>Severity:</strong> {cell(row['severity'])} · <strong>Status:</strong> {cell(row['status'])}</p>
        <p><strong>Uncertainty:</strong> {cell(row['uncertainty_note'])}</p>
        <p><strong>Cost:</strong> {cell(row['indicative_cost_amount'])} · No source-backed estimate is included.</p></article>"""
        for row in rows
    ) or "<p>No human-confirmed demo items are currently in the queue.</p>"
    document = f"""<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>VishraamPath Fix-First demo report</title>
    <style>body{{font:16px/1.5 Arial,sans-serif;color:#25352d;max-width:900px;margin:40px auto;padding:0 24px}}h1{{font-size:32px}}h2{{font-size:20px;margin-top:0}}.notice{{padding:16px;background:#f7f0dc;border-left:4px solid #ad7621}}.item{{border:1px solid #ccd5cc;padding:18px;margin:18px 0;page-break-inside:avoid}}.meta{{color:#52665a}}</style></head>
    <body><h1>VishraamPath · Fix-First review report</h1><p class=\"meta\">Generated from the local prototype queue · DEMO DATA</p>
    <div class=\"notice\"><strong>Advisory demo report.</strong> These records are illustrative, not field observations, engineering estimates, work orders, or proof of a completed repair. A repeat survey is required before calling a change verified.</div>
    {cards}</body></html>"""
    return Response(
        content=document,
        media_type="text/html",
        headers={"Content-Disposition": "inline; filename=vishraampath-fix-first-demo-report.html"},
    )


@router.post("/surveys/{repeat_survey_id}/repeat-links", status_code=201)
def create_repeat_link(repeat_survey_id: str, payload: RepeatInput) -> dict:
    if payload.alignment_status not in {"reviewed", "approximate", "uncertain"}:
        raise HTTPException(status_code=422, detail="Alignment must be reviewed, approximate, or uncertain")
    link_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with connect() as connection:
        repeat = connection.execute(
            "SELECT id FROM survey WHERE id = ? AND demo_data = 1", (repeat_survey_id,)
        ).fetchone()
        baseline = connection.execute(
            "SELECT id FROM segment WHERE id = ?", (payload.baseline_segment_id,)
        ).fetchone()
        if repeat is None or baseline is None:
            raise HTTPException(status_code=404, detail="Demo repeat survey or baseline segment not found")
        if payload.repeat_segment_id:
            new_segment = connection.execute(
                "SELECT id FROM segment WHERE id = ? AND survey_id = ?",
                (payload.repeat_segment_id, repeat_survey_id),
            ).fetchone()
            if new_segment is None:
                raise HTTPException(status_code=400, detail="Repeat segment does not belong to repeat survey")
        connection.execute(
            """INSERT INTO repeat_link
               (id, baseline_survey_id, repeat_survey_id, baseline_segment_id,
                repeat_segment_id, alignment_status, comparison_note, demo_data, created_at)
               SELECT ?, s.survey_id, ?, ?, ?, ?, ?, 1, ?
               FROM segment s WHERE s.id = ?""",
            (link_id, repeat_survey_id, payload.baseline_segment_id,
             payload.repeat_segment_id, payload.alignment_status,
             payload.comparison_note, now, payload.baseline_segment_id),
        )
    return {"id": link_id, "baseline_segment_id": payload.baseline_segment_id,
            "repeat_segment_id": payload.repeat_segment_id,
            "alignment_status": payload.alignment_status,
            "comparison_note": payload.comparison_note,
            "verified_repair": False, "demo_data": True}

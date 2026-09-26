import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = SERVER_DIR / "data" / "vishraampath.sqlite3"
MIGRATIONS_DIR = SERVER_DIR / "migrations"
DEMO_SURVEY_ID = "demo-nagpur-corridor"
DEMO_SURVEY_LABEL = "DEMO DATA / Nagpur corridor placeholder"


def insert_demo_marker(connection: sqlite3.Connection) -> None:
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    connection.execute(
        """
        INSERT OR IGNORE INTO survey (
            id, label, status, permission_status, capture_mode, surveyed_by,
            length_m, demo_data, created_at
        ) VALUES (?, ?, 'draft', 'unknown', 'demo_fixture', ?, NULL, 1, ?)
        """,
        (
            DEMO_SURVEY_ID,
            DEMO_SURVEY_LABEL,
            "Team Zenith structural fixture",
            created_at,
        ),
    )


def database_path() -> Path:
    configured_path = os.environ.get("VISHRAAMPATH_DB") or os.environ.get("VISHRAMPATH_DB")
    return Path(configured_path) if configured_path else DEFAULT_DB_PATH


def initialize_database() -> None:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    migration = MIGRATIONS_DIR / "001_initial.sql"

    with sqlite3.connect(path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(migration.read_text(encoding="utf-8"))
        insert_demo_marker(connection)


def reset_demo_fixture() -> None:
    """Clear demo workflow state without touching non-demo records, then reseed it."""
    initialize_database()

    # Import locally so the database module remains the low-level dependency of
    # the API modules while reset can ensure all demo tables exist.
    from app.repair_routes import initialize_repair_schema
    from app.review_routes import initialize_review_schema
    from app.survey_routes import initialize_survey_schema

    initialize_survey_schema()
    initialize_review_schema()
    initialize_repair_schema()

    path = database_path()
    with sqlite3.connect(path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")

        # A later review points to the previous decision; remove newest first.
        decisions = connection.execute(
            """SELECT d.id FROM review_decision d
               JOIN observation o ON o.id = d.observation_id
               WHERE o.demo_data = 1 ORDER BY d.rowid DESC"""
        ).fetchall()
        for (decision_id,) in decisions:
            connection.execute("DELETE FROM review_decision WHERE id = ?", (decision_id,))

        connection.execute("DELETE FROM intervention WHERE demo_data = 1")
        connection.execute("DELETE FROM repeat_link WHERE demo_data = 1")
        connection.execute("DELETE FROM repair_item WHERE demo_data = 1")
        connection.execute("DELETE FROM segment_score WHERE demo_data = 1")
        connection.execute("DELETE FROM observation WHERE demo_data = 1")
        connection.execute("DELETE FROM evidence_record WHERE demo_data = 1")
        connection.execute("DELETE FROM segment WHERE demo_data = 1")
        connection.execute("DELETE FROM survey WHERE demo_data = 1")

    # The rows are rebuilt by the ordinary initialization path. This leaves
    # field-tagged rows untouched and restores the governance demonstration.
    initialize_database()
    initialize_survey_schema()
    initialize_review_schema()
    initialize_repair_schema()


def list_surveys() -> list[dict[str, str | int | float | bool | None]]:
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(path) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT id, label, status, capture_mode, permission_status,
                   length_m, demo_data
            FROM survey
            ORDER BY created_at DESC
            """
        ).fetchall()

    return [
        {**dict(row), "demo_data": bool(row["demo_data"])}
        for row in rows
    ]

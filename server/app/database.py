import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = SERVER_DIR / "data" / "vishraampath.sqlite3"
MIGRATIONS_DIR = SERVER_DIR / "migrations"
DEMO_SURVEY_ID = "hour-1-demo-corridor"
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
    configured_path = os.environ.get("VISHRAAMPATH_DB")
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
    path = database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    migration = MIGRATIONS_DIR / "001_initial.sql"

    with sqlite3.connect(path) as connection:
        connection.execute("PRAGMA foreign_keys = ON")
        connection.executescript(migration.read_text(encoding="utf-8"))
        connection.execute(
            """
            UPDATE survey
            SET label = ?, status = 'draft', permission_status = 'unknown',
                capture_mode = 'demo_fixture', surveyed_by = ?,
                length_m = NULL, demo_data = 1
            WHERE id = ? AND demo_data = 1
            """,
            (
                DEMO_SURVEY_LABEL,
                "Team Zenith structural fixture",
                DEMO_SURVEY_ID,
            ),
        )
        insert_demo_marker(connection)


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

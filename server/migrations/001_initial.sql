CREATE TABLE IF NOT EXISTS survey (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    status TEXT NOT NULL CHECK (
        status IN ('draft', 'authorised', 'capturing', 'review', 'complete', 'blocked')
    ),
    permission_status TEXT NOT NULL CHECK (
        permission_status IN ('unknown', 'pending', 'authorised', 'denied')
    ),
    capture_mode TEXT NOT NULL CHECK (
        capture_mode IN ('field', 'demo_fixture', 'manual_entry')
    ),
    surveyed_by TEXT NOT NULL,
    length_m REAL CHECK (length_m IS NULL OR length_m >= 0),
    demo_data INTEGER NOT NULL DEFAULT 0 CHECK (demo_data IN (0, 1)),
    created_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS survey_demo_flag_is_immutable
BEFORE UPDATE OF demo_data ON survey
WHEN OLD.demo_data != NEW.demo_data
BEGIN
    SELECT RAISE(ABORT, 'demo_data is immutable');
END;

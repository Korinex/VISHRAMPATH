CREATE TABLE IF NOT EXISTS segment (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL REFERENCES survey(id) ON DELETE CASCADE,
    sequence_no INTEGER NOT NULL CHECK (sequence_no > 0),
    length_m REAL CHECK (length_m IS NULL OR length_m > 0),
    gps_accuracy_m REAL CHECK (gps_accuracy_m IS NULL OR gps_accuracy_m >= 0),
    street_label TEXT NOT NULL,
    alignment_status TEXT NOT NULL DEFAULT 'uncertain'
        CHECK (alignment_status IN ('reviewed', 'approximate', 'uncertain')),
    demo_data INTEGER NOT NULL CHECK (demo_data IN (0, 1)),
    UNIQUE (survey_id, sequence_no)
);

CREATE TABLE IF NOT EXISTS evidence_record (
    id TEXT PRIMARY KEY,
    survey_id TEXT NOT NULL REFERENCES survey(id) ON DELETE CASCADE,
    segment_id TEXT REFERENCES segment(id) ON DELETE SET NULL,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('note', 'blurred_image_reference')),
    description TEXT NOT NULL,
    captured_at TEXT,
    latitude REAL,
    longitude REAL,
    horizontal_accuracy_m REAL CHECK (
        horizontal_accuracy_m IS NULL OR horizontal_accuracy_m >= 0
    ),
    blur_status TEXT NOT NULL DEFAULT 'not_applicable'
        CHECK (blur_status IN ('not_applicable', 'passed', 'failed', 'pending')),
    qa_status TEXT NOT NULL DEFAULT 'passed'
        CHECK (qa_status IN ('passed', 'failed', 'pending')),
    demo_data INTEGER NOT NULL CHECK (demo_data IN (0, 1)),
    created_at TEXT NOT NULL,
    CHECK (
        (latitude IS NULL AND longitude IS NULL)
        OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    ),
    CHECK (evidence_type = 'note' OR (blur_status = 'passed' AND qa_status = 'passed'))
);

CREATE TRIGGER IF NOT EXISTS segment_demo_matches_survey
BEFORE INSERT ON segment
WHEN NEW.demo_data != (SELECT demo_data FROM survey WHERE id = NEW.survey_id)
BEGIN
    SELECT RAISE(ABORT, 'segment demo flag must match survey');
END;

CREATE TRIGGER IF NOT EXISTS evidence_demo_matches_survey
BEFORE INSERT ON evidence_record
WHEN NEW.demo_data != (SELECT demo_data FROM survey WHERE id = NEW.survey_id)
BEGIN
    SELECT RAISE(ABORT, 'evidence demo flag must match survey');
END;

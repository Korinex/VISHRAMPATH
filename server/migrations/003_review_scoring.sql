CREATE TABLE IF NOT EXISTS rule_pack (
    id TEXT PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'verified_for_demo', 'retired')),
    standard_edition TEXT,
    rules_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS observation (
    id TEXT PRIMARY KEY,
    segment_id TEXT NOT NULL REFERENCES segment(id) ON DELETE CASCADE,
    evidence_id TEXT REFERENCES evidence_record(id) ON DELETE SET NULL,
    class_code TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('model_suggestion', 'human_entry', 'fixture')),
    confidence REAL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
    suggested_severity TEXT,
    demo_data INTEGER NOT NULL CHECK (demo_data IN (0, 1)),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS review_decision (
    id TEXT PRIMARY KEY,
    observation_id TEXT NOT NULL REFERENCES observation(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('confirmed', 'rejected', 'uncertain')),
    severity TEXT CHECK (severity IS NULL OR severity IN ('low', 'medium', 'high')),
    note TEXT,
    decided_at TEXT NOT NULL,
    supersedes_decision_id TEXT REFERENCES review_decision(id),
    CHECK (decision = 'confirmed' OR severity IS NULL)
);

CREATE TABLE IF NOT EXISTS segment_score (
    id TEXT PRIMARY KEY,
    segment_id TEXT NOT NULL REFERENCES segment(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL CHECK (profile_id IN ('walking_stick', 'wheelchair')),
    rule_pack_id TEXT NOT NULL REFERENCES rule_pack(id),
    score_value INTEGER CHECK (score_value IS NULL OR score_value BETWEEN 0 AND 100),
    label TEXT NOT NULL,
    explanation TEXT NOT NULL,
    unknown_dimensions_json TEXT NOT NULL,
    computed_at TEXT NOT NULL,
    demo_data INTEGER NOT NULL CHECK (demo_data IN (0, 1))
);

CREATE TABLE IF NOT EXISTS repair_item (
    id TEXT PRIMARY KEY,
    segment_id TEXT NOT NULL REFERENCES segment(id),
    observation_id TEXT NOT NULL REFERENCES observation(id),
    issue_code TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    suggested_action TEXT NOT NULL,
    priority_rank INTEGER NOT NULL,
    priority_method TEXT NOT NULL,
    indicative_cost_amount REAL,
    cost_source_name TEXT,
    uncertainty_note TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'for_review'
        CHECK (status IN ('for_review', 'action_recorded', 'rechecked')),
    demo_data INTEGER NOT NULL CHECK (demo_data IN (0, 1)),
    created_at TEXT NOT NULL,
    UNIQUE (segment_id, observation_id)
);

CREATE TABLE IF NOT EXISTS intervention (
    id TEXT PRIMARY KEY,
    repair_item_id TEXT NOT NULL REFERENCES repair_item(id),
    description TEXT NOT NULL,
    recorded_by TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    demo_data INTEGER NOT NULL CHECK (demo_data IN (0, 1))
);

CREATE TABLE IF NOT EXISTS repeat_link (
    id TEXT PRIMARY KEY,
    baseline_survey_id TEXT NOT NULL REFERENCES survey(id),
    repeat_survey_id TEXT NOT NULL REFERENCES survey(id),
    baseline_segment_id TEXT NOT NULL REFERENCES segment(id),
    repeat_segment_id TEXT REFERENCES segment(id),
    alignment_status TEXT NOT NULL CHECK (alignment_status IN ('reviewed', 'approximate', 'uncertain')),
    comparison_note TEXT NOT NULL,
    demo_data INTEGER NOT NULL CHECK (demo_data IN (0, 1)),
    created_at TEXT NOT NULL
);

import pytest
from fastapi import HTTPException

from app.database import initialize_database
from app.survey_routes import (
    EvidenceCreate, SegmentCreate, SurveyCreate, create_evidence,
    create_segment, create_survey, initialize_survey_schema,
)


@pytest.fixture(autouse=True)
def fresh_demo_db(tmp_path, monkeypatch):
    monkeypatch.setenv("VISHRAAMPATH_DB", str(tmp_path / "hour2.sqlite3"))
    initialize_database()
    initialize_survey_schema()


def test_new_survey_is_demo_and_permission_stays_unknown():
    result = create_survey(SurveyCreate(label="Demo visit", surveyed_by="Volunteer role"))
    assert result["demo_data"] is True
    assert result["permission_status"] == "unknown"


def test_ui_cannot_assert_permission_without_recorded_check():
    with pytest.raises(HTTPException) as error:
        create_survey(SurveyCreate(
            label="Demo visit", surveyed_by="Volunteer role",
            permission_status="authorised",
        ))
    assert error.value.status_code == 400


def test_segment_and_note_inherit_demo_marker():
    segment = create_segment(
        "hour-1-demo-corridor",
        SegmentCreate(sequence_no=2, street_label="Demo segment two"),
    )
    note = create_evidence(
        "hour-1-demo-corridor",
        EvidenceCreate(segment_id=segment["id"], description="DEMO DATA note only"),
    )
    assert segment["demo_data"] is True
    assert note["demo_data"] is True
    assert note["evidence_type"] == "note"


def test_note_cannot_link_to_another_survey_segment():
    survey = create_survey(SurveyCreate(label="Second demo", surveyed_by="Team demo"))
    segment = create_segment(
        survey["id"], SegmentCreate(sequence_no=1, street_label="Another demo segment")
    )
    with pytest.raises(HTTPException) as error:
        create_evidence(
            "hour-1-demo-corridor",
            EvidenceCreate(segment_id=segment["id"], description="DEMO DATA mismatch test"),
        )
    assert error.value.status_code == 400
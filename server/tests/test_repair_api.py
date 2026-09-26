import pytest
from fastapi import HTTPException
from app.database import initialize_database, list_surveys, reset_demo_fixture
from app.repair_routes import (
    InterventionInput, RepairCreate, RepeatInput, add_intervention,
    create_repeat_link, create_repair, export_queue, initialize_repair_schema,
    list_queue, report_queue,
)
from app.review_routes import DecisionInput, initialize_review_schema, review, suggestions
from app.survey_routes import (
    SegmentCreate, SurveyCreate, create_segment, create_survey,
    initialize_survey_schema,
)

@pytest.fixture(autouse=True)
def fresh_demo_db(tmp_path, monkeypatch):
    monkeypatch.setenv("VISHRAAMPATH_DB", str(tmp_path / "hour5.sqlite3"))
    initialize_database()
    initialize_survey_schema()
    initialize_review_schema()
    initialize_repair_schema()

def test_queue_requires_latest_confirmed_review():
    review("demo-review-card", DecisionInput(decision="uncertain"))
    with pytest.raises(HTTPException) as error:
        create_repair(RepairCreate(
            observation_id="demo-review-card", suggested_action="Illustrative action"
        ))
    assert error.value.status_code == 400

def test_confirmed_queue_item_keeps_cost_blank_and_intervention_unverified():
    review("demo-review-card", DecisionInput(
        decision="confirmed", severity="medium", note="Demo workflow only"
    ))
    created = create_repair(RepairCreate(
        observation_id="demo-review-card", suggested_action="Illustrative action for review"
    ))
    assert created["priority_method"] == "severity-only advisory order"
    assert created["indicative_cost_amount"] is None
    assert created["demo_data"] is True
    row = list_queue()["items"][0]
    assert row["cost_source_name"] is None
    assert "No verified quantity" in row["uncertainty_note"]
    csv_response = export_queue()
    assert "demo_data" in csv_response.body.decode("utf-8")
    assert "uncertainty_note" in csv_response.body.decode("utf-8")
    report_response = report_queue()
    assert report_response.media_type == "text/html"
    assert "Advisory demo report" in report_response.body.decode("utf-8")
    intervention = add_intervention(
        created["id"],
        InterventionInput(description="Demo-only action note", recorded_by="Team demo"),
    )
    assert intervention["status"] == "action_recorded"
    assert intervention["verified_repair"] is False
    assert list_queue()["items"][0]["status"] == "action_recorded"

def test_repeat_link_does_not_claim_verified_repair():
    repeat_survey = create_survey(SurveyCreate(label="Demo repeat", surveyed_by="Team demo"))
    repeat_segment = create_segment(
        repeat_survey["id"],
        SegmentCreate(sequence_no=1, street_label="Demo repeat segment"),
    )
    link = create_repeat_link(
        repeat_survey["id"],
        RepeatInput(
            baseline_segment_id="demo-segment-01",
            repeat_segment_id=repeat_segment["id"],
            alignment_status="uncertain",
            comparison_note="DEMO DATA comparison only",
        ),
    )
    assert link["alignment_status"] == "uncertain"
    assert link["verified_repair"] is False
    assert link["demo_data"] is True

def test_repeat_link_rejects_segment_from_wrong_survey():
    repeat_survey = create_survey(SurveyCreate(label="Demo repeat", surveyed_by="Team demo"))
    with pytest.raises(HTTPException) as error:
        create_repeat_link(
            repeat_survey["id"],
            RepeatInput(
                baseline_segment_id="demo-segment-01",
                repeat_segment_id="demo-segment-01",
                alignment_status="reviewed",
                comparison_note="Test cross-survey rejection",
            ),
        )
    assert error.value.status_code == 400

def test_demo_reset_clears_workflow_state_and_restores_fixtures():
    review("demo-review-card", DecisionInput(
        decision="confirmed", severity="high", note="Demo-only review"
    ))
    repair = create_repair(RepairCreate(
        observation_id="demo-review-card", suggested_action="Inspect illustrative sample"
    ))
    add_intervention(
        repair["id"],
        InterventionInput(description="Illustrative action note", recorded_by="Team demo"),
    )
    repeat_survey = create_survey(SurveyCreate(label="Demo repeat", surveyed_by="Team demo"))
    repeat_segment = create_segment(
        repeat_survey["id"],
        SegmentCreate(sequence_no=1, street_label="Demo repeat segment"),
    )
    create_repeat_link(
        repeat_survey["id"],
        RepeatInput(
            baseline_segment_id="demo-segment-01",
            repeat_segment_id=repeat_segment["id"],
            alignment_status="uncertain",
            comparison_note="Demo comparison only",
        ),
    )

    reset_demo_fixture()

    assert len(list_surveys()) == 1
    assert list_queue()["items"] == []
    assert suggestions("demo-nagpur-corridor")["items"][0]["latest_decision"] is None

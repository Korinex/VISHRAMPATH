from fastapi.testclient import TestClient

from app.database import reset_demo_fixture
from app.main import app


client = TestClient(app)


def test_review_decision_is_saved_and_confirmed_item_becomes_plannable():
    reset_demo_fixture()

    before = client.get("/api/v1/surveys/demo-nagpur-corridor/suggestions")
    assert before.status_code == 200
    assert before.json()["items"][0]["latest_decision"] is None

    response = client.post(
        "/api/v1/suggestions/demo-review-card/review",
        json={"decision": "confirmed", "severity": "medium", "note": "Checked in demo"},
    )
    assert response.status_code == 201
    assert response.json()["decision"] == "confirmed"

    after = client.get("/api/v1/surveys/demo-nagpur-corridor/suggestions")
    reviewed = next(item for item in after.json()["items"] if item["id"] == "demo-review-card")
    assert reviewed["latest_decision"] == "confirmed"

    candidates = client.get("/api/v1/confirmed-observations")
    assert candidates.status_code == 200
    assert any(item["id"] == "demo-review-card" for item in candidates.json()["items"])


def test_rejected_review_does_not_become_plannable():
    reset_demo_fixture()
    response = client.post(
        "/api/v1/suggestions/demo-review-card/review",
        json={"decision": "rejected", "note": "Not supported by sample"},
    )
    assert response.status_code == 201
    candidates = client.get("/api/v1/confirmed-observations")
    assert all(item["id"] != "demo-review-card" for item in candidates.json()["items"])

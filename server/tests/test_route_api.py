from fastapi.testclient import TestClient
from app.main import app
from app.database import reset_demo_fixture

client = TestClient(app)

def test_route_endpoints():
    reset_demo_fixture()

    response = client.post("/api/v1/routes/plan", json={
        "origin_id": "demo-origin",
        "destination_id": "demo-market",
        "profile_id": "walking_stick",
        "language": "mr",
    })
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["options"]) == 2
    assert len(payload["corridor"]["segments"]) == 4
    assert payload["rule_pack"]["version"] == "draft-0.1"

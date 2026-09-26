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

    wheelchair = client.post("/api/v1/routes/plan", json={
        "origin_id": "demo-origin",
        "destination_id": "demo-market",
        "origin_label": "My home",
        "destination_label": "My office",
        "profile_id": "wheelchair",
        "language": "hi",
    })
    assert wheelchair.status_code == 200
    wheelchair_payload = wheelchair.json()
    assert wheelchair_payload["origin_label"] == "My home"
    assert wheelchair_payload["destination_label"] == "My office"
    assert "wheelchair" in wheelchair_payload["options"][0]["label"]
    assert "My home" in wheelchair_payload["corridor"]["title"]
    assert "My office" in wheelchair_payload["corridor"]["title"]

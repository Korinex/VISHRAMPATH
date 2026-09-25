from fastapi.testclient import TestClient
from app.main import app
from app.database import reset_demo_fixture

client = TestClient(app)

def test_route_endpoints():
    reset_demo_fixture()
    
    # Test gentle route resolution
    response = client.get("/api/v1/routes/evaluate")
    assert response.status_code in (200, 404)
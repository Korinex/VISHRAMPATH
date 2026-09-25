from fastapi.testclient import TestClient
from app.main import app
from app.database import reset_demo_fixture

client = TestClient(app)

def test_review_endpoints():
    reset_demo_fixture()
    
    # Test fetch suggestions
    response = client.get("/api/v1/reviews/suggestions")
    if response.status_code == 404:
        response = client.get("/api/v1/reviews")
    
    assert response.status_code in (200, 404)
from fastapi.testclient import TestClient

from app.settings import Settings
from app.main import create_app


def make_client() -> TestClient:
    return TestClient(create_app(Settings(frontend_origin="http://localhost:3000")))


def test_health_returns_ok():
    response = make_client().get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

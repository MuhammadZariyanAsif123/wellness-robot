from fastapi.testclient import TestClient

from app.settings import Settings
from app.main import create_app

ALLOWED = "http://localhost:3000"
DISALLOWED = "http://evil.example"


def make_client() -> TestClient:
    return TestClient(create_app(Settings(frontend_origin=ALLOWED)))


def test_allowed_origin_gets_cors_header():
    response = make_client().get("/health", headers={"Origin": ALLOWED})
    assert response.headers.get("access-control-allow-origin") == ALLOWED


def test_disallowed_origin_gets_no_cors_header():
    response = make_client().get("/health", headers={"Origin": DISALLOWED})
    assert "access-control-allow-origin" not in response.headers


def test_preflight_allowed_origin():
    response = make_client().options(
        "/health",
        headers={"Origin": ALLOWED, "Access-Control-Request-Method": "GET"},
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == ALLOWED


def test_preflight_disallowed_origin():
    response = make_client().options(
        "/health",
        headers={"Origin": DISALLOWED, "Access-Control-Request-Method": "GET"},
    )
    assert response.status_code == 400
    assert "access-control-allow-origin" not in response.headers


def test_several_origins_are_each_allowed_exactly():
    other = "https://app.example.com"
    client = TestClient(create_app(Settings(frontend_origin=f"{ALLOWED}, {other}")))
    assert client.get("/health", headers={"Origin": other}).headers.get("access-control-allow-origin") == other
    assert client.get("/health", headers={"Origin": ALLOWED}).headers.get("access-control-allow-origin") == ALLOWED
    assert "access-control-allow-origin" not in client.get("/health", headers={"Origin": DISALLOWED}).headers


def test_api_key_is_secret():
    settings = Settings(frontend_origin=ALLOWED, gemini_api_key="sk-test-123")
    assert "sk-test-123" not in repr(settings)
    assert "sk-test-123" not in str(settings)

from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings


def make_client(header: str, limit: int = 2) -> TestClient:
    settings = Settings(frontend_origin="http://localhost:3000", client_ip_header=header, turn_rate_limit=limit)
    return TestClient(create_app(settings))


def hit(client: TestClient, headers: dict[str, str] | None = None) -> int:
    return client.post("/turn", json={"message": "hi", "history": []}, headers=headers or {}).status_code


def test_header_is_ignored_when_not_configured():
    # Without CLIENT_IP_HEADER every caller shares the socket address, so a forged header changes nothing.
    client = make_client("")
    codes = [hit(client, {"cf-connecting-ip": f"203.0.113.{i}"}) for i in range(4)]
    assert 429 in codes


def test_configured_header_separates_clients():
    client = make_client("cf-connecting-ip")
    for _ in range(2):
        assert hit(client, {"cf-connecting-ip": "203.0.113.1"}) != 429
    assert hit(client, {"cf-connecting-ip": "203.0.113.1"}) == 429
    assert hit(client, {"cf-connecting-ip": "203.0.113.2"}) != 429


def test_invalid_header_value_falls_back_to_socket_address():
    client = make_client("cf-connecting-ip")
    codes = [hit(client, {"cf-connecting-ip": f"not-an-ip-{i}"}) for i in range(4)]
    assert 429 in codes

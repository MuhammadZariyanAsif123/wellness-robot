import logging

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.settings import Settings

KEY = "xi-test-key-123"


def make(handler, *, key: str | None = KEY, voice: str = "voice-1", limit: int = 30) -> TestClient:
    settings = Settings(
        _env_file=None,
        elevenlabs_api_key=key,
        elevenlabs_voice_id=voice,
        tts_rate_limit=limit,
    )
    http = httpx.Client(transport=httpx.MockTransport(handler))
    return TestClient(create_app(settings, http_client=http))


def ok(request: httpx.Request) -> httpx.Response:
    assert request.headers["xi-api-key"] == KEY
    assert request.url.path.endswith("/voice-1")
    return httpx.Response(200, content=b"AUDIO")


def test_returns_audio() -> None:
    res = make(ok).post("/tts", json={"text": "hello"})
    assert res.status_code == 200 and res.content == b"AUDIO"
    assert res.headers["content-type"] == "audio/mpeg"


def test_status_reports_configuration_only() -> None:
    assert make(ok).get("/tts/status").json() == {"elevenlabs": True}
    assert make(ok, key=None).get("/tts/status").json() == {"elevenlabs": False}
    assert KEY not in make(ok).get("/tts/status").text


def test_unavailable_without_key_or_voice() -> None:
    assert make(ok, key=None).post("/tts", json={"text": "hi"}).status_code == 503
    assert make(ok, voice="").post("/tts", json={"text": "hi"}).status_code == 503


@pytest.mark.parametrize("status", [401, 429, 500])
def test_upstream_failure_is_502_without_leaking(status: int) -> None:
    res = make(lambda r: httpx.Response(status, text="secret upstream detail")).post("/tts", json={"text": "hi"})
    assert res.status_code == 502
    assert "secret" not in res.text and KEY not in res.text


def test_network_error_is_502() -> None:
    def boom(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("down")

    assert make(boom).post("/tts", json={"text": "hi"}).status_code == 502


def test_validation_and_rate_limit() -> None:
    client = make(ok, limit=2)
    assert client.post("/tts", json={"text": ""}).status_code == 422
    assert client.post("/tts", json={"text": "x" * 601}).status_code == 422
    codes = [client.post("/tts", json={"text": "hi"}).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_logs_never_contain_text_or_key(caplog: pytest.LogCaptureFixture) -> None:
    with caplog.at_level(logging.DEBUG):
        make(ok).post("/tts", json={"text": "my-private-words"})
        make(lambda r: httpx.Response(500)).post("/tts", json={"text": "my-private-words"})
    assert "my-private-words" not in caplog.text and KEY not in caplog.text

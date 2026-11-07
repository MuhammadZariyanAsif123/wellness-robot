import logging

import pytest
from fastapi.testclient import TestClient

from app import exercises, forbidden
from app.llm import LLMError
from app.main import create_app
from app.responder import FALLBACK_SAY, respond
from app.safe import SAFE_MESSAGE, safe_turn
from app.schemas import ExerciseId, Gesture, RiskLevel, TurnRequest
from app.settings import Settings
from app.turn import handle_turn
from tests.fakes import FakeLLM, classifier_reply, responder_reply

C, R = "classifier-model", "responder-model"


def req(message: str, **kw: object) -> TurnRequest:
    return TurnRequest(message=message, **kw)  # type: ignore[arg-type]


def test_high_risk_returns_safe_turn_and_never_calls_the_responder() -> None:
    llm = FakeLLM(responder_reply())
    turn = handle_turn(req("I want to kill myself"), llm, C, R)
    assert turn.mode == "safe" and turn.risk is RiskLevel.high
    assert turn.segments[0].say == SAFE_MESSAGE
    assert llm.calls == []  # neither classifier nor responder


def test_classifier_high_also_skips_the_responder() -> None:
    llm = FakeLLM(classifier_reply("high"), responder_reply())
    turn = handle_turn(req("some message the screen misses"), llm, C, R)
    assert turn.mode == "safe"
    assert len(llm.calls) == 1  # classifier only


def test_safe_turn_invariants() -> None:
    turn = safe_turn()
    assert turn.exercise is None and turn.exercise_steps == []
    assert all(s.gesture is Gesture.none and s.expression.value == "neutral" for s in turn.segments)


def test_normal_flow_uses_the_responder() -> None:
    llm = FakeLLM(classifier_reply("none"), responder_reply(say="Thanks for sharing.", gesture="nod"))
    turn = handle_turn(req("rough day"), llm, C, R)
    assert turn.mode == "normal" and turn.risk is RiskLevel.none
    assert turn.segments[0].gesture is Gesture.nod


def test_model_cannot_set_risk_or_mode() -> None:
    bad = '{"risk": "none", "mode": "safe", "segments": [{"say": "Hi", "expression": "warm", "gesture": "none", "count": null}], "exercise": null}'
    llm = FakeLLM(classifier_reply("elevated"), bad)
    turn = handle_turn(req("hi"), llm, C, R)
    assert turn.risk is RiskLevel.elevated and turn.mode == "normal"


@pytest.mark.parametrize(
    "reply",
    ["garbage", '{"segments": [], "exercise": null}', responder_reply(gesture="backflip"), responder_reply(gesture="count")],
)
def test_invalid_output_is_retried_once_then_falls_back(reply: str) -> None:
    llm = FakeLLM(reply, reply)
    turn = respond("hi", [], RiskLevel.none, llm, R)
    assert len(llm.calls) == 2
    assert turn.segments[0].say == FALLBACK_SAY


def test_retry_can_succeed() -> None:
    llm = FakeLLM("garbage", responder_reply(say="Okay, I'm listening."))
    turn = respond("hi", [], RiskLevel.none, llm, R)
    assert turn.segments[0].say == "Okay, I'm listening."
    assert "rejected" in llm.calls[1]["user"]


@pytest.mark.parametrize(
    "say",
    ["You have depression.", "Try 50 mg of it.", "I am your therapist.", "You will feel better, I promise."],
)
def test_forbidden_text_is_never_returned(say: str) -> None:
    assert forbidden.violations(say)
    llm = FakeLLM(responder_reply(say=say), responder_reply(say=say))
    turn = respond("hi", [], RiskLevel.none, llm, R)
    assert turn.segments[0].say == FALLBACK_SAY


def test_clean_text_has_no_violations() -> None:
    assert forbidden.violations("That sounds like a lot. Want to try a slow breath together?") == []


def test_elevated_allows_only_grounding_and_breathing() -> None:
    bad = responder_reply(exercise="thought_record")
    llm = FakeLLM(bad, bad)
    assert respond("hi", [], RiskLevel.elevated, llm, R).exercise is None
    ok = FakeLLM(responder_reply(exercise="box_breathing"))
    turn = respond("hi", [], RiskLevel.elevated, ok, R)
    assert turn.exercise is ExerciseId.box_breathing
    assert turn.exercise_steps == exercises.steps_for(ExerciseId.box_breathing)


def test_provider_failure_gives_fallback_without_retry() -> None:
    llm = FakeLLM(LLMError("down"), responder_reply())
    turn = respond("hi", [], RiskLevel.none, llm, R)
    assert len(llm.calls) == 1 and turn.segments[0].say == FALLBACK_SAY


def test_every_exercise_has_a_script_and_smallest_steps_is_capped() -> None:
    for ex in ExerciseId:
        assert exercises.steps_for(ex)
    assert not exercises.is_allowed(ExerciseId.box_breathing, RiskLevel.high)


def make_client(llm: FakeLLM | None, limit: int = 20) -> TestClient:
    settings = Settings(turn_rate_limit=limit, classifier_model=C, responder_model=R)
    return TestClient(create_app(settings, llm or FakeLLM()))


def test_endpoint_safe_mode_and_validation() -> None:
    llm = FakeLLM()
    client = make_client(llm)
    res = client.post("/turn", json={"message": "I want to end my life"})
    assert res.status_code == 200 and res.json()["mode"] == "safe"
    assert llm.calls == []
    assert client.post("/turn", json={"message": ""}).status_code == 422
    assert client.post("/turn", json={"message": "x" * 2001}).status_code == 422


def test_endpoint_rate_limit() -> None:
    client = make_client(FakeLLM(), limit=2)
    codes = [client.post("/turn", json={"message": "I want to die"}).status_code for _ in range(3)]
    assert codes == [200, 200, 429]


def test_logs_never_contain_message_or_reply_text(caplog: pytest.LogCaptureFixture) -> None:
    secret = "my-very-private-sentence"
    llm = FakeLLM(classifier_reply("none"), responder_reply(say="reply-text-should-not-be-logged"))
    with caplog.at_level(logging.DEBUG):
        make_client(llm).post("/turn", json={"message": secret})
        make_client(FakeLLM()).post("/turn", json={"message": "I want to kill myself " + secret})
    logged = caplog.text
    assert secret not in logged and "reply-text-should-not-be-logged" not in logged
    assert "risk_assessed" in logged

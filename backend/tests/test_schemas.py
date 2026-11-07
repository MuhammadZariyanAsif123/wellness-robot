import pytest
from pydantic import ValidationError

from app.schemas import Segment, Turn


def seg(**kw: object) -> dict[str, object]:
    base: dict[str, object] = {"say": "Hello.", "expression": "warm", "gesture": "none"}
    base.update(kw)
    return base


def turn(**kw: object) -> dict[str, object]:
    base: dict[str, object] = {"risk": "none", "mode": "normal", "segments": [seg()]}
    base.update(kw)
    return base


def test_valid_turn() -> None:
    assert Turn.model_validate(turn()).mode == "normal"


@pytest.mark.parametrize("bad", [{"gesture": "backflip"}, {"expression": "angry"}])
def test_unknown_enum_rejected(bad: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        Segment.model_validate(seg(**bad))


def test_count_required_for_count_gesture() -> None:
    with pytest.raises(ValidationError):
        Segment.model_validate(seg(gesture="count"))
    assert Segment.model_validate(seg(gesture="count", count=3)).count == 3


def test_count_rejected_for_other_gestures() -> None:
    with pytest.raises(ValidationError):
        Segment.model_validate(seg(gesture="wave", count=2))


def test_segment_bounds() -> None:
    with pytest.raises(ValidationError):
        Turn.model_validate(turn(segments=[]))
    with pytest.raises(ValidationError):
        Turn.model_validate(turn(segments=[seg()] * 6))


def test_unknown_exercise_rejected() -> None:
    with pytest.raises(ValidationError):
        Turn.model_validate(turn(exercise="meditation"))


def test_safe_mode_rejects_gesture_exercise_and_non_neutral() -> None:
    safe = {"risk": "high", "mode": "safe"}
    ok = turn(**safe, segments=[seg(expression="neutral")])
    assert Turn.model_validate(ok).mode == "safe"
    for bad in (
        turn(**safe, segments=[seg(expression="neutral", gesture="wave")]),
        turn(**safe, segments=[seg(expression="warm")]),
        turn(**safe, segments=[seg(expression="neutral")], exercise="box_breathing"),
    ):
        with pytest.raises(ValidationError):
            Turn.model_validate(bad)

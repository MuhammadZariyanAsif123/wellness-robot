import json
from typing import Any

from app.llm import LLMError


class FakeLLM:
    """Scripted stand-in for the model provider. Records every call."""

    def __init__(self, *replies: str | Exception) -> None:
        self._replies = list(replies)
        self.calls: list[dict[str, Any]] = []

    def complete_json(self, **kwargs: Any) -> str:
        self.calls.append(kwargs)
        reply = self._replies.pop(0) if self._replies else LLMError("no more replies")
        if isinstance(reply, Exception):
            raise reply
        return reply


def classifier_reply(level: str) -> str:
    return json.dumps({"level": level, "reason": "test"})


def responder_reply(say: str = "That sounds heavy.", gesture: str = "none", exercise: str | None = None,
                    count: int | None = None, expression: str = "soft") -> str:
    return json.dumps(
        {
            "segments": [{"say": say, "expression": expression, "gesture": gesture, "count": count}],
            "exercise": exercise,
        }
    )

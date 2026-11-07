"""Thin boundary around the model provider.

Everything else depends on the `LLM` protocol, so tests use a fake and the
risk and responder logic never imports the SDK. Only `GeminiLLM` does, and
it imports lazily so the app still starts (and fails safe) without the package.
"""

from typing import Any, Protocol


class LLMError(Exception):
    """Any provider failure: network, auth, timeout, refusal, empty output."""


class LLM(Protocol):
    def complete_json(
        self,
        *,
        model: str,
        system: str,
        user: str,
        schema: dict[str, Any],
        max_tokens: int,
    ) -> str:
        """Return the model's raw JSON text for `schema`. Raise LLMError on failure."""
        ...


class GeminiLLM:
    """Gemini via the `google-genai` SDK (Interactions API).

    UNVERIFIED against a live key: the `response_format` argument follows the
    REST docs. Any failure raises LLMError, so the app fails safe (classifier
    returns `elevated`, responder returns the neutral fallback).
    """

    def __init__(self, api_key: str) -> None:
        from google import genai  # lazy: optional at import time
        from google.genai import errors

        self._errors = errors
        self._client = genai.Client(api_key=api_key)

    def complete_json(
        self,
        *,
        model: str,
        system: str,
        user: str,
        schema: dict[str, Any],
        max_tokens: int,
    ) -> str:
        del max_tokens  # the Interactions API call below uses the model default
        try:
            interaction = self._client.interactions.create(
                model=model,
                system_instruction=system,
                input=user,
                timeout=20,
                response_format={"type": "text", "mime_type": "application/json", "schema": schema},
            )
            text = interaction.output_text
        except (self._errors.APIError, OSError, TypeError, ValueError) as exc:
            raise LLMError(type(exc).__name__) from exc
        if not text:
            raise LLMError("empty")
        return str(text)


def build_llm(api_key: str | None) -> LLM | None:
    """Return a real client, or None when no key or no SDK is available."""
    if not api_key:
        return None
    try:
        return GeminiLLM(api_key)
    except ImportError:
        return None

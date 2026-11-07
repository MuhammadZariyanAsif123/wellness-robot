"""Optional ElevenLabs text-to-speech. The key stays on the server.

Endpoint, header and body fields follow the ElevenLabs API reference
(POST /v1/text-to-speech/{voice_id}, header xi-api-key, body text/model_id).
"""

import httpx

ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech"

class TTSError(Exception):
    """Any upstream failure. The message never contains the text or the key."""


def synthesize(
    text: str,
    *,
    api_key: str,
    voice_id: str,
    model_id: str,
    client: httpx.Client,
) -> bytes:
    body: dict[str, str] = {"text": text}
    if model_id:
        body["model_id"] = model_id
    try:
        response = client.post(
            f"{ELEVENLABS_URL}/{voice_id}",
            headers={"xi-api-key": api_key, "Content-Type": "application/json"},
            json=body,
            timeout=20.0,
        )
    except httpx.HTTPError as exc:
        raise TTSError(type(exc).__name__) from exc
    if response.status_code != 200 or not response.content:
        raise TTSError(f"status_{response.status_code}")
    return response.content

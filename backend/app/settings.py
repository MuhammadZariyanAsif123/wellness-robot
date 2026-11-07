from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # One origin, or several separated by commas (exact match, never "*").
    frontend_origin: str = "http://localhost:3000"
    # Name of a header the hosting proxy overwrites with the real client IP (empty = use the socket address).
    client_ip_header: str = ""
    gemini_api_key: SecretStr | None = None
    # Model identifiers come from the environment only (see .env.example).
    # Empty means "not configured": the pipeline then fails safe, never open.
    responder_model: str = ""
    classifier_model: str = ""
    # Optional ElevenLabs voice. Without a key /tts answers 503 and the UI uses the browser voice.
    elevenlabs_api_key: SecretStr | None = None
    elevenlabs_voice_id: str = ""
    elevenlabs_model_id: str = ""  # empty = the API's default model
    tts_rate_limit: int = 30
    # In-memory rate limit for /turn: requests per window, per client address.
    turn_rate_limit: int = 20
    turn_rate_window_seconds: int = 60

    @property
    def frontend_origins(self) -> list[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

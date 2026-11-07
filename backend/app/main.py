import logging
import time

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.llm import LLM, build_llm
from app.ratelimit import RateLimiter
from app.schemas import Turn, TurnRequest, TTSRequest, TTSStatus
from app.settings import Settings, get_settings
from app.tts import TTSError, synthesize
from app.turn import handle_turn

log = logging.getLogger("wellness.api")


def create_app(
    settings: Settings | None = None,
    llm: LLM | None = None,
    http_client: httpx.Client | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    if llm is None:
        key = settings.gemini_api_key.get_secret_value() if settings.gemini_api_key else None
        llm = build_llm(key)
    limiter = RateLimiter(settings.turn_rate_limit, settings.turn_rate_window_seconds)
    tts_limiter = RateLimiter(settings.tts_rate_limit, settings.turn_rate_window_seconds)
    tts_key = settings.elevenlabs_api_key.get_secret_value() if settings.elevenlabs_api_key else ""
    tts_ready = bool(tts_key and settings.elevenlabs_voice_id)
    tts_http = http_client or httpx.Client()

    app = FastAPI(title="Wellness Robot API")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/turn", response_model=Turn)
    def turn(req: TurnRequest, request: Request) -> Turn:
        client = request.client.host if request.client else "unknown"
        if not limiter.allow(client):
            log.info("rate_limited")
            raise HTTPException(status_code=429, detail="Too many requests")
        started = time.perf_counter()
        # Only event names, timings and risk levels are logged, never message text.
        result = handle_turn(req, llm, settings.classifier_model, settings.responder_model)
        log.info("turn_done risk=%s ms=%d", result.risk.value, (time.perf_counter() - started) * 1000)
        return result

    @app.get("/tts/status", response_model=TTSStatus)
    def tts_status() -> TTSStatus:
        # Only whether ElevenLabs is configured; never any key or voice detail.
        return TTSStatus(elevenlabs=tts_ready)

    @app.post("/tts")
    def tts(req: TTSRequest, request: Request) -> Response:
        if not tts_ready:
            raise HTTPException(status_code=503, detail="Voice service unavailable")
        client = request.client.host if request.client else "unknown"
        if not tts_limiter.allow(client):
            log.info("tts_rate_limited")
            raise HTTPException(status_code=429, detail="Too many requests")
        started = time.perf_counter()
        try:
            audio = synthesize(
                req.text,
                api_key=tts_key,
                voice_id=settings.elevenlabs_voice_id,
                model_id=settings.elevenlabs_model_id,
                client=tts_http,
            )
        except TTSError as exc:
            log.info("tts_failed reason=%s", exc)
            raise HTTPException(status_code=502, detail="Voice service failed") from exc
        log.info("tts_done ms=%d", (time.perf_counter() - started) * 1000)
        return Response(content=audio, media_type="audio/mpeg")

    return app


app = create_app()

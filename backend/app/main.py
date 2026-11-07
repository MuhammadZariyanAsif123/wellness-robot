import logging
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from app.llm import LLM, build_llm
from app.ratelimit import RateLimiter
from app.schemas import Turn, TurnRequest
from app.settings import Settings, get_settings
from app.turn import handle_turn

log = logging.getLogger("wellness.api")


def create_app(settings: Settings | None = None, llm: LLM | None = None) -> FastAPI:
    settings = settings or get_settings()
    if llm is None:
        key = settings.gemini_api_key.get_secret_value() if settings.gemini_api_key else None
        llm = build_llm(key)
    limiter = RateLimiter(settings.turn_rate_limit, settings.turn_rate_window_seconds)

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

    return app


app = create_app()

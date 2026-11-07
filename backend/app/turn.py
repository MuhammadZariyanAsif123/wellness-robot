"""The /turn pipeline. Importable by the eval script without HTTP."""

import logging

from app import risk as risk_router
from app.llm import LLM
from app.responder import respond
from app.safe import safe_turn
from app.schemas import RiskLevel, Turn, TurnRequest

log = logging.getLogger("wellness.turn")


def handle_turn(req: TurnRequest, llm: LLM | None, classifier_model: str, responder_model: str) -> Turn:
    level = risk_router.assess(req.message, req.history, llm, classifier_model, req.safe_locked)
    log.info("risk_assessed level=%s", level.value)

    if level is RiskLevel.high:
        # Safe mode: fixed response from code. The responder is NOT called.
        log.info("responder_skipped")
        return safe_turn()

    return respond(req.message, req.history, level, llm, responder_model)

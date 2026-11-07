"""Safe-mode response, built entirely in code. The responder is never involved."""

from app.config.resources import RESOURCES
from app.schemas import Expression, Gesture, RiskLevel, Segment, Turn

# AUTHOR TO REWRITE in your own voice. This is the SPEC draft, not reviewed copy.
SAFE_MESSAGE = (
    "I'm really glad you told me. What you're describing sounds serious, and you "
    "deserve support from a real person right now. Please reach out to someone you "
    "trust, or contact local emergency services or one of the contacts below. "
    "I'm not able to help with this safely on my own."
)


def safe_turn() -> Turn:
    return Turn(
        risk=RiskLevel.high,
        mode="safe",
        segments=[Segment(say=SAFE_MESSAGE, expression=Expression.neutral, gesture=Gesture.none)],
        exercise=None,
        resources=list(RESOURCES),
    )

"""Request/response contracts. Pydantic is the source of truth.

Frontend types are generated from the OpenAPI schema; never hand-copy them.
Do not add, rename, or remove enum entries without the author's approval.
"""

from datetime import date
from enum import Enum
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RiskLevel(str, Enum):
    none = "none"
    elevated = "elevated"
    high = "high"


class Expression(str, Enum):
    neutral = "neutral"
    warm = "warm"
    soft = "soft"
    curious = "curious"
    happy = "happy"
    calm = "calm"


class Gesture(str, Enum):
    none = "none"
    wave = "wave"
    nod = "nod"
    hand_on_chest = "hand_on_chest"
    open_palms = "open_palms"
    count = "count"
    point_to_light = "point_to_light"
    thumbs_up = "thumbs_up"
    palm_out = "palm_out"
    clap = "clap"  # added with author approval: celebrating a finished step
    open_arms = "open_arms"  # added with author approval: welcome / fresh start


class ExerciseId(str, Enum):
    grounding_54321 = "grounding_54321"
    box_breathing = "box_breathing"
    thought_record = "thought_record"
    smallest_steps = "smallest_steps"
    winddown = "winddown"
    consistency_checkin = "consistency_checkin"  # added with author approval; session-only, nothing stored


class Segment(BaseModel):
    say: str = Field(min_length=1)
    expression: Expression
    gesture: Gesture
    count: Literal[1, 2, 3, 4, 5] | None = None

    @model_validator(mode="after")
    def count_matches_gesture(self) -> Self:
        if self.gesture is Gesture.count and self.count is None:
            raise ValueError("count is required when gesture is 'count'")
        if self.gesture is not Gesture.count and self.count is not None:
            raise ValueError("count is only allowed when gesture is 'count'")
        return self


class Resource(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    contact: str
    country: str
    verified_on: date = Field(alias="verifiedOn")


class Turn(BaseModel):
    risk: RiskLevel
    mode: Literal["normal", "safe"]
    segments: list[Segment] = Field(min_length=1, max_length=5)
    exercise: ExerciseId | None = None
    resources: list[Resource] = Field(default_factory=list)

    @model_validator(mode="after")
    def safe_mode_invariants(self) -> Self:
        if self.mode != "safe":
            return self
        if self.exercise is not None:
            raise ValueError("safe mode allows no exercise")
        for seg in self.segments:
            if seg.gesture is not Gesture.none or seg.expression is not Expression.neutral:
                raise ValueError("safe mode requires neutral expression and no gesture")
        return self

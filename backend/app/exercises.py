"""Exercise steps are scripted here. The model only picks an id and a framing line.

AUTHOR TO REVIEW: draft wording for each exercise.
"""

from app.schemas import ExerciseId, RiskLevel

EXERCISE_STEPS: dict[ExerciseId, tuple[str, ...]] = {
    ExerciseId.grounding_54321: (
        "Look around and name 5 things you can see.",
        "Notice 4 things you can feel, like your feet on the floor.",
        "Listen for 3 things you can hear.",
        "Find 2 things you can smell, or like the smell of.",
        "Name 1 thing you can taste, or take one slow sip of water.",
    ),
    ExerciseId.box_breathing: (
        "Breathe in slowly through your nose for 4 counts.",
        "Hold gently for 4 counts.",
        "Breathe out slowly for 4 counts.",
        "Rest for 4 counts, then repeat a few times at your own pace.",
    ),
    ExerciseId.thought_record: (
        "Write down the thought that is bothering you, in one sentence.",
        "Write what makes it feel true, and what might make it less than 100% true.",
        "Write a kinder or more balanced way to say it.",
    ),
    ExerciseId.smallest_steps: (
        "Name one thing you would like to move forward today.",
        "Break it into at most three tiny tasks, each under ten minutes.",
        "Choose just the first task and start with that one.",
    ),
    ExerciseId.winddown: (
        "Put screens away and dim the lights if you can.",
        "Jot down anything on your mind so it can wait until tomorrow.",
        "Relax your shoulders and jaw, then take five slow breaths.",
    ),
    ExerciseId.consistency_checkin: (
        "Name one small thing you did today, however small.",
        "Name one small thing you would like to repeat tomorrow.",
        "Pick a time for it, so it is easy to remember.",
    ),
}

# Elevated risk allows only these two.
ELEVATED_ALLOWED: frozenset[ExerciseId] = frozenset(
    {ExerciseId.grounding_54321, ExerciseId.box_breathing}
)


def steps_for(exercise: ExerciseId) -> list[str]:
    return list(EXERCISE_STEPS[exercise])


def is_allowed(exercise: ExerciseId, risk: RiskLevel) -> bool:
    if risk is RiskLevel.high:
        return False
    if risk is RiskLevel.elevated:
        return exercise in ELEVATED_ALLOWED
    return True

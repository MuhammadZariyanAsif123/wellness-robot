"""Forbidden-pattern check for the robot's own text.

AUTHOR TO REVIEW AND EXTEND: placeholder starter lists. The medication list is
deliberately incomplete; the dose/pill patterns are the broader net.
"""

import re

FORBIDDEN_PATTERNS: dict[str, tuple[str, ...]] = {
    "diagnosis": (
        r"\byou (have|are suffering from|suffer from|seem to have|probably have)\s+(a\s+)?"
        r"(clinical\s+)?(depress\w*|anxiety( disorder)?|bipolar|ptsd|adhd|ocd|burnout disorder)\b",
        r"\byou(?:'| a)?re (clinically )?(depressed|bipolar)\b",
        r"\bdiagnos(e|is|ed)\b",
    ),
    "medication": (
        r"\b(ibuprofen|paracetamol|acetaminophen|aspirin|xanax|valium|prozac|zoloft|"
        r"sertraline|fluoxetine|diazepam|lorazepam|melatonin|antidepressants?|"
        r"benzodiazepines?|sleeping pills?)\b",
        r"\b\d+\s?(mg|milligrams?|mcg)\b",
        r"\b(dose|dosage|prescription|prescribe)\b",
    ),
    "therapist_claim": (
        r"\bi(?:'m| am) (your|a) (therapist|doctor|psychologist|psychiatrist|counsel+or)\b",
        r"\bas your (therapist|doctor|counsel+or)\b",
    ),
    "outcome_promise": (
        r"\byou (will|'ll) (definitely |certainly )?(feel better|be (fine|okay|ok)|get (the|that) job|succeed)\b",
        r"\b(guarantee|i promise)\b",
        r"\beverything will be (fine|okay|ok|alright)\b",
    ),
}
_COMPILED = {
    kind: tuple(re.compile(p, re.IGNORECASE) for p in patterns)
    for kind, patterns in FORBIDDEN_PATTERNS.items()
}


def violations(text: str) -> list[str]:
    """Return the kinds of forbidden content found in `text` (empty means clean)."""
    return [kind for kind, patterns in _COMPILED.items() if any(p.search(text) for p in patterns)]

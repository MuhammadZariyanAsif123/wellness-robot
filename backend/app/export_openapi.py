"""Export the API contract models as an OpenAPI 3.1 document.

Slice 1 only needs the shared models (no endpoint exists yet). Slice 3 will
switch the frontend to FastAPI's live /openapi.json; this script keeps types
generated from Pydantic in the meantime, never hand-copied.

Usage (from backend/): python -m app.export_openapi ../frontend/openapi.json
"""

import json
import sys
from pathlib import Path

from pydantic.json_schema import models_json_schema

from app.schemas import Resource, Segment, Turn


def build_document() -> dict[str, object]:
    _, defs = models_json_schema(
        [(Segment, "serialization"), (Resource, "serialization"), (Turn, "serialization")],
        ref_template="#/components/schemas/{model}",
    )
    return {
        "openapi": "3.1.0",
        "info": {"title": "Wellness Robot contracts", "version": "0.1.0"},
        "paths": {},
        "components": {"schemas": defs.get("$defs", {})},
    }


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: python -m app.export_openapi <output.json>")
    out = Path(sys.argv[1])
    out.write_text(json.dumps(build_document(), indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

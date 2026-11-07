"""Export the API contract models as an OpenAPI 3.1 document.

Exports FastAPI's own OpenAPI document (including POST /turn) so frontend
types are generated from Pydantic, never hand-copied. Settings are built with
no env file, so no secrets are read.

Usage (from backend/): python -m app.export_openapi ../frontend/openapi.json
"""

import json
import sys
from pathlib import Path

from app.main import create_app
from app.settings import Settings


def build_document() -> dict[str, object]:
    return create_app(Settings(_env_file=None)).openapi()


def main() -> None:
    if len(sys.argv) != 2:
        raise SystemExit("usage: python -m app.export_openapi <output.json>")
    out = Path(sys.argv[1])
    out.write_text(json.dumps(build_document(), indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

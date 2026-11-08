# Wellness companion

A browser app with an animated 3D robot you can talk to when you feel stressed or stuck. It listens, helps you find one small next step, and can guide a short breathing or grounding exercise.

> **A wellness companion, not a therapist or a medical service.** It does not diagnose, advise on medication, or promise outcomes. This is a portfolio proof of concept, not a validated clinical tool.

## What makes it different
- **Safety lives in code, not just in a prompt.** Every message goes through a risk router first. When risk is high, the app enters safe mode: a neutral face, no gestures or exercises, a fixed reviewed message, and support resources. The reply model is not called at all.
- **If the risk classifier fails or returns invalid output, the message is treated as elevated**, never as safe.
- **Text in a user message can never lower the risk level** or change the rules.
- **The robot only does what the schema allows.** Gestures, expressions and exercises come from fixed enums in `backend/app/schemas.py`; exercise steps are scripted, not improvised by the model.
- **Privacy:** no database, cookies or analytics. Messages and replies are not stored or logged. The browser keeps only a voice preference and, if you opt in, one next-step text with its date (deleted after 14 days or on request). Messages are processed by the model provider to produce a reply.

## Stack
- `frontend/`: Next.js, TypeScript (strict), React Three Fiber (robot, gestures, voice, transcript).
- `backend/`: FastAPI, Pydantic v2 (risk router, responder, exercises, `/turn`, `/tts`), Gemini for the model calls.
- `evals/`: sample messages for evaluation (`evals/heldout/` is git-ignored and reserved for the final run).

## Run locally
Backend (from `backend/`, with a virtual environment active):
```
pip install -r requirements.txt
cp .env.example .env   # then fill in the values; never commit .env
uvicorn app.main:app --reload
pytest
```
Frontend (from `frontend/`):
```
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL, e.g. http://localhost:8000
npm install
npm run dev
npm test
```

## Regenerating the API types
The frontend types come from the backend schema, never hand-copied. After changing `backend/app/schemas.py`, from `backend/` run `python -m app.export_openapi ../frontend/openapi.json` to refresh `frontend/openapi.json`, then from `frontend/` run `npm run gen:types`.

## Status and known gaps
- **Crisis resources are not filled in yet.** `backend/app/config/resources.py` must be completed from official sources before any public use; until then safe mode shows a generic line and a developer warning.
- **Evaluation is incomplete.** The scored evaluation run and the held-out set are still to do, so no accuracy figures are claimed.
- English only for now.

## Deploying
See [DEPLOY.md](DEPLOY.md) (Vercel for the frontend, Render for the backend).

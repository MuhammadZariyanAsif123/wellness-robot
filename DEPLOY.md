# Deploying the POC (two Vercel projects)

This is a proof of concept. Both halves run on Vercel's free Hobby plan, which needs no card but is for non-commercial personal use only; check Vercel's current limits and terms first. Nothing here is deployed for you: you create the accounts and enter the secrets.

## 0. Before you publish
- [ ] Fill `backend/app/config/resources.py` from official sources (safe mode shows a developer warning until then).
- [ ] Set the real public URL in `frontend/src/lib/site.ts` (`SITE_URL`).
- [ ] Set a spend or quota limit for your Gemini key (and ElevenLabs, if used). A public link means real API cost.
- [ ] Decide whether the evals (slice 5) should run first.

## 1. Backend (Vercel project 1)
1. In Vercel: **Add New > Project**, import the repo.
2. Set **Root Directory** to `backend`. Vercel detects FastAPI from `app/main.py` (the `app` instance) and installs `requirements.txt`. `backend/vercel.json` sets the function timeout to 60 s.
3. Add environment variables (never committed):
   - `GEMINI_API_KEY`, `RESPONDER_MODEL`, `CLASSIFIER_MODEL`: copy from your own `backend/.env`.
   - `FRONTEND_ORIGIN`: the frontend's Vercel URL, e.g. `https://your-app.vercel.app`. Several origins can be comma-separated. Exact-match, never `*`. (Deploy the frontend first, or redeploy the backend after you know the URL.)
   - `CLIENT_IP_HEADER` = `x-real-ip`. Vercel's docs say it overwrites this header with the client's public IP, so visitors cannot spoof it. Verify it with the checklist below.
   - Optional `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`. Without them the app uses the browser voice.
4. Deploy, then open `https://<backend-project>.vercel.app/health`: it should return `{"status":"ok"}`.

If the Python version is rejected or wrong, set it as Vercel's Python version docs describe (the code needs 3.11 or newer).

## 2. Frontend (Vercel project 2)
1. **Add New > Project**, import the same repo.
2. Set **Root Directory** to `frontend`.
3. Add `NEXT_PUBLIC_API_URL` = the backend URL (no trailing slash).
4. Deploy. Then put this URL into the backend's `FRONTEND_ORIGIN` and redeploy the backend.

If this becomes client or paid work, move to a plan or host that allows commercial use.

## 3. Checks after deploying
- [ ] `/health` works.
- [ ] A normal message gets a reply and the robot moves.
- [ ] Safe mode: send the safe-mode test phrase; the fixed message and resources appear and the model is not called.
- [ ] CORS: a request from your frontend origin works; from any other origin the browser blocks it.
- [ ] Rate limit: from two different networks, one visitor hitting the limit must not block the other. If everyone shares one limit, the header is not set as expected: check Vercel's current docs and adjust `CLIENT_IP_HEADER`.
- [ ] Cold start: the first request after idle can take a few seconds. The app retries once on a network error.

## 4. Things to know
- The backend runs as a serverless function. The in-memory rate limiter is per instance, so it is a soft limit, not a global one; the Gemini spending cap is the real cost guard.
- The code logs only event names, timings and risk levels, never message text. Vercel's request logs may still contain IP addresses and paths, so keep your privacy wording accurate.
- The `ELEVENLABS_*` and Gemini keys live only in the Vercel dashboard, never in the repo or in `NEXT_PUBLIC_*` variables.
- Not tested on Vercel from this machine: your first deploy is the real test.

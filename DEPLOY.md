# Deploying the POC (Vercel frontend, Render backend)

This is a proof of concept. The steps below use free tiers; check each provider's current limits and terms first. Nothing here is deployed for you: you create the accounts and enter the secrets.

## 0. Before you publish
- [ ] Fill `backend/app/config/resources.py` from official sources (safe mode shows a developer warning until then).
- [ ] Set the real public URL in `frontend/src/lib/site.ts` (`SITE_URL`).
- [ ] Set a spend or quota limit for your Gemini key (and ElevenLabs, if used). A public link means real API cost.
- [ ] Decide whether the evals (slice 5) should run first.

## 1. Backend on Render
1. Push the repo to GitHub.
2. In Render: **New > Blueprint**, pick the repo. It reads `render.yaml` (service `wellness-robot-api`, root `backend`, free plan).
3. Enter the values Render asks for (they are never committed):
   - `GEMINI_API_KEY`, `RESPONDER_MODEL`, `CLASSIFIER_MODEL`: copy from your own `backend/.env`.
   - `FRONTEND_ORIGIN`: your Vercel URL, e.g. `https://your-app.vercel.app`. Several origins can be separated by commas. It is exact-match, never `*`.
   - Optional `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`. Without them the app uses the browser voice.
4. `CLIENT_IP_HEADER` is preset to `cf-connecting-ip`. Render's docs say Cloudflare sets this on public web services and overwrites a caller-supplied value, so the rate limit can tell visitors apart. **Verify it on your service** (see the checklist), because this is not confirmed from this machine.
5. Open `https://<your-service>.onrender.com/health`: it should return `{"status":"ok"}`.

If `PYTHON_VERSION` (set to 3.12.8 in `render.yaml`) is rejected, change it to a version Render lists as supported (the code needs 3.11 or newer).

## 2. Frontend on Vercel
1. In Vercel: **Add New > Project**, import the repo.
2. Set **Root Directory** to `frontend`.
3. Add the environment variable `NEXT_PUBLIC_API_URL` = your Render URL (no trailing slash).
4. Deploy. Then put the Vercel URL into Render's `FRONTEND_ORIGIN` and redeploy the backend.

Vercel's free Hobby plan is for non-commercial personal use. If this becomes client or paid work, move to a plan or host that allows it.

## 3. Checks after deploying
- [ ] `/health` works.
- [ ] A normal message gets a reply and the robot moves.
- [ ] Safe mode: send the safe-mode test phrase; the fixed message and resources appear and the model is not called.
- [ ] CORS: a request from your Vercel origin works; from any other origin the browser blocks it.
- [ ] Rate limit: from two different networks, one visitor hitting the limit must not block the other. If everyone shares one limit, the header is not being set as expected: check Render's current docs and adjust `CLIENT_IP_HEADER`.
- [ ] Cold start: after about 15 minutes idle, the first request can take 30 to 60 seconds. The app retries once, but expect a slow first reply.

## 4. Things to know
- The free Render service sleeps when idle. It is fine for a demo, not for people who depend on it.
- The rate limiter is in memory and per instance; it resets on restart.
- The code logs only event names, timings and risk levels, never message text. The hosting provider's request logs may still contain IP addresses and paths, so keep your privacy wording accurate.
- The `ELEVENLABS_*` and Gemini keys live only in the hosting dashboards, never in the repo or in `NEXT_PUBLIC_*` variables.

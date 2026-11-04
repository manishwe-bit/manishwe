# Manish Kumar Kaiwarty — Portfolio

A portfolio that builds itself on screen, with an AI robot (MK-01), an AI website generator,
live cursors, a Showcase of build replays, Hindi/English, and an admin dashboard.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/manishkaiwarty00-dotcom/manish-portfolio)

| Part | Stack |
| --- | --- |
| `frontend/` | React 19, Vite, Tailwind CSS 4, GSAP |
| `backend/` | Python, FastAPI (also serves the built frontend) |
| AI | Claude API (MK-01 robot, website generator) |
| Database | MongoDB Atlas (optional) |

**One service, one URL.** The root `Dockerfile` builds the frontend and runs FastAPI, which serves the
website and every `/api/*` route together. No CORS or proxy setup needed.

## Deploy (one click)

1. Push this repo to GitHub.
2. Click **Deploy to Render** above (or Render → New → Blueprint → this repo). It reads `render.yaml`.
3. When Render asks for values, paste what you have (all optional, the site works without them):
   - `ANTHROPIC_API_KEY` — turns on MK-01 and the AI website generator ([console.anthropic.com](https://console.anthropic.com)).
   - `RESEND_API_KEY` — emails every enquiry to you ([resend.com](https://resend.com), sign up with `NOTIFY_EMAIL`).
   - `MONGODB_URI` — keeps enquiries after restarts (free MongoDB Atlas M0 cluster).
4. Wait for the build (~3–5 min). Your site is at `https://manish-kaiwarty.onrender.com` (Render may add a suffix).

After that, **every push to GitHub redeploys automatically.**

- **Admin dashboard:** `https://<your-site>/#/admin`. The password is `ADMIN_KEY` from Render → Environment.
- **Free plan sleep:** a free Render service sleeps after 15 min without visitors, and the next visit takes
  ~1 minute to wake it. To keep it awake, add a free monitor at [uptimerobot.com](https://uptimerobot.com) that
  opens `https://<your-site>/api/health` every 10 minutes.
- **Own domain (optional):** buy one (e.g. a `.in` from any registrar), then Render → your service → Settings →
  Custom Domains → add it and copy the DNS records Render shows into your registrar. HTTPS is automatic.

## Run locally

```bash
# Terminal 1: backend on http://localhost:8000
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: frontend on http://localhost:5173 (proxies /api to the backend)
cd frontend
npm install
npm run dev
```

Settings go in `backend/.env` (copy `backend/.env.example`), loaded with `uvicorn ... --env-file .env`.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | Status, database and email mode |
| POST | `/api/contact` | Enquiry form; saved and emailed. 5 per IP per 10 min |
| POST | `/api/chat` | MK-01 robot (Claude with site-control tools) |
| POST | `/api/generate` | AI website generator (structured output) |
| WS | `/api/live` | Live cursors |
| POST | `/api/hit` | Anonymous page-view counter (page name only) |
| GET | `/api/messages`, `/api/stats` | Admin, header `X-Admin-Key` |
| PATCH | `/api/messages/{id}` | Admin: set status `new` / `replied` / `done` |

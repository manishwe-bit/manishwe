# Manish Kumar Kaiwarty — Portfolio

Personal portfolio with a working contact form.

| Part | Stack | Hosted on |
| --- | --- | --- |
| `frontend/` | React 19, Vite, Tailwind CSS 4, GSAP | Netlify |
| `backend/` | Python, FastAPI | Render |
| Database | MongoDB | MongoDB Atlas (free M0) |

The browser only talks to the Netlify site. Netlify forwards `/api/*` to the Render backend (see `netlify.toml`), so no CORS setup is needed in production.

## Run locally

```bash
# Terminal 1: backend on http://localhost:8000
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Terminal 2: frontend on http://localhost:5173
cd frontend
npm install
npm run dev
```

Without `MONGODB_URI`, the backend keeps messages in memory (lost on restart). To use Atlas locally, copy `backend/.env.example` to `backend/.env`, fill it in, and start uvicorn with `--env-file .env`.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | `{"ok": true, "db": "mongodb"}` |
| POST | `/api/contact` | `{name, email, message}`. Limited to 5 per IP per 10 min. |
| GET | `/api/messages` | Needs header `X-Admin-Key: <ADMIN_KEY>`. Latest messages first. |

Read your messages:

```bash
curl -H "X-Admin-Key: YOUR_ADMIN_KEY" https://manishwe.netlify.app/api/messages
```

## Deploy

1. **MongoDB Atlas:** create a free M0 cluster, a database user, and allow access from `0.0.0.0/0` (Network Access). Copy the `mongodb+srv://…` connection string.
2. **Render:** New → Blueprint → pick this repo. It reads `render.yaml`. Paste the Atlas string as `MONGODB_URI`. `ADMIN_KEY` is generated for you (Environment tab).
3. **Netlify:** Add new site → Import from GitHub → pick this repo. It reads `netlify.toml`. Site name: `manishwe`.
4. Check the Render URL is exactly `https://manish-kaiwarty-api.onrender.com`. If Render added a suffix (name taken), put the real URL in `netlify.toml`, otherwise contact-form messages go to the wrong server. Same for the Netlify site name in `render.yaml` (`ALLOWED_ORIGINS`) and `frontend/index.html` (preview tags). Then push.

### Custom domain (later)

Netlify → Domain management → Add a domain, then add the DNS records Netlify shows at your registrar. Add the new domain to `ALLOWED_ORIGINS` on Render.

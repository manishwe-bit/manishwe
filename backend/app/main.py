"""Portfolio API: stores contact-form messages in MongoDB."""

import hmac
import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from .store import make_store

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
ADMIN_KEY = os.getenv("ADMIN_KEY", "")

# Per-IP limit for the public form: RATE_LIMIT submissions per RATE_WINDOW seconds.
RATE_LIMIT = 5
RATE_WINDOW = 600
_hits: dict[str, deque] = defaultdict(deque)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.store = await make_store(os.getenv("MONGODB_URI"), os.getenv("MONGODB_DB", "portfolio"))
    yield
    await app.state.store.close()


app = FastAPI(title="Manish Portfolio API", lifespan=lifespan, docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    message: str = Field(min_length=10, max_length=3000)
    # Honeypot: hidden in the form, so only bots fill it.
    website: str = Field(default="", max_length=200)


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")


def rate_limit(request: Request) -> str:
    ip = client_ip(request)
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= RATE_LIMIT:
        raise HTTPException(429, "Too many messages. Please try again later.")
    q.append(now)
    return ip


def require_admin(x_admin_key: str = Header(default="")) -> None:
    if not ADMIN_KEY or not hmac.compare_digest(x_admin_key, ADMIN_KEY):
        raise HTTPException(401, "Invalid admin key.")


@app.get("/api/health")
async def health():
    return {"ok": True, "db": app.state.store.kind}


@app.post("/api/contact", status_code=201)
async def contact(body: ContactIn, request: Request, ip: str = Depends(rate_limit)):
    if body.website:
        return {"ok": True}  # silently drop bot submissions
    await request.app.state.store.add_message(
        {
            "name": body.name.strip(),
            "email": str(body.email),
            "message": body.message.strip(),
            "ip": ip,
            "created_at": datetime.now(timezone.utc),
        }
    )
    return {"ok": True}


@app.get("/api/messages", dependencies=[Depends(require_admin)])
async def messages(request: Request, limit: int = 100):
    return await request.app.state.store.list_messages(min(max(limit, 1), 500))

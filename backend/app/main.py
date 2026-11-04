"""Portfolio API: contact form (MongoDB + email), the MK-01 AI robot and website generator (Claude),
live cursors (WebSocket), and the admin dashboard (enquiries + anonymous page-view stats)."""

import hmac
import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

from . import chat, generator, live
from .enquiries import save_enquiry
from .net import ALLOWED_ORIGIN_REGEX, ALLOWED_ORIGINS, client_ip
from .notify import email_configured
from .store import make_store

ADMIN_KEY = os.getenv("ADMIN_KEY", "")

# Per-IP limit for the public form: RATE_LIMIT submissions per RATE_WINDOW seconds.
RATE_LIMIT = 5
RATE_WINDOW = 600
_hits: dict[str, deque] = defaultdict(deque)
_views: dict[str, deque] = defaultdict(deque)  # page-view flood guard, per IP


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.store = await make_store(os.getenv("MONGODB_URI"), os.getenv("MONGODB_DB", "portfolio"))
    yield
    await app.state.store.close()


app = FastAPI(title="Manish Portfolio API", lifespan=lifespan, docs_url=None, redoc_url=None)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)
app.include_router(chat.router)
app.include_router(generator.router)
app.include_router(live.router)


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    message: str = Field(min_length=10, max_length=3000)
    # Optional project requirement details.
    phone: str = Field(default="", max_length=30)
    need: str = Field(default="", max_length=80)
    budget: str = Field(default="", max_length=40)
    timeline: str = Field(default="", max_length=40)
    # Honeypot: hidden in the form, so only bots fill it.
    website: str = Field(default="", max_length=200)


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
    return {"ok": True, "db": app.state.store.kind, "email": email_configured()}


@app.post("/api/contact", status_code=201)
async def contact(body: ContactIn, request: Request, tasks: BackgroundTasks, ip: str = Depends(rate_limit)):
    if body.website:
        return {"ok": True}  # silently drop bot submissions
    await save_enquiry(
        request.app.state.store, tasks, ip=ip, source="Contact form",
        name=body.name, email=str(body.email), message=body.message,
        phone=body.phone, need=body.need, budget=body.budget, timeline=body.timeline,
    )
    return {"ok": True}


@app.get("/api/messages", dependencies=[Depends(require_admin)])
async def messages(request: Request, limit: int = 100):
    return await request.app.state.store.list_messages(min(max(limit, 1), 500))


class StatusIn(BaseModel):
    status: Literal["new", "replied", "done"]


@app.patch("/api/messages/{msg_id}", dependencies=[Depends(require_admin)])
async def set_status(msg_id: str, body: StatusIn, request: Request):
    if not await request.app.state.store.set_status(msg_id, body.status):
        raise HTTPException(404, "Message not found.")
    return {"ok": True}


class HitIn(BaseModel):
    page: str = Field(max_length=20)


@app.post("/api/hit", status_code=204)
async def hit(body: HitIn, request: Request):
    """Anonymous page-view counter: only (day, page) is stored."""
    if body.page not in live.PAGES:
        return
    now = time.monotonic()
    q = _views[client_ip(request)]
    while q and now - q[0] > RATE_WINDOW:
        q.popleft()
    if len(q) >= 120:  # ignore floods instead of erroring: views are best-effort
        return
    q.append(now)
    await request.app.state.store.record_hit(datetime.now(timezone.utc).strftime("%Y-%m-%d"), body.page)


@app.get("/api/stats", dependencies=[Depends(require_admin)])
async def stats(request: Request):
    today = datetime.now(timezone.utc).date()
    days = [(today - timedelta(days=i)).isoformat() for i in range(13, -1, -1)]
    return {**await request.app.state.store.stats(days), "live": len(live.peers)}

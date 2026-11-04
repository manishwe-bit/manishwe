"""Live cursors: relays where every visitor is pointing to the others on the same page."""

import asyncio
import json
import random
import secrets
import time

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .net import client_ip, origin_allowed

router = APIRouter()

MAX_PEERS = 200
MAX_PER_IP = 4
MAX_MSGS_PER_SEC = 40
PAGES = {"home", "about", "services", "projects", "showcase", "skills", "contact"}
COLORS = ["#65e8ff", "#ff91c8", "#c6ff3d", "#f8b26a", "#a78bfa", "#9ef0a4", "#fca5a5", "#93c5fd"]
ANIMALS = ["Panda", "Tiger", "Falcon", "Otter", "Koala", "Fox", "Dolphin", "Owl", "Lynx", "Peacock", "Yak", "Gecko"]


class Peer:
    def __init__(self, ws: WebSocket, ip: str):
        self.ws = ws
        self.ip = ip
        self.id = secrets.token_hex(4)
        self.name = f"{random.choice(ANIMALS)} {random.randint(10, 99)}"
        self.color = random.choice(COLORS)
        self.place = ""
        self.page = "home"
        self.window_start = time.monotonic()
        self.window_count = 0

    def public(self) -> dict:
        return {"id": self.id, "name": self.name, "color": self.color, "place": self.place, "page": self.page}

    def allow(self) -> bool:
        now = time.monotonic()
        if now - self.window_start >= 1:
            self.window_start, self.window_count = now, 0
        self.window_count += 1
        return self.window_count <= MAX_MSGS_PER_SEC


peers: dict[str, Peer] = {}


async def broadcast(msg: dict, exclude: Peer | None = None, page: str | None = None) -> None:
    data = json.dumps(msg)
    targets = [p for p in peers.values() if p is not exclude and (page is None or p.page == page)]
    await asyncio.gather(*(p.ws.send_text(data) for p in targets), return_exceptions=True)


def frac(v) -> float | None:
    return round(float(v), 4) if isinstance(v, (int, float)) and -0.5 <= v <= 1.5 else None


@router.websocket("/api/live")
async def live(ws: WebSocket):
    ip = client_ip(ws)
    if not origin_allowed(ws.headers.get("origin"), ws.headers.get("host")) or len(peers) >= MAX_PEERS or sum(p.ip == ip for p in peers.values()) >= MAX_PER_IP:
        await ws.close(code=1008)
        return
    await ws.accept()
    me = Peer(ws, ip)

    try:
        hello = json.loads(await asyncio.wait_for(ws.receive_text(), timeout=10))
        if hello.get("page") in PAGES:
            me.page = hello["page"]
        me.place = str(hello.get("place", ""))[:24]
        await ws.send_text(json.dumps({"t": "welcome", "you": me.public(), "peers": [p.public() for p in peers.values()]}))
        peers[me.id] = me
        await broadcast({"t": "join", "peer": me.public()}, exclude=me)

        while True:
            raw = await ws.receive_text()
            if len(raw) > 200 or not me.allow():
                continue
            try:
                m = json.loads(raw)
            except ValueError:
                continue
            kind = m.get("t")
            if kind in ("mv", "ck"):
                fx, fy, s = frac(m.get("fx")), frac(m.get("fy")), m.get("s")
                if fx is None or fy is None or not isinstance(s, int) or not 0 <= s < 50:
                    continue
                await broadcast({"t": kind, "id": me.id, "s": s, "fx": fx, "fy": fy}, exclude=me, page=me.page)
            elif kind == "pg" and m.get("page") in PAGES:
                me.page = m["page"]
                await broadcast({"t": "pg", "peer": me.public()}, exclude=me)
    except (WebSocketDisconnect, asyncio.TimeoutError, ValueError):
        pass
    finally:
        if peers.pop(me.id, None):
            await broadcast({"t": "leave", "id": me.id})

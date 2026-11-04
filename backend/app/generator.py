"""AI Website Generator: Claude designs a one-page site for the visitor's business, as data the
frontend's Showcase player builds live (same shape as frontend/src/showcase/demos.js)."""

import json
import logging
import re
import time
from collections import defaultdict, deque

import anthropic
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from . import chat
from .net import client_ip

log = logging.getLogger("uvicorn.error")
router = APIRouter()

GEN_LIMIT = 3  # designs per IP per 10 minutes
_hits: dict[str, deque] = defaultdict(deque)

# Must match the ICONS map in frontend/src/components/showcase/MiniSite.jsx.
ICONS = [
    "Activity", "Aperture", "Baby", "Bath", "BedDouble", "Bike", "BookOpen", "Briefcase", "Cake", "Camera", "Car",
    "Coffee", "Croissant", "Dumbbell", "Flame", "Flower2", "Footprints", "Gem", "GraduationCap", "Hammer", "Heart",
    "HeartPulse", "House", "KeyRound", "Laptop", "Leaf", "Lock", "MapPin", "Mountain", "Music", "Palette", "PawPrint",
    "Pill", "Pizza", "Plane", "Scissors", "ShieldCheck", "Shirt", "Smartphone", "Sofa", "Sparkles", "Star",
    "Stethoscope", "Sun", "Timer", "Truck", "Users", "Utensils", "Wrench", "Zap",
]
GRID_LAYOUTS = ["menu", "schedule", "products", "pricing", "listings", "gallery"]
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


def _obj(props: dict) -> dict:
    return {"type": "object", "properties": props, "required": list(props), "additionalProperties": False}


S = {"type": "string"}
ART = {"icon": {"type": "string", "enum": ICONS}, "from": S, "to": S}
SCHEMA = _obj({
    "title": S,
    "kind": S,
    "blurb": S,
    "tags": {"type": "array", "items": S},
    "theme": _obj({
        "bg": S, "surface": S, "text": S, "muted": S, "accent": S, "onAccent": S,
        "radius": {"type": "string", "enum": ["0px", "2px", "10px", "14px", "999px"]},
        "font": {"type": "string", "enum": ["serif", "sans", "display"]},
    }),
    "nav": _obj({"brand": S, "links": {"type": "array", "items": S}, "cta": S}),
    "hero": _obj({
        "layout": {"type": "string", "enum": ["split", "center"]},
        "eyebrow": S, "title": S, "text": S, "cta": S, "art": _obj(ART),
    }),
    "features": _obj({"title": S, "items": {"type": "array", "items": _obj({"icon": ART["icon"], "title": S, "text": S})}}),
    "grid": _obj({
        "layout": {"type": "string", "enum": GRID_LAYOUTS},
        "title": S,
        "items": {"type": "array", "items": _obj({"name": S, "meta": S, "price": S, "highlight": {"type": "boolean"}, **ART})},
    }),
    "quote": _obj({"text": S, "author": S}),
    "footer": _obj({"text": S}),
})

SYSTEM = f"""You are a senior web designer. From a visitor's short description of their business, design a \
polished one-page website concept, returned as JSON.

Rules:
- Use the business name the visitor gives; if none, invent a fitting, memorable one.
- Write the site's copy in English (or Hinglish if the visitor wrote in Hindi/Hinglish), short and specific to
  their business and city. Prices in ₹ where prices make sense.
- Colours are 6-digit hex (#rrggbb). Pick a distinctive palette that suits the business; text must contrast
  clearly with bg, and onAccent with accent. font: serif (elegant), sans (modern), display (bold/sporty).
- nav.links: 3 short labels. features.items: exactly 3. grid.items: 4 to 6, fitting the chosen grid.layout:
  menu (food/drink items with price), schedule (classes/slots: price is a time like 07:30, meta is the host),
  products (shop items with price), pricing (3 plans: meta lists features separated by " · ", one highlight),
  listings (properties/rooms with price, meta like "2 bed · 1 bath"), gallery (portfolio pieces; price "").
- Every art/icon tile: pick the closest icon and two hex colours for a gradient.
- tags: 3 short tech/feature tags such as "React", "Booking form", "WhatsApp chat".
- quote: a believable customer testimonial with a first name.
"""


class GenIn(BaseModel):
    description: str = Field(min_length=8, max_length=600)


def gen_limit(request: Request) -> str:
    ip = client_ip(request)
    if not chat._within(_hits[ip], GEN_LIMIT, time.monotonic()):
        raise HTTPException(429, "You've designed a few sites already. Please wait a few minutes.")
    chat.count_daily()
    return ip


def _hex(value: str, fallback: str) -> str:
    return value if isinstance(value, str) and HEX.match(value) else fallback


def clean(d: dict) -> dict:
    """Clamp what the schema can't express (counts, hex colours) so the frontend always gets a valid demo."""
    t = d["theme"]
    for key, fallback in [("bg", "#ffffff"), ("surface", "#f3f4f6"), ("text", "#111827"), ("muted", "#6b7280"), ("accent", "#f04444"), ("onAccent", "#ffffff")]:
        t[key] = _hex(t.get(key), fallback)
    for art in [d["hero"]["art"], *d["grid"]["items"]]:
        art["from"] = _hex(art.get("from"), "#94a3b8")
        art["to"] = _hex(art.get("to"), t["accent"])
    d["nav"]["links"] = d["nav"]["links"][:4] or ["About", "Services", "Contact"]
    d["features"]["items"] = d["features"]["items"][:3]
    d["grid"]["items"] = d["grid"]["items"][:6]
    d["tags"] = d["tags"][:3]
    slug = re.sub(r"[^a-z0-9]+", "-", d["title"].lower()).strip("-")[:40] or "your-business"
    d["domain"] = f"{slug}.in"
    d["id"] = "custom"
    return d


@router.post("/api/generate")
async def generate(body: GenIn, ip: str = Depends(gen_limit)):
    if not chat.api_ready():
        raise HTTPException(503, "The AI designer isn't switched on yet. Please email Manish directly.")
    try:
        response = await chat.client().beta.messages.create(
            model=chat.MODEL,
            max_tokens=6000,
            system=SYSTEM,
            messages=[{"role": "user", "content": f"<business>{body.description.strip()}</business>"}],
            output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )
    except anthropic.RateLimitError:
        raise HTTPException(429, "The AI designer is busy. Please try again in a minute.")
    except anthropic.APIStatusError as e:
        log.error("Claude API error %s: %s", e.status_code, e.message)
        raise HTTPException(502, "The AI designer hit a glitch. Please try again.")
    except anthropic.APIConnectionError:
        raise HTTPException(502, "Couldn't reach the AI designer. Please try again.")

    if response.stop_reason in ("refusal", "max_tokens"):
        raise HTTPException(422, "I couldn't design that one. Try describing a different business.")
    text = next((b.text for b in response.content if b.type == "text"), "")
    try:
        return {"demo": clean(json.loads(text))}
    except (ValueError, KeyError, TypeError):
        log.exception("Generator returned unusable JSON")
        raise HTTPException(502, "The design came out garbled. Please try again.")

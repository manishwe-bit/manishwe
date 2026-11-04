"""MK-01, the AI robot: answers visitors' questions with Claude and can operate the site through tools."""

import logging
import os
import time
from collections import defaultdict, deque
from typing import Literal

import anthropic
from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from .enquiries import save_enquiry
from .net import client_ip
from .profile import SYSTEM_PROMPT

log = logging.getLogger("uvicorn.error")
router = APIRouter()

MODEL = os.getenv("CHAT_MODEL", "claude-opus-5-5")
# Per-IP: CHAT_LIMIT questions per CHAT_WINDOW seconds; plus a site-wide daily cap to bound the bill.
CHAT_LIMIT = 15
CHAT_WINDOW = 600
DAILY_CAP = int(os.getenv("CHAT_DAILY_CAP", "400"))
MAX_ROUNDS = 3  # model calls per question (a tool result may need one follow-up)
MAX_ENQUIRIES = 2  # per IP per window, on top of the question limit

PAGES = ["home", "about", "services", "projects", "showcase", "skills", "contact"]
DEMO_IDS = ["cafe", "gym", "shop", "saas", "realestate", "studio"]


def _tool(name: str, description: str, properties: dict) -> dict:
    return {
        "name": name,
        "description": description,
        "strict": True,
        "input_schema": {"type": "object", "properties": properties, "required": list(properties), "additionalProperties": False},
    }


TOOLS = [
    _tool("navigate", "Open a page of the portfolio in the visitor's browser.", {"page": {"type": "string", "enum": PAGES}}),
    _tool(
        "play_demo",
        "Open the Showcase page and play the build replay of one example website.",
        {"demo": {"type": "string", "enum": DEMO_IDS}},
    ),
    _tool(
        "set_view",
        "Switch a site view on or off: xray shows the source code under the cursor, blueprint shows a wireframe, hud shows live performance stats.",
        {"mode": {"type": "string", "enum": ["xray", "blueprint", "hud"]}, "on": {"type": "boolean"}},
    ),
    _tool(
        "design_site",
        "Open the AI Website Generator and design a demo website for the visitor's business, built live on screen.",
        {"description": {"type": "string", "description": "The visitor's business: type, name, city and anything they want"}},
    ),
    _tool(
        "submit_enquiry",
        "Email the visitor's project enquiry to Manish. Only after the visitor has confirmed the details.",
        {
            "name": {"type": "string", "description": "Visitor's name"},
            "email": {"type": "string", "description": "Visitor's email address"},
            "requirement": {"type": "string", "description": "What they need, in their words, with any useful details"},
            "phone": {"type": "string", "description": "Phone/WhatsApp, or empty string if not given"},
            "budget": {"type": "string", "description": "Budget, or empty string if not given"},
        },
    ),
]
CLIENT_TOOLS = {"navigate", "play_demo", "set_view", "design_site"}  # carried out by the browser

_hits: dict[str, deque] = defaultdict(deque)
_enquiries: dict[str, deque] = defaultdict(deque)
_day = {"date": "", "count": 0}
_client: anthropic.AsyncAnthropic | None = None


class Turn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class ChatIn(BaseModel):
    messages: list[Turn] = Field(min_length=1, max_length=16)


def client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(timeout=30.0)
    return _client


def _within(q: deque, limit: int, now: float) -> bool:
    while q and now - q[0] > CHAT_WINDOW:
        q.popleft()
    if len(q) >= limit:
        return False
    q.append(now)
    return True


def api_ready() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY"))


def count_daily() -> None:
    """Site-wide daily cap shared by the robot and the website generator."""
    today = time.strftime("%Y-%m-%d")
    if _day["date"] != today:
        _day.update(date=today, count=0)
    if _day["count"] >= DAILY_CAP:
        raise HTTPException(503, "The AI has done a lot today. Please email Manish directly.")
    _day["count"] += 1


def chat_limit(request: Request) -> str:
    ip = client_ip(request)
    if not _within(_hits[ip], CHAT_LIMIT, time.monotonic()):
        raise HTTPException(429, "Too many questions. Please wait a few minutes.")
    count_daily()
    return ip


async def _submit(args: dict, request: Request, tasks: BackgroundTasks, ip: str) -> tuple[str, bool]:
    """Run submit_enquiry. Returns (tool result text, is_error)."""
    name, req = args.get("name", "").strip(), args.get("requirement", "").strip()
    if len(name) < 2 or len(req) < 5:
        return "Missing details: a name and a short description of the requirement are needed.", True
    try:
        email = validate_email(args.get("email", ""), check_deliverability=False).normalized
    except EmailNotValidError:
        return "That email address isn't valid. Ask the visitor to check it.", True
    if not _within(_enquiries[ip], MAX_ENQUIRIES, time.monotonic()):
        return "Too many enquiries from this visitor recently; ask them to use the Contact page.", True
    await save_enquiry(
        request.app.state.store, tasks, ip=ip, source="MK-01 AI chat",
        name=name[:80], email=email, message=req[:3000],
        phone=args.get("phone", "")[:30], budget=args.get("budget", "")[:40], need="Via AI chat",
    )
    return "Sent. Manish has the enquiry in his inbox and will reply by email.", False


@router.post("/api/chat")
async def chat(body: ChatIn, request: Request, tasks: BackgroundTasks, ip: str = Depends(chat_limit)):
    if not api_ready():
        raise HTTPException(503, "MK-01 isn't switched on yet. Please email Manish directly.")
    messages: list = [t.model_dump() for t in body.messages]
    if messages[0]["role"] != "user" or messages[-1]["role"] != "user":
        raise HTTPException(422, "The conversation must start and end with a visitor message.")

    texts: list[str] = []
    actions: list[dict] = []
    sent = False
    try:
        for _ in range(MAX_ROUNDS):
            response = await client().beta.messages.create(
                model=MODEL,
                max_tokens=2000,  # replies are a few sentences; this only caps runaway cost
                system=SYSTEM_PROMPT,
                messages=messages,
                tools=TOOLS,
                output_config={"effort": "low"},  # short Q&A doesn't need deep reasoning
                # If a safety classifier declines, retry on a suitable model instead of failing.
                betas=["server-side-fallback-2026-07-01"],
                fallbacks="default",
            )
            if response.stop_reason == "refusal":
                return {"reply": "I can't help with that one. Ask me about Manish's work, skills, or getting a website built!", "actions": actions}

            texts += [b.text.strip() for b in response.content if b.type == "text" and b.text.strip()]
            calls = [b for b in response.content if b.type == "tool_use"]
            if not calls:
                break

            results, needs_followup = [], False
            for call in calls:
                if call.name in CLIENT_TOOLS:
                    actions.append({"type": call.name, **call.input})
                    results.append({"type": "tool_result", "tool_use_id": call.id, "content": "Done in the visitor's browser."})
                elif call.name == "submit_enquiry":
                    content, is_error = await _submit(call.input, request, tasks, ip)
                    sent = sent or not is_error
                    needs_followup = True  # let the robot tell the visitor how it went
                    results.append({"type": "tool_result", "tool_use_id": call.id, "content": content, "is_error": is_error})
            # Browser actions need no answer back unless the model hasn't said anything yet.
            if not needs_followup and texts:
                break
            messages += [{"role": "assistant", "content": response.content}, {"role": "user", "content": results}]
    except anthropic.RateLimitError:
        raise HTTPException(429, "MK-01 is busy right now. Please try again in a minute.")
    except anthropic.APIStatusError as e:
        log.error("Claude API error %s: %s", e.status_code, e.message)
        raise HTTPException(502, "MK-01 hit a glitch. Please try again shortly.")
    except anthropic.APIConnectionError:
        raise HTTPException(502, "Couldn't reach MK-01's brain. Please try again shortly.")

    if sent:
        actions.append({"type": "enquiry_sent"})
    reply = "\n\n".join(texts) or ("Done!" if actions else "Sorry, I didn't catch that. Could you ask again?")
    return {"reply": reply, "actions": actions}

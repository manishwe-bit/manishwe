import os
import re

from starlette.requests import HTTPConnection

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
# The Render static site's URL (Render may add a suffix if the name is taken).
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX", r"https://manish-kaiwarty-portfolio[a-z0-9-]*\.onrender\.com")


def origin_allowed(origin: str | None) -> bool:
    return bool(origin) and (origin in ALLOWED_ORIGINS or bool(re.fullmatch(ALLOWED_ORIGIN_REGEX, origin)))


def client_ip(conn: HTTPConnection) -> str:
    """Visitor IP behind Render's proxy. Works for HTTP requests and WebSockets."""
    fwd = conn.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (conn.client.host if conn.client else "unknown")

import os
import re

from starlette.requests import HTTPConnection

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
# Sites allowed to call this API from another host: the Netlify copy of the frontend (and its deploy previews).
# The site served by this same service is always allowed (see origin_allowed).
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX", r"https://([a-z0-9-]+--)?manishwe\.netlify\.app")


def origin_allowed(origin: str | None, host: str | None = None) -> bool:
    """host: the server's own Host header. A page served by this same service is always allowed."""
    if not origin:
        return False
    if host and origin in (f"https://{host}", f"http://{host}"):
        return True
    return origin in ALLOWED_ORIGINS or bool(re.fullmatch(ALLOWED_ORIGIN_REGEX, origin))


def client_ip(conn: HTTPConnection) -> str:
    """Visitor IP behind Render's proxy. Works for HTTP requests and WebSockets."""
    fwd = conn.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (conn.client.host if conn.client else "unknown")

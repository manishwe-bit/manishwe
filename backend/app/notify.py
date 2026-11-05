"""Emails Manish whenever a visitor sends the contact / requirement form.

Two ways to send, picked by which settings exist:
- Resend (recommended, works on Render's free plan): RESEND_API_KEY.
  Without your own domain, Resend only delivers to the email you signed up with, so sign up with NOTIFY_EMAIL.
- Gmail SMTP: SMTP_USER + SMTP_PASSWORD (a Google "app password"). Free Render instances may block SMTP ports.
"""

import asyncio
import html
import json
import logging
import os
import smtplib
import urllib.request
from email.message import EmailMessage

log = logging.getLogger("uvicorn.error")

NOTIFY_EMAIL = os.getenv("NOTIFY_EMAIL", "manishkaiwarty00@gmail.com")
MAIL_FROM = os.getenv("MAIL_FROM", "Portfolio <onboarding@resend.dev>")


def _send_resend(key: str, subject: str, text: str, body_html: str, reply_to: str) -> None:
    payload = {"from": MAIL_FROM, "to": [NOTIFY_EMAIL], "subject": subject, "text": text, "html": body_html, "reply_to": reply_to}
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "User-Agent": "manish-portfolio-api"},
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        r.read()


def _send_smtp(user: str, password: str, subject: str, text: str, body_html: str, reply_to: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = NOTIFY_EMAIL
    msg["Reply-To"] = reply_to
    msg.set_content(text)
    msg.add_alternative(body_html, subtype="html")
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    with smtplib.SMTP_SSL(host, int(os.getenv("SMTP_PORT", "465")), timeout=15) as s:
        s.login(user, password)
        s.send_message(msg)


def email_configured() -> str:
    if os.getenv("RESEND_API_KEY"):
        return "resend"
    if os.getenv("SMTP_USER") and os.getenv("SMTP_PASSWORD"):
        return "smtp"
    return "off"


def render(fields: dict) -> tuple[str, str, str]:
    """Subject, plain-text and HTML bodies for a submission. Empty fields are left out."""
    rows = [(k, v) for k, v in fields.items() if v]
    subject = f"New enquiry from {fields['Name']}" + (f" · {fields['Need']}" if fields.get("Need") else "")
    subject = " ".join(subject.split())  # no newlines in a mail header
    text = "\n".join(f"{k}: {v}" for k, v in rows) + "\n\nReply to this email to answer them directly."
    cells = "".join(
        f'<tr><td style="padding:8px 14px 8px 0;color:#6b7280;vertical-align:top;white-space:nowrap">{html.escape(k)}</td>'
        f'<td style="padding:8px 0;color:#111827;white-space:pre-wrap">{html.escape(v)}</td></tr>'
        for k, v in rows
    )
    body_html = (
        '<div style="font-family:Inter,Arial,sans-serif;max-width:600px">'
        '<h2 style="margin:0 0 4px;color:#f04444">New enquiry from your portfolio</h2>'
        '<p style="margin:0 0 18px;color:#6b7280">Hit reply to answer them directly.</p>'
        f'<table style="border-collapse:collapse;font-size:15px">{cells}</table></div>'
    )
    return subject, text, body_html


async def notify_submission(fields: dict, reply_to: str) -> None:
    """Send the email in a worker thread; failures are logged, never shown to the visitor."""
    subject, text, body_html = render(fields)
    try:
        if key := os.getenv("RESEND_API_KEY"):
            await asyncio.to_thread(_send_resend, key, subject, text, body_html, reply_to)
        elif (user := os.getenv("SMTP_USER")) and (pw := os.getenv("SMTP_PASSWORD")):
            await asyncio.to_thread(_send_smtp, user, pw, subject, text, body_html, reply_to)
        else:
            log.warning("No email settings (RESEND_API_KEY or SMTP_USER/SMTP_PASSWORD): enquiry saved but not emailed.")
            return
        log.info("Enquiry emailed to %s", NOTIFY_EMAIL)
    except Exception:
        log.exception("Emailing the enquiry failed (it is still saved in the database).")

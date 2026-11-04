"""Visitor enquiries (contact form or the AI robot): saved to the database, then emailed to Manish."""

from datetime import datetime, timezone

from fastapi import BackgroundTasks

from .notify import notify_submission


async def save_enquiry(store, tasks: BackgroundTasks, *, ip: str, source: str, name: str, email: str, message: str,
                       phone: str = "", need: str = "", budget: str = "", timeline: str = "") -> None:
    doc = {
        "name": name.strip(),
        "email": email.strip(),
        "message": message.strip(),
        "phone": phone.strip(),
        "need": need.strip(),
        "budget": budget.strip(),
        "timeline": timeline.strip(),
        "source": source,
        "ip": ip,
        "created_at": datetime.now(timezone.utc),
    }
    await store.add_message(doc)
    # Emailed after the response is sent, so the visitor never waits on (or sees) mail problems.
    tasks.add_task(
        notify_submission,
        {
            "Name": doc["name"],
            "Email": doc["email"],
            "Phone / WhatsApp": doc["phone"],
            "Need": doc["need"],
            "Budget": doc["budget"],
            "Timeline": doc["timeline"],
            "Message": doc["message"],
            "Sent via": source,
            "Received": doc["created_at"].strftime("%d %b %Y, %H:%M UTC"),
        },
        reply_to=doc["email"],
    )

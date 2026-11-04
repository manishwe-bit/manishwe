"""Storage: MongoDB when MONGODB_URI is set, otherwise in-memory (local dev only).

messages: visitor enquiries (contact form and MK-01), each with a status for the admin dashboard.
hits: anonymous page-view counters, one document per (day, page). No IPs or visitor data.
"""

import logging
from collections import defaultdict

log = logging.getLogger("uvicorn.error")

STATUSES = ("new", "replied", "done")


def _public(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", ""))
    doc["created_at"] = doc["created_at"].isoformat()
    doc.setdefault("status", "new")
    return doc


def _stats(rows: list[tuple[str, str, int]], days: list[str]) -> dict:
    """rows: (day, page, count) -> per-day totals for `days` and page totals over the same window."""
    per_day = defaultdict(int)
    per_page = defaultdict(int)
    for day, page, count in rows:
        per_day[day] += count
        per_page[page] += count
    return {
        "days": [{"day": d, "views": per_day.get(d, 0)} for d in days],
        "pages": sorted(({"page": p, "views": v} for p, v in per_page.items()), key=lambda x: -x["views"]),
    }


class MongoStore:
    kind = "mongodb"

    def __init__(self, client, db_name: str):
        self.client = client
        self.col = client[db_name]["messages"]
        self.hits = client[db_name]["hits"]

    async def add_message(self, doc: dict) -> None:
        await self.col.insert_one({**doc, "status": "new"})

    async def list_messages(self, limit: int) -> list[dict]:
        cursor = self.col.find({}, {"ip": 0}).sort("created_at", -1).limit(limit)
        return [_public(d) async for d in cursor]

    async def set_status(self, msg_id: str, status: str) -> bool:
        from bson import ObjectId
        from bson.errors import InvalidId

        try:
            oid = ObjectId(msg_id)
        except InvalidId:
            return False
        res = await self.col.update_one({"_id": oid}, {"$set": {"status": status}})
        return res.matched_count == 1

    async def record_hit(self, day: str, page: str) -> None:
        await self.hits.update_one({"day": day, "page": page}, {"$inc": {"count": 1}}, upsert=True)

    async def stats(self, days: list[str]) -> dict:
        rows = [(d["day"], d["page"], d["count"]) async for d in self.hits.find({"day": {"$in": days}})]
        return _stats(rows, days)

    async def close(self) -> None:
        await self.client.close()


class MemoryStore:
    kind = "memory"

    def __init__(self):
        self.items: list[dict] = []
        self.hits: dict[tuple[str, str], int] = defaultdict(int)

    async def add_message(self, doc: dict) -> None:
        self.items.append({**doc, "status": "new", "_id": len(self.items) + 1})

    async def list_messages(self, limit: int) -> list[dict]:
        return [_public({k: v for k, v in d.items() if k != "ip"}) for d in reversed(self.items[-limit:])]

    async def set_status(self, msg_id: str, status: str) -> bool:
        for d in self.items:
            if str(d["_id"]) == msg_id:
                d["status"] = status
                return True
        return False

    async def record_hit(self, day: str, page: str) -> None:
        self.hits[(day, page)] += 1

    async def stats(self, days: list[str]) -> dict:
        return _stats([(d, p, c) for (d, p), c in self.hits.items() if d in days], days)

    async def close(self) -> None:
        pass


async def make_store(uri: str | None, db_name: str):
    if not uri:
        log.warning("MONGODB_URI not set: messages are kept in memory and lost on restart.")
        return MemoryStore()
    from pymongo import AsyncMongoClient

    client = AsyncMongoClient(uri, serverSelectionTimeoutMS=8000)
    store = MongoStore(client, db_name)
    await store.col.create_index("created_at")
    await store.hits.create_index([("day", 1), ("page", 1)], unique=True)
    return store

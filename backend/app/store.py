"""Message storage: MongoDB when MONGODB_URI is set, otherwise in-memory (local dev only)."""

import logging

log = logging.getLogger("uvicorn.error")


def _public(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", ""))
    doc["created_at"] = doc["created_at"].isoformat()
    return doc


class MongoStore:
    kind = "mongodb"

    def __init__(self, client, db_name: str):
        self.client = client
        self.col = client[db_name]["messages"]

    async def add_message(self, doc: dict) -> None:
        await self.col.insert_one(doc)

    async def list_messages(self, limit: int) -> list[dict]:
        cursor = self.col.find({}, {"ip": 0}).sort("created_at", -1).limit(limit)
        return [_public(d) async for d in cursor]

    async def close(self) -> None:
        await self.client.close()


class MemoryStore:
    kind = "memory"

    def __init__(self):
        self.items: list[dict] = []

    async def add_message(self, doc: dict) -> None:
        self.items.append({**doc, "_id": len(self.items) + 1})

    async def list_messages(self, limit: int) -> list[dict]:
        return [_public({k: v for k, v in d.items() if k != "ip"}) for d in reversed(self.items[-limit:])]

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
    return store

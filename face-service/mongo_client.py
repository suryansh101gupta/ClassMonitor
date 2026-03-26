import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "ClassMonitor")
COLLECTION_NAME = "users"

if not MONGO_URI:
    raise RuntimeError("❌ MONGO_URI not found in .env")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_collection = db[COLLECTION_NAME]


def watch_user_photo_updates():
    """
    Listens only for updates on the users collection.
    Reacts only when photoUrl or photoVersion (or s3key) changes.
    Uses full_document="updateLookup" so we get the full document after update.
    Yields full documents that match photo-related updates.
    Dedupe/processing state is handled by the caller (listener), so failures can be retried.
    """
    pipeline = [
        {
            "$match": {
                "operationType": "update"
            }
        }
    ]

    print("👀 Listening to MongoDB change stream on users collection (updates only)...")

    with users_collection.watch(pipeline, full_document="updateLookup") as stream:
        for change in stream:
            full_doc = change.get("fullDocument")
            if not full_doc:
                continue

            # React only when photoUrl or photoVersion (or s3key) was in the update
            updated_fields = (change.get("updateDescription") or {}).get("updatedFields") or {}
            if not any(k in updated_fields for k in ("photoUrl", "photoVersion", "s3key")):
                continue

            if full_doc.get("photoUploaded") is not True:
                continue

            # Need either photoUrl or s3key to get S3 key
            if not full_doc.get("photoUrl") and not full_doc.get("s3key"):
                continue

            yield full_doc

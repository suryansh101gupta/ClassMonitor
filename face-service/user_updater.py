"""
user_updater.py

MongoDB update utilities that record face-processing results for a user.

Responsibilities:
- Update users collection after face processing:
  - faceEncoding (128-D vector)
  - faceProcessed (bool)
  - faceProcessedAt (UTC datetime)
- Failure handling:
  - faceProcessed = false
  - faceProcessingError = <error message>

Rules:
- No ML in this file
- No image downloading here
- Accept userId and photoVersion; only update if photoVersion still matches
- Use defensive updates to avoid race conditions
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Iterable, Optional
import logging

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGO_DB_NAME", "ClassMonitor")
COLLECTION_NAME = "users"

if not MONGO_URI:
    raise RuntimeError("❌ MONGO_URI not found in .env")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_collection = db[COLLECTION_NAME]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_user_id(user_id: str) -> ObjectId:
    try:
        return ObjectId(str(user_id))
    except Exception as e:
        raise ValueError(f"Invalid userId: {user_id}") from e


def _validate_encoding(encoding: Iterable[float]) -> list[float]:
    vec = [float(x) for x in encoding]
    if len(vec) != 128:
        raise ValueError(f"faceEncoding must be 128-D, got {len(vec)} values")
    return vec


def mark_face_processed(
    user_id: str,
    photo_version: int,
    face_encoding: Iterable[float],
) -> bool:
    """
    Persist a successful face encoding result for a user.

    Updates apply only if the user's current photoVersion matches `photo_version`
    (defensive against race conditions / re-uploads).

    Returns:
        True if the document was updated; False if no match (stale photoVersion or missing user).
    """
    logger.debug("mark_face_processed called (user_id=%s, photo_version=%s)", user_id, photo_version)
    oid = _normalize_user_id(user_id)
    encoding_list = _validate_encoding(face_encoding)

    update = {
        "$set": {
            "faceEncoding": encoding_list,
            "faceProcessed": True,
            "faceProcessedAt": _utc_now(),
            # Keep error field clean on success
            "faceProcessingError": "",
        }
    }

    filter_doc = {"_id": oid, "photoVersion": int(photo_version)}
    logger.debug("Mongo update filter=%s set_fields=%s", {"_id": str(oid), "photoVersion": int(photo_version)}, list(update["$set"].keys()))

    res = users_collection.update_one(
        filter_doc,
        update,
    )
    logger.debug("Mongo update result matched=%d modified=%d", res.matched_count, res.modified_count)
    return res.modified_count == 1


def mark_face_processing_failed(
    user_id: str,
    photo_version: int,
    error_message: str,
) -> bool:
    """
    Persist a failure result for face processing.

    Updates apply only if the user's current photoVersion matches `photo_version`.

    Returns:
        True if the document was updated; False if no match (stale photoVersion or missing user).
    """
    logger.debug("mark_face_processing_failed called (user_id=%s, photo_version=%s)", user_id, photo_version)
    oid = _normalize_user_id(user_id)
    msg = (error_message or "Face processing failed").strip()

    update = {
        "$set": {
            "faceProcessed": False,
            "faceProcessedAt": _utc_now(),
            "faceProcessingError": msg,
        }
    }

    filter_doc = {"_id": oid, "photoVersion": int(photo_version)}
    logger.debug("Mongo update filter=%s error_message_len=%d", {"_id": str(oid), "photoVersion": int(photo_version)}, len(msg))

    res = users_collection.update_one(
        filter_doc,
        update,
    )
    logger.debug("Mongo update result matched=%d modified=%d", res.matched_count, res.modified_count)
    return res.modified_count == 1


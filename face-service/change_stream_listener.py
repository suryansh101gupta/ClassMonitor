import os
import logging

from mongo_client import watch_user_photo_updates
from s3_client import extract_s3_key_from_url, download_image_to_folder
from face_encoder import encode_face, FaceEncodingError
from user_updater import mark_face_processed, mark_face_processing_failed


def get_extension_from_key(s3_key: str) -> str:
    """Get file extension from S3 key, default to .jpg."""
    if not s3_key:
        return "jpg"
    parts = s3_key.rsplit(".", 1)
    return parts[1].lower() if len(parts) == 2 and parts[1] else "jpg"


def main():
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )
    logger = logging.getLogger("change_stream_listener")

    logger.info("🚀 Face Service started (download → encode → update MongoDB)")
    downloads_dir = os.getenv("DOWNLOAD_DIR", "downloads")

    processed_versions: set[tuple[str, int]] = set()

    for full_doc in watch_user_photo_updates():
        user_id = str(full_doc["_id"])
        photo_version = full_doc.get("photoVersion", 0)
        photo_url = full_doc.get("photoUrl") or ""
        s3key = full_doc.get("s3key") or ""

        # Extract S3 key: from stored URL or use s3key field
        if photo_url:
            s3_key = extract_s3_key_from_url(photo_url)
        else:
            s3_key = s3key

        if not s3_key:
            logger.warning("No S3 key for user=%s photoVersion=%s — skipping", user_id, photo_version)
            continue

        logger.info("📸 New photo detected — user=%s photoVersion=%s s3_key=%s", user_id, photo_version, s3_key)
        print(f"[listener] event user={user_id} photoVersion={photo_version} s3_key={s3_key}")

        dedupe_key = (user_id, int(photo_version))
        if dedupe_key in processed_versions:
            logger.warning("⏭ Skipping already processed user=%s photoVersion=%s", user_id, photo_version)
            print(f"[listener] skip already processed user={user_id} photoVersion={photo_version}")
            continue

        try:
            ext = get_extension_from_key(s3_key)
            filename = f"{user_id}_v{photo_version}.{ext}"
            local_path = download_image_to_folder(
                s3_key,
                local_folder=downloads_dir,
                filename=filename,
            )
            logger.info("✅ Downloaded image to %s", local_path)
            print(f"[listener] downloaded local_path={local_path}")

            # --- ML step ---
            logger.info("🧠 Calling encode_face(...) user=%s photoVersion=%s", user_id, photo_version)
            print(f"[listener] calling encode_face path={local_path}")
            embedding = encode_face(image_path=local_path)
            logger.info("🧾 Got embedding length=%d user=%s photoVersion=%s", len(embedding), user_id, photo_version)
            print(f"[listener] encode_face returned len={len(embedding)}")

            # --- Mongo update step ---
            logger.info("🧩 Calling mark_face_processed(...) user=%s photoVersion=%s", user_id, photo_version)
            print(f"[listener] calling mark_face_processed user={user_id} photoVersion={photo_version}")
            updated = mark_face_processed(user_id=user_id, photo_version=int(photo_version), face_encoding=embedding)
            if updated:
                logger.info("✅ Mongo updated: faceProcessed=true user=%s photoVersion=%s", user_id, photo_version)
                processed_versions.add(dedupe_key)
                print(f"[listener] mark_face_processed updated=True")
            else:
                # This usually means the user re-uploaded and photoVersion changed while we processed.
                logger.warning(
                    "⚠ Mongo NOT updated (filter mismatch). Likely stale photoVersion. user=%s attempted_photoVersion=%s",
                    user_id,
                    photo_version,
                )
                print(f"[listener] mark_face_processed updated=False (filter mismatch)")

        except FaceEncodingError as e:
            # Face encoder rule violations (0 faces, >1 face, etc.)
            logger.error("❌ Face encoding failed user=%s photoVersion=%s: %s", user_id, photo_version, str(e))
            print(f"[listener] FaceEncodingError: {e}")
            logger.info("🧩 Calling mark_face_processing_failed(...) user=%s photoVersion=%s", user_id, photo_version)
            print(f"[listener] calling mark_face_processing_failed user={user_id} photoVersion={photo_version}")
            updated = mark_face_processing_failed(user_id=user_id, photo_version=int(photo_version), error_message=str(e))
            if updated:
                logger.info("✅ Mongo updated: faceProcessed=false + faceProcessingError user=%s photoVersion=%s", user_id, photo_version)
                processed_versions.add(dedupe_key)
                print(f"[listener] mark_face_processing_failed updated=True")
            else:
                logger.warning(
                    "⚠ Mongo NOT updated for failure (filter mismatch). user=%s attempted_photoVersion=%s",
                    user_id,
                    photo_version,
                )
                print(f"[listener] mark_face_processing_failed updated=False (filter mismatch)")
        except Exception as e:
            # Any unexpected failure (S3 download, decoding, Mongo connectivity, etc.)
            logger.exception("❌ Pipeline failure user=%s photoVersion=%s", user_id, photo_version)
            print(f"[listener] Unexpected exception: {e}")
            try:
                logger.info("🧩 Calling mark_face_processing_failed(...) user=%s photoVersion=%s", user_id, photo_version)
                mark_face_processing_failed(user_id=user_id, photo_version=int(photo_version), error_message=str(e))
                processed_versions.add(dedupe_key)
            except Exception:
                logger.exception("❌ Failed to persist failure state to MongoDB user=%s photoVersion=%s", user_id, photo_version)


if __name__ == "__main__":
    main()

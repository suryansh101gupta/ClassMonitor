"""
face_encoder.py

All face ML/encoding logic lives here.

Responsibilities:
- Accept raw image bytes OR a local image file path
- Detect exactly one human face
- Generate a 128-dimensional face embedding
- Return the embedding as a plain Python list of floats

Rules:
- No MongoDB, no S3, no filesystem writes
- Raise a clear exception if 0 faces or >1 face are detected
- Expose a single public function: encode_face(...)
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from pathlib import Path
from typing import Iterable, Optional, Union
import logging

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FaceEncodingError(RuntimeError):
    """Raised when a face cannot be encoded safely/correctly."""

    message: str

    def __str__(self) -> str:  # pragma: no cover
        return self.message


def _to_float_list(vec: Iterable[float]) -> list[float]:
    out = [float(x) for x in vec]
    if len(out) != 128:
        raise FaceEncodingError(f"Expected 128-D embedding, got {len(out)} values")
    return out


def encode_face(
    image_bytes: Optional[bytes] = None,
    image_path: Optional[Union[str, Path]] = None,
) -> list[float]:
    """
    Generate a 128-D face embedding from an image.

    Provide exactly one of:
    - image_bytes: raw image bytes (jpg/png/etc.)
    - image_path: path to a local image file

    Returns:
        A 128-dimensional face embedding as a list[float].

    Raises:
        FaceEncodingError:
            - if inputs are invalid
            - if no face is detected
            - if more than one face is detected
            - if encoding fails
    """
    if (image_bytes is None and image_path is None) or (image_bytes is not None and image_path is not None):
        raise FaceEncodingError("Provide exactly one of image_bytes or image_path")

    logger.debug(
        "encode_face called (image_bytes=%s, image_path=%s)",
        "set" if image_bytes is not None else "None",
        str(image_path) if image_path is not None else "None",
    )

    # Import inside function so callers can import this module even if ML deps
    # are not installed in certain environments (e.g., CI).
    try:
        import face_recognition  # type: ignore
    except Exception as e:  # pragma: no cover
        raise FaceEncodingError(f"Missing dependency 'face_recognition': {e}") from e

    try:
        if image_path is not None:
            logger.debug("Loading image from path: %s", str(image_path))
            img = face_recognition.load_image_file(str(image_path))
        else:
            logger.debug("Loading image from bytes (%d bytes)", len(image_bytes or b""))
            # face_recognition.load_image_file accepts a file-like object
            img = face_recognition.load_image_file(BytesIO(image_bytes))  # type: ignore[arg-type]
    except Exception as e:
        raise FaceEncodingError(f"Failed to decode image: {e}") from e

    # Detect faces first, then encode for the detected face location.
    # Using explicit face_locations prevents accidental selection of the "first"
    # face when multiple faces exist.
    try:
        face_locations = face_recognition.face_locations(img)
    except Exception as e:
        raise FaceEncodingError(f"Face detection failed: {e}") from e

    logger.debug("Detected %d face(s)", len(face_locations))

    if len(face_locations) == 0:
        raise FaceEncodingError("No face detected in the image")
    if len(face_locations) > 1:
        raise FaceEncodingError(f"More than one face detected ({len(face_locations)})")

    try:
        encodings = face_recognition.face_encodings(img, known_face_locations=face_locations)
    except Exception as e:
        raise FaceEncodingError(f"Face encoding failed: {e}") from e

    logger.debug("Generated %d encoding(s)", len(encodings))

    if len(encodings) != 1:
        # Defensive: should be 1 given 1 location, but keep strict.
        raise FaceEncodingError(f"Expected exactly 1 encoding, got {len(encodings)}")

    embedding = _to_float_list(encodings[0])
    logger.debug("Embedding length=%d (expected 128)", len(embedding))
    return embedding


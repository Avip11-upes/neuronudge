"""NeuroNudge Frame Decoder Module.

Milestone CV-1A: In-memory Base64 JPEG frame decoding, strict input validation,
dimension enforcement, and luminance analysis.

Zero-Persistence Guarantee:
    Raw webcam frames and decoded arrays are processed strictly in memory
    and are NEVER written to disk, complying with Child Privacy Safeguards.
"""

from __future__ import annotations

import base64
import binascii
from dataclasses import dataclass
import re

import cv2
import numpy as np

# Validation Limits
MAX_ENCODED_SIZE = 256 * 1024  # 256 KB Base64 string limit
MAX_DECODED_SIZE = 200 * 1024  # 200 KB binary image buffer limit
MAX_WIDTH = 1280
MAX_HEIGHT = 720

# Luminance classification thresholds (0.0 - 255.0)
LUMINANCE_LOW_THRESHOLD = 40.0
LUMINANCE_HIGH_THRESHOLD = 220.0

DATA_URL_PATTERN = re.compile(r"^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.*)$", re.DOTALL)
JPEG_SOI_MARKER = b"\xff\xd8"


class FrameDecodeError(ValueError):
    """Raised when an incoming frame payload is invalid, corrupted, or oversized."""


@dataclass(frozen=True)
class DecodedFrame:
    """Container for in-memory decoded frame and its physical attributes."""

    image: np.ndarray
    width: int
    height: int
    luminance: float
    lighting: str  # 'low' | 'ok' | 'high'


def _parse_jpeg_dimensions(data: bytes) -> tuple[int, int] | None:
    """Parse JPEG header markers to extract image (height, width) before full decode.

    Returns:
        (height, width) if SOF marker is found, or None if not easily parsed.
    """
    if len(data) < 4 or not data.startswith(JPEG_SOI_MARKER):
        return None

    idx = 2
    length = len(data)
    # JPEG SOF markers representing baseline, extended, or progressive frames
    sof_markers = {0xC0, 0xC1, 0xC2}

    while idx < length - 8:
        if data[idx] != 0xFF:
            idx += 1
            continue

        marker = data[idx + 1]
        # Skip padding bytes
        if marker == 0xFF:
            idx += 1
            continue

        # Standalone markers without length
        if marker in (0xD8, 0xD9, 0x00) or (0xD0 <= marker <= 0xD7):
            idx += 2
            continue

        if idx + 4 > length:
            break

        segment_len = int.from_bytes(data[idx + 2 : idx + 4], "big")
        if segment_len < 2:
            break

        if marker in sof_markers:
            # SOF segment: marker(2), len(2), precision(1), height(2), width(2)
            if idx + 9 <= length:
                height = int.from_bytes(data[idx + 5 : idx + 7], "big")
                width = int.from_bytes(data[idx + 7 : idx + 9], "big")
                return height, width
            break

        idx += 2 + segment_len

    return None


def calculate_luminance(bgr_image: np.ndarray) -> float:
    """Calculate mean perceptual luminance across the frame using ITU-R BT.601 weights."""
    if bgr_image is None or bgr_image.size == 0:
        raise FrameDecodeError("Cannot compute luminance on empty image.")
    gray = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2GRAY)
    return float(np.mean(gray))


def classify_lighting(luminance: float) -> str:
    """Classify frame lighting as 'low', 'ok', or 'high' based on mean luminance."""
    if luminance < LUMINANCE_LOW_THRESHOLD:
        return "low"
    if luminance > LUMINANCE_HIGH_THRESHOLD:
        return "high"
    return "ok"


def decode_frame(payload: str) -> DecodedFrame:
    """Decode and validate a Base64 JPEG frame into an in-memory BGR NumPy array.

    Args:
        payload: Base64 string or Data URL (`data:image/jpeg;base64,...`).

    Returns:
        DecodedFrame containing image array, dimensions, luminance, and lighting class.

    Raises:
        FrameDecodeError: If payload is malformed, oversized, not JPEG, or corrupt.
    """
    if not isinstance(payload, str):
        raise FrameDecodeError(f"Expected payload to be str, got {type(payload).__name__}.")

    payload = payload.strip()
    if not payload:
        raise FrameDecodeError("Empty frame payload received.")

    # 1. Enforce encoded size limit
    if len(payload) > MAX_ENCODED_SIZE:
        raise FrameDecodeError(
            f"Encoded payload size ({len(payload)} bytes) exceeds maximum allowed ({MAX_ENCODED_SIZE} bytes)."
        )

    # 2. Extract Base64 string and validate MIME type if Data URL
    if payload.startswith("data:"):
        match = DATA_URL_PATTERN.match(payload)
        if not match:
            raise FrameDecodeError("Malformed Data URL format.")
        mime_type, b64_data = match.group(1).lower(), match.group(2)
        if mime_type not in ("image/jpeg", "image/jpg"):
            raise FrameDecodeError(
                f"Unsupported image MIME type: '{mime_type}'. Only JPEG is accepted."
            )
    else:
        b64_data = payload

    # 3. Decode Base64 strictly
    try:
        raw_bytes = base64.b64decode(b64_data, validate=True)
    except (binascii.Error, ValueError) as err:
        raise FrameDecodeError(f"Invalid Base64 payload encoding: {err}") from err

    # 4. Enforce decoded size limit
    if len(raw_bytes) > MAX_DECODED_SIZE:
        raise FrameDecodeError(
            f"Decoded image size ({len(raw_bytes)} bytes) exceeds maximum allowed ({MAX_DECODED_SIZE} bytes)."
        )

    # 5. Validate JPEG SOI signature
    if not raw_bytes.startswith(JPEG_SOI_MARKER):
        raise FrameDecodeError("Payload is not a valid JPEG image (missing SOI marker).")

    # 6. Pre-check dimensions if available from JPEG header
    parsed_dims = _parse_jpeg_dimensions(raw_bytes)
    if parsed_dims is not None:
        p_height, p_width = parsed_dims
        if p_width > MAX_WIDTH or p_height > MAX_HEIGHT:
            raise FrameDecodeError(
                f"Image dimensions {p_width}x{p_height} exceed maximum allowed {MAX_WIDTH}x{MAX_HEIGHT}."
            )

    # 7. Decode into OpenCV BGR NumPy array in memory
    np_buf = np.frombuffer(raw_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_buf, cv2.IMREAD_COLOR)

    if image is None or image.size == 0:
        raise FrameDecodeError("Corrupted or invalid JPEG image data.")

    height, width = image.shape[:2]
    if width <= 0 or height <= 0:
        raise FrameDecodeError("Image has zero or negative dimensions.")

    if width > MAX_WIDTH or height > MAX_HEIGHT:
        raise FrameDecodeError(
            f"Decoded dimensions {width}x{height} exceed maximum allowed {MAX_WIDTH}x{MAX_HEIGHT}."
        )

    # 8. Luminance and lighting assessment
    luminance = calculate_luminance(image)
    lighting = classify_lighting(luminance)

    return DecodedFrame(
        image=image,
        width=width,
        height=height,
        luminance=luminance,
        lighting=lighting,
    )

"""Unit tests for NeuroNudge Frame Decoder module.

Milestone CV-1A: Verification of Base64 JPEG frame decoding, strict validation,
dimension enforcement, luminance analysis, and zero disk persistence.
"""

import base64
import os
import tempfile
import unittest

import cv2
import numpy as np

from app.cv.frame_decoder import (
    MAX_ENCODED_SIZE,
    MAX_HEIGHT,
    MAX_WIDTH,
    DecodedFrame,
    FrameDecodeError,
    calculate_luminance,
    classify_lighting,
    decode_frame,
)


def _create_jpeg_b64(
    width: int = 320,
    height: int = 240,
    color: tuple[int, int, int] = (128, 128, 128),
    prefix: str | None = None,
) -> str:
    """Helper to generate in-memory synthetic Base64 JPEG payloads."""
    img = np.full((height, width, 3), color, dtype=np.uint8)
    success, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
    if not success:
        raise RuntimeError("Failed to encode synthetic JPEG image")
    raw_b64 = base64.b64encode(buf.tobytes()).decode("ascii")
    if prefix:
        return f"{prefix}{raw_b64}"
    return raw_b64


class TestFrameDecoder(unittest.TestCase):
    """Test suite for CV-1A in-memory frame decoding and validation."""

    def test_valid_jpeg_raw_base64(self):
        """Test decoding a standard raw Base64 JPEG frame."""
        payload = _create_jpeg_b64(width=320, height=240, color=(120, 130, 140))
        result = decode_frame(payload)

        self.assertIsInstance(result, DecodedFrame)
        self.assertEqual(result.width, 320)
        self.assertEqual(result.height, 240)
        self.assertEqual(result.image.shape, (240, 320, 3))
        self.assertEqual(result.lighting, "ok")
        self.assertTrue(100.0 <= result.luminance <= 150.0)

    def test_valid_jpeg_data_url(self):
        """Test decoding Base64 JPEG wrapped in standard HTML5 Canvas Data URL."""
        payload = _create_jpeg_b64(
            width=640,
            height=480,
            color=(100, 100, 100),
            prefix="data:image/jpeg;base64,",
        )
        result = decode_frame(payload)

        self.assertEqual(result.width, 640)
        self.assertEqual(result.height, 480)
        self.assertEqual(result.image.shape, (480, 640, 3))
        self.assertEqual(result.lighting, "ok")

    def test_invalid_base64_rejection(self):
        """Test rejection of non-base64 or malformed base64 strings."""
        invalid_payloads = [
            "not_valid_base64!!!",
            "==invalid padding==",
            "data:image/jpeg;base64,???badchars???",
        ]
        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                with self.assertRaises(FrameDecodeError) as ctx:
                    decode_frame(payload)
                self.assertIn("Base64", str(ctx.exception))

    def test_corrupt_jpeg_rejection(self):
        """Test rejection of payload that has valid Base64 but truncated/corrupt JPEG data."""
        # SOI marker + 8 garbage bytes
        corrupted_bytes = b"\xff\xd8\x00\x00\xaa\xbb\xcc\xdd"
        corrupt_b64 = base64.b64encode(corrupted_bytes).decode("ascii")

        with self.assertRaises(FrameDecodeError) as ctx:
            decode_frame(corrupt_b64)
        self.assertTrue(
            "Corrupted" in str(ctx.exception)
            or "invalid" in str(ctx.exception)
            or "dimensions" in str(ctx.exception)
        )

    def test_non_jpeg_payload_rejection(self):
        """Test rejection of non-JPEG image formats (e.g., PNG)."""
        # 1. Non-JPEG MIME type in Data URL
        png_data_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
        with self.assertRaises(FrameDecodeError) as ctx:
            decode_frame(png_data_url)
        self.assertIn("Only JPEG is accepted", str(ctx.exception))

        # 2. Raw PNG encoded as Base64 (starts with PNG signature, not JPEG SOI)
        png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        png_b64 = base64.b64encode(png_bytes).decode("ascii")
        with self.assertRaises(FrameDecodeError) as ctx:
            decode_frame(png_b64)
        self.assertIn("missing SOI marker", str(ctx.exception))

    def test_oversized_payload_rejection(self):
        """Test rejection of payloads exceeding MAX_ENCODED_SIZE."""
        oversized_str = "A" * (MAX_ENCODED_SIZE + 1)
        with self.assertRaises(FrameDecodeError) as ctx:
            decode_frame(oversized_str)
        self.assertIn("exceeds maximum allowed", str(ctx.exception))

    def test_oversized_dimensions_rejection(self):
        """Test rejection of frames exceeding MAX_WIDTH (1280) or MAX_HEIGHT (720)."""
        oversized_payload = _create_jpeg_b64(width=MAX_WIDTH + 10, height=MAX_HEIGHT)
        with self.assertRaises(FrameDecodeError) as ctx:
            decode_frame(oversized_payload)
        self.assertIn("exceed maximum allowed", str(ctx.exception))

    def test_boundary_dimensions_accepted(self):
        """Test that exact maximum boundary (1280x720) is accepted."""
        boundary_payload = _create_jpeg_b64(width=MAX_WIDTH, height=MAX_HEIGHT)
        result = decode_frame(boundary_payload)
        self.assertEqual(result.width, MAX_WIDTH)
        self.assertEqual(result.height, MAX_HEIGHT)

    def test_lighting_classification(self):
        """Test classification of low, ok, and high lighting based on mean luminance."""
        # 1. Low lighting (< 40.0)
        low_payload = _create_jpeg_b64(width=100, height=100, color=(15, 15, 15))
        low_res = decode_frame(low_payload)
        self.assertEqual(low_res.lighting, "low")
        self.assertLess(low_res.luminance, 40.0)

        # 2. High lighting (> 220.0)
        high_payload = _create_jpeg_b64(width=100, height=100, color=(245, 245, 245))
        high_res = decode_frame(high_payload)
        self.assertEqual(high_res.lighting, "high")
        self.assertGreater(high_res.luminance, 220.0)

        # 3. OK lighting (40.0 <= lum <= 220.0)
        ok_payload = _create_jpeg_b64(width=100, height=100, color=(128, 128, 128))
        ok_res = decode_frame(ok_payload)
        self.assertEqual(ok_res.lighting, "ok")
        self.assertTrue(40.0 <= ok_res.luminance <= 220.0)

    def test_empty_and_invalid_type_inputs(self):
        """Test graceful rejection of empty strings and invalid types."""
        with self.assertRaises(FrameDecodeError):
            decode_frame("")

        with self.assertRaises(FrameDecodeError):
            decode_frame("    ")

        with self.assertRaises(FrameDecodeError):
            decode_frame(None)  # type: ignore

        with self.assertRaises(FrameDecodeError):
            decode_frame(12345)  # type: ignore

    def test_no_frame_persistence(self):
        """Verify that decoding frames does NOT write any files to disk."""
        # Snapshot files in temp dir and current directory
        temp_dir = tempfile.gettempdir()
        temp_files_before = set(os.listdir(temp_dir))
        backend_files_before = set(os.listdir("."))

        # Process a batch of diverse frames
        for color in [(10, 10, 10), (128, 128, 128), (250, 250, 250)]:
            payload = _create_jpeg_b64(width=320, height=240, color=color)
            res = decode_frame(payload)
            self.assertIsNotNone(res.image)

        temp_files_after = set(os.listdir(temp_dir))
        backend_files_after = set(os.listdir("."))

        # Check for any new image/video files created
        new_backend = backend_files_after - backend_files_before
        new_temp = temp_files_after - temp_files_before

        image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".avi", ".mp4"}
        for fname in new_backend | new_temp:
            _, ext = os.path.splitext(fname.lower())
            self.assertNotIn(
                ext,
                image_extensions,
                f"Persistence violation: Detected image file written to disk: {fname}",
            )


if __name__ == "__main__":
    unittest.main()

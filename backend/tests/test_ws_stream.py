"""Targeted integration tests for NeuroNudge WebSocket Stream Endpoint.

Milestone CV-1B: Verification of real-time WebSocket transport, UUID validation,
database session check, bounded latest-frame-wins processing, safe disconnects,
and zero raw-frame persistence.
"""

from __future__ import annotations

import base64
import os
import tempfile
import unittest
import uuid
from unittest.mock import patch

import cv2
from fastapi import FastAPI
from fastapi.testclient import TestClient
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from starlette.websockets import WebSocketDisconnect

from app.api.ws_stream import router as ws_stream_router
from app.db.database import Base
from app.schemas.session import SessionCreate
from app.services.session_service import SessionService

# Isolated in-memory SQLite database for test execution
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


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


class TestWebSocketStream(unittest.TestCase):
    """Integration test suite for CV-1B WebSocket frame streaming."""

    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(bind=test_engine)
        cls.app = FastAPI(title="CV-1B Stream Test App")
        cls.app.include_router(ws_stream_router)
        cls.client = TestClient(cls.app)

    @classmethod
    def tearDownClass(cls):
        Base.metadata.drop_all(bind=test_engine)

    def setUp(self):
        self.session_patcher = patch(
            "app.api.ws_stream.SessionLocal", TestingSessionLocal
        )
        self.session_patcher.start()

        # Seed a valid test session in database
        with TestingSessionLocal() as db:
            session_in = SessionCreate(
                child_nickname="TestChild",
                child_age=7,
                guardian_consent=True,
            )
            self.valid_session = SessionService.create_session(db, session_in)
            self.valid_session_id = self.valid_session.id

    def tearDown(self):
        self.session_patcher.stop()

    def test_invalid_stage_rejection(self):
        """Reject connection when stage query parameter is invalid."""
        url = f"/ws/stream/{self.valid_session_id}?stage=invalid_stage"
        with self.assertRaises(WebSocketDisconnect) as ctx:
            with self.client.websocket_connect(url):
                pass
        self.assertEqual(ctx.exception.code, 1008)

    def test_invalid_uuid_format_rejection(self):
        """Reject connection when session_id is not a valid UUID."""
        url = "/ws/stream/not-a-valid-uuid?stage=adhd"
        with self.assertRaises(WebSocketDisconnect) as ctx:
            with self.client.websocket_connect(url):
                pass
        self.assertEqual(ctx.exception.code, 1008)

    def test_nonexistent_session_rejection(self):
        """Reject connection when session_id is a valid UUID but does not exist in DB."""
        nonexistent_uuid = str(uuid.uuid4())
        url = f"/ws/stream/{nonexistent_uuid}?stage=adhd"
        with self.assertRaises(WebSocketDisconnect) as ctx:
            with self.client.websocket_connect(url):
                pass
        self.assertEqual(ctx.exception.code, 1008)

    def test_valid_session_connection_and_frame_processing(self):
        """Connect successfully with valid session and receive truthful telemetry for valid frame."""
        url = f"/ws/stream/{self.valid_session_id}?stage=adhd"
        frame_b64 = _create_jpeg_b64(width=320, height=240, color=(128, 128, 128))

        with self.client.websocket_connect(url) as ws:
            ws.send_json(
                {
                    "t": 1730279000000,
                    "block": "adhd_block_1",
                    "frame": frame_b64,
                }
            )
            response = ws.receive_json()

            self.assertIn("lighting", response)
            self.assertEqual(response["lighting"], "ok")
            self.assertFalse(response["face_found"])
            self.assertIsNone(response["gaze_on_screen"])
            self.assertEqual(response["tracking_status"], "face_not_detected")
            self.assertIsNone(response["tracking_quality"])

    def test_data_url_frame_processing(self):
        """Verify processing of frames formatted as Data URLs."""
        url = f"/ws/stream/{self.valid_session_id}?stage=autism"
        data_url = _create_jpeg_b64(
            width=320,
            height=240,
            color=(130, 130, 130),
            prefix="data:image/jpeg;base64,",
        )

        with self.client.websocket_connect(url) as ws:
            ws.send_json(
                {
                    "t": 1730279001000,
                    "block": "autism_social_1",
                    "frame": data_url,
                }
            )
            response = ws.receive_json()
            self.assertEqual(response["lighting"], "ok")
            self.assertFalse(response["face_found"])
            self.assertIsNone(response["gaze_on_screen"])
            self.assertEqual(response["tracking_status"], "face_not_detected")

    def test_measured_lighting_classification(self):
        """Verify that telemetry reflects true measured luminance from frame_decoder."""
        url = f"/ws/stream/{self.valid_session_id}?stage=dyslexia"

        dark_b64 = _create_jpeg_b64(width=100, height=100, color=(10, 10, 10))
        bright_b64 = _create_jpeg_b64(width=100, height=100, color=(245, 245, 245))

        with self.client.websocket_connect(url) as ws:
            # 1. Dark frame
            ws.send_json({"t": 1730279002000, "block": "block_dark", "frame": dark_b64})
            dark_resp = ws.receive_json()
            self.assertEqual(dark_resp["lighting"], "low")

            # 2. Bright frame
            ws.send_json({"t": 1730279003000, "block": "block_bright", "frame": bright_b64})
            bright_resp = ws.receive_json()
            self.assertEqual(bright_resp["lighting"], "high")

    def test_malformed_json_rejection_without_disconnect(self):
        """Handle unparseable JSON without crashing or closing connection."""
        url = f"/ws/stream/{self.valid_session_id}?stage=adhd"

        with self.client.websocket_connect(url) as ws:
            ws.send_text("this is not valid json {{{")
            response = ws.receive_json()
            self.assertEqual(response.get("status"), "invalid_json")

            # Connection remains operational for subsequent valid frame
            valid_b64 = _create_jpeg_b64(width=100, height=100)
            ws.send_json({"t": 1730279004000, "block": "recovery_block", "frame": valid_b64})
            recovery_resp = ws.receive_json()
            self.assertEqual(recovery_resp.get("lighting"), "ok")

    def test_invalid_schema_rejection(self):
        """Reject messages missing required fields (t, block, frame)."""
        url = f"/ws/stream/{self.valid_session_id}?stage=adhd"

        with self.client.websocket_connect(url) as ws:
            # Missing frame
            ws.send_json({"t": 12345, "block": "blk"})
            resp1 = ws.receive_json()
            self.assertEqual(resp1.get("status"), "invalid_schema")

            # Invalid timestamp type
            ws.send_json({"t": "not_an_int", "block": "blk", "frame": "abc"})
            resp2 = ws.receive_json()
            self.assertEqual(resp2.get("status"), "invalid_schema")

    def test_corrupt_frame_decode_error(self):
        """Return decode error for invalid/corrupted image data without terminating session."""
        url = f"/ws/stream/{self.valid_session_id}?stage=adhd"
        corrupt_b64 = base64.b64encode(b"\xff\xd8not_a_valid_jpeg").decode("ascii")

        with self.client.websocket_connect(url) as ws:
            ws.send_json({"t": 123456, "block": "corrupt_test", "frame": corrupt_b64})
            response = ws.receive_json()
            self.assertEqual(response.get("status"), "decode_error")

    def test_oversized_payload_rejection(self):
        """Return decode error when frame payload exceeds size limits."""
        url = f"/ws/stream/{self.valid_session_id}?stage=adhd"
        oversized_str = "A" * (300 * 1024)  # 300 KB > 256 KB limit

        with self.client.websocket_connect(url) as ws:
            ws.send_json({"t": 123456, "block": "oversize_test", "frame": oversized_str})
            response = ws.receive_json()
            self.assertEqual(response.get("status"), "decode_error")

    def test_no_raw_frame_persistence(self):
        """Verify that streaming multiple frames leaves zero temporary image files on disk."""
        temp_dir = tempfile.gettempdir()
        temp_files_before = set(os.listdir(temp_dir))
        backend_files_before = set(os.listdir("."))

        url = f"/ws/stream/{self.valid_session_id}?stage=adhd"
        with self.client.websocket_connect(url) as ws:
            for i in range(10):
                frame_b64 = _create_jpeg_b64(width=160, height=120, color=(100 + i * 5, 100, 100))
                ws.send_json({"t": 1730279010000 + i * 100, "block": f"block_{i}", "frame": frame_b64})
                resp = ws.receive_json()
                self.assertIsNotNone(resp.get("lighting"))

        temp_files_after = set(os.listdir(temp_dir))
        backend_files_after = set(os.listdir("."))

        new_files = (temp_files_after - temp_files_before) | (backend_files_after - backend_files_before)
        image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".mp4", ".avi"}
        for f in new_files:
            _, ext = os.path.splitext(f.lower())
            self.assertNotIn(
                ext,
                image_exts,
                f"Persistence violation: Detected image or video file written to disk: {f}",
            )

    def test_bounded_processing_throughput(self):
        """Verify bounded processing executes multiple rapid frames cleanly."""
        url = f"/ws/stream/{self.valid_session_id}?stage=autism"
        with self.client.websocket_connect(url) as ws:
            # Stream a burst of 5 rapid frames
            for i in range(5):
                frame_b64 = _create_jpeg_b64(width=160, height=120)
                ws.send_json({"t": 1730279020000 + i, "block": "burst", "frame": frame_b64})

            # Receive replies for processed frames
            reply = ws.receive_json()
            self.assertEqual(reply.get("lighting"), "ok")


if __name__ == "__main__":
    unittest.main()

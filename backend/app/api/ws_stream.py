"""NeuroNudge WebSocket Stream Endpoint Module.

Milestone CV-1B: Real-time validated WebSocket frame transport.
Handles live webcam streaming, UUID session existence verification via SessionService,
stage validation, bounded latest-frame-wins processing, non-blocking asynchronous decoding,
and clean disconnect handling.

Privacy & Zero-Persistence Guarantee:
    Incoming video frames are decoded and processed strictly in memory and are
    NEVER written to disk or persisted to any permanent storage.
"""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Any, Dict

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.cv.frame_decoder import FrameDecodeError, decode_frame
from app.db.database import SessionLocal
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["stream"])

VALID_STAGES = {"adhd", "dyslexia", "autism"}


def validate_uuid(session_id: str) -> bool:
    """Validate that session_id is a canonical RFC 4122 UUID string."""
    if not isinstance(session_id, str):
        return False
    try:
        parsed = uuid.UUID(session_id, version=4)
        return str(parsed) == session_id.lower()
    except (ValueError, AttributeError):
        return False


def verify_session_in_db(session_id: str) -> bool:
    """Verify session exists in the database using the official SessionService."""
    if not validate_uuid(session_id):
        return False

    with SessionLocal() as db:
        session_obj = SessionService.get_session(db, session_id)
        return session_obj is not None


@router.websocket("/ws/stream/{session_id}")
async def websocket_stream_endpoint(
    websocket: WebSocket,
    session_id: str,
    stage: str = Query(..., description="Active assessment stage: adhd, dyslexia, or autism"),
):
    """WebSocket endpoint for webcam frame streaming during child developmental assessment.

    Protocol:
        1. Validate stage parameter against permitted assessment stages.
        2. Validate session_id format (UUID v4) and database existence.
        3. Reject invalid requests with WS code 1008 (Policy Violation) before accept.
        4. Bounded latest-frame-wins processing via asyncio.Queue(maxsize=1).
        5. Frame decoding executed in worker threads via asyncio.to_thread.
        6. Returns measured lighting and truthful unmeasured tracking status.
    """
    # 1. Stage validation
    if stage not in VALID_STAGES:
        logger.warning(
            "WebSocket rejected: Invalid stage '%s'. Allowed: %s", stage, VALID_STAGES
        )
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason=f"Invalid stage '{stage}'. Must be one of: {', '.join(sorted(VALID_STAGES))}",
        )
        return

    # 2. UUID format and Database session verification
    if not validate_uuid(session_id):
        logger.warning("WebSocket rejected: Invalid UUID format '%s'", session_id)
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Invalid session ID format. Must be a valid UUID.",
        )
        return

    try:
        session_exists = verify_session_in_db(session_id)
    except Exception as err:
        logger.error("Database error while checking session %s: %s", session_id, err)
        await websocket.close(
            code=status.WS_1011_INTERNAL_ERROR,
            reason="Internal database error validating session.",
        )
        return

    if not session_exists:
        logger.warning(
            "WebSocket rejected: Session '%s' not found in database", session_id
        )
        await websocket.close(
            code=status.WS_1008_POLICY_VIOLATION,
            reason=f"Session '{session_id}' does not exist.",
        )
        return

    # 3. Connection acceptance
    await websocket.accept()
    logger.info("WebSocket stream connected: session=%s, stage=%s", session_id, stage)

    # 4. Decoupled bounded frame processing (Latest-Frame-Wins)
    frame_queue: asyncio.Queue[Dict[str, Any] | None] = asyncio.Queue(maxsize=1)
    stop_event = asyncio.Event()

    async def worker_loop():
        """Worker task processing frames off the async event loop."""
        while not stop_event.is_set():
            try:
                payload = await frame_queue.get()
                if payload is None:
                    break

                frame_b64 = payload.get("frame")
                try:
                    # Offload CPU-bound image decoding to worker thread
                    decoded = await asyncio.to_thread(decode_frame, frame_b64)

                    # Truthful telemetry response:
                    # In CV-1B, no facial tracking model is run.
                    # We report actual measured lighting and explicit unmeasured tracking status.
                    response = {
                        "face_found": False,
                        "lighting": decoded.lighting,
                        "gaze_on_screen": 0.0,
                        "tracking_status": "unavailable",
                    }
                    await websocket.send_json(response)
                except FrameDecodeError as decode_err:
                    await websocket.send_json(
                        {
                            "error": str(decode_err),
                            "status": "decode_error",
                        }
                    )
                except Exception as proc_err:
                    logger.error("Unexpected error in frame processing: %s", proc_err)
                    await websocket.send_json(
                        {"error": "Frame processing failed", "status": "error"}
                    )
                finally:
                    frame_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as loop_err:
                logger.error("Worker loop exception: %s", loop_err)
                break

    worker_task = asyncio.create_task(worker_loop())

    try:
        while True:
            raw_text = await websocket.receive_text()

            # Parse JSON message
            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                await websocket.send_json(
                    {"error": "Malformed JSON payload", "status": "invalid_json"}
                )
                continue

            if not isinstance(data, dict):
                await websocket.send_json(
                    {"error": "Message must be a JSON object", "status": "invalid_schema"}
                )
                continue

            # Validate required schema: t (int), block (str), frame (str)
            t = data.get("t")
            block = data.get("block")
            frame_data = data.get("frame")

            if (
                not isinstance(t, int)
                or not isinstance(block, str)
                or not block.strip()
                or not isinstance(frame_data, str)
                or not frame_data.strip()
            ):
                await websocket.send_json(
                    {
                        "error": "Invalid frame schema. Required: 't' (int), 'block' (non-empty str), 'frame' (non-empty str)",
                        "status": "invalid_schema",
                    }
                )
                continue

            # Bounded queue: discard stale frame if worker is currently busy (Latest-Frame-Wins)
            if frame_queue.full():
                try:
                    discarded = frame_queue.get_nowait()
                    frame_queue.task_done()
                except (asyncio.QueueEmpty, ValueError):
                    pass

            await frame_queue.put(data)

    except WebSocketDisconnect:
        logger.info(
            "WebSocket stream disconnected: session=%s, stage=%s", session_id, stage
        )
    except Exception as conn_err:
        logger.warning(
            "WebSocket stream connection closed unexpectedly: %s", conn_err
        )
    finally:
        # Graceful worker shutdown and resource cleanup
        stop_event.set()
        if not worker_task.done():
            # Signal worker to terminate
            if frame_queue.full():
                try:
                    frame_queue.get_nowait()
                    frame_queue.task_done()
                except (asyncio.QueueEmpty, ValueError):
                    pass
            await frame_queue.put(None)
            try:
                await asyncio.wait_for(worker_task, timeout=1.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                worker_task.cancel()

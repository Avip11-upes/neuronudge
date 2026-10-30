"""NeuroNudge Face Mesh Detection Module.

Milestone CV-2: MediaPipe Tasks Face Landmarker integration.
Detects facial presence, 478 3D landmarks (including eye and iris landmarks),
and tracking quality confidence score.

Zero-Persistence Guarantee:
    Video frames are processed strictly in memory and are NEVER written to disk,
    complying with Child Privacy Safeguards.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
import os
from pathlib import Path
import tempfile
from typing import Any, List, Optional
import urllib.request

import cv2
import mediapipe as mp
from mediapipe.tasks.python import vision
import numpy as np

logger = logging.getLogger(__name__)

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task"
MODEL_FILENAME = "face_landmarker.task"


def get_model_path() -> str:
    """Resolve face landmarker task model path using local fallback cascade."""
    # 1. Check local models directory under backend/app/cv/models
    module_dir = Path(__file__).resolve().parent
    local_path = module_dir / "models" / MODEL_FILENAME
    if local_path.exists() and local_path.stat().st_size > 0:
        return str(local_path)

    # 2. Check environment variable override
    env_path = os.environ.get("MEDIAPIPE_MODEL_PATH")
    if env_path and os.path.exists(env_path) and os.path.getsize(env_path) > 0:
        return env_path

    # 3. Check system temp directory cache
    cache_dir = os.path.join(tempfile.gettempdir(), "mediapipe_models")
    os.makedirs(cache_dir, exist_ok=True)
    temp_path = os.path.join(cache_dir, MODEL_FILENAME)
    if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
        return temp_path

    # 4. Download if missing from cache
    logger.info("Downloading MediaPipe Face Landmarker model to %s...", temp_path)
    urllib.request.urlretrieve(MODEL_URL, temp_path)
    return temp_path


@dataclass(frozen=True)
class FaceMeshResult:
    """Detection results for a single processed video frame."""

    face_detected: bool
    landmarks: Optional[List[Any]]  # 478 NormalizedLandmark objects when detected
    landmark_count: int
    tracking_quality: Optional[float]  # 0.0 to 1.0 confidence score
    iris_available: bool


def compute_tracking_quality(landmarks: list) -> float:
    """Compute genuine tracking quality score (0.0 - 1.0) based on physical metrics.

    Evaluates:
      1. Landmark completeness: 478 points (including irises).
      2. Frame containment: Proportion of landmarks strictly within [0.0, 1.0].
      3. Face scale sanity: Appropriate bounding box dimensions for clinical assessment.
    """
    if not landmarks or len(landmarks) < 468:
        return 0.0

    count = len(landmarks)
    completeness = 1.0 if count >= 478 else (count / 478.0)

    # Frame containment: fraction of landmarks within normalized viewport [0, 1]
    xs = [lm.x for lm in landmarks]
    ys = [lm.y for lm in landmarks]
    in_bounds = sum(1 for x, y in zip(xs, ys) if 0.0 <= x <= 1.0 and 0.0 <= y <= 1.0)
    containment = in_bounds / float(count)

    # Bounding box scale: optimal child face span is 15% to 70% of frame width/height
    bbox_w = max(xs) - min(xs)
    bbox_h = max(ys) - min(ys)
    if bbox_w < 0.10 or bbox_h < 0.10:
        scale_score = max(0.2, (min(bbox_w, bbox_h) / 0.10) * 0.8)
    elif bbox_w > 0.95 or bbox_h > 0.95:
        scale_score = 0.8  # Clipped or overly close to lens
    else:
        scale_score = 1.0

    # Weighted composite score
    quality = 0.4 * completeness + 0.3 * containment + 0.3 * scale_score
    return round(float(min(1.0, max(0.0, quality))), 3)


class FaceMeshDetector:
    """High-performance in-memory face mesh detector wrapping MediaPipe Tasks API."""

    def __init__(
        self,
        model_path: Optional[str] = None,
        min_detection_confidence: float = 0.5,
        min_presence_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ):
        self._model_path = model_path or get_model_path()
        if not os.path.exists(self._model_path):
            raise FileNotFoundError(f"Model file not found at {self._model_path}")

        base_options = mp.tasks.BaseOptions(model_asset_path=self._model_path)
        options = vision.FaceLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_faces=1,
            min_face_detection_confidence=min_detection_confidence,
            min_face_presence_confidence=min_presence_confidence,
            min_tracking_confidence=min_tracking_confidence,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
        )
        self._landmarker = vision.FaceLandmarker.create_from_options(options)
        logger.info("FaceMeshDetector initialized with model: %s", self._model_path)

    def detect(self, bgr_frame: np.ndarray) -> FaceMeshResult:
        """Process an in-memory BGR image frame and return facial landmark measurements.

        Args:
            bgr_frame: OpenCV BGR image array (H, W, 3).

        Returns:
            FaceMeshResult containing detection flag, landmarks, and tracking quality.
        """
        if bgr_frame is None or bgr_frame.size == 0:
            return FaceMeshResult(
                face_detected=False,
                landmarks=None,
                landmark_count=0,
                tracking_quality=0.0,
                iris_available=False,
            )

        # MediaPipe requires RGB color format
        rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        result = self._landmarker.detect(mp_image)

        if not result.face_landmarks:
            return FaceMeshResult(
                face_detected=False,
                landmarks=None,
                landmark_count=0,
                tracking_quality=0.0,
                iris_available=False,
            )

        landmarks = result.face_landmarks[0]
        count = len(landmarks)
        iris_available = count >= 478

        # Genuine tracking quality measured from physical geometry and landmark completeness
        tracking_quality = compute_tracking_quality(landmarks)

        return FaceMeshResult(
            face_detected=True,
            landmarks=landmarks,
            landmark_count=count,
            tracking_quality=tracking_quality,
            iris_available=iris_available,
        )


_global_detector: Optional[FaceMeshDetector] = None


def get_face_mesh_detector() -> FaceMeshDetector:
    """Return a shared singleton instance of FaceMeshDetector."""
    global _global_detector
    if _global_detector is None:
        _global_detector = FaceMeshDetector()
    return _global_detector

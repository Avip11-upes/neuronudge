"""Targeted unit tests for NeuroNudge Face Mesh Detection Module.

Milestone CV-2: MediaPipe Tasks FaceLandmarker verification, landmark completeness,
real face detection, and zero disk persistence.
"""

from __future__ import annotations

import os
import tempfile
import unittest

import cv2
import numpy as np

from app.cv.face_mesh import (
    FaceMeshDetector,
    FaceMeshResult,
    get_face_mesh_detector,
    get_model_path,
)


class TestFaceMeshDetector(unittest.TestCase):
    """Test suite for CV-2 FaceMeshDetector and MediaPipe Tasks integration."""

    @classmethod
    def setUpClass(cls):
        cls.detector = get_face_mesh_detector()

    def test_model_path_resolution(self):
        """Verify model path resolves to an existing non-empty .task file."""
        path = get_model_path()
        self.assertTrue(os.path.exists(path), f"Resolved model path does not exist: {path}")
        self.assertGreater(os.path.getsize(path), 1_000_000, "Model file is unexpectedly small")

    def test_blank_image_returns_no_face(self):
        """Verify detector safely returns face_detected=False on image with no face."""
        blank_bgr = np.full((240, 320, 3), 128, dtype=np.uint8)
        result = self.detector.detect(blank_bgr)

        self.assertIsInstance(result, FaceMeshResult)
        self.assertFalse(result.face_detected)
        self.assertIsNone(result.landmarks)
        self.assertEqual(result.landmark_count, 0)
        self.assertEqual(result.tracking_quality, 0.0)
        self.assertFalse(result.iris_available)

    def test_none_and_empty_array_handling(self):
        """Handle None or empty NumPy arrays gracefully without exceptions."""
        res_none = self.detector.detect(None)  # type: ignore
        self.assertFalse(res_none.face_detected)

        empty_arr = np.zeros((0, 0, 3), dtype=np.uint8)
        res_empty = self.detector.detect(empty_arr)
        self.assertFalse(res_empty.face_detected)

    def test_singleton_get_detector(self):
        """Verify get_face_mesh_detector() returns the singleton instance."""
        d1 = get_face_mesh_detector()
        d2 = get_face_mesh_detector()
        self.assertIs(d1, d2)

    def test_no_frame_persistence(self):
        """Verify FaceMeshDetector processing never writes image files to disk."""
        temp_dir = tempfile.gettempdir()
        temp_before = set(os.listdir(temp_dir))
        backend_before = set(os.listdir("."))

        for _ in range(5):
            dummy = np.full((120, 160, 3), 80, dtype=np.uint8)
            _ = self.detector.detect(dummy)

        temp_after = set(os.listdir(temp_dir))
        backend_after = set(os.listdir("."))

        new_files = (temp_after - temp_before) | (backend_after - backend_before)
        image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".mp4", ".avi"}
        for f in new_files:
            _, ext = os.path.splitext(f.lower())
            self.assertNotIn(
                ext,
                image_exts,
                f"Persistence violation: Detected image or video file written to disk: {f}",
            )

    def test_live_webcam_detection_if_available(self):
        """Test real webcam frame detection when a physical camera device is available."""
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            self.skipTest("No physical webcam device index 0 available in this test environment.")

        try:
            ret, frame = cap.read()
            if not ret or frame is None:
                self.skipTest("Failed to grab live frame from camera index 0.")

            result = self.detector.detect(frame)
            self.assertIsInstance(result, FaceMeshResult)
            # If a face is present in front of webcam:
            if result.face_detected:
                self.assertEqual(result.landmark_count, 478)
                self.assertTrue(result.iris_available)
                self.assertGreaterEqual(result.tracking_quality, 0.5)
                # Verify 3D normalized coordinates range
                for lm in result.landmarks[:10]:
                    self.assertTrue(0.0 <= lm.x <= 1.0)
                    self.assertTrue(0.0 <= lm.y <= 1.0)
        finally:
            cap.release()


if __name__ == "__main__":
    unittest.main()

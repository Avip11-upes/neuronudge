import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.crud import get_session_storage_dir
from app.db.models import (
    AnswerModel,
    CVBlockModel,
    ReportModel,
    ScoreModel,
    SessionModel,
    StageRunModel,
)


def test_app_imports_cleanly(client: TestClient):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_docs_accessible(client: TestClient):
    response = client.get("/docs")
    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower() or "html" in response.headers.get("content-type", "")

    # Verify openapi.json generates valid OpenAPI 3 schema
    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    openapi_data = openapi_resp.json()
    assert openapi_data["openapi"].startswith("3.")
    assert "/api/health" in openapi_data["paths"]
    assert "/api/sessions" in openapi_data["paths"]


# ============================================================================
# Shared Schema Validation Tests (Milestone 1C)
# ============================================================================

def test_answer_schema_validation():
    from app.schemas.answers import AnswerSubmit

    valid_answer = AnswerSubmit(
        stage_name="dyslexia",
        question_id="dys_5_7_01",
        selected_option="b",
        response_time_ms=1500,
        is_correct=True,
    )
    assert valid_answer.stage_name == "dyslexia"
    assert valid_answer.response_time_ms == 1500

    # Negative response time should fail validation
    with pytest.raises(Exception):
        AnswerSubmit(
            stage_name="dyslexia",
            question_id="dys_5_7_01",
            response_time_ms=-10,
        )


def test_metrics_schema_validation():
    from app.schemas.metrics import (
        BlinkData,
        CVBlockMetrics,
        FramePacket,
        GazeData,
        TrackingFeedback,
    )

    # FramePacket with epoch milliseconds and base64 string
    frame_pkt = FramePacket(
        t=1730279000000,
        block="adhd_video_2",
        frame="data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    )
    assert frame_pkt.t == 1730279000000
    assert frame_pkt.block == "adhd_video_2"

    # TrackingFeedback with explicit null/unavailable representations
    feedback_unmeasured = TrackingFeedback()
    assert feedback_unmeasured.face_found is None
    assert feedback_unmeasured.lighting == "unavailable"
    assert feedback_unmeasured.gaze_on_screen is None

    gaze = GazeData(on_screen_ratio=0.88, fixation_count=12, coarse_region="center")
    blink = BlinkData(blink_count=5, blink_rate_per_min=15.0)
    metrics = CVBlockMetrics(
        block_index=1,
        stage_name="adhd",
        tracking_quality=0.92,
        face_detected=True,
        lighting="ok",
        gaze=gaze,
        blink=blink,
    )
    assert metrics.tracking_quality == 0.92
    assert metrics.gaze.on_screen_ratio == 0.88
    assert metrics.lighting == "ok"


def test_question_schema_excludes_answer_keys():
    from app.schemas.answers import QuestionItem, QuestionOption, QuestionBankResponse

    options = [
        QuestionOption(id="a", label="d"),
        QuestionOption(id="b", label="b"),
    ]
    question = QuestionItem(
        id="dys_01",
        category="letter_confusion",
        prompt_text="Choose letter b",
        options=options,
    )
    # Ensure QuestionItem schema has no answer key field
    assert "correct_option" not in QuestionItem.model_fields
    assert "is_correct" not in QuestionItem.model_fields


def test_report_schema_validation():
    from datetime import datetime
    from app.schemas.report import ReportResponse, DomainIndicator

    indicator = DomainIndicator(
        domain="adhd",
        indicator_level="Moderate",
        observed_summary="Observed gaze dispersion during sustained visual tasks.",
    )
    report = ReportResponse(
        id="rep-123",
        session_id="sess-456",
        domains=[indicator],
        observations=["Task performance completed."],
        recommendations=["Structured breaks."],
        limitations=["Camera tracking confidence varied."],
        created_at=datetime.utcnow(),
    )
    assert report.domains[0].domain == "adhd"
    assert "screening prototype" in report.disclaimer.lower()


@pytest.mark.parametrize("origin", ["http://localhost:8080", "http://localhost:5173"])
def test_cors_headers(client: TestClient, origin: str):
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "GET",
    }
    response = client.options("/api/health", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == origin


# ============================================================================
# Session API Tests (Milestone 1B)
# ============================================================================

def test_create_session_success(client: TestClient):
    payload = {
        "child_nickname": "Alex",
        "child_age": 7,
        "guardian_consent": True,
    }
    response = client.post("/api/sessions", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert len(data["id"]) == 36  # UUID length
    assert data["child_nickname"] == "Alex"
    assert data["child_age"] == 7
    assert data["guardian_consent"] is True
    assert data["status"] == "created"
    assert data["current_stage"] is None
    assert data["stage_runs"] == []


@pytest.mark.parametrize("invalid_age", [2, 4, 11, 15, 0, -1])
def test_create_session_age_restriction(client: TestClient, invalid_age: int):
    payload = {
        "child_nickname": "Sam",
        "child_age": invalid_age,
        "guardian_consent": True,
    }
    response = client.post("/api/sessions", json=payload)
    assert response.status_code == 422


def test_create_session_requires_guardian_consent(client: TestClient):
    payload = {
        "child_nickname": "Jamie",
        "child_age": 8,
        "guardian_consent": False,
    }
    response = client.post("/api/sessions", json=payload)
    assert response.status_code == 422


def test_get_session_by_id(client: TestClient):
    create_resp = client.post(
        "/api/sessions",
        json={"child_nickname": "Leo", "child_age": 6, "guardian_consent": True},
    )
    session_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/sessions/{session_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == session_id
    assert get_resp.json()["child_nickname"] == "Leo"


def test_get_nonexistent_session_returns_404(client: TestClient):
    response = client.get("/api/sessions/non-existent-uuid-12345")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_sessions(client: TestClient):
    # Create two sessions
    client.post("/api/sessions", json={"child_nickname": "One", "child_age": 5, "guardian_consent": True})
    client.post("/api/sessions", json={"child_nickname": "Two", "child_age": 9, "guardian_consent": True})

    list_resp = client.get("/api/sessions")
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


def test_update_session(client: TestClient):
    create_resp = client.post(
        "/api/sessions",
        json={"child_nickname": "Maya", "child_age": 7, "guardian_consent": True},
    )
    session_id = create_resp.json()["id"]

    update_resp = client.patch(
        f"/api/sessions/{session_id}",
        json={"status": "in_progress", "current_stage": "dyslexia"},
    )
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["status"] == "in_progress"
    assert updated["current_stage"] == "dyslexia"


def test_delete_session_and_cascade(client: TestClient, db_session: Session):
    # Create session
    create_resp = client.post(
        "/api/sessions",
        json={"child_nickname": "Jordan", "child_age": 10, "guardian_consent": True},
    )
    session_id = create_resp.json()["id"]

    # Add related records directly via db_session
    stage_run = StageRunModel(session_id=session_id, stage_name="adhd", status="completed")
    cv_block = CVBlockModel(session_id=session_id, block_index=0, tracking_quality=0.95)
    answer = AnswerModel(session_id=session_id, stage_name="adhd", question_id="q1", is_correct=True)
    score = ScoreModel(session_id=session_id, stage_name="adhd", domain="adhd", raw_score=8.5)
    report = ReportModel(session_id=session_id, report_text="Sample report", is_fallback=False)

    db_session.add_all([stage_run, cv_block, answer, score, report])
    db_session.commit()

    # Create dummy storage directory
    session_storage = get_session_storage_dir(session_id)
    session_storage.mkdir(parents=True, exist_ok=True)
    dummy_file = session_storage / "test_data.json"
    dummy_file.write_text("{}")
    assert dummy_file.exists()

    # Delete session via API
    delete_resp = client.delete(f"/api/sessions/{session_id}")
    assert delete_resp.status_code == 200

    # Verify session is deleted
    assert client.get(f"/api/sessions/{session_id}").status_code == 404

    # Verify cascade deletion across all 6 tables
    assert db_session.query(SessionModel).filter_by(id=session_id).count() == 0
    assert db_session.query(StageRunModel).filter_by(session_id=session_id).count() == 0
    assert db_session.query(CVBlockModel).filter_by(session_id=session_id).count() == 0
    assert db_session.query(AnswerModel).filter_by(session_id=session_id).count() == 0
    assert db_session.query(ScoreModel).filter_by(session_id=session_id).count() == 0
    assert db_session.query(ReportModel).filter_by(session_id=session_id).count() == 0

    # Verify session storage folder was cleaned up
    assert not session_storage.exists()


def test_storage_deletion_path_traversal_protection():
    from app.db.crud import cleanup_session_storage, get_session_storage_dir
    import pytest

    with pytest.raises(ValueError):
        get_session_storage_dir("../../../etc")

    # cleanup_session_storage must safely ignore/suppress traversal attempts
    cleanup_session_storage("../../../etc")


def test_session_persistence_across_restart(tmp_path):
    import uuid
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.db.database import Base
    from app.db.models import SessionModel

    db_file = tmp_path / "test_restart.db"
    db_url = f"sqlite:///{db_file}"

    # Step 1: Start engine 1, create tables and insert session
    engine1 = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine1)
    Session1 = sessionmaker(bind=engine1)

    with Session1() as session:
        test_session = SessionModel(
            child_nickname="RestartTester",
            child_age=8,
            guardian_consent=True,
            status="created",
        )
        session.add(test_session)
        session.commit()
        session_id = test_session.id
        assert session_id is not None

    # Step 2: Shutdown engine 1 (simulate process termination)
    engine1.dispose()

    # Step 3: Start engine 2 on the same database file (simulate backend reboot)
    engine2 = create_engine(db_url, connect_args={"check_same_thread": False})
    Session2 = sessionmaker(bind=engine2)

    with Session2() as session:
        reloaded = session.query(SessionModel).filter_by(id=session_id).first()
        assert reloaded is not None
        assert reloaded.child_nickname == "RestartTester"
        assert reloaded.child_age == 8
        assert reloaded.guardian_consent is True
        assert reloaded.status == "created"

    engine2.dispose()


def test_delete_all_sessions(client: TestClient):
    # Create two sessions
    client.post("/api/sessions", json={"child_nickname": "A", "child_age": 6, "guardian_consent": True})
    client.post("/api/sessions", json={"child_nickname": "B", "child_age": 7, "guardian_consent": True})

    delete_resp = client.delete("/api/sessions")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["deleted_count"] >= 2

    # Verify sessions are empty
    list_resp = client.get("/api/sessions")
    assert list_resp.json()["total"] == 0


# ============================================================================
# Frontend/Backend API Compatibility Tests (Milestone 2B-1)
# ============================================================================

def test_frontend_session_creation_payload_compatibility(client: TestClient):
    """Verify backend accepts frontend Profile.tsx payload and returns compatible aliases."""
    frontend_payload = {
        "nickname": "FrontendChild",
        "age": 7,
        "language": "en",
        "taker": "child",
        "consent": True,
    }
    response = client.post("/api/sessions", json=frontend_payload)
    assert response.status_code == 201
    data = response.json()

    # Core UUID fields
    assert "id" in data
    assert "session_id" in data
    assert data["session_id"] == data["id"]
    assert len(data["session_id"]) == 36

    # Nickname and age aliases
    assert data["child_nickname"] == "FrontendChild"
    assert data["nickname"] == "FrontendChild"
    assert data["child_age"] == 7
    assert data["age"] == 7
    assert data["guardian_consent"] is True

    # Stages dictionary for frontend stage tracking
    assert "stages" in data
    assert data["stages"] == {
        "adhd": "pending",
        "dyslexia": "pending",
        "autism": "pending",
    }
    assert data["has_report"] is False


def test_frontend_answer_submission_alias_compatibility():
    """Verify AnswerSubmit schema accepts frontend SubmitAnswerRequest fields and preserves interaction metadata."""
    from app.schemas.answers import AnswerSubmit

    # Frontend SubmitAnswerRequest payload: answer_changes must be preserved in metadata
    answer = AnswerSubmit.model_validate({
        "stage": "dyslexia",
        "question_id": "dys_5_7_01",
        "option_id": "b",
        "response_ms": 1250,
        "answer_changes": 2,
    })
    assert answer.stage_name == "dyslexia"
    assert answer.question_id == "dys_5_7_01"
    assert answer.selected_option == "b"
    assert answer.response_time_ms == 1250
    assert answer.metadata is not None
    assert answer.metadata["answer_changes"] == 2

    # Conflicting alias and canonical field names must be rejected
    with pytest.raises(Exception):
        AnswerSubmit.model_validate({
            "stage": "dyslexia",
            "stage_name": "adhd",
            "question_id": "dys_5_7_01",
            "response_time_ms": 1000,
        })


def test_frontend_block_marker_alias_compatibility():
    """Verify BlockMarkerCreate preserves semantics, does not fabricate block_index, and validates requirements."""
    from app.schemas.metrics import BlockMarkerCreate

    # Frontend block marker with block name, event, and timestamp
    marker = BlockMarkerCreate.model_validate({
        "stage": "adhd",
        "block": "adhd_video_1",
        "event": "start",
        "t": 1730279000000,
    })
    assert marker.stage_name == "adhd"
    assert marker.block_name == "adhd_video_1"
    assert marker.event == "start"
    assert marker.timestamp_ms == 1730279000000
    # block_index must not be silently fabricated as 0
    assert marker.block_index is None

    # Backend-style block marker with numeric block_index
    backend_marker = BlockMarkerCreate.model_validate({
        "stage_name": "adhd",
        "block_index": 2,
        "timestamp_ms": 5000,
    })
    assert backend_marker.block_index == 2
    assert backend_marker.block_name is None

    # Missing both block_index and block_name must fail validation
    with pytest.raises(Exception):
        BlockMarkerCreate.model_validate({
            "stage": "adhd",
            "event": "start",
        })

    # Invalid event string must fail validation
    with pytest.raises(Exception):
        BlockMarkerCreate.model_validate({
            "stage": "adhd",
            "block": "adhd_video_1",
            "event": "pause",
        })


def test_session_response_reflects_actual_reports_and_stages(
    client: TestClient, db_session: Session
):
    """Verify has_report and stage statuses reflect actual database records, not hardcoded defaults."""
    from app.db.models import ReportModel, StageRunModel

    # Create session
    create_resp = client.post(
        "/api/sessions",
        json={"nickname": "ReportChild", "age": 8, "consent": True},
    )
    session_id = create_resp.json()["session_id"]
    assert create_resp.json()["has_report"] is False

    # Attach stage run and report directly to database
    stage_run = StageRunModel(session_id=session_id, stage_name="adhd", status="completed")
    report = ReportModel(session_id=session_id, report_text="Observed engagement report", is_fallback=False)
    db_session.add_all([stage_run, report])
    db_session.commit()

    # Fetch via API: has_report must be True and adhd status must be completed
    get_resp = client.get(f"/api/sessions/{session_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["has_report"] is True
    assert data["stages"]["adhd"] == "completed"
    assert data["stages"]["dyslexia"] == "pending"


def test_session_conflicting_aliases_rejected(client: TestClient):
    """Verify providing conflicting alias and canonical fields produces 422."""
    conflicting_payload = {
        "child_nickname": "Alex",
        "nickname": "Sam",
        "age": 7,
        "consent": True,
    }
    response = client.post("/api/sessions", json=conflicting_payload)
    assert response.status_code == 422


def test_frontend_delete_response_compatibility(client: TestClient):
    """Verify session delete endpoints return { 'ok': True } for frontend api.ts."""
    create_resp = client.post(
        "/api/sessions",
        json={"nickname": "DeleteChild", "age": 8, "consent": True},
    )
    session_id = create_resp.json()["session_id"]

    delete_resp = client.delete(f"/api/sessions/{session_id}")
    assert delete_resp.status_code == 200
    data = delete_resp.json()
    assert data["ok"] is True
    assert "message" in data

    delete_all_resp = client.delete("/api/sessions")
    assert delete_all_resp.status_code == 200
    all_data = delete_all_resp.json()
    assert all_data["ok"] is True
    assert "deleted_count" in all_data


# ============================================================================
# WebSocket Router Registration Tests (Milestone M2B-2A)
# ============================================================================

def test_ws_router_registration_and_path():
    """Verify WebSocket router is registered without /api prefix exactly once."""
    from app.main import app

    ws_routes = [r.path for r in app.routes if "ws/stream" in getattr(r, "path", "")]
    assert len(ws_routes) == 1
    assert ws_routes[0] == "/ws/stream/{session_id}"
    assert "/api/ws/stream/{session_id}" not in [r.path for r in app.routes]


def test_ws_stream_connection_and_unmeasured_gaze(client: TestClient, db_session: Session):
    """Verify live WS connection over main app, rejection of invalid IDs, and truthful telemetry."""
    import uuid
    from unittest.mock import patch
    from starlette.websockets import WebSocketDisconnect
    from app.schemas.session import SessionCreate
    from app.services.session_service import SessionService
    from tests.test_ws_stream import _create_jpeg_b64

    with patch("app.api.ws_stream.SessionLocal", lambda: db_session):
        # 1. Non-existent session must be rejected with 1008 (Policy Violation)
        nonexistent = str(uuid.uuid4())
        try:
            with client.websocket_connect(f"/ws/stream/{nonexistent}?stage=adhd"):
                pass
            pytest.fail("Connection to non-existent session should have been rejected")
        except WebSocketDisconnect as exc:
            assert exc.code == 1008

        # 2. Valid created session establishes connection and receives truthful telemetry
        created = SessionService.create_session(
            db_session,
            SessionCreate(child_nickname="WSTester", child_age=7, guardian_consent=True),
        )
        session_id = created.id

        with client.websocket_connect(f"/ws/stream/{session_id}?stage=adhd") as ws:
            frame_b64 = _create_jpeg_b64(320, 240, (120, 120, 120))
            ws.send_json({"t": 1730279000000, "block": "adhd_video_1", "frame": frame_b64})
            response = ws.receive_json()

            assert response["lighting"] == "ok"
            assert response["face_found"] is False
            # Unmeasured gaze must strictly be null/None, never fabricated
            assert response["gaze_on_screen"] is None
            assert response["tracking_quality"] is None

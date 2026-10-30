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

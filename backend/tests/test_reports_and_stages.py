import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import AnswerModel, CVBlockModel, SessionModel
from app.main import app


def test_ws_stream_is_mounted_on_app(client: TestClient, db_session: Session):
    """Verify that ws_stream route is mounted and functional on the main FastAPI app."""
    # Create valid session in database
    sess = SessionModel(
        child_nickname="WsTestChild",
        child_age=7,
        guardian_consent=True,
        status="in_progress",
    )
    db_session.add(sess)
    db_session.commit()
    session_id = sess.id

    # Verify websocket connection handshakes with app at /ws/stream/{session_id}
    from tests.test_ws_stream import _create_jpeg_b64
    valid_frame = _create_jpeg_b64(width=320, height=240, color=(128, 128, 128), prefix="data:image/jpeg;base64,")

    with client.websocket_connect(f"/ws/stream/{session_id}?stage=adhd") as ws:
        # Send initial ping/frame and receive telemetry feedback
        ws.send_json({
            "t": 1730279000000,
            "block": "adhd_task_1",
            "frame": valid_frame,
        })
        msg = ws.receive_json()
        assert "face_found" in msg
        assert "lighting" in msg


def test_question_bank_endpoint(client: TestClient):
    """Verify GET /api/questions/{stage_name} returns questions without server-side keys."""
    resp = client.get("/api/questions/dyslexia?age=7")
    assert resp.status_code == 200
    data = resp.json()
    assert data["stage_name"] == "dyslexia"
    assert data["age_band"] == "5_7"
    assert len(data["questions"]) > 0

    # Guarantee server-side correct answers are never leaked to client
    for q in data["questions"]:
        assert "correct_option_id" not in q
        assert "is_correct" not in q
        assert "prompt_text" in q
        assert "options" in q


def test_full_stage_and_answer_flow(client: TestClient, db_session: Session):
    """Test start stage, submit answers, finish stage, and block marker."""
    # 1. Create session
    sess_resp = client.post(
        "/api/sessions",
        json={"nickname": "Leo", "age": 7, "consent": True},
    )
    assert sess_resp.status_code == 201
    session_id = sess_resp.json()["session_id"]

    # 2. Start stage
    start_resp = client.post(f"/api/sessions/{session_id}/stages/dyslexia/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "in_progress"

    # 3. Submit answer with metadata
    ans_resp = client.post(
        f"/api/sessions/{session_id}/answers",
        json={
            "stage": "dyslexia",
            "question_id": "dys_5_7_01",
            "option_id": "opt_s",
            "response_ms": 1400,
            "answer_changes": 1,
        },
    )
    assert ans_resp.status_code == 201
    ans_data = ans_resp.json()
    assert ans_data["question_id"] == "dys_5_7_01"
    assert ans_data["selected_option"] == "opt_s"

    # Verify server-side evaluation in database
    db_ans = db_session.query(AnswerModel).filter_by(session_id=session_id).first()
    assert db_ans is not None
    assert db_ans.is_correct is True

    # 4. Submit block marker
    marker_resp = client.post(
        f"/api/sessions/{session_id}/block-marker",
        json={
            "stage": "dyslexia",
            "block": "dys_reading_1",
            "event": "start",
            "t": 1730279000000,
        },
    )
    assert marker_resp.status_code == 200
    assert marker_resp.json()["ok"] is True

    # 5. Finish stage
    finish_resp = client.post(
        f"/api/sessions/{session_id}/stages/dyslexia/finish",
        json={
            "duration_seconds": 45.2,
            "metrics_summary": {"completed_items": 1},
        },
    )
    assert finish_resp.status_code == 200
    assert finish_resp.json()["status"] == "completed"
    assert finish_resp.json()["duration_seconds"] == 45.2


def test_report_generation_and_retrieval(client: TestClient, db_session: Session):
    """Verify report generation, non-diagnostic policy, and frontend compatibility."""
    # Create session
    sess_resp = client.post(
        "/api/sessions",
        json={"nickname": "Maya", "age": 8, "consent": True},
    )
    session_id = sess_resp.json()["session_id"]

    # Add dummy CV block metrics directly to DB to verify CV aggregation in report
    cv_block = CVBlockModel(
        session_id=session_id,
        block_index=0,
        tracking_quality=0.94,
        gaze_data={"on_screen_ratio": 0.82, "look_away_count": 2},
    )
    db_session.add(cv_block)
    db_session.commit()

    # Generate report via POST /api/sessions/{session_id}/report
    gen_resp = client.post(f"/api/sessions/{session_id}/report")
    assert gen_resp.status_code == 200
    report = gen_resp.json()

    # Verify core contract fields
    assert report["session_id"] == session_id
    assert len(report["summary"]) > 20
    assert len(report["domains"]) == 3
    assert len(report["indicators"]) == 3
    assert report["most_likely"] in ["adhd", "dyslexia", "autism", "none"]
    assert report["least_likely"] in ["adhd", "dyslexia", "autism"]
    assert len(report["recommendations"]) >= 3
    assert len(report["observations"]) >= 2
    assert "screening prototype" in report["disclaimer"].lower()

    # Verify Clinical Safety: no diagnostic labels or probabilities
    summary_lower = report["summary"].lower()
    assert "diagnos" not in summary_lower or "not a diagnosis" in summary_lower
    assert "disability probability" not in summary_lower

    # Verify GET /api/sessions/{session_id}/report returns existing report
    get_resp = client.get(f"/api/sessions/{session_id}/report")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == report["id"]

    # Verify session reflects has_report = True
    session_check = client.get(f"/api/sessions/{session_id}").json()
    assert session_check["has_report"] is True


def test_report_alias_endpoints(client: TestClient):
    """Verify /api/reports/{session_id} compatibility aliases."""
    sess_resp = client.post(
        "/api/sessions",
        json={"nickname": "AliasChild", "age": 6, "consent": True},
    )
    session_id = sess_resp.json()["session_id"]

    gen_resp = client.post(f"/api/reports/{session_id}/generate")
    assert gen_resp.status_code == 200
    assert gen_resp.json()["session_id"] == session_id

    get_resp = client.get(f"/api/reports/{session_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == gen_resp.json()["id"]

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

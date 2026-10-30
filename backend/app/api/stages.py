from datetime import datetime
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.data.questions import (
    get_correct_option_id,
    get_questions_for_stage,
    strip_correct_answers,
)
from app.db.database import get_db
from app.db.models import AnswerModel, SessionModel, StageRunModel
from app.schemas.answers import AnswerResponse, AnswerSubmit, QuestionBankResponse
from app.schemas.metrics import BlockMarkerCreate
from app.schemas.stage import StageRunResponse

router = APIRouter(tags=["Stages & Assessment"])


@router.get(
    "/questions/{stage_name}",
    response_model=Dict[str, Any],
    summary="Get sanitized question bank for a stage (correct keys excluded)",
)
def get_stage_questions(
    stage_name: str,
    age: Optional[int] = Query(None, ge=5, le=10),
) -> Dict[str, Any]:
    raw_questions = get_questions_for_stage(stage_name, age)
    sanitized = strip_correct_answers(raw_questions)
    target_age = age if age is not None else 8
    age_band = "5_7" if target_age <= 7 else "8_12"

    return {
        "stage_name": stage_name,
        "age_band": age_band,
        "questions": sanitized,
    }


@router.post(
    "/sessions/{session_id}/stages/{stage_name}/start",
    response_model=StageRunResponse,
    summary="Start an assessment stage run",
)
def start_stage(
    session_id: str,
    stage_name: str,
    db: Session = Depends(get_db),
) -> StageRunResponse:
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )

    session.status = "in_progress"
    session.current_stage = stage_name

    stage_run = (
        db.query(StageRunModel)
        .filter_by(session_id=session_id, stage_name=stage_name)
        .first()
    )
    if not stage_run:
        stage_run = StageRunModel(
            session_id=session_id,
            stage_name=stage_name,
            status="in_progress",
            started_at=datetime.utcnow(),
        )
        db.add(stage_run)
    else:
        stage_run.status = "in_progress"
        stage_run.started_at = datetime.utcnow()

    db.commit()
    db.refresh(stage_run)
    return stage_run


@router.post(
    "/sessions/{session_id}/stages/{stage_name}/finish",
    response_model=StageRunResponse,
    summary="Finish an assessment stage run",
)
def finish_stage(
    session_id: str,
    stage_name: str,
    payload: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db),
) -> StageRunResponse:
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )

    stage_run = (
        db.query(StageRunModel)
        .filter_by(session_id=session_id, stage_name=stage_name)
        .first()
    )
    now = datetime.utcnow()
    duration: Optional[float] = None
    metrics_summary: Optional[Dict[str, Any]] = None

    if payload:
        duration = payload.get("duration_seconds")
        metrics_summary = payload.get("metrics_summary")

    if not stage_run:
        stage_run = StageRunModel(
            session_id=session_id,
            stage_name=stage_name,
            status="completed",
            started_at=now,
            completed_at=now,
            duration_seconds=duration or 0.0,
            metrics_summary=metrics_summary,
        )
        db.add(stage_run)
    else:
        stage_run.status = "completed"
        stage_run.completed_at = now
        if duration is not None:
            stage_run.duration_seconds = float(duration)
        elif stage_run.started_at:
            delta = (now - stage_run.started_at).total_seconds()
            stage_run.duration_seconds = round(delta, 2)
        if metrics_summary is not None:
            stage_run.metrics_summary = metrics_summary

    db.commit()
    db.refresh(stage_run)
    return stage_run


@router.post(
    "/sessions/{session_id}/answers",
    response_model=AnswerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit an answer item (evaluated server-side)",
)
def submit_answer(
    session_id: str,
    answer_in: AnswerSubmit,
    db: Session = Depends(get_db),
) -> AnswerResponse:
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )

    correct_option = get_correct_option_id(answer_in.question_id)
    is_correct = (
        (answer_in.selected_option == correct_option)
        if correct_option and answer_in.selected_option
        else None
    )

    answer = AnswerModel(
        session_id=session_id,
        stage_name=answer_in.stage_name,
        question_id=answer_in.question_id,
        selected_option=answer_in.selected_option,
        is_correct=is_correct,
        response_time_ms=answer_in.response_time_ms,
        metadata_json=answer_in.metadata,
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return answer


@router.post(
    "/sessions/{session_id}/block-marker",
    summary="Submit a stimulus block marker",
)
def submit_block_marker(
    session_id: str,
    marker: BlockMarkerCreate,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )

    return {
        "ok": True,
        "status": "acknowledged",
        "session_id": session_id,
        "block_name": marker.block_name,
    }

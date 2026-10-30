from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import SessionModel, StageRunModel
from app.schemas.stage import StageRunResponse

router = APIRouter(prefix="/sessions/{session_id}/stages", tags=["Stages"])

VALID_STAGES = {"adhd", "dyslexia", "autism"}


@router.post(
    "/{stage_name}/start",
    response_model=StageRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Start an assessment stage",
)
def start_stage(
    session_id: str,
    stage_name: str,
    db: Session = Depends(get_db),
) -> StageRunResponse:
    if stage_name not in VALID_STAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid stage name '{stage_name}'. Must be one of: {sorted(VALID_STAGES)}",
        )

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )

    now = datetime.utcnow()
    session.current_stage = stage_name
    if session.status != "completed":
        session.status = "in_progress"

    stage_run = (
        db.query(StageRunModel)
        .filter(
            StageRunModel.session_id == session_id,
            StageRunModel.stage_name == stage_name,
        )
        .first()
    )
    if not stage_run:
        stage_run = StageRunModel(
            session_id=session_id,
            stage_name=stage_name,
            status="in_progress",
            started_at=now,
        )
        db.add(stage_run)
    else:
        stage_run.status = "in_progress"
        stage_run.started_at = now

    db.commit()
    db.refresh(stage_run)
    return stage_run


@router.post(
    "/{stage_name}/finish",
    response_model=StageRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Finish an assessment stage",
)
def finish_stage(
    session_id: str,
    stage_name: str,
    db: Session = Depends(get_db),
) -> StageRunResponse:
    if stage_name not in VALID_STAGES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid stage name '{stage_name}'. Must be one of: {sorted(VALID_STAGES)}",
        )

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )

    now = datetime.utcnow()
    stage_run = (
        db.query(StageRunModel)
        .filter(
            StageRunModel.session_id == session_id,
            StageRunModel.stage_name == stage_name,
        )
        .first()
    )
    if not stage_run:
        stage_run = StageRunModel(
            session_id=session_id,
            stage_name=stage_name,
            status="completed",
            started_at=now,
            completed_at=now,
            duration_seconds=0.0,
        )
        db.add(stage_run)
    else:
        stage_run.status = "completed"
        stage_run.completed_at = now
        if stage_run.started_at:
            delta = (now - stage_run.started_at).total_seconds()
            stage_run.duration_seconds = max(0.0, delta)

    # Check if all assessment stages completed
    rows = (
        db.query(StageRunModel.stage_name)
        .filter(
            StageRunModel.session_id == session_id,
            StageRunModel.status == "completed",
        )
        .all()
    )
    completed_stages = {r[0] for r in rows}
    completed_stages.add(stage_name)
    if VALID_STAGES.issubset(completed_stages):
        session.status = "completed"

    db.commit()
    db.refresh(stage_run)
    return stage_run

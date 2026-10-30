from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.session import (
    SessionCreate,
    SessionListResponse,
    SessionResponse,
    SessionUpdate,
)
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post(
    "",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new assessment session",
)
def create_session(
    session_in: SessionCreate, db: Session = Depends(get_db)
) -> SessionResponse:
    session = SessionService.create_session(db, session_in)
    return session


@router.get(
    "",
    response_model=SessionListResponse,
    summary="List all assessment sessions",
)
def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> SessionListResponse:
    items, total = SessionService.list_sessions(db, skip=skip, limit=limit)
    return SessionListResponse(items=items, total=total)


@router.get(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Get session details by ID",
)
def get_session(
    session_id: str, db: Session = Depends(get_db)
) -> SessionResponse:
    session = SessionService.get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )
    return session


@router.patch(
    "/{session_id}",
    response_model=SessionResponse,
    summary="Update session status or stage",
)
def update_session(
    session_id: str,
    session_in: SessionUpdate,
    db: Session = Depends(get_db),
) -> SessionResponse:
    session = SessionService.update_session(db, session_id, session_in)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )
    return session


@router.delete(
    "/{session_id}",
    summary="Delete a session and associated records",
)
def delete_session(
    session_id: str, db: Session = Depends(get_db)
) -> dict:
    success = SessionService.delete_session(db, session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session with ID '{session_id}' not found",
        )
    return {
        "ok": True,
        "message": f"Session '{session_id}' and all associated records deleted",
    }


@router.delete(
    "",
    summary="Delete all sessions (data purge/reset)",
)
def delete_all_sessions(db: Session = Depends(get_db)) -> dict:
    deleted_count = SessionService.delete_all_sessions(db)
    return {
        "ok": True,
        "message": "All sessions and associated records deleted",
        "deleted_count": deleted_count,
    }

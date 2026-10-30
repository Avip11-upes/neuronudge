import shutil
from pathlib import Path
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload

from app.db.models import SessionModel
from app.schemas.session import SessionCreate, SessionUpdate

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
STORAGE_ROOT = (BACKEND_DIR / "storage" / "sessions").resolve()


def get_session_storage_dir(session_id: str) -> Path:
    target_dir = (STORAGE_ROOT / session_id).resolve()
    # Path containment check: ensure target remains strictly under STORAGE_ROOT
    if not target_dir.is_relative_to(STORAGE_ROOT) or target_dir == STORAGE_ROOT:
        raise ValueError(f"Invalid session storage directory for ID: {session_id}")
    return target_dir


def cleanup_session_storage(session_id: str) -> None:
    try:
        storage_dir = get_session_storage_dir(session_id)
    except ValueError:
        return
    # Guard against symlink resolution or traversal attacks
    if storage_dir.exists() and storage_dir.is_dir() and not storage_dir.is_symlink():
        shutil.rmtree(storage_dir, ignore_errors=True)


def cleanup_all_session_storage() -> None:
    if STORAGE_ROOT.exists() and STORAGE_ROOT.is_dir() and not STORAGE_ROOT.is_symlink():
        shutil.rmtree(STORAGE_ROOT, ignore_errors=True)
        STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def create_session(db: Session, session_in: SessionCreate) -> SessionModel:
    db_session = SessionModel(
        child_nickname=session_in.child_nickname,
        child_age=session_in.child_age,
        guardian_consent=session_in.guardian_consent,
        status="created",
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_session(db: Session, session_id: str) -> Optional[SessionModel]:
    return (
        db.query(SessionModel)
        .options(joinedload(SessionModel.stage_runs))
        .filter(SessionModel.id == session_id)
        .first()
    )


def list_sessions(
    db: Session, skip: int = 0, limit: int = 100
) -> Tuple[List[SessionModel], int]:
    query = db.query(SessionModel).options(joinedload(SessionModel.stage_runs))
    total = query.count()
    items = query.order_by(SessionModel.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def update_session(
    db: Session, db_session: SessionModel, session_in: SessionUpdate
) -> SessionModel:
    if session_in.status is not None:
        db_session.status = session_in.status
    if session_in.current_stage is not None:
        db_session.current_stage = session_in.current_stage
    db.commit()
    db.refresh(db_session)
    return db_session


def delete_session(db: Session, session_id: str) -> bool:
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not db_session:
        return False
    db.delete(db_session)
    db.commit()
    cleanup_session_storage(session_id)
    return True


def delete_all_sessions(db: Session) -> int:
    count = db.query(SessionModel).count()
    db.query(SessionModel).delete()
    db.commit()
    cleanup_all_session_storage()
    return count

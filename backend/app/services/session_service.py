from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from app.db import crud
from app.db.models import SessionModel
from app.schemas.session import SessionCreate, SessionUpdate


class SessionService:
    @staticmethod
    def create_session(db: Session, session_in: SessionCreate) -> SessionModel:
        return crud.create_session(db, session_in)

    @staticmethod
    def get_session(db: Session, session_id: str) -> Optional[SessionModel]:
        return crud.get_session(db, session_id)

    @staticmethod
    def list_sessions(
        db: Session, skip: int = 0, limit: int = 100
    ) -> Tuple[List[SessionModel], int]:
        return crud.list_sessions(db, skip=skip, limit=limit)

    @staticmethod
    def update_session(
        db: Session, session_id: str, session_in: SessionUpdate
    ) -> Optional[SessionModel]:
        db_session = crud.get_session(db, session_id)
        if not db_session:
            return None
        return crud.update_session(db, db_session, session_in)

    @staticmethod
    def delete_session(db: Session, session_id: str) -> bool:
        return crud.delete_session(db, session_id)

    @staticmethod
    def delete_all_sessions(db: Session) -> int:
        return crud.delete_all_sessions(db)

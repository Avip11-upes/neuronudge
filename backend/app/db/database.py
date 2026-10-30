import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.config import get_settings

settings = get_settings()

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
db_url = settings.database_url

# If using SQLite with relative path (e.g. from custom env), normalize against BACKEND_DIR
if db_url.startswith("sqlite:///./"):
    rel_path = db_url[len("sqlite:///./") :]
    if rel_path.startswith("backend/"):
        rel_path = rel_path[len("backend/") :]
    db_file = (BACKEND_DIR / rel_path).resolve()
    db_url = f"sqlite:///{db_file}"

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

    # Ensure parent directory exists for file-based SQLite databases
    file_path = db_url.replace("sqlite:///", "")
    if file_path and not file_path.startswith(":memory:"):
        db_dir = os.path.dirname(file_path)
        if db_dir:
            Path(db_dir).mkdir(parents=True, exist_ok=True)

engine = create_engine(db_url, connect_args=connect_args)


# Enable foreign key support for SQLite connections
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if db_url.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)

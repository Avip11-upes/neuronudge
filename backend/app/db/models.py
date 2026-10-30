import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    child_nickname = Column(String(100), nullable=False, default="Child")
    child_age = Column(Integer, nullable=False)
    guardian_consent = Column(Boolean, nullable=False, default=False)
    status = Column(String(50), nullable=False, default="created")
    current_stage = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Cascading relationships
    stage_runs = relationship(
        "StageRunModel",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    cv_blocks = relationship(
        "CVBlockModel",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    answers = relationship(
        "AnswerModel",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    scores = relationship(
        "ScoreModel",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    reports = relationship(
        "ReportModel",
        back_populates="session",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class StageRunModel(Base):
    __tablename__ = "stage_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage_name = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    metrics_summary = Column(JSON, nullable=True)

    session = relationship("SessionModel", back_populates="stage_runs")


class CVBlockModel(Base):
    __tablename__ = "cv_blocks"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage_name = Column(String(50), nullable=True)
    block_index = Column(Integer, nullable=False, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    gaze_data = Column(JSON, nullable=True)
    blink_data = Column(JSON, nullable=True)
    head_pose_data = Column(JSON, nullable=True)
    expression_data = Column(JSON, nullable=True)
    motion_data = Column(JSON, nullable=True)
    tracking_quality = Column(Float, nullable=True)

    session = relationship("SessionModel", back_populates="cv_blocks")


class AnswerModel(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage_name = Column(String(50), nullable=False)
    question_id = Column(String(100), nullable=False)
    selected_option = Column(String(200), nullable=True)
    is_correct = Column(Boolean, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("SessionModel", back_populates="answers")


class ScoreModel(Base):
    __tablename__ = "scores"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage_name = Column(String(50), nullable=False)
    domain = Column(String(50), nullable=False)
    raw_score = Column(Float, nullable=False, default=0.0)
    task_metrics = Column(JSON, nullable=True)
    cv_metrics = Column(JSON, nullable=True)
    combined_summary = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("SessionModel", back_populates="scores")


class ReportModel(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    session_id = Column(
        String(36),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    report_text = Column(Text, nullable=True)
    observations = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    model_used = Column(String(50), nullable=True)
    is_fallback = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("SessionModel", back_populates="reports")

"""Report Builder Service for NeuroNudge.

Coordinates:
- Aggregation of session answers and CV blocks from SQLite.
- Deterministic scoring across ADHD, Dyslexia, and Autism domains.
- LLM prompt orchestration via Gemma 4 (with structured fallback).
- Persistence into SQLite models (reports, scores).
- Production of ReportResponse conforming to both REST API contract and frontend UI.
"""

from __future__ import annotations

from datetime import datetime
import logging
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import ReportModel, ScoreModel, SessionModel
from app.schemas.report import ReportResponse
from app.scoring.combine import combine_scores
from app.services.llm_service import LLMService

logger = logging.getLogger(__name__)


class ReportBuilder:
    """Builds, persists, and retrieves non-diagnostic screening reports."""

    @classmethod
    async def generate_report(cls, db: Session, session_id: str) -> ReportResponse:
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found",
            )

        answers = list(session.answers or [])
        cv_blocks = list(session.cv_blocks or [])
        child_age = int(session.child_age or 7)

        # 1. Compute deterministic scores across all domains
        metrics = combine_scores(
            answers=answers,
            cv_blocks=cv_blocks,
            child_age=child_age,
        )

        # 2. Synthesize explanatory narrative using Gemma 4 (or deterministic fallback)
        llm_result = await LLMService.generate_report_synthesis(
            child_age=child_age,
            metrics_summary=metrics,
        )

        summary_text = llm_result.get("summary") or metrics["summary"]
        observations = llm_result.get("observations") or metrics["observations"]
        recommendations = llm_result.get("recommendations") or metrics["recommendations"]
        confidence_note = llm_result.get("confidence_note") or metrics["confidence_note"]
        model_used = llm_result.get("model_used", "gemma-4")
        is_fallback = llm_result.get("is_fallback", False)

        # 3. Persist or update ScoreModel records
        for ind in metrics["domains"]:
            existing_score = (
                db.query(ScoreModel)
                .filter_by(session_id=session_id, domain=ind.domain)
                .first()
            )
            raw_score = float((ind.task_metrics_summary or {}).get("score", 50.0))
            if existing_score:
                existing_score.raw_score = raw_score
                existing_score.task_metrics = ind.task_metrics_summary
                existing_score.cv_metrics = ind.cv_metrics_summary
            else:
                db_score = ScoreModel(
                    session_id=session_id,
                    stage_name=ind.domain,
                    domain=ind.domain,
                    raw_score=raw_score,
                    task_metrics=ind.task_metrics_summary,
                    cv_metrics=ind.cv_metrics_summary,
                )
                db.add(db_score)

        # 4. Persist or update ReportModel
        db_report = (
            db.query(ReportModel).filter(ReportModel.session_id == session_id).first()
        )
        if not db_report:
            db_report = ReportModel(
                session_id=session_id,
                report_text=summary_text,
                observations=observations,
                recommendations=recommendations,
                model_used=model_used,
                is_fallback=is_fallback,
            )
            db.add(db_report)
        else:
            db_report.report_text = summary_text
            db_report.observations = observations
            db_report.recommendations = recommendations
            db_report.model_used = model_used
            db_report.is_fallback = is_fallback

        session.status = "completed"
        db.commit()
        db.refresh(db_report)

        # 5. Build ReportResponse with full compatibility
        response = ReportResponse(
            id=db_report.id,
            session_id=session_id,
            report_text=summary_text,
            summary=summary_text,
            domains=metrics["domains"],
            indicators=metrics["indicators"],
            most_likely=metrics["most_likely"],
            least_likely=metrics["least_likely"],
            observations=observations,
            recommendations=recommendations,
            limitations=metrics["limitations"],
            confidence_note=confidence_note,
            model_used=model_used,
            generated_by=model_used,
            is_fallback=is_fallback,
            created_at=db_report.created_at,
        )

        return response

    @classmethod
    async def get_report(cls, db: Session, session_id: str) -> ReportResponse:
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found",
            )

        db_report = (
            db.query(ReportModel).filter(ReportModel.session_id == session_id).first()
        )
        if not db_report:
            # Generate on demand if report does not exist yet
            return await cls.generate_report(db, session_id)

        # Recalculate indicators for frontend rendering
        answers = list(session.answers or [])
        cv_blocks = list(session.cv_blocks or [])
        child_age = int(session.child_age or 7)
        metrics = combine_scores(
            answers=answers,
            cv_blocks=cv_blocks,
            child_age=child_age,
        )

        return ReportResponse(
            id=db_report.id,
            session_id=session_id,
            report_text=db_report.report_text,
            summary=db_report.report_text,
            domains=metrics["domains"],
            indicators=metrics["indicators"],
            most_likely=metrics["most_likely"],
            least_likely=metrics["least_likely"],
            observations=db_report.observations or metrics["observations"],
            recommendations=db_report.recommendations or metrics["recommendations"],
            limitations=metrics["limitations"],
            confidence_note=metrics["confidence_note"],
            model_used=db_report.model_used or "gemma-4",
            generated_by=db_report.model_used or "gemma-4",
            is_fallback=db_report.is_fallback,
            created_at=db_report.created_at,
        )

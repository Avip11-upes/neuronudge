from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.report import ReportResponse
from app.services.report_builder import ReportBuilder

router = APIRouter(tags=["Reports"])


@router.post(
    "/sessions/{session_id}/report",
    response_model=ReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a screening report for a session using Gemma 4",
)
async def generate_session_report(
    session_id: str,
    db: Session = Depends(get_db),
) -> ReportResponse:
    return await ReportBuilder.generate_report(db, session_id)


@router.get(
    "/sessions/{session_id}/report",
    response_model=ReportResponse,
    summary="Retrieve or generate a screening report for a session",
)
async def get_session_report(
    session_id: str,
    db: Session = Depends(get_db),
) -> ReportResponse:
    return await ReportBuilder.get_report(db, session_id)


# API compatibility aliases
@router.post(
    "/reports/{session_id}/generate",
    response_model=ReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate report alias",
)
async def generate_report_alias(
    session_id: str,
    db: Session = Depends(get_db),
) -> ReportResponse:
    return await ReportBuilder.generate_report(db, session_id)


@router.get(
    "/reports/{session_id}",
    response_model=ReportResponse,
    summary="Get report alias",
)
async def get_report_alias(
    session_id: str,
    db: Session = Depends(get_db),
) -> ReportResponse:
    return await ReportBuilder.get_report(db, session_id)

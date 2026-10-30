from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

DEFAULT_DISCLAIMER = (
    "NeuroNudge is an exploratory screening prototype, NOT a clinically validated medical device. "
    "This report presents measured task metrics and experimental computer vision observations. "
    "It does not compute medical probabilities, diagnose conditions, or replace professional evaluation. "
    "Consult a qualified pediatric healthcare or educational specialist for formal clinical evaluation."
)


class DomainIndicator(BaseModel):
    domain: str = Field(..., description="Screening domain: adhd, dyslexia, or autism")
    indicator_level: str = Field(
        ...,
        description="Observed behavioral/task indicator band: Low, Moderate, High, or Incomplete. Not a clinical diagnosis or disability likelihood.",
    )
    observed_summary: str = Field(
        ..., description="Objective, non-diagnostic description of observed task performance and gaze patterns"
    )
    task_metrics_summary: Optional[Dict[str, Any]] = Field(
        default=None, description="Deterministic task metrics from user interactions"
    )
    cv_metrics_summary: Optional[Dict[str, Any]] = Field(
        default=None, description="Aggregated computer vision metrics (strictly non-PII, numeric features)"
    )


class ReportCreate(BaseModel):
    session_id: str
    domains: List[DomainIndicator] = []
    observations: List[str] = []
    recommendations: List[str] = []
    limitations: List[str] = []
    model_used: Optional[str] = "gemma-4"
    is_fallback: bool = False


class ReportResponse(BaseModel):
    id: str
    session_id: str
    report_text: Optional[str] = None
    domains: List[DomainIndicator] = []
    observations: List[str] = []
    recommendations: List[str] = []
    limitations: List[str] = []
    model_used: Optional[str] = "gemma-4"
    is_fallback: bool = False
    disclaimer: str = DEFAULT_DISCLAIMER
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

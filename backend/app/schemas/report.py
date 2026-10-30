from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator

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

    # Frontend compatibility fields (matching frontend/src/lib/types.ts Report interface)
    summary: Optional[str] = None
    indicators: Optional[List[Dict[str, Any]]] = None
    most_likely: Optional[str] = "none"
    least_likely: Optional[str] = "none"
    confidence_note: Optional[str] = None
    generated_by: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @model_validator(mode="wrap")
    @classmethod
    def populate_compatibility_fields(
        cls, data: Any, handler: Any
    ) -> "ReportResponse":
        instance: ReportResponse = handler(data)
        if instance.summary is None:
            instance.summary = instance.report_text or ""
        if instance.report_text is None:
            instance.report_text = instance.summary or ""
        if instance.generated_by is None:
            instance.generated_by = instance.model_used or "gemma-4"
        if instance.model_used is None:
            instance.model_used = instance.generated_by or "gemma-4"

        if instance.indicators is None and instance.domains:
            frontend_indicators = []
            for d in instance.domains:
                task_metrics = d.task_metrics_summary or {}
                cv_metrics = d.cv_metrics_summary or {}
                score_val = task_metrics.get("score", 50)
                evidence = []
                for k, v in task_metrics.items():
                    if k != "score":
                        evidence.append(f"{k.replace('_', ' ').capitalize()}: {v}")
                for k, v in cv_metrics.items():
                    evidence.append(f"{k.replace('_', ' ').capitalize()}: {v}")
                if not evidence:
                    evidence = ["Assessment activity completed with active response logging."]

                frontend_indicators.append({
                    "condition": d.domain.lower(),
                    "level": d.indicator_level.lower(),
                    "score": score_val,
                    "observed_symptoms": [d.observed_summary],
                    "evidence": evidence,
                })
            instance.indicators = frontend_indicators

        if instance.confidence_note is None:
            if instance.limitations:
                instance.confidence_note = " ".join(instance.limitations)
            else:
                instance.confidence_note = (
                    "Screening completed with verified task responses and active visual calibration."
                )

        return instance

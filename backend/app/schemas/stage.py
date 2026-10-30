from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class StageRunBase(BaseModel):
    stage_name: str = Field(..., description="Name of the assessment stage (e.g. dyslexia, adhd, autism)")
    status: str = Field(default="pending", description="Status of the stage run")


class StageRunCreate(StageRunBase):
    pass


class StageRunUpdate(BaseModel):
    status: Optional[str] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    metrics_summary: Optional[Dict[str, Any]] = None


class StageRunResponse(StageRunBase):
    id: str
    session_id: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    metrics_summary: Optional[Dict[str, Any]] = None
    ok: bool = True
    summary: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_summary(self) -> "StageRunResponse":
        if self.summary is None and self.metrics_summary is not None:
            self.summary = self.metrics_summary
        elif self.summary is None:
            self.summary = {}
        return self

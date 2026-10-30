from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.stage import StageRunResponse


class SessionBase(BaseModel):
    child_nickname: str = Field(default="Child", min_length=1, max_length=100)
    child_age: int = Field(..., ge=5, le=10, description="Child age must be between 5 and 10 years old")
    guardian_consent: bool = Field(..., description="Explicit guardian consent is mandatory")

    @field_validator("guardian_consent")
    @classmethod
    def validate_guardian_consent(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Guardian consent must be explicitly granted before starting a session.")
        return v


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    status: Optional[str] = None
    current_stage: Optional[str] = None


class SessionResponse(BaseModel):
    id: str
    child_nickname: str
    child_age: int
    guardian_consent: bool
    status: str
    current_stage: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    stage_runs: List[StageRunResponse] = []

    model_config = ConfigDict(from_attributes=True)


class SessionListResponse(BaseModel):
    items: List[SessionResponse]
    total: int

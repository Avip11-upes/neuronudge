from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.schemas.stage import StageRunResponse


class SessionBase(BaseModel):
    child_nickname: str = Field(
        default="Child",
        min_length=1,
        max_length=100,
    )
    child_age: int = Field(
        ...,
        ge=5,
        le=10,
        description="Child age must be between 5 and 10 years old",
    )
    guardian_consent: bool = Field(
        ...,
        description="Explicit guardian consent is mandatory",
    )
    language: Optional[str] = Field(
        default="en",
        description="Preferred language ('en' or 'hi')",
    )
    taker: Optional[str] = Field(
        default="child",
        description="Assessment taker ('child' or 'adult')",
    )

    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            if "nickname" in data:
                if "child_nickname" in data and data["child_nickname"] != data["nickname"]:
                    raise ValueError("Conflicting values provided for 'nickname' and 'child_nickname'")
                if "child_nickname" not in data:
                    data["child_nickname"] = data["nickname"]
            if "age" in data:
                if "child_age" in data and data["child_age"] != data["age"]:
                    raise ValueError("Conflicting values provided for 'age' and 'child_age'")
                if "child_age" not in data:
                    data["child_age"] = data["age"]
            if "consent" in data:
                if "guardian_consent" in data and data["guardian_consent"] != data["consent"]:
                    raise ValueError("Conflicting values provided for 'consent' and 'guardian_consent'")
                if "guardian_consent" not in data:
                    data["guardian_consent"] = data["consent"]
        return data

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
    session_id: Optional[str] = None
    child_nickname: str
    nickname: Optional[str] = None
    child_age: int
    age: Optional[int] = None
    guardian_consent: bool
    status: str
    current_stage: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    stage_runs: List[StageRunResponse] = []
    stages: Optional[Dict[str, str]] = None
    has_report: Optional[bool] = False

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @model_validator(mode="wrap")
    @classmethod
    def populate_compatibility_fields(
        cls, data: Any, handler: Any
    ) -> "SessionResponse":
        instance: SessionResponse = handler(data)
        if instance.session_id is None:
            instance.session_id = instance.id
        if instance.nickname is None:
            instance.nickname = instance.child_nickname
        if instance.age is None:
            instance.age = instance.child_age
        if instance.stages is None:
            default_stages: Dict[str, str] = {
                "adhd": "pending",
                "dyslexia": "pending",
                "autism": "pending",
            }
            if instance.stage_runs:
                for run in instance.stage_runs:
                    st_name = getattr(run, "stage_name", None) or (
                        run.get("stage_name") if isinstance(run, dict) else None
                    )
                    st_status = getattr(run, "status", None) or (
                        run.get("status") if isinstance(run, dict) else None
                    )
                    if st_name in default_stages and st_status:
                        default_stages[st_name] = st_status
            instance.stages = default_stages

        # Accurately reflect whether reports exist on the session record
        if not instance.has_report:
            if hasattr(data, "reports") and data.reports:
                instance.has_report = bool(data.reports)
            elif isinstance(data, dict) and data.get("reports"):
                instance.has_report = bool(data["reports"])
            elif isinstance(data, dict) and data.get("has_report"):
                instance.has_report = bool(data["has_report"])
            else:
                instance.has_report = False
        return instance


class SessionListResponse(BaseModel):
    items: List[SessionResponse]
    total: int

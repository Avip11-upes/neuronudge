from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class QuestionOption(BaseModel):
    id: str = Field(..., description="Option identifier (e.g. 'a', 'b', 'c')")
    label: str = Field(..., description="Display text or symbol")
    audio_url: Optional[str] = Field(None, description="Audio prompt URL for option")


class QuestionItem(BaseModel):
    id: str = Field(..., description="Question identifier (e.g. 'dys_5_7_01')")
    category: str = Field(..., description="Skill category (e.g. 'letter_confusion', 'rhyme_matching')")
    prompt_text: str = Field(..., description="Instructions or stimulus question")
    audio_url: Optional[str] = Field(None, description="Spoken prompt audio URL")
    options: List[QuestionOption] = Field(..., description="Available answer choices (answer key excluded)")


class QuestionBankResponse(BaseModel):
    stage_name: str
    age_band: str
    questions: List[QuestionItem]


class AnswerSubmit(BaseModel):
    stage_name: str = Field(..., description="Stage name (e.g. dyslexia, adhd, autism)")
    question_id: str = Field(..., description="Unique question identifier from question bank")
    selected_option: Optional[str] = Field(None, description="Identifier of the selected option")
    response_time_ms: int = Field(..., ge=0, description="Response time in milliseconds (monotonic timing)")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, description="Interaction metrics (e.g. hover_count, answer_changes)"
    )


class AnswerResponse(BaseModel):
    id: str
    session_id: str
    stage_name: str
    question_id: str
    selected_option: Optional[str] = None
    response_time_ms: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnswerListResponse(BaseModel):
    items: List[AnswerResponse]
    total: int

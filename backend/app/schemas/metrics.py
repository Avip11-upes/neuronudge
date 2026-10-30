from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class FramePacket(BaseModel):
    t: int = Field(..., ge=0, description="Unix epoch timestamp in milliseconds")
    block: str = Field(..., description="Active stimulus block identifier (e.g. adhd_video_2)")
    frame: str = Field(..., description="Base64 encoded JPEG Data URL or raw Base64 JPEG string")


class TrackingFeedback(BaseModel):
    face_found: Optional[bool] = Field(None, description="Null when not evaluated, boolean when measured")
    lighting: Optional[str] = Field("unavailable", description="Lighting evaluation: ok, low, glare, or unavailable")
    gaze_on_screen: Optional[bool] = Field(None, description="Null when unmeasured, boolean when evaluated")
    tracking_quality: Optional[float] = Field(None, ge=0.0, le=1.0, description="Tracking confidence score 0.0-1.0")
    coarse_gaze: Optional[str] = Field(None, description="Primary gaze zone: center, left, right, top, bottom, away")
    alert: Optional[str] = Field(None, description="User guidance alert: face_not_centered, low_light, etc.")


class BlockMarkerCreate(BaseModel):
    stage_name: str = Field(..., description="Stage name (e.g. adhd, autism)")
    block_index: Optional[int] = Field(
        None,
        ge=0,
        description="Sequential 0-indexed stimulus block; optional when identified by block_name",
    )
    block_name: Optional[str] = Field(
        None,
        description="Stimulus block identifier (e.g. adhd_video_2)",
    )
    event: Optional[str] = Field(
        None,
        description="Block event ('start' or 'end')",
    )
    timestamp_ms: Optional[int] = Field(
        None,
        ge=0,
        description="Client monotonic timestamp in milliseconds",
    )

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    @model_validator(mode="before")
    @classmethod
    def handle_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            data = dict(data)
            if "stage" in data:
                if "stage_name" in data and data["stage_name"] != data["stage"]:
                    raise ValueError("Conflicting values provided for 'stage' and 'stage_name'")
                if "stage_name" not in data:
                    data["stage_name"] = data["stage"]
            if "block" in data:
                if "block_name" in data and data["block_name"] != data["block"]:
                    raise ValueError("Conflicting values provided for 'block' and 'block_name'")
                if "block_name" not in data:
                    data["block_name"] = data["block"]
            if "t" in data:
                if "timestamp_ms" in data and data["timestamp_ms"] != data["t"]:
                    raise ValueError("Conflicting values provided for 't' and 'timestamp_ms'")
                if "timestamp_ms" not in data:
                    data["timestamp_ms"] = data["t"]
        return data

    @model_validator(mode="after")
    def validate_block_marker_requirements(self) -> "BlockMarkerCreate":
        if self.block_index is None and not self.block_name:
            raise ValueError("Either block_index or block_name (or block) must be provided.")
        if self.event is not None and self.event not in ("start", "end"):
            raise ValueError("event must be either 'start' or 'end'.")
        return self


class GazeData(BaseModel):
    on_screen_ratio: Optional[float] = Field(None, ge=0.0, le=1.0, description="Fraction of evaluated time gaze is on screen")
    fixation_count: Optional[int] = Field(None, ge=0, description="Number of visual fixations detected")
    look_away_count: Optional[int] = Field(None, ge=0, description="Number of look-aways detected")
    dispersion_score: Optional[float] = Field(None, ge=0.0, description="Spatial spread of gaze points")
    eye_contact_ratio: Optional[float] = Field(None, ge=0.0, le=1.0, description="Direct eye contact ratio for autism social tasks")
    coarse_region: Optional[str] = Field(None, description="Primary gaze zone: center, left, right, top, bottom, away")


class BlinkData(BaseModel):
    blink_count: Optional[int] = Field(None, ge=0, description="Total blinks detected in block")
    blink_rate_per_min: Optional[float] = Field(None, ge=0.0, description="Estimated blink rate per minute")


class HeadPoseData(BaseModel):
    pitch: Optional[float] = Field(None, description="Head pitch in degrees")
    yaw: Optional[float] = Field(None, description="Head yaw in degrees")
    roll: Optional[float] = Field(None, description="Head roll in degrees")
    movement_variability: Optional[float] = Field(None, ge=0.0, description="Movement instability score")


class MotionData(BaseModel):
    repetitive_motion_detected: Optional[bool] = Field(None, description="Flag for repetitive head or body motion")
    motion_score: Optional[float] = Field(None, ge=0.0, description="Overall movement intensity score")


class ExpressionData(BaseModel):
    engagement_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Facial attentiveness score")
    expression_range: Optional[float] = Field(None, ge=0.0, description="Observed facial variability")


class CVBlockMetrics(BaseModel):
    block_index: int = Field(..., ge=0)
    stage_name: Optional[str] = None
    timestamp: Optional[datetime] = None
    tracking_quality: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Confidence in face tracking")
    face_detected: Optional[bool] = Field(default=None, description="Null when not evaluated, boolean when measured")
    lighting: Optional[str] = Field(default="unavailable", description="Lighting evaluation")
    gaze: Optional[GazeData] = None
    blink: Optional[BlinkData] = None
    head_pose: Optional[HeadPoseData] = None
    motion: Optional[MotionData] = None
    expression: Optional[ExpressionData] = None


class CVBlockResponse(BaseModel):
    id: str
    session_id: str
    stage_name: Optional[str] = None
    block_index: int
    timestamp: datetime
    tracking_quality: Optional[float] = None
    gaze_data: Optional[Dict[str, Any]] = None
    blink_data: Optional[Dict[str, Any]] = None
    head_pose_data: Optional[Dict[str, Any]] = None
    expression_data: Optional[Dict[str, Any]] = None
    motion_data: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

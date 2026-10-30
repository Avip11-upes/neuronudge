import pytest
from unittest.mock import AsyncMock, patch

from app.services.llm_service import LLMService


@pytest.mark.anyio
async def test_llm_prompt_zero_pii():
    """Verify prompt never contains child name or identifiers."""
    metrics_summary = {
        "indicators": [
            {
                "condition": "adhd",
                "level": "moderate",
                "task_metrics": {"reaction_time_mean_ms": 680},
                "cv_metrics": {"on_screen_gaze_ratio": 0.65},
            }
        ],
        "most_likely": "adhd",
        "least_likely": "autism",
    }
    prompt = LLMService._build_sanitized_prompt(child_age=7, metrics_summary=metrics_summary)

    # Verify zero PII
    assert "Alex" not in prompt
    assert "child_age" in prompt or "age 7" in prompt
    assert "reaction_time_mean_ms" in prompt
    assert "CRITICAL CLINICAL & PRIVACY SAFEGUARDS" in prompt
    assert "NO DIAGNOSES" in prompt


@pytest.mark.anyio
async def test_llm_deterministic_fallback_when_unreachable():
    """Verify fallback executes gracefully when Ollama and Gemini are offline."""
    metrics_summary = {
        "summary": "Default deterministic test summary.",
        "observations": ["Obs 1", "Obs 2"],
        "recommendations": ["Rec 1", "Rec 2"],
        "confidence_note": "Stable tracking.",
    }
    result = await LLMService.generate_report_synthesis(child_age=8, metrics_summary=metrics_summary)
    assert result["is_fallback"] is True
    assert result["model_used"] == "fallback"
    assert result["summary"] == "Default deterministic test summary."
    assert len(result["observations"]) == 2
    assert len(result["recommendations"]) == 2


@pytest.mark.anyio
async def test_llm_live_response_parsing():
    """Verify successful LLM response sets model_used='gemma-4' and is_fallback=False."""
    mock_response = {
        "summary": "Observed steady focus during interactive games.",
        "observations": ["Consistent central gaze alignment."],
        "recommendations": ["Incorporate movement breaks."],
        "confidence_note": "Valid calibration throughout.",
    }

    with patch.object(LLMService, "_call_ollama", new=AsyncMock(return_value=mock_response)):
        result = await LLMService.generate_report_synthesis(child_age=7, metrics_summary={})
        assert result["is_fallback"] is False
        assert result["model_used"] == "gemma-4"
        assert result["summary"] == "Observed steady focus during interactive games."

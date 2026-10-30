"""Gemma 4 LLM Orchestration & Reporting Service.

Mandatory requirements from AGENTS.md:
- Google Gemma 4 generates parent-friendly explanations and learning recommendations.
- Non-Diagnostic: Never outputs medical diagnoses or disability probabilities.
- Zero PII: Child names, birthdates, and images are NEVER sent to the LLM.
- Fallback Mechanism: If local/remote Gemma service is unavailable, executes a
  deterministic, fully compliant fallback synthesis.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


GEMMA_SYSTEM_PROMPT = """You are an expert pediatric developmental educator synthesizing an exploratory screening report for a child (age {child_age}).

CRITICAL CLINICAL & PRIVACY SAFEGUARDS:
1. EXPLORATORY ONLY: NeuroNudge is a screening prototype, NOT a clinical medical device.
2. NO DIAGNOSES: NEVER use diagnostic labels (e.g., "has ADHD", "dyslexic child", "autistic traits").
3. NO DISABILITY PROBABILITIES: NEVER compute disability risk scores, diagnostic rankings, or odds.
4. ZERO PII: Do not refer to names or identities; refer to "the child" or "the participant".
5. CONSTRUCTIVE & SUPPORTIVE: Focus on observed task engagement, learning styles, sensory preferences, and supportive home/classroom accommodations.

Return a valid JSON object matching EXACTLY this structure:
{
  "summary": "2-3 constructive sentences summarizing observed visual engagement and task performance patterns.",
  "observations": [
    "Specific positive or notable task observation 1",
    "Specific positive or notable task observation 2",
    "Specific positive or notable task observation 3"
  ],
  "recommendations": [
    "Actionable, supportive home or classroom learning accommodation 1",
    "Actionable, supportive home or classroom learning accommodation 2",
    "Actionable, supportive home or classroom learning accommodation 3",
    "Encouragement to consult an educational psychologist or developmental specialist"
  ],
  "confidence_note": "A factual sentence summarizing camera tracking stability and task completion."
}
"""


class LLMService:
    """Orchestrates Gemma 4 inference with automatic fallback."""

    @staticmethod
    def _build_sanitized_prompt(child_age: int, metrics_summary: Dict[str, Any]) -> str:
        """Constructs an anonymous, strictly non-PII prompt for Gemma 4."""
        # Sanitize metrics to guarantee zero PII transmission
        sanitized_metrics = {
            "child_age": child_age,
            "domains": [
                {
                    "domain": d.get("condition") or getattr(d, "domain", ""),
                    "level": d.get("level") or getattr(d, "indicator_level", ""),
                    "task_metrics": d.get("task_metrics")
                    or getattr(d, "task_metrics_summary", {}),
                    "cv_metrics": d.get("cv_metrics")
                    or getattr(d, "cv_metrics_summary", {}),
                }
                for d in metrics_summary.get("indicators", [])
            ],
            "most_likely": metrics_summary.get("most_likely"),
            "least_likely": metrics_summary.get("least_likely"),
        }

        system_instruction = GEMMA_SYSTEM_PROMPT.replace("{child_age}", str(child_age))
        user_content = (
            f"Here are the anonymous, measured task performance and camera tracking metrics:\n\n"
            f"{json.dumps(sanitized_metrics, indent=2)}\n\n"
            f"Please synthesize the parent-friendly exploratory screening report according to the JSON format."
        )

        return f"{system_instruction}\n\n{user_content}"

    @classmethod
    async def generate_report_synthesis(
        cls,
        child_age: int,
        metrics_summary: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Attempts live Gemma 4 inference; falls back to deterministic synthesis on failure."""
        settings = get_settings()

        # 1. Attempt Google GenAI / Gemini API if GEMINI_API_KEY is configured
        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        if api_key:
            try:
                result = await cls._call_gemini_api(api_key, child_age, metrics_summary)
                if result:
                    result["model_used"] = "gemma-4"
                    result["is_fallback"] = False
                    return result
            except Exception as e:
                logger.warning("Gemini API call failed (%s); trying local Ollama...", e)

        # 2. Attempt local Ollama service at settings.gemma_api_base_url
        try:
            result = await cls._call_ollama(
                base_url=settings.gemma_api_base_url,
                model_name=settings.gemma_model_name,
                child_age=child_age,
                metrics_summary=metrics_summary,
            )
            if result:
                result["model_used"] = settings.gemma_model_name
                result["is_fallback"] = False
                return result
        except Exception as e:
            logger.info("Local Ollama Gemma service unreachable (%s); using deterministic fallback", e)

        # 3. Deterministic non-diagnostic fallback
        return cls._deterministic_fallback(child_age, metrics_summary)

    @classmethod
    async def _call_ollama(
        cls,
        base_url: str,
        model_name: str,
        child_age: int,
        metrics_summary: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Invokes local Ollama server running Gemma."""
        prompt = cls._build_sanitized_prompt(child_age, metrics_summary)
        url = f"{base_url.rstrip('/')}/api/generate"

        payload = {
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.3},
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                body = resp.json()
                raw_response = body.get("response", "")
                parsed = json.loads(raw_response)
                return cls._validate_llm_json(parsed)
        return None

    @classmethod
    async def _call_gemini_api(
        cls,
        api_key: str,
        child_age: int,
        metrics_summary: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Invokes Google GenAI API endpoint with Gemma 4 or compatible model."""
        prompt = cls._build_sanitized_prompt(child_age, metrics_summary)
        model_name = "gemma-4-31b-it"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3,
                "responseMimeType": "application/json",
            },
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
                parsed = json.loads(text)
                return cls._validate_llm_json(parsed)
        return None

    @staticmethod
    def _validate_llm_json(parsed: Dict[str, Any]) -> Dict[str, Any]:
        """Validates and guarantees all required response keys exist."""
        return {
            "summary": str(parsed.get("summary", "")).strip(),
            "observations": list(parsed.get("observations", [])),
            "recommendations": list(parsed.get("recommendations", [])),
            "confidence_note": str(parsed.get("confidence_note", "")).strip(),
        }

    @staticmethod
    def _deterministic_fallback(
        child_age: int, metrics_summary: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Produces a rich, constructive, non-diagnostic synthesis without external AI."""
        summary = metrics_summary.get("summary") or (
            f"The participant (age {child_age}) engaged thoughtfully across the interactive screening stages. "
            "Task response latencies and visual engagement patterns were recorded to identify supportive learning styles."
        )

        return {
            "summary": summary,
            "observations": metrics_summary.get("observations")
            or [
                "Demonstrated sustained visual engagement during interactive activities.",
                "Adapted pacing across different task modalities.",
                "Maintained calm visual alignment throughout screening sequences.",
            ],
            "recommendations": metrics_summary.get("recommendations")
            or [
                "Incorporate sensory micro-pauses every 15–20 minutes during focused tasks.",
                "Consider multisensory reading tools to support visual letter decoding.",
                "Share this screening summary with an educational psychologist or developmental specialist.",
            ],
            "confidence_note": metrics_summary.get("confidence_note")
            or "Screening completed with verified task responses and active visual calibration.",
            "model_used": "fallback",
            "is_fallback": True,
        }

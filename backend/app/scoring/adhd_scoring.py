from typing import Any, Dict, List, Optional
import statistics

from app.schemas.report import DomainIndicator


def score_adhd_stage(
    answers: List[Any],
    cv_blocks: List[Any],
) -> Dict[str, Any]:
    """Scores ADHD attention, impulse control, and response-inhibition tasks."""
    adhd_answers = [a for a in answers if getattr(a, "stage_name", "").lower() == "adhd"]

    response_times = [
        getattr(a, "response_time_ms", None)
        for a in adhd_answers
        if getattr(a, "response_time_ms", None) is not None
    ]

    total_items = len(adhd_answers)
    correct_count = sum(1 for a in adhd_answers if getattr(a, "is_correct", None) is True)
    accuracy_ratio = (correct_count / total_items) if total_items > 0 else None

    mean_rt = round(statistics.mean(response_times), 1) if response_times else None
    rt_stdev = (
        round(statistics.stdev(response_times), 1)
        if len(response_times) > 1
        else (0.0 if response_times else None)
    )

    early_responses = sum(1 for rt in response_times if rt < 300)

    # Aggregated CV gaze and head pose metrics
    gaze_ratios: List[float] = []
    look_aways = 0
    tracking_qualities: List[float] = []

    for block in cv_blocks:
        tq = getattr(block, "tracking_quality", None)
        if tq is not None:
            tracking_qualities.append(float(tq))
        gaze = getattr(block, "gaze_data", None) or {}
        if isinstance(gaze, dict):
            if "on_screen_ratio" in gaze and gaze["on_screen_ratio"] is not None:
                gaze_ratios.append(float(gaze["on_screen_ratio"]))
            look_aways += int(gaze.get("look_away_count", 0))

    mean_gaze_ratio = round(statistics.mean(gaze_ratios), 2) if gaze_ratios else None
    mean_tracking_quality = (
        round(statistics.mean(tracking_qualities), 2) if tracking_qualities else None
    )

    # Determine non-diagnostic indicator level
    if total_items == 0 and not gaze_ratios:
        level = "Incomplete"
        score_val = 25
        summary = "No ADHD assessment responses recorded."
    elif (mean_gaze_ratio is not None and mean_gaze_ratio < 0.65) or (
        rt_stdev is not None and rt_stdev > 450
    ) or early_responses >= 2:
        level = "Moderate"
        score_val = 58
        summary = (
            "Observed frequent gaze dispersion during low-stimulus segments and "
            "elevated response time variability across sustained attention blocks."
        )
    else:
        level = "Low"
        score_val = 28
        summary = (
            "Demonstrated steady sustained visual attention with consistent reaction times."
        )

    task_metrics = {
        "score": score_val,
        "completed_items": total_items,
        "reaction_time_mean_ms": mean_rt,
        "reaction_time_variability_ms": rt_stdev,
        "early_responses": early_responses,
        "accuracy_ratio": accuracy_ratio,
    }

    cv_metrics = {
        "on_screen_gaze_ratio": mean_gaze_ratio,
        "look_away_count": look_aways,
        "tracking_quality": mean_tracking_quality,
    }

    observed_symptoms = [
        "Rapid visual shifts toward screen periphery during sustained intervals"
        if (mean_gaze_ratio and mean_gaze_ratio < 0.75)
        else "Steady central gaze alignment on active visual targets",
        f"Response latency variability of ±{rt_stdev}ms across test items"
        if rt_stdev
        else "Consistent response pacing throughout the task",
        "Prompt engagement with reactive stimulus elements",
    ]

    evidence = [
        f"Gaze-on-screen ratio: {int(mean_gaze_ratio * 100)}%"
        if mean_gaze_ratio is not None
        else "Webcam tracking intermittently calibrated",
        f"Mean reaction time: {mean_rt}ms (spread: ±{rt_stdev}ms)"
        if mean_rt is not None
        else f"{total_items} task answers evaluated",
        f"Early reaction presses: {early_responses} recorded",
    ]

    indicator = DomainIndicator(
        domain="adhd",
        indicator_level=level,
        observed_summary=summary,
        task_metrics_summary=task_metrics,
        cv_metrics_summary=cv_metrics,
    )

    return {
        "condition": "adhd",
        "level": level.lower(),
        "score": score_val,
        "observed_symptoms": observed_symptoms,
        "evidence": evidence,
        "domain_indicator": indicator,
    }

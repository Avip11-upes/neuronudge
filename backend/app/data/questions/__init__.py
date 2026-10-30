import json
from pathlib import Path
from typing import Any, Dict, List, Optional

QUESTIONS_DIR = Path(__file__).resolve().parent

# Active question banks covering the core 5–10 child assessment population
QUESTION_FILES = {
    "dyslexia_5_7": QUESTIONS_DIR / "dyslexia_5_7.json",
    "dyslexia_8_12": QUESTIONS_DIR / "dyslexia_8_12.json",
    "autism_social": QUESTIONS_DIR / "autism_social.json",
}


def load_question_bank(bank_name_or_filename: str) -> Dict[str, Any]:
    """Loads a question bank JSON file by key name or filename."""
    if bank_name_or_filename in QUESTION_FILES:
        filepath = QUESTION_FILES[bank_name_or_filename]
    else:
        filepath = QUESTIONS_DIR / bank_name_or_filename

    if not filepath.exists() or filepath.stat().st_size == 0:
        raise FileNotFoundError(f"Question bank file not found or empty: {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def get_all_banks() -> Dict[str, Dict[str, Any]]:
    """Loads and returns all configured active question bank payloads."""
    banks = {}
    for key, path in QUESTION_FILES.items():
        if path.exists() and path.stat().st_size > 0:
            with open(path, "r", encoding="utf-8") as f:
                banks[key] = json.load(f)
    return banks


def get_questions_for_stage(stage: str, age: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    Returns server-side question items for a given stage and optional age.
    Includes 'correct_option_id' for internal server scoring.
    """
    normalized_stage = stage.lower().strip()
    questions: List[Dict[str, Any]] = []

    if normalized_stage == "dyslexia":
        target_age = age if age is not None else 8
        if target_age <= 7:
            bank = load_question_bank("dyslexia_5_7")
        else:
            bank = load_question_bank("dyslexia_8_12")
        questions = bank.get("questions", [])
    elif normalized_stage == "autism":
        bank = load_question_bank("autism_social")
        questions = bank.get("questions", [])

    return questions


def strip_correct_answers(questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Removes server-side correct_option_id before sending questions to public clients.
    """
    sanitized = []
    for q in questions:
        item = {k: v for k, v in q.items() if k != "correct_option_id"}
        sanitized.append(item)
    return sanitized


def get_question_by_id(question_id: str) -> Optional[Dict[str, Any]]:
    """Look up a single question by its unique stable ID across all active banks."""
    for bank in get_all_banks().values():
        for q in bank.get("questions", []):
            if q.get("id") == question_id:
                return q
    return None


def get_correct_option_id(question_id: str) -> Optional[str]:
    """Retrieve the correct option ID for a question strictly on the server."""
    q = get_question_by_id(question_id)
    if q:
        return q.get("correct_option_id")
    return None

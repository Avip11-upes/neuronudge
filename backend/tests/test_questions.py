import os
import sys
import unittest
from pathlib import Path

# Ensure backend root is on sys.path for test imports
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.data.questions import (
    QUESTION_FILES,
    get_all_banks,
    get_correct_option_id,
    get_question_by_id,
    get_questions_for_stage,
    load_question_bank,
    strip_correct_answers,
)


class TestQuestionBanks(unittest.TestCase):
    """
    Validation test suite for AR-1 Assessment Question Banks.
    Verifies JSON integrity, structure, schema adherence, age coverage, and server-side metadata.
    """

    def setUp(self):
        self.banks = get_all_banks()

    def test_json_files_exist_and_load(self):
        """Verify that all active question bank JSON files exist and are valid JSON."""
        expected_keys = ["dyslexia_5_7", "dyslexia_8_12", "autism_social"]
        for key in expected_keys:
            self.assertIn(key, self.banks, f"Bank key {key} must be in loaded banks")
            data = self.banks[key]
            self.assertIsInstance(data, dict, f"Bank {key} must load as a dict")
            self.assertIn("stage", data)
            self.assertIn("age_band", data)
            self.assertIn("age_min", data)
            self.assertIn("age_max", data)
            self.assertIn("questions", data)
            self.assertIsInstance(data["questions"], list)
            self.assertGreater(len(data["questions"]), 0, f"Bank {key} must have questions")

    def test_required_question_fields(self):
        """Verify each question has all required fields with correct types."""
        required_fields = ["id", "category", "prompt", "prompt_text", "options", "correct_option_id"]

        for bank_name, bank_data in self.banks.items():
            for q in bank_data["questions"]:
                for field in required_fields:
                    self.assertIn(
                        field,
                        q,
                        f"Question {q.get('id', 'UNKNOWN')} in {bank_name} missing required field '{field}'",
                    )
                self.assertTrue(q["id"].strip(), f"Question ID cannot be empty in {bank_name}")
                self.assertTrue(q["category"].strip(), f"Category cannot be empty in {bank_name}")
                self.assertTrue(q["prompt"].strip(), f"Prompt cannot be empty in {bank_name}")
                self.assertEqual(q["prompt"], q["prompt_text"], f"prompt and prompt_text should match in {q['id']}")
                self.assertIsInstance(q["options"], list, f"Options must be a list in {q['id']}")
                self.assertGreaterEqual(
                    len(q["options"]), 2, f"Question {q['id']} must have at least 2 options"
                )

    def test_question_ids_globally_unique(self):
        """Verify question IDs are globally unique across all active question banks."""
        seen_ids = set()
        duplicate_ids = []

        for bank_name, bank_data in self.banks.items():
            for q in bank_data["questions"]:
                qid = q["id"]
                if qid in seen_ids:
                    duplicate_ids.append(qid)
                seen_ids.add(qid)

        self.assertEqual(
            duplicate_ids,
            [],
            f"Found duplicate question IDs: {duplicate_ids}",
        )

    def test_categories_are_explicit_and_valid(self):
        """Verify that question categories belong to defined domain subsets."""
        valid_dyslexia_categories = {
            "letter_sound_matching",
            "rhyme_phonological_awareness",
            "real_vs_nonword",
            "spelling_choices",
            "sequencing",
            "short_comprehension",
            "letter_recognition",
        }
        valid_autism_categories = {
            "emotion_recognition",
            "perspective_taking",
            "social_situations_rules",
            "figurative_language",
        }

        for bank_name, bank_data in self.banks.items():
            stage = bank_data["stage"]
            for q in bank_data["questions"]:
                cat = q["category"]
                if stage == "dyslexia":
                    self.assertIn(
                        cat,
                        valid_dyslexia_categories,
                        f"Invalid dyslexia category '{cat}' in question {q['id']}",
                    )
                elif stage == "autism":
                    self.assertIn(
                        cat,
                        valid_autism_categories,
                        f"Invalid autism category '{cat}' in question {q['id']}",
                    )

    def test_dyslexia_subsets_covered(self):
        """Verify dyslexia banks cover the required subsets across ages 5-10."""
        categories_5_7 = {q["category"] for q in self.banks["dyslexia_5_7"]["questions"]}
        categories_8_12 = {q["category"] for q in self.banks["dyslexia_8_12"]["questions"]}

        combined_categories = categories_5_7 | categories_8_12
        required_subsets = {
            "letter_sound_matching",
            "rhyme_phonological_awareness",
            "real_vs_nonword",
            "spelling_choices",
            "sequencing",
            "short_comprehension",
        }
        for subset in required_subsets:
            self.assertIn(
                subset,
                combined_categories,
                f"Required dyslexia learning activity subset '{subset}' not found",
            )

    def test_autism_social_subsets_covered(self):
        """Verify developmental/social activities cover required neutral situations."""
        categories = {q["category"] for q in self.banks["autism_social"]["questions"]}
        required_subsets = {
            "emotion_recognition",
            "perspective_taking",
            "social_situations_rules",
            "figurative_language",
        }
        for subset in required_subsets:
            self.assertIn(
                subset,
                categories,
                f"Required developmental/social activity subset '{subset}' not found",
            )

    def test_options_structurally_valid(self):
        """Verify option objects have unique 'id', non-empty 'text', and compatible 'label'."""
        for bank_name, bank_data in self.banks.items():
            for q in bank_data["questions"]:
                option_ids = set()
                for opt in q["options"]:
                    self.assertIsInstance(opt, dict)
                    self.assertIn("id", opt, f"Option in {q['id']} missing 'id'")
                    self.assertIn("text", opt, f"Option in {q['id']} missing 'text'")
                    self.assertIn("label", opt, f"Option in {q['id']} missing 'label'")
                    self.assertTrue(opt["id"].strip(), f"Option id empty in {q['id']}")
                    self.assertTrue(opt["text"].strip(), f"Option text empty in {q['id']}")
                    self.assertEqual(opt["text"], opt["label"], f"Option text and label should match in {q['id']}")
                    self.assertNotIn(
                        opt["id"],
                        option_ids,
                        f"Duplicate option id '{opt['id']}' in question {q['id']}",
                    )
                    option_ids.add(opt["id"])

    def test_correct_answers_reference_valid_options(self):
        """Verify that server-side correct_option_id matches one of the question's options."""
        for bank_name, bank_data in self.banks.items():
            for q in bank_data["questions"]:
                correct_id = q["correct_option_id"]
                valid_ids = {opt["id"] for opt in q["options"]}
                self.assertIn(
                    correct_id,
                    valid_ids,
                    f"Question {q['id']} correct_option_id '{correct_id}' not found in options {valid_ids}",
                )

    def test_age_coverage_spans_5_through_10(self):
        """Verify age bands continuously cover child population aged 5 to 10."""
        # Dyslexia coverage: 5-7 and 8-12 cover ages 5, 6, 7, 8, 9, 10
        dys_5_7 = self.banks["dyslexia_5_7"]
        dys_8_12 = self.banks["dyslexia_8_12"]

        self.assertLessEqual(dys_5_7["age_min"], 5)
        self.assertGreaterEqual(dys_5_7["age_max"], 7)
        self.assertLessEqual(dys_8_12["age_min"], 8)
        self.assertGreaterEqual(dys_8_12["age_max"], 10)

        # Autism social coverage: covers 5 to 10
        aut = self.banks["autism_social"]
        self.assertLessEqual(aut["age_min"], 5)
        self.assertGreaterEqual(aut["age_max"], 10)

        # Verify get_questions_for_stage retrieves questions for every age from 5 to 10
        for age in range(5, 11):
            dys_q = get_questions_for_stage("dyslexia", age=age)
            self.assertGreater(
                len(dys_q),
                0,
                f"Dyslexia stage should return questions for age {age}",
            )
            aut_q = get_questions_for_stage("autism", age=age)
            self.assertGreater(
                len(aut_q),
                0,
                f"Autism stage should return questions for age {age}",
            )

    def test_strip_correct_answers_safeguard(self):
        """Verify that stripping server metadata never leaks correct_option_id to clients."""
        for stage in ["dyslexia", "autism"]:
            server_questions = get_questions_for_stage(stage, age=7)
            client_questions = strip_correct_answers(server_questions)

            self.assertEqual(len(server_questions), len(client_questions))
            for q in client_questions:
                self.assertNotIn(
                    "correct_option_id",
                    q,
                    f"Client question {q.get('id')} must not contain 'correct_option_id'",
                )
                self.assertIn("id", q)
                self.assertIn("category", q)
                self.assertIn("prompt", q)
                self.assertIn("prompt_text", q)
                self.assertIn("options", q)

    def test_helper_lookups(self):
        """Verify single question and correct answer lookups by ID."""
        q = get_question_by_id("dys_5_7_01")
        self.assertIsNotNone(q)
        self.assertEqual(q["category"], "letter_sound_matching")

        correct_id = get_correct_option_id("dys_5_7_01")
        self.assertEqual(correct_id, "opt_s")

        # Unknown question returns None
        self.assertIsNone(get_question_by_id("non_existent_id"))
        self.assertIsNone(get_correct_option_id("non_existent_id"))

    def test_no_clinical_diagnoses_in_prompts(self):
        """Verify questions adhere to non-diagnostic safeguards and neutrality."""
        prohibited_terms = [
            "diagnosis",
            "diagnosed",
            "disability probability",
            "clinical deficit",
            "disorder",
            "patient",
        ]
        for bank_name, bank_data in self.banks.items():
            for q in bank_data["questions"]:
                text_corpus = f"{q['prompt']} {q['category']} " + " ".join(
                    opt["text"] for opt in q["options"]
                )
                for term in prohibited_terms:
                    self.assertNotIn(
                        term,
                        text_corpus.lower(),
                        f"Prohibited diagnostic term '{term}' found in question {q['id']}",
                    )


if __name__ == "__main__":
    unittest.main()

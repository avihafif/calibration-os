"""Display-only Finding DTO conformance. @req FR-META-01 @req DV-06"""

from __future__ import annotations

import copy
import unittest
from pathlib import Path

from calos_metadata.schema import load_schema_file, validate_findings

ROOT = Path(__file__).resolve().parents[2]


class FindingDisplayContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.schema = load_schema_file(ROOT / "schemas/finding/v1.schema.json")

    def test_closed_display_contract_accepts_structured_finding(self) -> None:
        finding = {
            "code": "UI_SAMPLE",
            "severity": "warning",
            "pointer": {"value": "/display"},
            "message": {
                "key": "arbitrary.message",
                "params": [{"name": "field", "value": "label"}],
            },
            "stage": "local",
            "fix": {"id": "open-field"},
        }
        self.assertEqual(validate_findings(self.schema, finding), ())

    def test_rejects_missing_fields_unknown_keys_and_invalid_shapes(self) -> None:
        valid = {
            "code": "UI_SAMPLE",
            "severity": "info",
            "pointer": {"value": "/display"},
            "message": {"key": "arbitrary.message"},
            "stage": "local",
        }
        cases = (
            ({**valid, "severity": "critical"}, "SCHEMA_ENUM"),
            ({key: value for key, value in valid.items() if key != "pointer"}, "SCHEMA_REQUIRED"),
            ({**valid, "unknown": "blocked"}, "SCHEMA_UNKNOWN_PROPERTY"),
            ({**valid, "message": {"key": "x", "extra": "blocked"}}, "SCHEMA_UNKNOWN_PROPERTY"),
            ({**valid, "pointer": {"value": 42}}, "SCHEMA_TYPE"),
        )
        for value, expected_code in cases:
            with self.subTest(value=value):
                findings = validate_findings(self.schema, copy.deepcopy(value))
                self.assertTrue(findings)
                self.assertEqual(findings[0].code, expected_code)

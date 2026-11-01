"""@req FR-META-01 @req FR-META-02 @req NFR-18"""

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "py" / "calos_metadata"))

from calos_metadata import SchemaError, SchemaRegistry, canonical_bytes, content_digest  # noqa: E402


class SchemaContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.registry = SchemaRegistry(ROOT)

    def _fixture(self, name: str) -> dict:
        return json.loads((ROOT / "fixtures" / "manufacturer" / name).read_text(encoding="utf-8"))

    def test_positive_fixture_and_order_independent_digest(self) -> None:
        item = self._fixture("valid.json")
        self.assertEqual(item["provenance"]["status"], "synthetic_demo")
        self.registry.validate(item["kind"], item["schema_version"], item["content"])
        reordered = {
            "aliases": [],
            "name": {"he": item["content"]["name"]["he"], "en": item["content"]["name"]["en"]},
        }
        self.assertEqual(content_digest(item["content"]), content_digest(reordered))
        self.assertEqual(canonical_bytes(item["content"]), canonical_bytes(reordered))

    def test_negative_fixtures(self) -> None:
        for name in ("invalid-unknown-property.json", "invalid-missing-translation.json"):
            with self.subTest(name=name), self.assertRaises(SchemaError):
                item = self._fixture(name)
                self.registry.validate(item["kind"], item["schema_version"], item["content"])

    def test_float_rejected_by_canonicalizer(self) -> None:
        with self.assertRaises(ValueError):
            content_digest({"measurement": 1.2})

    def test_generated_types_are_current(self) -> None:
        result = subprocess.run(
            [sys.executable, str(ROOT / "tools" / "codegen.py"), "--check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()

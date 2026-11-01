"""Closed metadata envelope and digest checks. @req FR-GOV-07 @req NFR-18"""

import json
import unittest
from pathlib import Path

from calos_metadata import PackageError, PackageParser, content_digest

ROOT = Path(__file__).resolve().parents[2]


class PackageParserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.parser = PackageParser(ROOT)
        cls.item = json.loads(
            (ROOT / "fixtures" / "manufacturer" / "valid.json").read_text(encoding="utf-8")
        )

    def envelope(self) -> dict:
        content = self.item["content"]
        return {
            "manifest": {
                "format_version": 1,
                "package_id": "synthetic-package",
                "kind": self.item["kind"],
                "key": self.item["key"],
                "item_version": "0.1.0",
                "schema_version": self.item["schema_version"],
                "content_digest": content_digest(content),
                "tenant_id": "synthetic-tenant",
                "deployment_id": "00000000-0000-4000-8000-0000000000a1",
                "environment_kind": "test",
                "publisher_id": "fixture-publisher",
                "issuer_id": "fixture-issuer",
                "key_id": "fixture-key",
                "issued_at": "2026-11-01T00:00:00Z",
                "expires_at": "2027-11-01T00:00:00Z",
                "runtime_min": "0.1.0",
                "runtime_max": "0.2.0",
                "provenance_status": "synthetic_demo",
            },
            "content": content,
            "signature": "unverified",
        }

    def test_valid_envelope_parses_without_claiming_signature_trust(self) -> None:
        parsed = self.parser.parse(json.dumps(self.envelope()).encode())
        self.assertEqual(parsed.manifest["provenance_status"], "synthetic_demo")

    def test_tamper_and_unsupported_schema_rejected(self) -> None:
        envelope = self.envelope()
        envelope["content"]["aliases"].append("tampered")
        with self.assertRaises(PackageError) as caught:
            self.parser.parse(json.dumps(envelope).encode())
        self.assertEqual(caught.exception.code, "PACKAGE_DIGEST_MISMATCH")
        envelope = self.envelope()
        envelope["manifest"]["schema_version"] = 999
        with self.assertRaises(PackageError) as caught:
            self.parser.parse(json.dumps(envelope).encode())
        self.assertEqual(caught.exception.code, "SCHEMA_UNKNOWN")

    def test_duplicate_keys_and_float_rejected(self) -> None:
        raw = json.dumps(self.envelope())
        duplicate = raw.replace('"format_version": 1', '"format_version": 1, "format_version": 1')
        with self.assertRaises(PackageError) as caught:
            self.parser.parse(duplicate.encode())
        self.assertEqual(caught.exception.code, "PACKAGE_DUPLICATE_KEY")
        raw_float = raw.replace('"format_version": 1', '"format_version": 1.0')
        with self.assertRaises(PackageError) as caught:
            self.parser.parse(raw_float.encode())
        self.assertEqual(caught.exception.code, "PACKAGE_NUMBER_UNSUPPORTED")


if __name__ == "__main__":
    unittest.main()

"""R-4 fail-closed schema subset and finding vectors. @req FR-META-01 @req NFR-18"""

import copy
import json
import sys
import tempfile
import time
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "py" / "calos_metadata"))

from calos_metadata.schema import (  # noqa: E402
    SchemaError,
    SchemaRegistry,
    load_schema_file,
    validate_document,
    validate_findings,
    validate_schema,
)
from calos_metadata.canonical import content_digest  # noqa: E402
from tools.codegen import TypeGenerator  # noqa: E402


class SchemaEngineR4Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        corpus = json.loads(
            (ROOT / "fixtures/schema-engine/v1-cases.json").read_text(encoding="utf-8")
        )
        cls.cases = corpus["cases"]
        cls.schema = json.loads((ROOT / corpus["schema"]).read_text(encoding="utf-8"))
        validate_schema(cls.schema)

    def test_structural_conformance_corpus(self) -> None:
        # @req FR-META-01: schema is source of truth for positive and negative content.
        for case in self.cases:
            with self.subTest(case=case["id"]):
                findings = validate_findings(self.schema, case["content"])
                if case["valid"]:
                    self.assertEqual(findings, ())
                    validate_document(self.schema, case["content"])
                else:
                    self.assertTrue(findings)
                    self.assertEqual(findings[0].code, case["code"])
                    self.assertEqual(findings[0].pointer.value, case["pointer"])
                    self.assertEqual(findings[0].message.key, f"schema.{case['code'].lower()}")
                    with self.assertRaises(SchemaError) as caught:
                        validate_document(self.schema, case["content"])
                    self.assertEqual(caught.exception.finding, findings[0])

    def test_oneof_requires_exactly_one_matching_branch(self) -> None:
        schema = {"oneOf": [{"type": "string"}, {"type": "string"}]}
        self.assertEqual(validate_findings(schema, "x")[0].code, "SCHEMA_ONEOF_AMBIGUOUS")
        self.assertEqual(validate_findings(schema, 1)[0].code, "SCHEMA_ONEOF_NONE")

    def test_json_pointer_escapes_property_names(self) -> None:
        schema = {
            "type": "object",
            "additionalProperties": False,
            "properties": {"a/b~c": {"type": "string"}},
        }
        self.assertEqual(validate_findings(schema, {"a/b~c": 1})[0].pointer.value, "/a~1b~0c")

    def test_pattern_search_dialect_preserves_exact_manifest_shape(self) -> None:
        schema = {"type": "string", "pattern": r"^(?:abc)(?![\s\S])"}
        self.assertEqual(validate_findings(schema, "abc"), ())
        for value in ("xabc", "abcx", "abc\n"):
            with self.subTest(value=value):
                self.assertEqual(validate_findings(schema, value)[0].code, "SCHEMA_PATTERN")

    def test_regex_registration_rejects_unicode_and_backtracking_constructs(self) -> None:
        rejected = (
            r"\d+",
            r"\w+",
            r"\s+",
            r"\bword",
            r"\p{L}+",
            ".+",
            r"[\d]+",
            r"[^a]+",
            r"[a-z]+[a-z]+[a-z]+[a-z]+",
            r"[a-z]+a[a-z]+",
            r"[a-z]+(?:-[a-z]+)*(?:-[a-z]+)*",
            r"(?:-a+)*",
            r"[a-z]+|[0-9]+",
        )
        for inner in rejected:
            with self.subTest(inner=inner):
                with self.assertRaises(SchemaError) as caught:
                    validate_schema({"type": "string", "pattern": f"^(?:{inner})(?![\\s\\S])"})
                self.assertIn(
                    caught.exception.reason_code,
                    ("SCHEMA_PATTERN_UNSUPPORTED", "SCHEMA_PATTERN_INVALID"),
                )

    def test_registered_patterns_have_adversarial_time_bound(self) -> None:
        manifest = json.loads(
            (ROOT / "schemas/package-manifest/v1.schema.json").read_text(encoding="utf-8")
        )
        for name, node in manifest["properties"].items():
            if "pattern" not in node:
                continue
            with self.subTest(property=name):
                started = time.perf_counter()
                findings = validate_findings(node, "a" * 4_000 + "!")
                self.assertTrue(findings)
                self.assertLess(time.perf_counter() - started, 2.0)

    def test_lone_surrogates_fail_before_uniqueness_or_pattern(self) -> None:
        schema = {"type": "array", "items": {"type": "string"}, "uniqueItems": True}
        findings = validate_findings(schema, ["\ud800", "\ud800"])
        self.assertEqual(findings[0].code, "SCHEMA_INVALID_UNICODE")
        self.assertEqual(findings[0].pointer.value, "/1")
        self.assertEqual(
            validate_findings({"type": "string"}, "\udfff")[0].code, "SCHEMA_INVALID_UNICODE"
        )
        with self.assertRaises(SchemaError) as caught:
            validate_schema({"type": "string", "title": "\ud800"})
        self.assertEqual(caught.exception.reason_code, "SCHEMA_INVALID_UNICODE")

    def test_restricted_editor_hints_reject_unbound_widgets_and_type_mismatch(self) -> None:
        for hints in (
            {"version": 1, "widget": "expression"},
            {"version": 1, "widget": "table"},
            {"version": 1, "ref_kind": "Unknown"},
            {"version": 1, "quick_fixes": ["unknown"]},
            {"version": 1, "widget": "record"},
        ):
            with self.subTest(hints=hints):
                with self.assertRaises(SchemaError):
                    validate_schema({"type": "string", "x-calos-editor": hints})

    def test_cross_language_digest_and_pattern_vectors(self) -> None:
        corpus = json.loads(
            (ROOT / "fixtures/schema-engine/cross-language-vectors.json").read_text(
                encoding="utf-8"
            )
        )
        manifest = json.loads(
            (ROOT / "schemas/package-manifest/v1.schema.json").read_text(encoding="utf-8")
        )
        for vector in corpus["digests"]:
            with self.subTest(digest=vector["id"]):
                self.assertEqual(content_digest(vector["content"]), vector["digest"])
        for value in corpus["invalid_unicode"]:
            with self.subTest(invalid_unicode=repr(value)):
                with self.assertRaises((ValueError, UnicodeError)):
                    content_digest(value)
                with self.assertRaises((ValueError, UnicodeError)):
                    content_digest({value: True})
        for vector in corpus["patterns"]:
            schema = manifest["properties"][vector["property"]]
            for value in vector["accepted"]:
                with self.subTest(property=vector["property"], value=value):
                    self.assertEqual(validate_findings(schema, value), ())
            for value in vector["rejected"]:
                with self.subTest(property=vector["property"], value=value):
                    self.assertEqual(validate_findings(schema, value)[0].code, "SCHEMA_PATTERN")
        for vector in corpus["safe_patterns"]:
            schema = {"type": "string", "pattern": vector["pattern"]}
            validate_schema(schema)
            for value in vector["accepted"]:
                with self.subTest(pattern=vector["pattern"], value=value):
                    self.assertEqual(validate_findings(schema, value), ())
            for value in vector["rejected"]:
                with self.subTest(pattern=vector["pattern"], value=value):
                    self.assertEqual(validate_findings(schema, value)[0].code, "SCHEMA_PATTERN")

    def test_registration_rejects_unsupported_or_malformed_schema(self) -> None:
        base = {"type": "object", "additionalProperties": False, "properties": {}}
        invalid = (
            ({**base, "format": "date-time"}, "SCHEMA_KEYWORD_UNSUPPORTED"),
            ({**base, "additionalProperties": True}, "SCHEMA_OPEN_OBJECT"),
            ({**base, "required": ["missing"]}, "SCHEMA_REQUIRED_INVALID"),
            (
                {**base, "required": ["x", "x"], "properties": {"x": {"type": "string"}}},
                "SCHEMA_REQUIRED_INVALID",
            ),
            ({"type": ["string", "integer"]}, "SCHEMA_TYPE_UNSUPPORTED"),
            ({"type": "string", "pattern": "abc"}, "SCHEMA_PATTERN_INVALID"),
            ({"type": "string", "pattern": r"^(?:abc\)(?![\s\S])"}, "SCHEMA_PATTERN_INVALID"),
            (
                {"type": "string", "pattern": r"^(?:(?:a+)+)(?![\s\S])"},
                "SCHEMA_PATTERN_UNSUPPORTED",
            ),
            ({"$ref": "https://other.invalid/schema"}, "SCHEMA_REF_INVALID"),
            ({"$ref": "#/$defs/Unknown"}, "SCHEMA_REF_INVALID"),
            ({"type": "integer", "minimum": 2, "maximum": 1}, "SCHEMA_INVALID"),
            (
                {"type": "array", "items": {"type": "string"}, "uniqueItems": "yes"},
                "SCHEMA_INVALID",
            ),
            ({"type": "string", "enum": ["same", "same"]}, "SCHEMA_ENUM_INVALID"),
            ({"oneOf": [{"type": "string"}]}, "SCHEMA_ONEOF_INVALID"),
            (
                {"type": "string", "x-calos-editor": {"version": 1, "script": "run()"}},
                "SCHEMA_HINT_UNSUPPORTED",
            ),
            ({"type": "string", "x-calos-editor": {"version": 2}}, "SCHEMA_HINT_VERSION"),
            (
                {"type": "string", "x-calos-editor": {"version": 1, "widget": []}},
                "SCHEMA_HINT_INVALID",
            ),
            (
                {
                    "type": "string",
                    "x-calos-editor": {"version": 1, "label": {"$t": "x", "raw_html": "<b>"}},
                },
                "SCHEMA_HINT_INVALID",
            ),
        )
        for schema, code in invalid:
            with self.subTest(schema=schema):
                with self.assertRaises(SchemaError) as caught:
                    validate_schema(schema)
                self.assertEqual(caught.exception.reason_code, code)
                self.assertEqual(caught.exception.finding.stage, "registration")

    def test_unused_cyclic_definitions_are_rejected(self) -> None:
        schema = copy.deepcopy(self.schema)
        schema["$defs"]["CycleA"] = {"$ref": "#/$defs/CycleB"}
        schema["$defs"]["CycleB"] = {"$ref": "#/$defs/CycleA"}
        with self.assertRaises(SchemaError) as caught:
            validate_schema(schema)
        self.assertEqual(caught.exception.reason_code, "SCHEMA_REF_CYCLE")

    def test_schema_and_content_resource_limits(self) -> None:
        schema = {"type": "string"}
        for _ in range(66):
            schema = {"type": "array", "items": schema}
        with self.assertRaises(SchemaError) as caught:
            validate_schema(schema)
        self.assertEqual(caught.exception.reason_code, "SCHEMA_RESOURCE_LIMIT")
        self.assertEqual(
            validate_findings({"type": "string"}, "x" * 4097)[0].code,
            "SCHEMA_RESOURCE_LIMIT",
        )
        self.assertEqual(
            validate_findings({"type": "array", "items": {"type": "integer"}}, list(range(10_001)))[
                0
            ].code,
            "SCHEMA_RESOURCE_LIMIT",
        )

    def test_registry_rejects_duplicate_json_keys_and_path_escape(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            schema_file = root / "schema.json"
            schema_file.write_text('{"type":"string","type":"integer"}', encoding="utf-8")
            with self.assertRaises(SchemaError) as caught:
                load_schema_file(schema_file)
            self.assertEqual(caught.exception.reason_code, "SCHEMA_DUPLICATE_KEY")

            (root / "catalog").mkdir()
            (root / "catalog/kinds.json").write_text(
                json.dumps(
                    {
                        "kinds": [
                            {
                                "kind": "Proof",
                                "schema_version": 1,
                                "schema": "../outside/schema.json",
                            }
                        ]
                    }
                ),
                encoding="utf-8",
            )
            with self.assertRaises(SchemaError) as caught:
                SchemaRegistry(root)
            self.assertEqual(caught.exception.reason_code, "SCHEMA_PATH_INVALID")

    def test_registry_entry_is_defensively_copied(self) -> None:
        registry = SchemaRegistry(ROOT)
        entry = registry.entry("Manufacturer")
        entry["editor"]["group"] = "changed-in-caller"
        self.assertEqual(registry.entry("Manufacturer")["editor"]["group"], "instrument")

    def test_codegen_names_and_array_union_are_unambiguous(self) -> None:
        schema = {
            "type": "object",
            "additionalProperties": False,
            "properties": {
                "a-b": {"type": "object", "additionalProperties": False},
                "ab": {"type": "object", "additionalProperties": False},
                "choices": {"type": "array", "items": {"type": "string", "enum": ["a", "b"]}},
            },
        }
        validate_schema(schema)
        python = TypeGenerator(schema, "Proof", "py").generate("proof.json")
        typescript = TypeGenerator(schema, "Proof", "ts").generate("proof.json")
        self.assertIn("class ProofAb(TypedDict)", python)
        self.assertIn("class ProofAb2(TypedDict)", python)
        self.assertIn('choices?: ("a" | "b")[];', typescript)


if __name__ == "__main__":
    unittest.main()

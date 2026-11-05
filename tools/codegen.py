"""Generate structural Python and TypeScript types from the supported JSON Schema subset.

Runtime constraints (bounds, uniqueness, pattern) remain authoritative in the
validator. Unsupported schema constructs fail before code is emitted.
@req FR-META-01 @req NFR-18
"""

from __future__ import annotations

import argparse
import json
import keyword
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "packages" / "py" / "calos_metadata"))
from calos_metadata.schema import load_schema_file  # noqa: E402

SCHEMAS = (
    ("manufacturer/v1.schema.json", "Manufacturer", "manufacturer"),
    ("package-manifest/v1.schema.json", "PackageManifest", "package_manifest"),
    ("schema-proof/v1.schema.json", "SchemaProof", "schema_proof"),
)
PY_DIR = ROOT / "packages" / "py" / "calos_metadata" / "calos_metadata" / "generated"
TS_DIR = ROOT / "packages" / "ts" / "domain-types" / "src"
_IDENTIFIER = re.compile(r"[A-Za-z][A-Za-z0-9_]*\Z")
_TS_IDENTIFIER = re.compile(r"[$A-Za-z_][$A-Za-z0-9_]*\Z")
_REF = re.compile(r"#/\$defs/([A-Za-z][A-Za-z0-9_]*)\Z")


class TypeGenerator:
    def __init__(self, schema: dict[str, Any], root_name: str, language: str) -> None:
        self.schema = schema
        self.root_name = root_name
        self.language = language
        self.definitions: dict[str, dict[str, Any]] = schema.get("$defs", {})
        self.blocks: list[str] = []
        self.generated_defs: set[str] = set()
        self.needs_literal = False
        self.needs_optional = False
        self.needs_alias = False
        self.used_names = {root_name} | {root_name + "Def" + name for name in self.definitions}

    def _fresh_name(self, base: str) -> str:
        name = base
        suffix = 2
        while name in self.used_names:
            name = f"{base}{suffix}"
            suffix += 1
        self.used_names.add(name)
        return name

    def _literal(self, value: Any) -> str:
        if self.language == "ts":
            return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        self.needs_literal = True
        if isinstance(value, str):
            return json.dumps(value, ensure_ascii=False)
        return repr(value)

    def _definition(self, def_name: str) -> str:
        name = self.root_name + "Def" + def_name
        if def_name not in self.generated_defs:
            self.generated_defs.add(def_name)
            result = self._type_of(self.definitions[def_name], name)
            if result != name:
                self.needs_alias = True
                if self.language == "py":
                    self.blocks.append(f"{name}: TypeAlias = {result}\n")
                else:
                    self.blocks.append(f"export type {name} = {result};")
        return name

    def _object(self, node: dict[str, Any], name: str) -> str:
        properties = node.get("properties", {})
        required = set(node.get("required", []))
        fields: list[tuple[str, str, bool]] = []
        for key, child in properties.items():
            child_name = name + re.sub(r"[^A-Za-z0-9]", "", key).capitalize()
            if not child_name or child_name == name:
                child_name = name + "Field"
            child_name = self._fresh_name(child_name)
            child_type = self._type_of(child, child_name)
            fields.append((key, child_type, key in required))
        if self.language == "ts":
            lines = []
            for key, child_type, is_required in fields:
                safe_key = key if _TS_IDENTIFIER.fullmatch(key) else json.dumps(key)
                marker = "" if is_required else "?"
                lines.append(f"  {safe_key}{marker}: {child_type};")
            self.blocks.append(f"export interface {name} {{\n" + "\n".join(lines) + "\n}")
        elif all(_IDENTIFIER.fullmatch(key) and not keyword.iskeyword(key) for key, _, _ in fields):
            lines = []
            for key, child_type, is_required in fields:
                if not is_required:
                    self.needs_optional = True
                type_text = child_type if is_required else f"NotRequired[{child_type}]"
                lines.append(f"    {key}: {type_text}")
            body = "\n".join(lines) if lines else "    pass"
            self.blocks.append(f"class {name}(TypedDict):\n{body}\n")
        else:
            pairs = []
            for key, child_type, is_required in fields:
                if not is_required:
                    self.needs_optional = True
                type_text = child_type if is_required else f"NotRequired[{child_type}]"
                pairs.append(f"        {json.dumps(key, ensure_ascii=False)}: {type_text},")
            self.blocks.append(
                f'{name} = TypedDict(\n    "{name}",\n    {{\n' + "\n".join(pairs) + "\n    },\n)\n"
            )
        return name

    def _type_of(self, node: dict[str, Any], name: str) -> str:
        if "$ref" in node:
            match = _REF.fullmatch(node["$ref"])
            if match is None:
                raise ValueError("Invalid local reference")
            return self._definition(match.group(1))
        if "oneOf" in node:
            members = [
                self._type_of(branch, name + "Variant" + str(index + 1))
                for index, branch in enumerate(node["oneOf"])
            ]
            self.needs_alias = True
            joiner = " | "
            if self.language == "py":
                self.blocks.append(f"{name}: TypeAlias = {joiner.join(members)}\n")
            else:
                declaration = f"export type {name} = {joiner.join(members)};"
                if len(declaration) > 80:
                    declaration = f"export type {name} =\n  {joiner.join(members)};"
                self.blocks.append(declaration)
            return name
        kind = node["type"]
        if kind == "object":
            return self._object(node, name)
        if kind == "array":
            item = self._type_of(node["items"], name + "Item")
            if self.language == "py":
                return f"list[{item}]"
            if "enum" in node["items"]:
                item = f"({item})"
            return f"{item}[]"
        if "const" in node:
            literal = self._literal(node["const"])
            return f"Literal[{literal}]" if self.language == "py" else literal
        if "enum" in node:
            values = [self._literal(value) for value in node["enum"]]
            return f"Literal[{', '.join(values)}]" if self.language == "py" else " | ".join(values)
        mapping = {
            "py": {"string": "str", "integer": "int", "boolean": "bool"},
            "ts": {"string": "string", "integer": "number", "boolean": "boolean"},
        }
        return mapping[self.language][kind]

    def generate(self, schema_path: str) -> str:
        for def_name in self.definitions:
            self._definition(def_name)
        self._type_of(self.schema, self.root_name)
        if self.language == "ts":
            header = f"// Generated from schemas/{schema_path}; do not edit.\n\n"
            return header + "\n\n".join(self.blocks).rstrip() + "\n"
        imports = ["TypedDict"]
        if self.needs_literal:
            imports.append("Literal")
        if self.needs_optional:
            imports.append("NotRequired")
        if self.needs_alias:
            imports.append("TypeAlias")
        header = (
            f"# Generated from schemas/{schema_path}; do not edit.\n"
            f"from typing import {', '.join(sorted(imports))}\n\n\n"
        )
        return header + "\n\n".join(self.blocks).rstrip() + "\n"


def generate() -> dict[Path, str]:
    outputs: dict[Path, str] = {}
    for schema_path, type_name, filename in SCHEMAS:
        schema = load_schema_file(ROOT / "schemas" / schema_path)
        for language, target in (
            ("py", PY_DIR / f"{filename}.py"),
            ("ts", TS_DIR / f"{filename}.ts"),
        ):
            outputs[target] = TypeGenerator(schema, type_name, language).generate(schema_path)
    return outputs


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    stale = []
    for path, content in generate().items():
        if args.check:
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                stale.append(str(path.relative_to(ROOT)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8", newline="\n")
    if stale:
        print("Generated types stale: " + ", ".join(stale))
        return 1
    print("Code generation " + ("verified" if args.check else "completed"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

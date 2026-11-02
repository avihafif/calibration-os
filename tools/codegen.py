"""Generate initial Python TypedDict and TypeScript interfaces from JSON Schema.

This deliberately supports the same closed-object subset as calos_metadata.schema.
Unsupported constructs fail rather than produce an inaccurate type.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SCHEMAS = (
    ("manufacturer/v1.schema.json", "Manufacturer", "manufacturer"),
    ("package-manifest/v1.schema.json", "PackageManifest", "package_manifest"),
)
PY_DIR = ROOT / "packages" / "py" / "calos_metadata" / "calos_metadata" / "generated"
TS_DIR = ROOT / "packages" / "ts" / "domain-types" / "src"


def _type_of(schema: dict[str, Any], name: str, language: str, classes: list[str]) -> str:
    kind = schema["type"]
    if kind == "object":
        if schema.get("additionalProperties") is not False:
            raise ValueError("Open objects are forbidden")
        fields = []
        required = set(schema.get("required", []))
        if required != set(schema.get("properties", {})):
            raise ValueError("Phase 0A generator requires all properties")
        for key, child in schema["properties"].items():
            if re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", key) is None:
                raise ValueError("Unsupported property name")
            child_name = name + key[:1].upper() + key[1:]
            child_type = _type_of(child, child_name, language, classes)
            fields.append(
                f"    {key}: {child_type}" if language == "py" else f"  {key}: {child_type};"
            )
        if language == "py":
            classes.append(f"class {name}(TypedDict):\n" + "\n".join(fields) + "\n")
        else:
            classes.append(f"export interface {name} {{\n" + "\n".join(fields) + "\n}")
        return name
    if kind == "array":
        item = _type_of(schema["items"], name + "Item", language, classes)
        return f"list[{item}]" if language == "py" else f"{item}[]"
    mapping = {
        "py": {"string": "str", "integer": "int", "boolean": "bool"},
        "ts": {"string": "string", "integer": "number", "boolean": "boolean"},
    }
    try:
        return mapping[language][kind]
    except KeyError as exc:
        raise ValueError(f"Unsupported schema type: {kind}") from exc


def generate() -> dict[Path, str]:
    outputs = {}
    for schema_path, type_name, filename in SCHEMAS:
        schema = json.loads((ROOT / "schemas" / schema_path).read_text(encoding="utf-8"))
        for language, target in (
            ("py", PY_DIR / f"{filename}.py"),
            ("ts", TS_DIR / f"{filename}.ts"),
        ):
            classes: list[str] = []
            _type_of(schema, type_name, language, classes)
            header = (
                (
                    f"# Generated from schemas/{schema_path}; do not edit.\n"
                    "from typing import TypedDict\n\n\n"
                )
                if language == "py"
                else (f"// Generated from schemas/{schema_path}; do not edit.\n\n")
            )
            outputs[target] = header + "\n\n".join(classes).rstrip() + "\n"
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

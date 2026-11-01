"""Fail-closed validator for the JSON Schema keywords in the initial kind registry.

This intentionally supports a small Draft 2020-12 subset. Encountering an unimplemented
keyword fails registration, so adding a kind cannot silently weaken validation. A full
validator is required before other schema features are registered.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from .canonical import Json


class SchemaError(ValueError):
    """A schema or content validation error with a stable code."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)

KEYWORDS = frozenset({
    "$schema", "$id", "title", "description", "type", "additionalProperties",
    "required", "properties", "items", "minLength", "maxLength", "maxItems",
    "minItems", "pattern", "enum",
})


def _check_schema(schema: dict[str, Any]) -> None:
    if set(schema) - KEYWORDS:
        raise SchemaError("SCHEMA_KEYWORD_UNSUPPORTED")
    if schema.get("$schema") not in (None, "https://json-schema.org/draft/2020-12/schema"):
        raise SchemaError("SCHEMA_DIALECT_UNSUPPORTED")
    if schema.get("type") not in ("object", "array", "string", "integer", "boolean"):
        raise SchemaError("SCHEMA_TYPE_UNSUPPORTED")
    if schema.get("type") == "object":
        if schema.get("additionalProperties") is not False:
            raise SchemaError("SCHEMA_OPEN_OBJECT")
        properties = schema.get("properties", {})
        if not isinstance(properties, dict):
            raise SchemaError("SCHEMA_INVALID")
        for child in properties.values():
            _check_schema(child)
    if schema.get("type") == "array":
        child = schema.get("items")
        if not isinstance(child, dict):
            raise SchemaError("SCHEMA_INVALID")
        _check_schema(child)


def _validate(value: Json, schema: dict[str, Any], pointer: str) -> None:
    expected = schema["type"]
    valid_type = {
        "object": isinstance(value, dict),
        "array": isinstance(value, list),
        "string": isinstance(value, str),
        "integer": isinstance(value, int) and not isinstance(value, bool),
        "boolean": isinstance(value, bool),
    }[expected]
    if not valid_type:
        raise SchemaError(f"SCHEMA_TYPE:{pointer}")
    if "enum" in schema and value not in schema["enum"]:
        raise SchemaError(f"SCHEMA_ENUM:{pointer}")
    if isinstance(value, dict):
        properties = schema.get("properties", {})
        if not set(schema.get("required", [])).issubset(value):
            raise SchemaError(f"SCHEMA_REQUIRED:{pointer}")
        if set(value) - set(properties):
            raise SchemaError(f"SCHEMA_UNKNOWN_PROPERTY:{pointer}")
        for key, child in value.items():
            _validate(child, properties[key], pointer + "/" + key.replace("~", "~0").replace("/", "~1"))
    elif isinstance(value, list):
        if len(value) < schema.get("minItems", 0) or len(value) > schema.get("maxItems", len(value)):
            raise SchemaError(f"SCHEMA_ARRAY_LENGTH:{pointer}")
        for index, child in enumerate(value):
            _validate(child, schema["items"], pointer + f"/{index}")
    elif isinstance(value, str):
        if len(value) < schema.get("minLength", 0) or len(value) > schema.get("maxLength", len(value)):
            raise SchemaError(f"SCHEMA_STRING_LENGTH:{pointer}")
        if "pattern" in schema and re.fullmatch(schema["pattern"], value) is None:
            raise SchemaError(f"SCHEMA_PATTERN:{pointer}")


class SchemaRegistry:
    def __init__(self, repository_root: Path) -> None:
        registry = json.loads((repository_root / "catalog" / "kinds.json").read_text(encoding="utf-8"))
        self._schemas: dict[tuple[str, int], dict[str, Any]] = {}
        self._entries: dict[str, dict[str, Any]] = {}
        for entry in registry["kinds"]:
            path = repository_root / entry["schema"]
            schema = json.loads(path.read_text(encoding="utf-8"))
            _check_schema(schema)
            kind = entry["kind"]
            version = entry["schema_version"]
            self._schemas[kind, version] = schema
            self._entries[kind] = entry

    def entry(self, kind: str) -> dict[str, Any]:
        try:
            return self._entries[kind].copy()
        except KeyError as exc:
            raise SchemaError("KIND_UNKNOWN") from exc

    def validate(self, kind: str, version: int, content: Json) -> None:
        try:
            schema = self._schemas[kind, version]
        except KeyError as exc:
            raise SchemaError("SCHEMA_UNKNOWN") from exc
        _validate(content, schema, "")


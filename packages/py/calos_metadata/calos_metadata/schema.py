"""Bounded, fail-closed Draft 2020-12 subset for platform metadata schemas.

Only registered keywords have semantics. Schema references are local root $defs,
and authored editor hints are inert annotations. @req FR-META-01 @req NFR-18
"""

from __future__ import annotations

import copy
import json
import re
from pathlib import Path
from typing import Any, cast

from .canonical import MAX_SAFE_INTEGER, Json, canonical_bytes
from .findings import Finding, JsonPointer, LocalizedMessage

MAX_SCHEMA_BYTES = 1_048_576
MAX_SCHEMA_NODES = 4_096
MAX_SCHEMA_DEPTH = 64
MAX_CONTENT_NODES = 10_000
MAX_CONTENT_DEPTH = 64
MAX_STRING_LENGTH = 4_096
MAX_VALIDATION_STEPS = 100_000
MAX_ONEOF_BRANCHES = 16
MAX_PATTERN_LENGTH = 256
MAX_ENUM_ITEMS = 64

_DIALECT = "https://json-schema.org/draft/2020-12/schema"
_REF = re.compile(r"#/\$defs/([A-Za-z][A-Za-z0-9_]*)\Z")
_NAME = re.compile(r"[A-Za-z][A-Za-z0-9_]*\Z")
_HINT_ID = re.compile(r"[A-Za-z][A-Za-z0-9_.-]*\Z")
# ADR-0025: search semantics; this wrapper preserves exact-match manifest rules
# on Python and ECMAScript, including a trailing newline.
_PATTERN_PREFIX = "^(?:"
_PATTERN_SUFFIX = r")(?![\s\S])"
_COMMON = frozenset({"title", "description", "x-calos-editor"})
_ROOT = frozenset({"$schema", "$id", "$defs"})
_TYPED = frozenset({"type", "enum", "const"})
_BY_TYPE = {
    "object": frozenset({"additionalProperties", "properties", "required"}),
    "array": frozenset({"items", "minItems", "maxItems", "uniqueItems"}),
    "string": frozenset({"minLength", "maxLength", "pattern"}),
    "integer": frozenset({"minimum", "maximum"}),
    "boolean": frozenset(),
}
_WIDGETS = frozenset(
    {
        "text",
        "localized",
        "integer",
        "decimal-string",
        "quantity",
        "interval",
        "enum",
        "bool",
        "reference",
        "expression",
        "provenance",
        "list",
        "record",
        "table",
        "union",
        "hazard",
        "media",
        "code-readonly",
    }
)
_HINT_KEYS = frozenset(
    {
        "version",
        "group",
        "order",
        "label",
        "help",
        "placeholder",
        "explain",
        "widget",
        "unit_dimension",
        "ref_kind",
        "no_default",
        "derived",
        "provenance",
        "quick_fixes",
    }
)


class SchemaError(ValueError):
    """Stable legacy code plus a structured finding and JSON Pointer."""

    def __init__(
        self,
        reason_code: str,
        pointer: str = "",
        *,
        registration: bool = False,
        legacy_pointer: str | None = None,
    ) -> None:
        self.reason_code = reason_code
        self.pointer = pointer
        self.code = (
            reason_code
            if registration
            else f"{reason_code}:{pointer if legacy_pointer is None else legacy_pointer}"
        )
        self.finding = Finding(
            code=reason_code,
            severity="error",
            pointer=JsonPointer(value=pointer),
            message=LocalizedMessage(key=f"schema.{reason_code.lower()}"),
            stage="registration" if registration else "schema",
        )
        super().__init__(self.code)


def _schema_error(code: str, pointer: str = "") -> SchemaError:
    return SchemaError(code, pointer, registration=True)


def _pointer(parent: str, key: str | int) -> str:
    return parent + "/" + str(key).replace("~", "~0").replace("/", "~1")


def _nonnegative_int(value: Any, limit: int) -> bool:
    return type(value) is int and 0 <= value <= limit


def _same_json(left: Any, right: Any) -> bool:
    try:
        return canonical_bytes(cast(Json, left)) == canonical_bytes(cast(Json, right))
    except (ValueError, UnicodeError):
        return False


def _type_matches(value: Any, expected: str) -> bool:
    return {
        "object": isinstance(value, dict),
        "array": isinstance(value, list),
        "string": isinstance(value, str),
        "integer": type(value) is int and abs(value) <= MAX_SAFE_INTEGER,
        "boolean": type(value) is bool,
    }[expected]


def _supported_literal(value: Any) -> bool:
    if _content_limit(value) is not None:
        return False
    try:
        canonical_bytes(cast(Json, value))
    except (ValueError, UnicodeError, RecursionError):
        return False
    return True


def _check_localized(value: Any, pointer: str) -> None:
    if not isinstance(value, dict) or set(value) != {"$t"}:
        raise _schema_error("SCHEMA_HINT_INVALID", pointer)
    key = value["$t"]
    if not isinstance(key, str) or not _HINT_ID.fullmatch(key) or len(key) > 160:
        raise _schema_error("SCHEMA_HINT_INVALID", pointer)


def _check_hints(hints: Any, pointer: str) -> None:
    if not isinstance(hints, dict) or set(hints) - _HINT_KEYS:
        raise _schema_error("SCHEMA_HINT_UNSUPPORTED", pointer)
    if type(hints.get("version")) is not int or hints["version"] != 1:
        raise _schema_error("SCHEMA_HINT_VERSION", _pointer(pointer, "version"))
    for name in ("group", "unit_dimension", "ref_kind"):
        if name in hints:
            value = hints[name]
            if not isinstance(value, str) or not _HINT_ID.fullmatch(value) or len(value) > 120:
                raise _schema_error("SCHEMA_HINT_INVALID", _pointer(pointer, name))
    if "order" in hints and not _nonnegative_int(hints["order"], 10_000):
        raise _schema_error("SCHEMA_HINT_INVALID", _pointer(pointer, "order"))
    for name in ("label", "help", "placeholder", "explain"):
        if name in hints:
            _check_localized(hints[name], _pointer(pointer, name))
    if "widget" in hints and (
        not isinstance(hints["widget"], str) or hints["widget"] not in _WIDGETS
    ):
        raise _schema_error("SCHEMA_HINT_INVALID", _pointer(pointer, "widget"))
    for name in ("no_default", "derived"):
        if name in hints and type(hints[name]) is not bool:
            raise _schema_error("SCHEMA_HINT_INVALID", _pointer(pointer, name))
    if "provenance" in hints and (
        not isinstance(hints["provenance"], str)
        or hints["provenance"] not in ("required", "optional", "none")
    ):
        raise _schema_error("SCHEMA_HINT_INVALID", _pointer(pointer, "provenance"))
    if "quick_fixes" in hints:
        values = hints["quick_fixes"]
        if not isinstance(values, list) or len(values) > 32:
            raise _schema_error("SCHEMA_HINT_INVALID", _pointer(pointer, "quick_fixes"))
        if any(
            not isinstance(value, str) or not _HINT_ID.fullmatch(value) or len(value) > 120
            for value in values
        ) or len(set(values)) != len(values):
            raise _schema_error("SCHEMA_HINT_INVALID", _pointer(pointer, "quick_fixes"))


def _check_pattern(pattern: Any, pointer: str) -> None:
    if (
        not isinstance(pattern, str)
        or len(pattern) > MAX_PATTERN_LENGTH
        or not pattern.startswith(_PATTERN_PREFIX)
        or not pattern.endswith(_PATTERN_SUFFIX)
    ):
        raise _schema_error("SCHEMA_PATTERN_INVALID", pointer)
    inner = pattern[len(_PATTERN_PREFIX) : -len(_PATTERN_SUFFIX)]
    if "|" in inner or re.search(r"\\[1-9]", inner):
        raise _schema_error("SCHEMA_PATTERN_UNSUPPORTED", pointer)
    groups = tuple(re.finditer(r"\(\?:([^()]*)\)", inner))
    remainder = re.sub(r"\(\?:[^()]*\)", "", inner)
    if "(" in remainder or ")" in remainder:
        raise _schema_error("SCHEMA_PATTERN_UNSUPPORTED", pointer)
    for group in groups:
        body = group.group(1)
        next_character = inner[group.end() : group.end() + 1]
        if (
            next_character in ("+", "*", "{")
            and ("+" in body or "*" in body)
            and not body.startswith(("-", r"\."))
        ):
            raise _schema_error("SCHEMA_PATTERN_UNSUPPORTED", pointer)
    for lower, upper in re.findall(r"\{([0-9]+)(?:,([0-9]+))?\}", inner):
        if int(lower) > MAX_STRING_LENGTH or (upper and int(upper) > MAX_STRING_LENGTH):
            raise _schema_error("SCHEMA_PATTERN_UNSUPPORTED", pointer)
    try:
        re.compile(pattern)
    except re.error as exc:
        raise _schema_error("SCHEMA_PATTERN_INVALID", pointer) from exc


def _check_schema(schema: dict[str, Any]) -> None:
    """Validate the complete schema and its reference graph before it is used."""
    if not isinstance(schema, dict):
        raise _schema_error("SCHEMA_INVALID")
    if schema.get("$schema") not in (None, _DIALECT):
        raise _schema_error("SCHEMA_DIALECT_UNSUPPORTED", "/$schema")
    for name in ("$id", "title", "description"):
        if name in schema and (not isinstance(schema[name], str) or len(schema[name]) > 256):
            raise _schema_error("SCHEMA_INVALID", _pointer("", name))
    definitions = schema.get("$defs", {})
    if not isinstance(definitions, dict) or len(definitions) > MAX_SCHEMA_NODES:
        raise _schema_error("SCHEMA_INVALID", "/$defs")
    if any(not isinstance(name, str) or not _NAME.fullmatch(name) for name in definitions):
        raise _schema_error("SCHEMA_INVALID", "/$defs")

    count = 0
    graph: dict[str, set[str]] = {}
    for def_name, def_schema in [("", schema), *definitions.items()]:
        refs: set[str] = set()
        start = "" if not def_name else _pointer("/$defs", def_name)
        stack: list[tuple[Any, str, int, bool]] = [(def_schema, start, 0, not def_name)]
        while stack:
            node, pointer, depth, is_root = stack.pop()
            count += 1
            if count > MAX_SCHEMA_NODES or depth > MAX_SCHEMA_DEPTH:
                raise _schema_error("SCHEMA_RESOURCE_LIMIT", pointer)
            if not isinstance(node, dict):
                raise _schema_error("SCHEMA_INVALID", pointer)
            if "x-calos-editor" in node:
                _check_hints(node["x-calos-editor"], _pointer(pointer, "x-calos-editor"))
            if "$ref" in node:
                allowed = _COMMON | {"$ref"} | (_ROOT if is_root else frozenset())
                if set(node) - allowed:
                    raise _schema_error("SCHEMA_KEYWORD_UNSUPPORTED", pointer)
                ref = node["$ref"]
                match = _REF.fullmatch(ref) if isinstance(ref, str) else None
                if match is None or match.group(1) not in definitions:
                    raise _schema_error("SCHEMA_REF_INVALID", _pointer(pointer, "$ref"))
                refs.add(match.group(1))
            elif "oneOf" in node:
                allowed = _COMMON | {"oneOf"} | (_ROOT if is_root else frozenset())
                if set(node) - allowed:
                    raise _schema_error("SCHEMA_KEYWORD_UNSUPPORTED", pointer)
                variants = node["oneOf"]
                if not isinstance(variants, list) or not 2 <= len(variants) <= MAX_ONEOF_BRANCHES:
                    raise _schema_error("SCHEMA_ONEOF_INVALID", _pointer(pointer, "oneOf"))
                for index, child in enumerate(variants):
                    stack.append(
                        (child, _pointer(_pointer(pointer, "oneOf"), index), depth + 1, False)
                    )
            else:
                kind = node.get("type")
                if not isinstance(kind, str) or kind not in _BY_TYPE:
                    raise _schema_error("SCHEMA_TYPE_UNSUPPORTED", pointer)
                allowed = _COMMON | _TYPED | _BY_TYPE[kind] | (_ROOT if is_root else frozenset())
                if set(node) - allowed:
                    raise _schema_error("SCHEMA_KEYWORD_UNSUPPORTED", pointer)
                if "const" in node and "enum" in node:
                    raise _schema_error("SCHEMA_INVALID", pointer)
                if "const" in node and (
                    not _type_matches(node["const"], kind) or not _supported_literal(node["const"])
                ):
                    raise _schema_error("SCHEMA_CONST_INVALID", _pointer(pointer, "const"))
                if "enum" in node:
                    values = node["enum"]
                    try:
                        valid_enum = (
                            isinstance(values, list)
                            and 1 <= len(values) <= MAX_ENUM_ITEMS
                            and all(
                                _type_matches(value, kind) and _supported_literal(value)
                                for value in values
                            )
                            and len({canonical_bytes(cast(Json, value)) for value in values})
                            == len(values)
                        )
                    except (ValueError, UnicodeError, RecursionError):
                        valid_enum = False
                    if not valid_enum:
                        raise _schema_error("SCHEMA_ENUM_INVALID", _pointer(pointer, "enum"))
                if kind == "object":
                    if node.get("additionalProperties") is not False:
                        raise _schema_error("SCHEMA_OPEN_OBJECT", pointer)
                    props = node.get("properties", {})
                    required = node.get("required", [])
                    if isinstance(props, dict) and len(props) > MAX_SCHEMA_NODES:
                        raise _schema_error("SCHEMA_RESOURCE_LIMIT", pointer)
                    if isinstance(required, list) and len(required) > MAX_SCHEMA_NODES:
                        raise _schema_error("SCHEMA_RESOURCE_LIMIT", pointer)
                    if not isinstance(props, dict) or any(
                        not isinstance(key, str) or len(key) > 160 for key in props
                    ):
                        raise _schema_error("SCHEMA_INVALID", _pointer(pointer, "properties"))
                    if (
                        not isinstance(required, list)
                        or any(not isinstance(key, str) for key in required)
                        or len(set(required)) != len(required)
                        or not set(required).issubset(props)
                    ):
                        raise _schema_error(
                            "SCHEMA_REQUIRED_INVALID", _pointer(pointer, "required")
                        )
                    for key, child in props.items():
                        stack.append(
                            (
                                child,
                                _pointer(_pointer(pointer, "properties"), key),
                                depth + 1,
                                False,
                            )
                        )
                elif kind == "array":
                    if not isinstance(node.get("items"), dict):
                        raise _schema_error("SCHEMA_INVALID", _pointer(pointer, "items"))
                    for name in ("minItems", "maxItems"):
                        if name in node and not _nonnegative_int(node[name], MAX_CONTENT_NODES):
                            raise _schema_error("SCHEMA_INVALID", _pointer(pointer, name))
                    if node.get("minItems", 0) > node.get("maxItems", MAX_CONTENT_NODES):
                        raise _schema_error("SCHEMA_INVALID", pointer)
                    if "uniqueItems" in node and type(node["uniqueItems"]) is not bool:
                        raise _schema_error("SCHEMA_INVALID", _pointer(pointer, "uniqueItems"))
                    stack.append((node["items"], _pointer(pointer, "items"), depth + 1, False))
                elif kind == "string":
                    for name in ("minLength", "maxLength"):
                        if name in node and not _nonnegative_int(node[name], MAX_STRING_LENGTH):
                            raise _schema_error("SCHEMA_INVALID", _pointer(pointer, name))
                    if node.get("minLength", 0) > node.get("maxLength", MAX_STRING_LENGTH):
                        raise _schema_error("SCHEMA_INVALID", pointer)
                    if "pattern" in node:
                        _check_pattern(node["pattern"], _pointer(pointer, "pattern"))
                elif kind == "integer":
                    for name in ("minimum", "maximum"):
                        if name in node and (
                            type(node[name]) is not int or abs(node[name]) > MAX_SAFE_INTEGER
                        ):
                            raise _schema_error("SCHEMA_INVALID", _pointer(pointer, name))
                    if node.get("minimum", -MAX_SAFE_INTEGER) > node.get(
                        "maximum", MAX_SAFE_INTEGER
                    ):
                        raise _schema_error("SCHEMA_INVALID", pointer)
            for name in ("title", "description"):
                if name in node and (not isinstance(node[name], str) or len(node[name]) > 256):
                    raise _schema_error("SCHEMA_INVALID", _pointer(pointer, name))
        if def_name:
            graph[def_name] = refs

    # Every definition is checked, including unused ones. References may not form cycles.
    active: set[str] = set()
    done: set[str] = set()

    def visit(name: str, depth: int) -> None:
        if depth > MAX_SCHEMA_DEPTH:
            raise _schema_error("SCHEMA_RESOURCE_LIMIT", _pointer("/$defs", name))
        if name in active:
            raise _schema_error("SCHEMA_REF_CYCLE", _pointer("/$defs", name))
        if name in done:
            return
        active.add(name)
        for target in graph[name]:
            visit(target, depth + 1)
        active.remove(name)
        done.add(name)

    for name in graph:
        visit(name, 0)


def validate_schema(schema: dict[str, Any]) -> None:
    """Check a schema's supported vocabulary, shapes, hints and local references."""
    _check_schema(schema)


def _content_limit(content: Any) -> SchemaError | None:
    count = 0
    stack: list[tuple[Any, str, int]] = [(content, "", 0)]
    while stack:
        value, pointer, depth = stack.pop()
        count += 1
        if count > MAX_CONTENT_NODES or depth > MAX_CONTENT_DEPTH:
            return SchemaError("SCHEMA_RESOURCE_LIMIT", pointer)
        if isinstance(value, str) and len(value) > MAX_STRING_LENGTH:
            return SchemaError("SCHEMA_RESOURCE_LIMIT", pointer)
        if isinstance(value, dict):
            if count + len(stack) + len(value) > MAX_CONTENT_NODES:
                return SchemaError("SCHEMA_RESOURCE_LIMIT", pointer)
            for key, child in value.items():
                if not isinstance(key, str) or len(key) > MAX_STRING_LENGTH:
                    return SchemaError("SCHEMA_RESOURCE_LIMIT", pointer)
                stack.append((child, _pointer(pointer, key), depth + 1))
        elif isinstance(value, list):
            if count + len(stack) + len(value) > MAX_CONTENT_NODES:
                return SchemaError("SCHEMA_RESOURCE_LIMIT", pointer)
            stack.extend(
                (child, _pointer(pointer, index), depth + 1) for index, child in enumerate(value)
            )
    return None


def _finding(code: str, pointer: str) -> Finding:
    return SchemaError(code, pointer).finding


def _validate(
    value: Any,
    node: dict[str, Any],
    definitions: dict[str, dict[str, Any]],
    pointer: str,
    findings: list[Finding],
    steps: list[int],
) -> None:
    steps[0] += 1
    if steps[0] > MAX_VALIDATION_STEPS:
        raise SchemaError("SCHEMA_RESOURCE_LIMIT", pointer)
    if "$ref" in node:
        matched = _REF.fullmatch(node["$ref"])
        assert matched is not None  # Registration already checked the reference.
        name = matched.group(1)
        _validate(value, definitions[name], definitions, pointer, findings, steps)
        return
    if "oneOf" in node:
        matches = 0
        for variant in node["oneOf"]:
            branch: list[Finding] = []
            _validate(value, variant, definitions, pointer, branch, steps)
            matches += not branch
        if matches != 1:
            findings.append(
                _finding("SCHEMA_ONEOF_NONE" if matches == 0 else "SCHEMA_ONEOF_AMBIGUOUS", pointer)
            )
        return

    kind: str = node["type"]
    if not _type_matches(value, kind):
        findings.append(_finding("SCHEMA_TYPE", pointer))
        return
    if "const" in node and not _same_json(value, node["const"]):
        findings.append(_finding("SCHEMA_CONST", pointer))
    if "enum" in node and not any(_same_json(value, item) for item in node["enum"]):
        findings.append(_finding("SCHEMA_ENUM", pointer))

    if kind == "object":
        props = node.get("properties", {})
        for key in node.get("required", []):
            if key not in value:
                findings.append(_finding("SCHEMA_REQUIRED", _pointer(pointer, key)))
        for key, child in value.items():
            child_pointer = _pointer(pointer, key)
            if key not in props:
                findings.append(_finding("SCHEMA_UNKNOWN_PROPERTY", child_pointer))
            else:
                _validate(child, props[key], definitions, child_pointer, findings, steps)
    elif kind == "array":
        if len(value) < node.get("minItems", 0) or len(value) > node.get(
            "maxItems", MAX_CONTENT_NODES
        ):
            findings.append(_finding("SCHEMA_ARRAY_LENGTH", pointer))
        if node.get("uniqueItems", False):
            seen: set[bytes] = set()
            for index, item in enumerate(value):
                try:
                    digest = canonical_bytes(cast(Json, item))
                except (ValueError, UnicodeError):
                    continue
                if digest in seen:
                    findings.append(_finding("SCHEMA_UNIQUE_ITEMS", _pointer(pointer, index)))
                seen.add(digest)
        for index, item in enumerate(value):
            _validate(item, node["items"], definitions, _pointer(pointer, index), findings, steps)
    elif kind == "string":
        if len(value) < node.get("minLength", 0) or len(value) > node.get(
            "maxLength", MAX_STRING_LENGTH
        ):
            findings.append(_finding("SCHEMA_STRING_LENGTH", pointer))
        if "pattern" in node and re.search(node["pattern"], value) is None:
            findings.append(_finding("SCHEMA_PATTERN", pointer))
    elif kind == "integer":
        if value < node.get("minimum", -MAX_SAFE_INTEGER) or value > node.get(
            "maximum", MAX_SAFE_INTEGER
        ):
            findings.append(_finding("SCHEMA_INTEGER_BOUNDS", pointer))


def _findings_for_validated_schema(schema: dict[str, Any], content: Json) -> tuple[Finding, ...]:
    limited = _content_limit(content)
    if limited is not None:
        return (limited.finding,)
    results: list[Finding] = []
    try:
        _validate(content, schema, schema.get("$defs", {}), "", results, [0])
    except SchemaError as exc:
        return (exc.finding,)
    return tuple(results)


def validate_findings(schema: dict[str, Any], content: Json) -> tuple[Finding, ...]:
    """Return bounded structural findings after checking the supplied schema."""
    _check_schema(schema)
    return _findings_for_validated_schema(schema, content)


def validate_document(schema: dict[str, Any], content: Json) -> None:
    """Preserve the fail-first API used by the Phase 0B package verifier."""
    findings = validate_findings(schema, content)
    if findings:
        raise _legacy_validation_error(findings[0])


def _legacy_validation_error(finding: Finding) -> SchemaError:
    pointer = finding.pointer.value
    legacy_pointer = (
        pointer.rpartition("/")[0]
        if finding.code in {"SCHEMA_REQUIRED", "SCHEMA_UNKNOWN_PROPERTY"}
        else pointer
    )
    return SchemaError(finding.code, pointer, legacy_pointer=legacy_pointer)


def _no_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise _schema_error("SCHEMA_DUPLICATE_KEY")
        result[key] = value
    return result


def _load_schema(path: Path) -> dict[str, Any]:
    try:
        raw = path.read_bytes()
    except OSError as exc:
        raise _schema_error("SCHEMA_INVALID") from exc
    if len(raw) > MAX_SCHEMA_BYTES:
        raise _schema_error("SCHEMA_RESOURCE_LIMIT")
    try:
        value = json.loads(raw.decode("utf-8"), object_pairs_hook=_no_duplicate_keys)
    except (UnicodeError, json.JSONDecodeError, RecursionError) as exc:
        raise _schema_error("SCHEMA_INVALID") from exc
    if not isinstance(value, dict):
        raise _schema_error("SCHEMA_INVALID")
    return cast(dict[str, Any], value)


def load_schema_file(path: Path) -> dict[str, Any]:
    """Load and register-check a schema with duplicate-key and size rejection."""
    schema = _load_schema(path)
    _check_schema(schema)
    return schema


class SchemaRegistry:
    def __init__(self, repository_root: Path) -> None:
        registry = _load_schema(repository_root / "catalog" / "kinds.json")
        entries = registry.get("kinds")
        if not isinstance(entries, list):
            raise _schema_error("SCHEMA_INVALID")
        self._schemas: dict[tuple[str, int], dict[str, Any]] = {}
        self._entries: dict[str, dict[str, Any]] = {}
        schema_root = (repository_root / "schemas").resolve()
        for entry in entries:
            if not isinstance(entry, dict):
                raise _schema_error("SCHEMA_INVALID")
            kind = entry.get("kind")
            version = entry.get("schema_version")
            relative = entry.get("schema")
            if (
                not isinstance(kind, str)
                or not kind
                or type(version) is not int
                or version < 1
                or not isinstance(relative, str)
            ):
                raise _schema_error("SCHEMA_INVALID")
            path = (repository_root / relative).resolve()
            if not path.is_relative_to(schema_root):
                raise _schema_error("SCHEMA_PATH_INVALID")
            schema = load_schema_file(path)
            identity = (kind, version)
            if identity in self._schemas or kind in self._entries:
                raise _schema_error("SCHEMA_DUPLICATE_KIND")
            self._schemas[identity] = schema
            self._entries[kind] = entry

    def entry(self, kind: str) -> dict[str, Any]:
        try:
            return copy.deepcopy(self._entries[kind])
        except KeyError as exc:
            raise SchemaError("KIND_UNKNOWN", registration=True) from exc

    def findings(self, kind: str, version: int, content: Json) -> tuple[Finding, ...]:
        try:
            schema = self._schemas[kind, version]
        except KeyError as exc:
            raise SchemaError("SCHEMA_UNKNOWN", registration=True) from exc
        return _findings_for_validated_schema(schema, content)

    def validate(self, kind: str, version: int, content: Json) -> None:
        findings = self.findings(kind, version, content)
        if findings:
            raise _legacy_validation_error(findings[0])

"""Restricted RFC 8785 canonical JSON for configuration documents.

The configuration format excludes JSON binary floating-point values. Integer values are
limited to the exact IEEE-754 range so the same document has the same JCS bytes in Python
and JavaScript. Callers must validate the kind schema separately before publishing.
"""

from __future__ import annotations

import hashlib
import json
from typing import TypeAlias

Json: TypeAlias = "None | bool | int | str | list[Json] | dict[str, Json]"
MAX_SAFE_INTEGER = (1 << 53) - 1


def _utf16_key(value: str) -> bytes:
    return value.encode("utf-16-be", errors="strict")


def _render(value: Json) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        if abs(value) > MAX_SAFE_INTEGER:
            raise ValueError("JSON integer exceeds canonical safe range")
        return str(value)
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
    if isinstance(value, list):
        return "[" + ",".join(_render(item) for item in value) + "]"
    if isinstance(value, dict):
        if any(not isinstance(key, str) for key in value):
            raise ValueError("JSON object keys must be strings")
        parts = []
        for key in sorted(value, key=_utf16_key):
            parts.append(_render(key) + ":" + _render(value[key]))
        return "{" + ",".join(parts) + "}"
    raise ValueError("Unsupported JSON value; binary floats are prohibited")


def canonical_bytes(value: Json) -> bytes:
    """Return deterministic UTF-8 JCS bytes for the restricted configuration domain."""
    return _render(value).encode("utf-8", errors="strict")


def content_digest(value: Json) -> str:
    return "sha256:" + hashlib.sha256(canonical_bytes(value)).hexdigest()


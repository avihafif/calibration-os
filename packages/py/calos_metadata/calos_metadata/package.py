"""Strict parsing for verification-only Class A metadata packages. @req NFR-18"""

from __future__ import annotations

import hmac
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, cast

from .canonical import Json, canonical_bytes, content_digest
from .schema import SchemaError, SchemaRegistry, validate_document

MAX_PACKAGE_BYTES = 1_048_576
MAX_JSON_DEPTH = 64
MAX_JSON_NODES = 10_000


class PackageError(ValueError):
    """Stable rejection code; untrusted package content is never echoed."""

    def __init__(self, code: str) -> None:
        self.code = code
        super().__init__(code)


@dataclass(frozen=True)
class ParsedPackage:
    manifest: dict[str, Any]
    content: dict[str, Any]
    signature: str
    signed_bytes: bytes


def _unique_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise PackageError("PACKAGE_DUPLICATE_KEY")
        result[key] = value
    return result


def _reject_number(_: str) -> None:
    raise PackageError("PACKAGE_NUMBER_UNSUPPORTED")


def _check_shape(value: Any) -> None:
    stack: list[tuple[Any, int]] = [(value, 0)]
    seen = 0
    while stack:
        node, depth = stack.pop()
        seen += 1
        if depth > MAX_JSON_DEPTH or seen > MAX_JSON_NODES:
            raise PackageError("PACKAGE_COMPLEXITY_LIMIT")
        if isinstance(node, dict):
            stack.extend((child, depth + 1) for child in node.values())
        elif isinstance(node, list):
            stack.extend((child, depth + 1) for child in node)


class PackageParser:
    def __init__(self, repository_root: Path) -> None:
        self._registry = SchemaRegistry(repository_root)
        self._manifest_schema: dict[str, Any] = json.loads(
            (repository_root / "schemas" / "package-manifest" / "v1.schema.json").read_text(
                encoding="utf-8"
            )
        )

    def parse(self, raw: bytes) -> ParsedPackage:
        if len(raw) > MAX_PACKAGE_BYTES:
            raise PackageError("PACKAGE_TOO_LARGE")
        try:
            envelope: Any = json.loads(
                raw.decode("utf-8", errors="strict"),
                object_pairs_hook=_unique_pairs,
                parse_float=_reject_number,
                parse_constant=_reject_number,
            )
        except PackageError:
            raise
        except (UnicodeError, ValueError, RecursionError) as exc:
            raise PackageError("PACKAGE_MALFORMED") from exc
        _check_shape(envelope)
        if not isinstance(envelope, dict) or set(envelope) != {
            "manifest",
            "content",
            "signature",
        }:
            raise PackageError("PACKAGE_ENVELOPE_INVALID")
        manifest = envelope["manifest"]
        content = envelope["content"]
        signature = envelope["signature"]
        if (
            not isinstance(manifest, dict)
            or not isinstance(content, dict)
            or not isinstance(signature, str)
        ):
            raise PackageError("PACKAGE_ENVELOPE_INVALID")
        try:
            validate_document(self._manifest_schema, cast(Json, manifest))
            self._registry.validate(
                manifest["kind"], manifest["schema_version"], cast(Json, content)
            )
            actual = content_digest(cast(Json, content))
            signed_bytes = canonical_bytes(cast(Json, manifest))
        except SchemaError as exc:
            raise PackageError(exc.code) from exc
        except (ValueError, RecursionError) as exc:
            raise PackageError("PACKAGE_CANONICAL_INVALID") from exc
        if not hmac.compare_digest(actual, manifest["content_digest"]):
            raise PackageError("PACKAGE_DIGEST_MISMATCH")
        return ParsedPackage(manifest, content, signature, signed_bytes)

"""Shared structured findings for schema validation and lifecycle contracts."""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

_INVALID_POINTER_ESCAPE = re.compile(r"~(?![01])")


@dataclass(frozen=True, slots=True, kw_only=True)
class JsonPointer:
    value: str

    def __post_init__(self) -> None:
        if not isinstance(self.value, str) or (
            self.value
            and (not self.value.startswith("/") or _INVALID_POINTER_ESCAPE.search(self.value))
        ):
            raise ValueError("invalid JSON Pointer")


@dataclass(frozen=True, slots=True, kw_only=True)
class MessageParameter:
    name: str
    value: str


@dataclass(frozen=True, slots=True, kw_only=True)
class LocalizedMessage:
    key: str
    params: tuple[MessageParameter, ...] = ()


@dataclass(frozen=True, slots=True, kw_only=True)
class Remediation:
    id: str
    params: tuple[MessageParameter, ...] = ()


@dataclass(frozen=True, slots=True, kw_only=True)
class Finding:
    code: str
    severity: Literal["error", "warning", "info"]
    pointer: JsonPointer
    message: LocalizedMessage
    stage: str
    fix: Remediation | None = None

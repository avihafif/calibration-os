"""Version-aware workflow ports; no state-changing implementation in Phase 0B.

ADR-0016 and ADR-0021 remain Proposed. These interfaces describe future
composition boundaries, not authorization to write drafts or release content.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from .canonical import Json


@dataclass(frozen=True)
class ConfigVersionRef:
    tenant_id: str
    kind: str
    key: str
    item_version: str
    schema_version: int
    content_digest: str


@dataclass(frozen=True)
class ReviewSnapshotRef:
    draft_id: str
    content_digest: str


class DraftPort(Protocol):
    def create(self, tenant_id: str, kind: str, key: str, base: ConfigVersionRef | None) -> str: ...

    def read(self, draft_id: str) -> Json: ...


class ValidationPort(Protocol):
    def validate(self, draft_id: str) -> tuple[str, ...]: ...


class ApprovalPort(Protocol):
    def submit(self, draft_id: str) -> ReviewSnapshotRef: ...

    def approve(self, snapshot: ReviewSnapshotRef, actor_id: str) -> None: ...


class PublicationPort(Protocol):
    def publish(self, snapshot: ReviewSnapshotRef) -> ConfigVersionRef: ...


class ReleasePackagePort(Protocol):
    def prepare(self, version: ConfigVersionRef) -> bytes: ...

    def verify_import(self, package: bytes) -> tuple[ConfigVersionRef, ...]: ...

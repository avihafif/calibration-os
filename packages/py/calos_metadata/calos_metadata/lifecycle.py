"""Typed metadata lifecycle contracts only; no workflow implementation.

The host supplies actor/deployment context. ADR-0016 and ADR-0021 remain
Proposed; these ports authorize no persistence, approval or publication.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Protocol, TypeAlias

from .canonical import Json
from .findings import (
    Finding,
    JsonPointer,
    LocalizedMessage as LocalizedMessage,
    MessageParameter as MessageParameter,
    Remediation as Remediation,
)

_DIGEST_PATTERN = re.compile(r"sha256:[0-9a-f]{64}\Z")


@dataclass(frozen=True, slots=True, kw_only=True)
class DraftRevision:
    value: int

    def __post_init__(self) -> None:
        if isinstance(self.value, bool) or not isinstance(self.value, int) or self.value < 0:
            raise ValueError("draft revision must be a non-negative integer")


@dataclass(frozen=True, slots=True, kw_only=True)
class ContentDigest:
    value: str

    def __post_init__(self) -> None:
        if not isinstance(self.value, str) or not _DIGEST_PATTERN.fullmatch(self.value):
            raise ValueError("content digest must be a canonical sha256 digest")


@dataclass(frozen=True, slots=True, kw_only=True)
class Reason:
    value: str

    def __post_init__(self) -> None:
        if not isinstance(self.value, str) or not self.value.strip():
            raise ValueError("a non-empty reason is required")


@dataclass(frozen=True, slots=True, kw_only=True)
class IdempotencyKey:
    value: str

    def __post_init__(self) -> None:
        if not isinstance(self.value, str) or not self.value.strip():
            raise ValueError("a non-empty idempotency key is required")


@dataclass(frozen=True, slots=True, kw_only=True)
class ScopedActor:
    """Trusted host context, never accepted in an authoring or governance request."""

    tenant_id: str
    actor_id: str
    deployment_id: str
    environment_kind: str


class ActorContextPort(Protocol):
    def current(self) -> ScopedActor: ...


@dataclass(frozen=True, slots=True, kw_only=True)
class ConfigVersionRef:
    version_id: str
    tenant_id: str
    kind: str
    key: str
    item_version: str
    schema_version: int
    content_digest: ContentDigest


@dataclass(frozen=True, slots=True, kw_only=True)
class AuthoringScope:
    kind: str
    owner_ref: str | None


@dataclass(frozen=True, slots=True, kw_only=True)
class CreateDraftRequest:
    kind: str
    key: str
    scope: AuthoringScope
    base_version: ConfigVersionRef | None
    content: Json | None


@dataclass(frozen=True, slots=True, kw_only=True)
class DraftRef:
    draft_id: str
    item_id: str
    revision: DraftRevision
    base_version: ConfigVersionRef | None


@dataclass(frozen=True, slots=True, kw_only=True)
class LeaseRef:
    lease_id: str
    holder_actor_id: str
    expires_at: datetime


@dataclass(frozen=True, slots=True, kw_only=True)
class DraftDocument:
    ref: DraftRef
    content: Json
    lease: LeaseRef | None
    validation: ValidationResult | None


@dataclass(frozen=True, slots=True, kw_only=True)
class TakeoverLeaseRequest:
    draft_id: str
    base_revision: DraftRevision
    reason: Reason


class DraftPort(Protocol):
    def create(self, request: CreateDraftRequest) -> DraftRef: ...

    def read(self, draft_id: str) -> DraftDocument: ...


class LeasePort(Protocol):
    def acquire(self, draft_id: str) -> LeaseRef: ...

    def heartbeat(self, lease_id: str) -> LeaseRef: ...

    def release(self, lease_id: str) -> None: ...

    def takeover(self, request: TakeoverLeaseRequest) -> LeaseRef: ...


@dataclass(frozen=True, slots=True, kw_only=True)
class AddPatch:
    path: JsonPointer
    value: Json
    op: Literal["add"] = "add"


@dataclass(frozen=True, slots=True, kw_only=True)
class RemovePatch:
    path: JsonPointer
    op: Literal["remove"] = "remove"


@dataclass(frozen=True, slots=True, kw_only=True)
class ReplacePatch:
    path: JsonPointer
    value: Json
    op: Literal["replace"] = "replace"


@dataclass(frozen=True, slots=True, kw_only=True)
class MovePatch:
    path: JsonPointer
    from_pointer: JsonPointer
    op: Literal["move"] = "move"


@dataclass(frozen=True, slots=True, kw_only=True)
class CopyPatch:
    path: JsonPointer
    from_pointer: JsonPointer
    op: Literal["copy"] = "copy"


@dataclass(frozen=True, slots=True, kw_only=True)
class TestPatch:
    path: JsonPointer
    value: Json
    op: Literal["test"] = "test"


JsonPatch: TypeAlias = AddPatch | RemovePatch | ReplacePatch | MovePatch | CopyPatch | TestPatch


@dataclass(frozen=True, slots=True, kw_only=True)
class PatchDraftRequest:
    draft_id: str
    base_revision: DraftRevision
    lease_id: str
    operations: tuple[JsonPatch, ...]
    label: str | None = None


@dataclass(frozen=True, slots=True, kw_only=True)
class ValidationResult:
    state: Literal["valid", "warnings", "errors"]
    findings: tuple[Finding, ...]
    revision: DraftRevision


@dataclass(frozen=True, slots=True, kw_only=True)
class PatchApplied:
    revision: DraftRevision
    validation: ValidationResult


@dataclass(frozen=True, slots=True, kw_only=True)
class RevisionConflict:
    code: Literal["DRAFT_REVISION_CONFLICT"]
    requested_revision: DraftRevision
    current_revision: DraftRevision


@dataclass(frozen=True, slots=True, kw_only=True)
class LeaseConflict:
    code: Literal["DRAFT_LEASE_HELD"]
    current_lease: LeaseRef


PatchResult: TypeAlias = PatchApplied | RevisionConflict | LeaseConflict


@dataclass(frozen=True, slots=True, kw_only=True)
class ForkDraftRequest:
    source: DraftRef | ConfigVersionRef
    key: str


@dataclass(frozen=True, slots=True, kw_only=True)
class MergeDraftRequest:
    target_draft_id: str
    base_revision: DraftRevision
    lease_id: str
    source: DraftRef


@dataclass(frozen=True, slots=True, kw_only=True)
class MergeConflict:
    pointer: JsonPointer
    code: str


@dataclass(frozen=True, slots=True, kw_only=True)
class MergeConflicted:
    current_revision: DraftRevision
    conflicts: tuple[MergeConflict, ...]


MergeResult: TypeAlias = PatchApplied | RevisionConflict | LeaseConflict | MergeConflicted


@dataclass(frozen=True, slots=True, kw_only=True)
class ChangesetRequest:
    patches: tuple[PatchDraftRequest, ...]
    idempotency_key: IdempotencyKey


@dataclass(frozen=True, slots=True, kw_only=True)
class ChangesetApplied:
    revisions: tuple[DraftRef, ...]


ChangesetResult: TypeAlias = ChangesetApplied | RevisionConflict | LeaseConflict


class EditingPort(Protocol):
    def apply_patch(self, request: PatchDraftRequest) -> PatchResult: ...

    def fork(self, request: ForkDraftRequest) -> DraftRef: ...

    def merge(self, request: MergeDraftRequest) -> MergeResult: ...

    def apply_changeset(self, request: ChangesetRequest) -> ChangesetResult: ...


class ValidationPort(Protocol):
    def validate(self, draft_id: str, revision: DraftRevision) -> ValidationResult: ...


@dataclass(frozen=True, slots=True, kw_only=True)
class ReviewSnapshotRef:
    snapshot_id: str
    draft_id: str
    draft_revision: DraftRevision
    content_digest: ContentDigest


@dataclass(frozen=True, slots=True, kw_only=True)
class SubmitReviewRequest:
    draft_id: str
    base_revision: DraftRevision
    reason: Reason
    idempotency_key: IdempotencyKey


@dataclass(frozen=True, slots=True, kw_only=True)
class StepUpEvidenceRef:
    """Opaque host-validated reference, never a raw credential or assertion body."""

    evidence_id: str


GovernanceAction: TypeAlias = Literal["submit", "approve", "reject", "publish"]


@dataclass(frozen=True, slots=True, kw_only=True)
class ReviewDecisionRequest:
    snapshot: ReviewSnapshotRef
    asserted_digest: ContentDigest
    reason: Reason
    idempotency_key: IdempotencyKey
    step_up: StepUpEvidenceRef | None


class RoleEligibilityPort(Protocol):
    def require_role(
        self, actor: ScopedActor, snapshot: ReviewSnapshotRef, action: GovernanceAction
    ) -> None: ...


class StepUpVerificationPort(Protocol):
    def require_valid(
        self,
        actor: ScopedActor,
        snapshot: ReviewSnapshotRef,
        action: GovernanceAction,
        evidence: StepUpEvidenceRef | None,
    ) -> None: ...


class SeparationOfDutiesPort(Protocol):
    def require_eligible(
        self, actor: ScopedActor, snapshot: ReviewSnapshotRef, action: Literal["approve", "reject"]
    ) -> None: ...


class ApprovalPort(Protocol):
    def submit(self, request: SubmitReviewRequest) -> ReviewSnapshotRef: ...

    def approve(self, request: ReviewDecisionRequest) -> None: ...

    def reject(self, request: ReviewDecisionRequest) -> None: ...


@dataclass(frozen=True, slots=True, kw_only=True)
class SemVerProposal:
    major: int
    minor: int
    patch: int
    prerelease: str | None = None

    def __post_init__(self) -> None:
        if any(
            isinstance(part, bool) or not isinstance(part, int) or part < 0
            for part in (self.major, self.minor, self.patch)
        ):
            raise ValueError("SemVer parts must be non-negative integers")


@dataclass(frozen=True, slots=True, kw_only=True)
class ChangeClassProposal:
    class_id: str


@dataclass(frozen=True, slots=True, kw_only=True)
class PublishVersionRequest:
    snapshot: ReviewSnapshotRef
    asserted_digest: ContentDigest
    proposed_version: SemVerProposal
    proposed_change_class: ChangeClassProposal
    reason: Reason
    idempotency_key: IdempotencyKey


class PublicationPort(Protocol):
    def publish(self, request: PublishVersionRequest) -> ConfigVersionRef: ...


@dataclass(frozen=True, slots=True, kw_only=True)
class StructuralChange:
    pointer: JsonPointer
    kind: Literal["added", "removed", "changed"]
    before_digest: ContentDigest | None
    after_digest: ContentDigest | None


@dataclass(frozen=True, slots=True, kw_only=True)
class StructuralDiff:
    left: DraftRef | ConfigVersionRef
    right: DraftRef | ConfigVersionRef
    changes: tuple[StructuralChange, ...]
    proposed_change_class: ChangeClassProposal | None
    computed_minimum_bump: Literal["patch", "minor", "major"] | None


@dataclass(frozen=True, slots=True, kw_only=True)
class ImpactReport:
    version: ConfigVersionRef
    dependent_versions: tuple[ConfigVersionRef, ...]
    package_ids: tuple[str, ...]
    assignment_ids: tuple[str, ...]
    station_ids: tuple[str, ...]
    in_flight_run_ids: tuple[str, ...]
    approved_result_ids: tuple[str, ...]


class VersionAnalysisPort(Protocol):
    def diff(
        self, left: DraftRef | ConfigVersionRef, right: DraftRef | ConfigVersionRef
    ) -> StructuralDiff: ...

    def dependencies(self, version: ConfigVersionRef) -> tuple[ConfigVersionRef, ...]: ...

    def dependents(self, version: ConfigVersionRef) -> tuple[ConfigVersionRef, ...]: ...

    def impact(self, version: ConfigVersionRef) -> ImpactReport: ...

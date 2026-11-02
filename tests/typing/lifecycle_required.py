"""Expected mypy failures prove mandatory R-7 request fields stay mandatory.

This file is type-checked, never executed. Unused ignores fail strict mypy.
@req AC-GOV-01 @req AC-GOV-09
"""

from calos_metadata.lifecycle import (
    ChangeClassProposal,
    ContentDigest,
    DraftRevision,
    IdempotencyKey,
    PatchDraftRequest,
    PublishVersionRequest,
    Reason,
    ReviewDecisionRequest,
    ReviewSnapshotRef,
    SemVerProposal,
    SubmitReviewRequest,
)


def check_required_fields(snapshot: ReviewSnapshotRef) -> None:
    PatchDraftRequest(draft_id="d", lease_id="l", operations=())  # type: ignore[call-arg]
    SubmitReviewRequest(  # type: ignore[call-arg]
        draft_id="d",
        reason=Reason(value="review"),
        idempotency_key=IdempotencyKey(value="i"),
    )
    SubmitReviewRequest(  # type: ignore[call-arg]
        draft_id="d",
        base_revision=DraftRevision(value=1),
        idempotency_key=IdempotencyKey(value="i"),
    )
    SubmitReviewRequest(  # type: ignore[call-arg]
        draft_id="d",
        base_revision=DraftRevision(value=1),
        reason=Reason(value="review"),
    )
    ReviewDecisionRequest(  # type: ignore[call-arg]
        snapshot=snapshot,
        reason=Reason(value="review"),
        idempotency_key=IdempotencyKey(value="i"),
        step_up=None,
    )
    ReviewDecisionRequest(  # type: ignore[call-arg]
        snapshot=snapshot,
        asserted_digest=ContentDigest(value="sha256:" + "a" * 64),
        reason=Reason(value="review"),
        step_up=None,
    )
    PublishVersionRequest(  # type: ignore[call-arg]
        snapshot=snapshot,
        proposed_version=SemVerProposal(major=1, minor=0, patch=0),
        proposed_change_class=ChangeClassProposal(class_id="editorial"),
        reason=Reason(value="publish"),
        idempotency_key=IdempotencyKey(value="i"),
    )
    PublishVersionRequest(  # type: ignore[call-arg]
        snapshot=snapshot,
        asserted_digest=snapshot.content_digest,
        proposed_version=SemVerProposal(major=1, minor=0, patch=0),
        proposed_change_class=ChangeClassProposal(class_id="editorial"),
        reason=Reason(value="publish"),
    )

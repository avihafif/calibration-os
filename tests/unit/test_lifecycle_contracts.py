"""R-7 contract-only guards. @req AC-GOV-09 @req AC-NC-01"""

import unittest
from dataclasses import FrozenInstanceError, fields

from calos_metadata.lifecycle import (
    AddPatch,
    ChangeClassProposal,
    ContentDigest,
    CreateDraftRequest,
    DraftRevision,
    Finding,
    IdempotencyKey,
    JsonPointer,
    LocalizedMessage,
    PatchDraftRequest,
    PublishVersionRequest,
    Reason,
    ReviewDecisionRequest,
    ReviewSnapshotRef,
    SemVerProposal,
    SubmitReviewRequest,
)


class LifecycleContractTests(unittest.TestCase):
    def test_required_governance_context_cannot_be_omitted(self) -> None:
        # @req AC-GOV-01: action envelopes must carry revision, digest, reason and idempotency.
        snapshot = ReviewSnapshotRef(
            snapshot_id="s",
            draft_id="d",
            draft_revision=DraftRevision(value=1),
            content_digest=ContentDigest(value="sha256:" + "a" * 64),
        )
        required_cases = (
            (
                PatchDraftRequest,
                {
                    "draft_id": "d",
                    "lease_id": "l",
                    "operations": (),
                },
            ),
            (
                SubmitReviewRequest,
                {
                    "draft_id": "d",
                    "base_revision": DraftRevision(value=1),
                    "idempotency_key": IdempotencyKey(value="i"),
                },
            ),
            (
                SubmitReviewRequest,
                {
                    "draft_id": "d",
                    "base_revision": DraftRevision(value=1),
                    "reason": Reason(value="review"),
                },
            ),
            (
                ReviewDecisionRequest,
                {
                    "snapshot": snapshot,
                    "reason": Reason(value="review"),
                    "idempotency_key": IdempotencyKey(value="i"),
                    "step_up": None,
                },
            ),
            (
                PublishVersionRequest,
                {
                    "snapshot": snapshot,
                    "proposed_version": SemVerProposal(major=1, minor=0, patch=0),
                    "proposed_change_class": ChangeClassProposal(class_id="editorial"),
                    "reason": Reason(value="publish"),
                    "idempotency_key": IdempotencyKey(value="i"),
                },
            ),
            (
                PublishVersionRequest,
                {
                    "snapshot": snapshot,
                    "asserted_digest": snapshot.content_digest,
                    "proposed_version": SemVerProposal(major=1, minor=0, patch=0),
                    "proposed_change_class": ChangeClassProposal(class_id="editorial"),
                    "reason": Reason(value="publish"),
                },
            ),
        )
        for contract, incomplete in required_cases:
            with self.subTest(contract=contract.__name__, keys=tuple(incomplete)):
                with self.assertRaises(TypeError):
                    contract(**incomplete)

    def test_empty_or_malformed_required_values_are_rejected(self) -> None:
        for contract, value in (
            (Reason, "  "),
            (IdempotencyKey, ""),
            (ContentDigest, "sha256:wrong"),
            (DraftRevision, -1),
            (DraftRevision, True),
            (JsonPointer, "content/key"),
            (JsonPointer, "/bad~2escape"),
            (SemVerProposal, -1),
        ):
            with self.subTest(contract=contract.__name__, value=value):
                with self.assertRaises(ValueError):
                    if contract is SemVerProposal:
                        SemVerProposal(major=-1, minor=0, patch=0)
                    else:
                        contract(value=value)

    def test_authoring_requests_do_not_accept_caller_tenant_or_actor(self) -> None:
        # Scope is host-supplied through ActorContextPort, not a caller override.
        for contract in (
            CreateDraftRequest,
            PatchDraftRequest,
            SubmitReviewRequest,
            ReviewDecisionRequest,
            PublishVersionRequest,
        ):
            names = {field.name for field in fields(contract)}
            self.assertFalse({"tenant_id", "actor_id", "deployment_id"} & names)

    def test_findings_and_patch_are_typed_immutable_envelopes(self) -> None:
        patch = AddPatch(path=JsonPointer(value="/content/label"), value="synthetic_demo")
        finding = Finding(
            code="PR-001",
            severity="error",
            pointer=patch.path,
            message=LocalizedMessage(key="finding.required"),
            stage="schema",
        )
        self.assertEqual(patch.op, "add")
        self.assertEqual(finding.message.key, "finding.required")
        with self.assertRaises(FrozenInstanceError):
            patch.op = "remove"  # type: ignore[misc,assignment]


if __name__ == "__main__":
    unittest.main()

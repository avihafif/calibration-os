# Gate A0 closure package

Status: **preparation for human decisions. No approval is recorded; every sign-off field is blank.** Prepared 2026-11-02 after PRs #1–#5 were merged into `main`. Nothing in this package changes Codex-owned source, any ADR, or any register; PR #6 is not merged.

| File | Purpose |
|---|---|
| [01_PR6_INDEPENDENT_REVIEW.md](01_PR6_INDEPENDENT_REVIEW.md) | Independent review of R-4 (PR #6): findings with files/lines, ADR-0025 evidence, compatibility, merge readiness |
| [02_GATE_A0_APPROVAL_FORMS.md](02_GATE_A0_APPROVAL_FORMS.md) | 17 approval forms: options, recommendation, evidence, risks, accountable role, blank sign-off |
| [03_ADR_REVIEWS.md](03_ADR_REVIEWS.md) | ADR-0001 and ADR-0015: conflicts with the design handoff and exact amendment text |
| [04_DEPENDENCY_AND_FONT_EVIDENCE.md](04_DEPENDENCY_AND_FONT_EVIDENCE.md) | Minimal dependency list (exact pins, licence, OSV/audit, CSP, SBOM, alternatives) and font verification |
| [05_CHECKLIST_SEQUENCING_AND_BLOCKERS.md](05_CHECKLIST_SEQUENCING_AND_BLOCKERS.md) | Exact checklist, two paths to open the gate, sequencing, remaining blockers to WP-1A-1 |
| [06_PRODUCT_OWNER_DECISIONS_2026-11-02.md](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) | Product-owner outcomes recorded by delegation (PR #8); not independent review |
| [07_PR6_FINAL_REVIEW_VERDICT.md](07_PR6_FINAL_REVIEW_VERDICT.md) | Final PR #6 verdict after the correction round: re-verification of H-1/M-1/M-3/M-5, H-2 deferral safety, merge recommendation |
| [08_ARCHITECTURE_DECISION_PROPOSALS.md](08_ARCHITECTURE_DECISION_PROPOSALS.md) | Recommended outcomes for GA0-02 (architecture half), GA0-05, GA0-09, GA0-10 |
| [09_D12_DEPENDENCY_APPROVAL_MATRIX.md](09_D12_DEPENDENCY_APPROVAL_MATRIX.md) | Exact D-12 dependency approval matrix (pins, licence, vulnerability, CSP, SBOM) with blank approval record |
| [10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md](10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md) | Scoped readiness checklist, staged start, approvals still required |
| [11_ROLE_DESIGNATION_RECORD.md](11_ROLE_DESIGNATION_RECORD.md) | Owner-stated designation of Avi Hafif as Architecture owner, Security reviewer and Legal approver (scope, limits, no approval) |
| [12_SIGNATURE_READY_PACKETS.md](12_SIGNATURE_READY_PACKETS.md) | Eight signature-ready packets with recommended outcomes and exact status changes; every box blank |
| [13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md](13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md) | Outcomes recorded by delegation for P-1…P-8 (assistant-entered under the owner's instruction; not independent review) |
| `evidence/` | Reproducible artefacts: PR #6 probes, dependency evaluation (pins, lock, CSV, results), font licences and checksums |

**Form ids** (`GA0-nn`) identify these forms only; `D-nn`, `PD-DEC-nnn`, `A0-n` and ADR numbers keep their meaning and status. The decision-identifier check (`design/tools/check_decision_ids.py`) continues to pass.

**Headline (updated).** After Codex's correction round, PR #6 is technically ready to merge as an R-4-only change with two human conditions ([07](07_PR6_FINAL_REVIEW_VERDICT.md)); the first-round verdict in [01](01_PR6_INDEPENDENT_REVIEW.md) is historical. WP-1A-1 is blocked only by unrecorded architecture/security/legal decisions ([10](10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md)); the full Gate A0 stays closed.

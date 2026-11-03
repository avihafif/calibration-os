# Gate A0 closure package

**Current status (2026-11-02, after PR #6 merge):** R-4 is merged into `main` at `19e81df`; ADR-0025 is Accepted. Scoped WP-1A-1 product/architecture/dependency decisions are documented by delegation in [06](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) and [13](13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md), **not independently reviewed or legally certified**. ADR-0001/0015 and dependency ADR-0026 are proposed to be recorded in PR #9. Full Gate A0 remains **CLOSED**. Historical review and blank approval forms below are retained as evidence of earlier states.

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
| [14_WP-1A-1a_TRANSITIVE_DEPENDENCY_EXCEPTION_RECORD_2026-11-03.md](14_WP-1A-1a_TRANSITIVE_DEPENDENCY_EXCEPTION_RECORD_2026-11-03.md) | `minimatch` override and one-time ADR-0026 age waiver for PR #11, recorded by delegation (assistant-entered; not independent review) |
| [15_LA-DP-01_LA-DP-02_DELEGATED_RECORD_2026-11-03.md](15_LA-DP-01_LA-DP-02_DELEGATED_RECORD_2026-11-03.md) | Planning direction for the station delivery model (ADR-0011 not ratified) and the re-baselined WP-1A-1c/1d/1e split, recorded by delegation (assistant-entered; not independent review) |
| `evidence/` | Reproducible artefacts: PR #6 probes, dependency evaluation (pins, lock, CSV, results), font licences and checksums |

**Form ids** (`GA0-nn`) identify these forms only; `D-nn`, `PD-DEC-nnn`, `A0-n` and ADR numbers keep their meaning and status. The decision-identifier check (`design/tools/check_decision_ids.py`) continues to pass.

**Headline (current).** PR #6 R-4 has merged and main CI is green. This PR #9 consolidates scoped WP-1A-1 documentation and delegated approvals, but does not deliver application code or any independent security/legal review. Before Codex starts WP-1A-1 sub-PR 1a, reconcile the accepted ADR-0001 A1–A4 specs and run dependency audits when dependencies are actually introduced; keep full Gate A0 closed.

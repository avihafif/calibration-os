# Gate A0 closure package

Status: **preparation for human decisions. No approval is recorded; every sign-off field is blank.** Prepared 2026-11-02 after PRs #1–#5 were merged into `main`. Nothing in this package changes Codex-owned source, any ADR, or any register; PR #6 is not merged.

| File | Purpose |
|---|---|
| [01_PR6_INDEPENDENT_REVIEW.md](01_PR6_INDEPENDENT_REVIEW.md) | Independent review of R-4 (PR #6): findings with files/lines, ADR-0025 evidence, compatibility, merge readiness |
| [02_GATE_A0_APPROVAL_FORMS.md](02_GATE_A0_APPROVAL_FORMS.md) | 17 approval forms: options, recommendation, evidence, risks, accountable role, blank sign-off |
| [03_ADR_REVIEWS.md](03_ADR_REVIEWS.md) | ADR-0001 and ADR-0015: conflicts with the design handoff and exact amendment text |
| [04_DEPENDENCY_AND_FONT_EVIDENCE.md](04_DEPENDENCY_AND_FONT_EVIDENCE.md) | Minimal dependency list (exact pins, licence, OSV/audit, CSP, SBOM, alternatives) and font verification |
| [05_CHECKLIST_SEQUENCING_AND_BLOCKERS.md](05_CHECKLIST_SEQUENCING_AND_BLOCKERS.md) | Exact checklist, two paths to open the gate, sequencing, remaining blockers to WP-1A-1 |
| `evidence/` | Reproducible artefacts: PR #6 probes, dependency evaluation (pins, lock, CSV, results), font licences and checksums |

**Form ids** (`GA0-nn`) identify these forms only; `D-nn`, `PD-DEC-nnn`, `A0-n` and ADR numbers keep their meaning and status. The decision-identifier check (`design/tools/check_decision_ids.py`) continues to pass.

**Headline.** PR #6 is *not ready to merge* (2 High, 7 Medium). WP-1A-1 can start under a scoped authorization once the Path B items in [05](05_CHECKLIST_SEQUENCING_AND_BLOCKERS.md) are signed by named humans; the full Gate A0 needs more.

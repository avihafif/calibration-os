# 10 — Decisions, dependencies, contradictions, unresolved inputs

**Identifier namespace.** Decisions new to this package use **`PD-DEC-nnn`** so they cannot collide with the Phase 1 register ([`docs/phase1/11_DECISIONS_REQUIRED.md`](../phase1/11_DECISIONS_REQUIRED.md), `D-01…D-26`). An earlier revision of this file wrongly reused `D-06…D-17`; those were renumbered (old → new: D-07→PD-DEC-001, D-08→002, D-09→003, D-10→004, D-11→005, D-12→006, D-13→007, D-14→008, D-15→009, D-16→010, D-17→011). The old D-06 was **not** a new decision: it is the existing **D-06** (who may author H2 commands), whose status is unchanged (open); it is only cross-referenced below. A CI check (`design/tools/check_decision_ids.py`, workflow `.github/workflows/design-prototype.yml`) now enforces uniqueness.

Nothing here is approved; "Owner" is a role, not a named person. Recommendations live in [`docs/integration/03_GATE_A0_APPROVAL_MATRIX.md`](../integration/03_GATE_A0_APPROVAL_MATRIX.md).

## Decisions needed
| ID | Decision | Why it matters | Owner | Blocks |
|---|---|---|---|---|
| *D-06 (existing, open — cross-reference only)* | Who may author H2 commands (the prototype **assumes** option (a): a separate Hazardous Driver Author role; not approved) | see Phase 1 register | per register | Command Builder slice |
| PD-DEC-001 | Must an operation be `verified_by_reviewer` before use outside simulation? | driver trust model | LSMA / Quality | driver kind |
| PD-DEC-002 | Driver library lineage/versioning semantics (local copy of platform op) | updates & provenance | Architecture | driver kind |
| PD-DEC-003 | Accept the structured block tree (ADR-0006, *Proposed*) as the Workflow IR for the Designer | whole canvas model | Architecture | all Designer work |
| PD-DEC-004 | Where does the simulation run (central service vs station), and how is "central never talks to instruments" kept | architecture | Architecture | Simulation slice |
| PD-DEC-005 | Numeric functions/aggregations (`mean`, division precision) and **rounding/display rules** | metrology (MI) — prototype shows 12-digit quotients, not a rule | Metrologist | expression catalogue |
| PD-DEC-006 | PR-003 semantics (loops only vs loops, waits and retries); register DRV-001…014 | lint namespace | Architecture | validation |
| PD-DEC-007 | Resume semantics: re-assert state through Broker vs restore from snapshot | engine correctness | Engine owner | recovery |
| PD-DEC-008 | How a procedure selects/pins a Safety Profile (explicit pin vs scope-based) | safety governance | Safety Officer | safety UI |
| PD-DEC-009 | Approval matrix: author/approver/co-approver for profiles and for safety-affecting procedure changes; whether simulation evidence gates review | governance | Quality Manager | review UI |
| PD-DEC-010 | Remappable keyboard shortcuts (Alt+Arrow collisions) | accessibility | UX | Designer |
| PD-DEC-011 | Supported device classes for authoring vs review | responsive scope | Product | Designer |
| PD-DEC-012 | Schedule of the Procedure Designer + Simulation Lab relative to Phase 1A/1B (roadmap M1.6 includes a minimal Simulation Lab, but phase1/13 §2.2 excludes procedures/engine/simulator from Phase 1A) | sequencing; avoids building on Proposed ADR-0006 | Product owner | all Designer implementation |
| Q-08 / MI-01 | Use of vendor documentation, logos, trademarks | licensing | Legal | real drivers |

## Contradictions / gaps found (not silently resolved)
1. **Missing catalogue entries** for reference-standard selection and identification (PD-GAP-1…PD-GAP-3); the prototype marks `standard.require` as *Proposed*.
2. **Uncertainty/decision-rule editors** are Phase 2 in the roadmap but the mission requires their UX: the prototype shows locked, not-evaluated placeholders.
3. **ADR-0006 is Proposed** while the Phase 1 handoff already assumes it.
4. **Codex `PHASE1A_GATE_A0.md`** overlaps with `docs/phase1a/05_GATE_A0_APPROVAL_PACKAGE.md` (carried from Phase 1A); unchanged here.
5. "Select Safety Profile" is asked for in the mission; ADR-0023 says profiles are governed config — prototype shows a **read-only pinned selection** plus the governed change flow.
6. Client-side authority in the prototype vs "validation/safety are server/Broker-enforced" in the architecture.

## Unresolved metrology inputs used as placeholders
MI-03 test points · MI-04 specs/acceptance limits (tp3) · MI-06 reference capability · MI-08 decision rules · MI-14 inclusivity convention · MI-16 stabilisation durations (tp3) · MI-17 uncertainty reference calculations · MI-26 hardware limits (here a *synthetic* simulator pack) · MI-27 TUR policy. **No real value appears anywhere**; synthetic values are labelled `synthetic_demo`.

## Dependencies
Phase 1A design system (PR #3) → this package · ADR-0006/0023/0024 status · catalogue/schema registry (Phase 1B) · Instrument Broker + simulator transport (engine) · review/governance service · i18n professional review (he) · PR #1/#2/#3 merge order is the owner's decision.

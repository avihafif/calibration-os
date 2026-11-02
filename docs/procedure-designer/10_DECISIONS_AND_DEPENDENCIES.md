# 10 — Decisions, dependencies, contradictions, unresolved inputs

IDs continue the Phase 1/1A registers; **D-06…D-17 below are new to this package** (earlier IDs not repeated). Nothing here is approved; "Owner" is a role, not a named person.

## Decisions needed
| ID | Decision | Why it matters | Owner | Blocks |
|---|---|---|---|---|
| D-06 | Introduce a **Hazardous Driver Author** role (H2 authoring) separate from engineers? | prototype assumes yes | Safety Officer + Quality Manager | Command Builder slice |
| D-07 | Must an operation be `verified_by_reviewer` before use outside simulation? | driver trust model | LSMA / Quality | driver kind |
| D-08 | Driver library lineage/versioning semantics (local copy of platform op) | updates & provenance | Architecture | driver kind |
| D-09 | Accept the structured block tree (ADR-0006, *Proposed*) as the Workflow IR for the Designer | whole canvas model | Architecture | all Designer work |
| D-10 | Where does the simulation run (central service vs station), and how is "central never talks to instruments" kept | architecture | Architecture | Simulation slice |
| D-11 | Numeric functions/aggregations (`mean`, division precision) and **rounding/display rules** | metrology (MI) — prototype shows 12-digit quotients, not a rule | Metrologist | expression catalogue |
| D-12 | PR-003 semantics (loops only vs loops, waits and retries); register DRV-001…014 | lint namespace | Architecture | validation |
| D-13 | Resume semantics: re-assert state through Broker vs restore from snapshot | engine correctness | Engine owner | recovery |
| D-14 | How a procedure selects/pins a Safety Profile (explicit pin vs scope-based) | safety governance | Safety Officer | safety UI |
| D-15 | Approval matrix: author/approver/co-approver for profiles and for safety-affecting procedure changes; whether simulation evidence gates review | governance | Quality Manager | review UI |
| D-16 | Remappable keyboard shortcuts (Alt+Arrow collisions) | accessibility | UX | Designer |
| D-17 | Supported device classes for authoring vs review | responsive scope | Product | Designer |
| Q-08 / MI-01 | Use of vendor documentation, logos, trademarks | licensing | Legal | real drivers |

## Contradictions / gaps found (not silently resolved)
1. **Missing catalogue entries** for reference-standard selection and identification (G-1…G-3); the prototype marks `standard.require` as *Proposed*.
2. **Uncertainty/decision-rule editors** are Phase 2 in the roadmap but the mission requires their UX: the prototype shows locked, not-evaluated placeholders.
3. **ADR-0006 is Proposed** while the Phase 1 handoff already assumes it.
4. **Codex `PHASE1A_GATE_A0.md`** overlaps with `docs/phase1a/05_GATE_A0_APPROVAL_PACKAGE.md` (carried from Phase 1A); unchanged here.
5. "Select Safety Profile" is asked for in the mission; ADR-0023 says profiles are governed config — prototype shows a **read-only pinned selection** plus the governed change flow.
6. Client-side authority in the prototype vs "validation/safety are server/Broker-enforced" in the architecture.

## Unresolved metrology inputs used as placeholders
MI-03 test points · MI-04 specs/acceptance limits (tp3) · MI-06 reference capability · MI-08 decision rules · MI-14 inclusivity convention · MI-16 stabilisation durations (tp3) · MI-17 uncertainty reference calculations · MI-26 hardware limits (here a *synthetic* simulator pack) · MI-27 TUR policy. **No real value appears anywhere**; synthetic values are labelled `synthetic_demo`.

## Dependencies
Phase 1A design system (PR #3) → this package · ADR-0006/0023/0024 status · catalogue/schema registry (Phase 1B) · Instrument Broker + simulator transport (engine) · review/governance service · i18n professional review (he) · PR #1/#2/#3 merge order is the owner's decision.

# 05 — User journeys

| | |
|---|---|
| Status | Proposal. Journeys are written for the personas in `PRODUCT_REQUIREMENTS §2`. Every journey names the screens (SCR-nn, 04A/04B) and the acceptance scenario it feeds (AC-NC-nn / P1-AC). |
| Method | Each journey: *goal → preconditions → steps (user action · system response) → pain points designed out → success measure → failure paths*. Steps are GUI-only; no CLI/DB/API access (AC-NC global conditions). Role holders in tests are fixtures; real holders are MI-34 (open). |

## J-01 · Calibration Engineer (P5) creates a new instrument model and driver — AC-NC-01, AC-NC-02

* **Goal.** Add an instrument the platform has not seen before, with a working simulated identity and read, without code.
* **Preconditions.** Signed in to **TEST**; holds Calibration Engineer bundle; a station-less simulator is enough.

| # | Action | System response | Screen |
|---|---|---|---|
| 1 | Builder → Instruments → New model | Guided card: "Choose or create manufacturer" | SCR-05a |
| 2 | Creates "Demo Maker" (display name; aliases for `*IDN?` matching) | Draft created; breadcrumb shows `draft r1`, `● Saved` | SCR-05a |
| 3 | Adds function "DC voltage", picks dimension via unit picker | Ranges cell shows **Input required · MI-02**; provenance chip appears | SCR-05a |
| 4 | Ticks capabilities | Panel shows "Unlocks: measure steps, error-queue handling" | SCR-05a |
| 5 | Validates | Drawer: only expected "Input required" warnings; no errors | Drawer |
| 6 | Drivers → New → Connections → adds `visa` profile via resource wizard (GPIB pattern) | Pattern compiles; requirement "VISA backend" added to Requirements | SCR-05b |
| 7 | Identification → chooses `identify` query, delimited parser, maps fields, pastes a sample response | Table shows parse result and match **Exact ✔** | SCR-05b |
| 8 | Commands → adds `configure_…` (H1) and `read` (H0) with the token editor; sets parameter bounds **or leaves Input required** | Wire-text preview with sample values; rejected-value examples; verification = unverified | SCR-05b |
| 9 | Simulation tab → identity (auto-marked simulated), a rule for the read command, scenario values typed by the engineer (chip `synthetic_demo`) | Rules table validates; conversation terminal available | SCR-05b |
| 10 | Test (simulator mode) → run identify, configure, read | Parsed identity shown; read returns typed Decimal + unit; wire log visible | SCR-05b |

* **Pain points designed out.** Blank-page anxiety (wizard + clone); wrong value types (typed pickers); invisible gaps (Input required badges); trust in the parser (sample tester stored as vectors).
* **Success.** Participant completes unaided; draft validates with only expected warnings; model appears in selectors after publish (J-04).
* **Failure paths.** Unknown placeholder in template → inline error with "Add parameter" quick fix; control character in template → blocked with explanation; duplicate key → suggestion.

## J-02 · Calibration Engineer builds a procedure and metrology — AC-NC-03, AC-NC-04

* **Goal.** Compose a measurement procedure from reusable steps with limits and a calculation.

| # | Action | System response |
|---|---|---|
| 1 | Procedures → New → "Start from template" or blank | Canvas with Setup / As Found / Teardown / Safe-state scaffolding |
| 2 | Drags `operator.confirm`, `foreach` over a spec table, `driver.call`, `measure.acquire`, `evaluate.limits`, `record.result` | Constraints surfaced at drop time; PR-xxx findings appear in the analysis dock |
| 3 | In Metrology → Spec table: adds rows with values the engineer enters (chip `synthetic_demo`) and explicit boundary inclusivity (no default) | Per-row test vector runner shows within/outside for a sample |
| 4 | Binds a standard role in the procedure inspector; adds a `Calculation` node | Role picker lists `StandardRole` items; expression editor shows `: quantity<V>`-style types |
| 5 | Selects a group of nodes → **Extract to sub-procedure** | Wizard infers inputs/outputs; canvas replaces selection with a call node |
| 6 | Adds teardown source-off using the quick fix on PR-018 | Analysis clean |
| 7 | Evaluate-with-sample on the limits expression | Shows within/outside and the expression trace |

* **Pain points designed out.** Unbounded loops, retries on hazardous nodes, dimension mistakes — blocked at edit time with reasons.
* **Success.** Lint clean; canvas shows flow; sub-procedure reused; outline-only keyboard run passes (AC-PD-08).

## J-03 · Calibration Engineer tests in the Simulation Lab — AC-NC-07

| # | Action | System response |
|---|---|---|
| 1 | Run → pick scenario `nominal` | Production engine runs on a central worker with simulator transport only |
| 2 | Sets a breakpoint at the acquire node; continues | Pauses; variable inspector shows typed values; expression trace on the limits step |
| 3 | Injects a "timeout at command N" fault | Handler path visible; superseded attempt retained |
| 4 | **Kill at node X → Resume** | Final dataset compared with the uninterrupted run (identical excluding attempt metadata) |
| 5 | Previews the draft report; saves the configuration + assertions as an **Application test** | App test appears in Tests tab; required to publish |

* **Success.** Resume parity shown; app test saved; run artefacts flagged `simulated`/`debug`.

## J-04 · Engineer publishes, reviewer approves, station installs — AC-NC-08, AC-NC-09

| # | Actor | Action | System response |
|---|---|---|---|
| 1 | Engineer | Application → Validate → Submit for review | Snapshot frozen; digest shown; required approvals computed from change class |
| 2 | Metrology Approver (≠ author) | Opens the review: structural diff, test results, impact, readiness, hazard-path summary | Approve on digest with reason (step-up) |
| 3 | Quality Manager | Approves report/policy-class items; publishes | Immutable versions; SemVer ≥ computed minimum; digests visible |
| 4 | Deployment Manager | Deployments → select enrolled **simulator** station → compatibility ✓ → assign (canary) | Station shows pending → staged → active |
| 5 | Technician | Station → Start calibration → run completes | Run pins version + digest |
| 6 | Engineer | Open published app → New draft → change a step → submit → second user approves → publish v1.1.0 | Distinct digest; both versions exist; SoD enforced; station runs v1.1.0 |

* **Failure paths.** Author tries to approve → `SEPARATION_OF_DUTIES` with plain explanation; stale approval digest → `APPROVAL_DIGEST_MISMATCH` with "re-review required"; incompatible station → reason per gap ("needs agent update").

## J-05 · Deployment Manager rolls back — AC-NC-10

Deployments → select assignment → Rollback → choose earlier **approved, non-withdrawn** version → impact preview (stations affected, in-flight runs unaffected) → reason + step-up → new assignment event. Station activates v1.0; audit shows rollback; in-flight run finishes on its pinned version. Rollback to a withdrawn version is refused with explanation.

## J-06 · LSMA authors a Safety Profile; Safety Officer and Quality Manager approve — AC-NC-12

| # | Actor | Action | System response |
|---|---|---|---|
| 1 | LSMA | Safety Console → New Safety Profile (simulator-scope, `[SIMULATED]`) | Draft; AHL band visible read-only where present |
| 2 | LSMA | Sets envelopes (values supplied by the LSMA — never suggested) | Values outside the AHL band cannot be saved; reason announced |
| 3 | LSMA | Marks interlocks and the safe-state sequence; reviews coverage | Coverage red/green per H2+ command |
| 4 | LSMA | Submit | Approval path computed: Safety Officer required; Quality Manager if flagged (raise-only) |
| 5 | Safety Officer (≠ LSMA, ≠ contributors) | Reviews impact analysis and hazard path; approves on digest | Step-up; audit |
| 6 | Quality Manager | Approves when classified metrological/compliance-affecting | Publish enabled when all approvals are on the same digest |
| 7 | Deployment Manager | Assign; Technician runs a simulated procedure | Broker enforces AHL ∩ profile ∩ bounds; an out-of-envelope test emits `safety.violation` |

* **Failure paths.** Platform Admin attempts approval → control absent/disabled with `ROLE_CONFLICT`/`FORBIDDEN`; author attempts → `SEPARATION_OF_DUTIES`; envelope outside AHL → blocked with PR-023 explanation.

## J-07 · Release Manager and approvers promote Test → Production rehearsal — AC-NC-11

Test: create Release Candidate from published package (evidence attached) → Test approvals → Export (checksums shown) → out-of-band transfer. Production rehearsal: Import → verification findings → production-mode validation → **independent** approvals (importer ≠ approver; Safety Officer (+QM) again for safety content) → Release (identical digests; `origin=release`) → assign canary → recorded sign-off → stable. A package containing `synthetic_demo` is rejected with a **specific finding** at validation. Every step GUI-only.

## J-08 · Technician (P1) runs, is interrupted, resumes — AC-VS-10…13

Start wizard (instrument identity verified → application → standards → preflight → mode) → run console. Power-cut/kill → restart → Home modal "Run … was interrupted at …" with saved data, reconcile plan and any required decisions → Resume → stepwise reconcile → continues; final dataset equals uninterrupted (excluding attempt metadata). Results screen shows limit-check labels and "Conformity: not evaluated"; Generate draft report (he/en), watermark intact.

## J-09 · Platform Administrator administers access safely — AC-SAF-03/04

Users & Roles → assign roles; attempting to combine Platform Admin with `safety.*`/approval permissions → rejected with explanation and audit entry; proposing a privileged grant → pending until a Safety Officer/Quality Manager who is neither grantor nor grantee approves (step-up). Trusted Issuer proposal (Production) → needs Quality Manager **and** Safety Officer.

## J-10 · Quality Manager / Auditor (P4/P8) verifies governance

Opens audit → filters by item → blame view ("who changed this field and when") → verify hash chain → views release lineage and drift dashboard (Test vs Production digests). Read-only; exports are P2.

## J-11 · Translator / reviewer completes localization — AC-NC-05/06 supporting

Localization → key table filtered by "missing/unreviewed" → edits `he`/`en` with ICU helpers → RTL preview with real components → marks `reviewed` (owner per Q-15). Completeness meter feeds the publish gate (PR-017 per policy).

## Journey-to-slice map

| Journey | Slices |
|---|---|
| J-01 | S1, S3 |
| J-02 | S2, S4 |
| J-03 | S4 |
| J-04 | S1, S6, S7 |
| J-05 | S7 |
| J-06 | S3, S4, S5, S7 |
| J-07 | S7 |
| J-08 | S4, S5, S6 |
| J-09 | S0, S7 |
| J-10 | S0, S7 |
| J-11 | S1, S6 |

## Research plan hook
These journeys are the task scripts for the moderated sessions in [10 §8](10_ACCEPTANCE_TESTS.md#8-usability-study-protocol); persona-specific prototypes (P1, P2, P5, P10, P11) are tested in he and en before S4 closes.

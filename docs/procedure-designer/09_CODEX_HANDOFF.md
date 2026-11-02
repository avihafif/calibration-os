# 09 — Codex handoff (Procedure Designer + Simulation Lab)

**Do not start implementation until the Gate decisions in 10 are made.** This handoff reuses, not duplicates, `docs/phase1a/07_CODEX_HANDOFF.md` and the Phase 1 package.

## Read first
`docs/NO_CODE_ARCHITECTURE.md` → `docs/ARCHITECTURE.md` → `docs/PRODUCT_REQUIREMENTS.md` → `docs/PROCEDURE_SCHEMA.md` → ADR-0006/0023/0024 (note ADR status) → this package.

## Non-negotiables (restated from AGENTS §2)
No invented metrology (use `{"$input":"MI-nn"}`); simulation never represented as calibration and never approvable; no instrument/model-specific logic in runtime; Class A content has no code; safety outside editable content (AHL read-only, profiles narrow only, fail closed); no free-form SCPI from procedures/UI/operators; central never talks to instruments; immutable published versions and audit; Decimal + units; deterministic expressions; Test/Production separation; no role bypass.

## Suggested slices (each independently shippable, behind Test deployment only)
1. **Schemas + catalogue**: step types, hints, closed schemas, registry, fixtures (valid+invalid) → regenerate Pydantic/TS. Add missing blocks G-1…G-4 only after D-decisions.
2. **Validation service**: PR-/DRV- codes with stable params; shared with UI preview; golden fixtures from `tests/pd.test.js`.
3. **Designer UI (React)**: view-model → canvas + outline; command stack; palette; inspector widgets; dock panels. Acceptance: the 38 flows in `tests/flows-in-page.js` re-expressed as Playwright (he/en, RTL, light/dark).
4. **Command Builder**: driver config kind, library lineage, operation lint, sandbox via Broker **simulator transport only**.
5. **Simulation service + Lab**: engine interpreter and seeded simulator behind `SimulationPort`; event stream = journal; resume parity and kill-at-boundary tests; report preview object with non-optional watermark.
6. **Safety + governance UI**: read-only AHL pack view, Safety Profile lifecycle with SoD and step-up, review workflow, version compare — **server-enforced**.
7. **Metrology workspace** (points/specs/inputs/provenance first; uncertainty and decision rules only after their kinds are approved).

## Acceptance criteria (carry over)
- Every lint code has a failing fixture; closed-schema and no-raw-command tests exist.
- `canPlace` rules enforced server-side as well; node/depth limits configurable by policy.
- Watermark/flags tests: `simulated=true, issued=false, approvable=false`; no UI or API toggle.
- No path writes AHL or widens limits (static + runtime tests).
- Canvas/outline id-order equality test; keyboard parity test.
- he/en strings via ICU keys; RTL, a11y (axe) in CI; no hard-coded user text.
- Audit events for every state change; correlation IDs; no secrets/PII in logs.

## What to take from the prototype / what not to
Take: behaviours, copy deck structure, lint code semantics, test cases, fixtures, UX flows. **Do not** copy code (vanilla JS, client-side authority, BigInt Dec, interpreter) into production packages — re-implement against ports; the Python evaluator remains authoritative.

## Known prototype simplifications
Client-side validation/simulation; resume restores from checkpoint snapshot; persona permissions are UI only; step-up simulated; synthetic units and driver; digests are prototype digests; one reference-standard role.

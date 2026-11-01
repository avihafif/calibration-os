# ADR-0013: Non-removable simulation marking

Status: Proposed

## Context
Simulation output must never be mistaken for calibration (brief; FR-EXEC-10, FR-REP-02, FR-RPD-04).

## Decision
1. `simulated` is a property of the **transport** (`TransportInfo.simulated`), propagated: instrument session → run (`run_mode=simulation`) → every journal event (`flags.simulated`) → readings → snapshot → report dataset.
2. Mixing is impossible: a run cannot bind real and simulated instruments together except in an explicit, labelled "hybrid test" mode (disabled by default, not approvable).
3. Simulation runs cannot enter review/approval as calibration results; their report templates are forced to the draft/non-certificate family; the **renderer injects** watermark and banner (templates cannot remove them).
4. Simulated identities use a reserved convention (manufacturer/serial tokens containing the simulation marker) so `*IDN?` strings can't pass for real assets; asset binding rejects them.
5. Production-mode preflight rejects any config item with `provenance.status = synthetic_demo` or SafetyProfile `simulated`.
6. Negative tests across API, UI, exports, and PDFs (AC-GA-02).
7. **`validation` mode** (real *test instruments* in a Test deployment, ADR-0024) follows the same rules: watermark "VALIDATION — NOT A CALIBRATION", never approvable or issuable, never in Production. Production deployments accept only `production` runs.

## Consequences
+ Defense in depth against mislabelling. − Slightly more plumbing; test matrix grows.

# Visual Procedure Designer + Simulation Lab — design package

> **Status: design prototype and specification. Not product code, not approved.** All data is synthetic. No instrument is contacted. Nothing here is a calibration, a certificate or an approval. ADRs that are still *Proposed* (e.g. ADR-0006) are **not** treated as approved.

Stacked on Phase 1A (`feature/phase-1a-ux-prototype`, PR #3). It reuses the Phase 1A design system, schema-driven form renderer and shell; it does not modify Codex-owned source, PR #1, #2 or #3.

## Contents
| File | What it is |
|---|---|
| [01_DESIGNER_UX_SPEC.md](01_DESIGNER_UX_SPEC.md) | Visual workflow canvas, accessible outline, palette, inspector, dock, review workflow |
| [02_COMMAND_BUILDER_UX_SPEC.md](02_COMMAND_BUILDER_UX_SPEC.md) | Instrument Command Builder (driver authoring), no raw SCPI |
| [03_COMPONENT_ARCHITECTURE.md](03_COMPONENT_ARCHITECTURE.md) | Product component architecture for the Designer, Metrology, Safety and Simulation Lab |
| [04_METADATA_AND_STEP_CATALOG.md](04_METADATA_AND_STEP_CATALOG.md) | Step catalogue, schema/hint requirements, proposed lint codes |
| [05_DESIGN_SYSTEM_EXTENSIONS.md](05_DESIGN_SYSTEM_EXTENSIONS.md) | New patterns added on top of Phase 1A |
| [06_SIMULATION_SAFETY_GOVERNANCE_UX.md](06_SIMULATION_SAFETY_GOVERNANCE_UX.md) | Simulation Lab, safety envelope, governance UX, metrology UX |
| [07_PROTOTYPE_TESTS_AND_RESULTS.md](07_PROTOTYPE_TESTS_AND_RESULTS.md) | Automated checks and their **actual** results; honest limits |
| [08_DESIGN_REVIEW.md](08_DESIGN_REVIEW.md) | Structured design review (10 dimensions) |
| [09_CODEX_HANDOFF.md](09_CODEX_HANDOFF.md) | Implementation handoff |
| [10_DECISIONS_AND_DEPENDENCIES.md](10_DECISIONS_AND_DEPENDENCIES.md) | Decision/dependency register, contradictions, unresolved MI inputs |
| `screenshots/` | Captures of the prototype |

## Run the prototype
Serve the `design/` folder (the prototype loads Phase 1A scripts from `../phase1a-prototype/`):
```bash
python -m http.server 8765 --bind 127.0.0.1 --directory design
```
Open `http://127.0.0.1:8765/procedure-designer-prototype/`. Strict CSP, `connect-src 'none'`, no network.

## Run the checks
```bash
node design/procedure-designer-prototype/tests/pd.test.js        # pure logic, safety, simulation, boundary lint
node design/procedure-designer-prototype/tests/i18n-audit.js     # en/he completeness
```
`tests/audit-in-page.js` (accessibility) and `tests/flows-in-page.js` (DOM flows) run in the browser: inject them as a `<script src>` on the served page and read `window.__audit` / `window.__flows`.

## The ten demonstrations (all covered by `flows-in-page.js`)
Create a synthetic procedure · add blocks visually · edit properties · connect/reorder steps · configure named driver operations · validate · detect missing inputs · run a synthetic simulation · inspect traces · view results and failure explanations.

## Hard rules reflected in the prototype
Simulation is always labelled and watermarked and can never be approved; hardware limits are read-only with no control that edits or overrides them; a Safety Profile can only narrow; procedures call only named operations with typed parameters; expressions are a closed language (no scripts); metrology values are synthetic or `Input required`; limit checks are never presented as conformity decisions.

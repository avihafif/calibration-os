# Phase 1 implementation package — index

| | |
|---|---|
| Status | **Proposal for human review** — not ratified. Written 2026-11-02 on branch `feature/phase-1-design`, in parallel with Phase 0B (Codex, branch `feature/phase0b-secure-metadata`). |
| Scope | Documentation only. No application source, schema, catalog, CI, or existing document was modified. Every file in this folder is new. |
| Precedence | `NO_CODE_ARCHITECTURE` → `ARCHITECTURE` → `PRODUCT_REQUIREMENTS` → area spec (AGENTS.md §1). Where this package disagrees with those documents it says so explicitly (see [01_SPEC_REVIEW](01_SPEC_REVIEW.md)) and **does not override them**; a human decision or an ADR is required first. |
| Metrology rule | This package contains **no** instrument specification, tolerance, test point, range, uncertainty, safety limit, interval, or rounding rule. Where a screen needs an example, it shows a placeholder (`{nominal}`, `Input required · MI-nn`) or a clearly synthetic label. Illustrative colour/size values are *UI design* proposals, not metrology. |

## Reading order

| # | Document | What it gives you | Primary reader |
|---|---|---|---|
| 01 | [Spec review](01_SPEC_REVIEW.md) | Contradictions, gaps and missing requirements found in the current specification set, each with a proposed resolution and an owner | Product, architecture, Codex |
| 02 | [Phase 1 plan](02_PHASE1_PLAN.md) | Entry gate, slices S0–S8 (milestones), dependencies, exit criteria, parallel-work rules | Everyone |
| 03 | [UX architecture](03_UX_ARCHITECTURE.md) | Design system, shells, navigation, tokens (with computed contrast), RTL/he rules, accessibility, interaction patterns | Design, frontend |
| 04 | [Screen specifications A](04_SCREEN_SPECS_A.md) | Dashboard, Application Library, Application Builder, Procedure Designer, Instrument Manager | Design, frontend |
| 04 | [Screen specifications B](04_SCREEN_SPECS_B.md) | Test Station Manager, Calibration Runner, Measurement Results, Report & Certificate Designer, Administrative Settings, plus Safety / Release / Simulation Lab consoles | Design, frontend |
| 05 | [User journeys](05_USER_JOURNEYS.md) | Journeys per persona, mapped to screens and AC-NC scenarios | UX research, QA |
| 06 | [Component architecture](06_COMPONENT_ARCHITECTURE.md) | TS packages, component contracts, host ports, editor-core command model, schema-driven inspector, dependencies needing approval | Frontend, architecture |
| 07 | [Metadata schemas](07_METADATA_SCHEMAS.md) | Kind inventory per slice, group/permission mapping proposal, proposed bodies for kinds the spec leaves undefined, editor-hint vocabulary, lint-code namespaces | Backend, frontend, metrology reviewer |
| 08 | [API requirements](08_API_REQUIREMENTS.md) | Screen → endpoint map, API additions needed by the UX, error codes, permission matrix | Backend |
| 09 | [Packaging and publishing](09_PACKAGING_AND_PUBLISHING.md) | `.calapp` / Release Package UX and rules, Library trust tiers, plugin visibility, future marketplace model | Product, backend, security |
| 10 | [Acceptance tests](10_ACCEPTANCE_TESTS.md) | Phase 1 acceptance criteria (P1-AC-*), test layers, GUI-only E2E scripts, negative/security, a11y/RTL matrix, usability protocol | QA, Codex |
| 11 | [Decisions required](11_DECISIONS_REQUIRED.md) | Everything that needs a human decision or sign-off, with a recommendation | Product owner, safety/quality |
| 12 | [Codex implementation prompt](12_CODEX_IMPLEMENTATION_PROMPT.md) | Self-contained prompt for Codex to start Phase 1 after the entry gate passes | Codex |
| — | [Design reference (HTML)](design/phase1-design-reference.html) | Static, non-functional visual reference for tokens, LTR/RTL, light/dark and four key screens | Design, stakeholders |

## How this package maps to the assignment

| Assignment item | Where |
|---|---|
| 1. Enterprise No-Code Application Builder (instrument/model, SCPI builder, procedure designer, station & reference equipment, measurement points & specs, formulas & uncertainty, Safety Profile selection, versioning & approval, simulation & debugging, plugin packaging) | SCR-03, SCR-04, SCR-05 (04A); SCR-06, SCR-11, SCR-13 (04B); 07, 09 |
| 2. Enterprise UX/UI architecture, he/en + RTL | 03 |
| 3. Visual product design for ten screens | 04A, 04B, design reference |
| 4. Technical preparation (specs, components, APIs, schemas, acceptance, dependencies, spec review) | 01, 06, 07, 08, 10 |
| 5. Enterprise quality attributes | 02 §7 (quality-attribute traceability), 10 |
| Final deliverable (milestones, journeys, screens, components, acceptance, Codex prompt) | 02, 05, 04, 06, 10, 12 |

## Collaboration boundaries (read before touching anything)

* This folder only adds files under `docs/phase1/`. Codex's Phase 0B branch modifies `AGENTS.md`, `README.md`, `docs/NO_CODE_CAPABILITY_MATRIX.md`, `tools/codegen.py`, `schemas/`, `packages/py/*`, `apps/api/*` and adds `docs/PHASE0B_*.md`. **None of those are touched here.**
* Edits to existing specification documents that this review recommends are listed in [01_SPEC_REVIEW §4](01_SPEC_REVIEW.md#4-recommended-edits-to-existing-documents-not-applied) and are **not applied**; they should be made after Phase 0B merges, by the document owners, to avoid merge conflicts and to keep human approval in the loop.
* Nothing was committed to `main` and nothing was pushed.

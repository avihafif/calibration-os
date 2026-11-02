# Phase 1A work packages — visual Builder on a Synthetic Host

Status: historical conditional plan, updated for the accepted scoped WP-1A-1
Path B decision. PRs #1–#9 are merged; ADR-0001 A1–A4, ADR-0015 B1–B6 and
ADR-0026 are accepted. A reviewed architecture-spec alignment PR remains the
entry condition for WP-1A-1a. Full Gate A0 and H-2/GA0-16 remain closed for
later Builder work. This plan does not ratify any other Proposed ADR.

## Narrow outcome

A Test-only Synthetic Host lets a user create and revise synthetic
`Manufacturer`, `InstrumentFamily` and `InstrumentModel` metadata through
schema-driven forms, validate fields, preview and compare draft revisions, and
demonstrate digest-bound review and **synthetic publish** to an immutable
in-memory version. Personas and approvals are visibly simulated, not an
authorization system. Reload clears all state: no browser storage, network
write, real publication, signing, release, execution or calibration result.
Production rehearsal has no Builder entry point or Synthetic Host bundle.

The design follows `NO_CODE_ARCHITECTURE.md` B-1…B-7,
`VISUAL_APPLICATION_BUILDER_SPEC.md` §§1–4, 12 and `UI_UX_SPEC.md` §§1–6.
ADR-0015's accepted B1–B6 amendments govern scoped localization; ADR-0020
remains Proposed. Detailed Builder rendering and the H-2 vocabulary need
their separate approvals before later work packages.
Claude's [Phase 1A plan in PR #2](https://github.com/avihafif/calibration-os/blob/feature/phase-1-design/docs/phase1/13_PHASE1A_PLAN.md)
is the detailed work-package reference, subject to [Gate A0](PHASE1A_GATE_A0.md).

## Proposed file-level changes, after the gates

| File or directory | Planned responsibility |
| --- | --- |
| `schemas/_common/`, `schemas/instrument-family/v1.schema.json`, `schemas/instrument-model/v1.schema.json` | Shared closed definitions and the two new instrument metadata kinds; no invented metrology limits or vendor-specific branches. Final field list follows approved design and D-11. |
| `schemas/manufacturer/v1.schema.json` | Extend only if an approved field requirement demands it; version the schema instead of editing a published contract in place. |
| `catalog/kinds.json` | Register the model kind, schema version, permission metadata and generic editor hints. Keep labels as localization keys. |
| `fixtures/instrument-model/{valid,invalid-*}.json` | Synthetic positive and negative corpus; missing metrology inputs use `MI-nn` markers only if the approved schema includes those fields. |
| `tools/codegen.py`, `packages/ts/domain-types/src/`, `packages/py/calos_metadata/calos_metadata/generated/` | Generate types from the approved schemas and fail CI on drift; extend the generator only for schema keywords actually needed. |
| `packages/ts/editor-core/src/` | Pure draft commands, undo/redo, validation findings, revision snapshots, structural diff and framework-neutral `InspectorModel` (hint interpretation, field tree, validation binding); injected host ports, no React, `ui-kit` or API client import. |
| `packages/ts/designers/inspector/`, `packages/ts/ui-runtime/src/` | React inspector renderer and widget registry in the `inspector/` folder of the **single** `designers` package; `ui-runtime` remains the operator-screen renderer. Hints need H-2/GA0-16 first. No executable authored content or kind-specific screen. |
| `packages/ts/i18n/`, `packages/ts/ui-kit/` | Compiled ICU en/he system bundles, pseudo-locales, Hebrew plurals, bidi helpers and a future bundle-provider port; reusable enterprise tokens and controls. Use only exact ADR-0026 dependencies after refreshed evidence and system fonts until GA0-06b. |
| `apps/web/src/builder/` | Test-only workspace, dynamic form host, validation summary, local revision preview and change comparison. All controls come from registered kind/schema/editor metadata. |
| `apps/web/src/dev/synthetic-host/`, `packages/ts/host-conformance/` | In-memory host-port implementation and reusable contract tests; synthetic persona/SoD and immutable-version demo, reset on reload. No localStorage, IndexedDB, credentials, network writes or real authority. |
| `apps/web/src/i18n/`, `apps/web/src/style.css` | System UI message keys, English/Hebrew resources, `dir` and logical CSS, visible simulation/deployment badges, focus and responsive tokens. Authored content translation policy remains gated by Q-15. |
| `apps/web/src/App.tsx` | Mount the Builder only in the Test shell after the approved design is integrated; preserve the existing non-operational shell and Production rehearsal exclusion. Client gating is presentation only; no authoring API exists. |
| `tests/frontend/`, `apps/web/src/**/*.test.tsx` | UI, validation, command-stack, localization, Playwright, axe, visual regression and production-bundle exclusion tests. Exact runner dependencies are approved in ADR-0026; re-run vulnerability, licence, CSP and SBOM checks at installation. |
| `.github/workflows/phase0a.yml`, `docs/NO_CODE_CAPABILITY_MATRIX.md`, `README.md` | Add frontend test and codegen gates; describe precisely which local draft operations exist and which governance capabilities do not. |

No Phase 0B verifier, trust snapshot, token validator, Compose identity, or
Production release flow is repurposed as a Builder persistence shortcut.

## Milestones and acceptance evidence

1. **Contract and fixtures.** Review the `InstrumentModel` field contract and
   reference shape with the approved design. Register it, generate types, and
   add positive/negative fixtures. Acceptance: codegen drift, unknown-field,
   required-field, reference-shape, schema-version and canonical digest tests
   pass in Python and TypeScript where the same behavior is implemented.
2. **Pure editor core and Synthetic Host.** Implement generic commands and
   validation, with undo/redo and two immutable local snapshots for visual
   comparison. Acceptance: create/edit/reset tests pass; reload discards all
   state; synthetic publish freezes a digest-bound in-memory version only after
   a different synthetic persona reviews it. Unsupported constructs fail closed.
3. **Bilingual visual slice.** Render both kinds from registry/schema hints,
   with per-field errors, a validation summary, draft revision preview and
   structural change comparison. Acceptance: browser UI tests create and revise
   both kinds without editing JSON; English/Hebrew switching mirrors layout,
   isolates IDs/hashes with LTR direction, and preserves focus and field data.
4. **Quality gate.** Add automated keyboard, accessibility, RTL screenshot,
   schema-drift, production-exclusion and no-code boundary checks. Run existing
   Phase 0A/0B Python, TypeScript, security, architecture and Compose CI jobs.
   Acceptance: all applicable jobs pass, no model-name behavior is introduced,
   no write/approval/publish/execute endpoint exists, and the simulation label
   remains visible in every Builder view.

## PR sequence after Gate A0

The recommended A0 prerequisite sequence is R-4/WP-1A-0 (schema subset,
cross-language canonical vectors) and R-7 (ports only) in separate PRs. The
first **Phase 1A** PR is WP-1A-1 (frontend foundation: `i18n`, `ui-kit`, app
frame, protected badges and test harness). Follow with WP-1A-2 (kinds/fixtures),
WP-1A-3 (editor-core/inspector), WP-1A-4 (Synthetic Host), WP-1A-5 (Builder
screens), WP-1A-6 (new-kind No-Code proof), and WP-1A-7 (GUI-only/a11y/visual
quality and demo). Each work package has its own PR and the P1A-AC rows in
Claude's `13_PHASE1A_PLAN.md §5` as acceptance checks. The WP-1A-0/A0 order
contradiction needs an owner decision before branch creation.

These are Phase 1A acceptance tests, not a claim that the full AC-NC-01…12
walkthroughs or the broader Phase 1 MVP are implemented.

## Decision dependencies and independent work

- **Required before starting this feature branch:** Phase 0B PR merged;
  Claude's architecture/UX design approved and integrated; the final
  `InstrumentModel` schema fields and Synthetic Host UX reviewed for consistency
  with the No-Code architecture. Create a fresh branch from the resulting main.
- **Gate A0:** D-23, D-11/12/13/18/21 and ADR-0001/0015 decisions, R-4/R-7
  prerequisite merges and a named he/en string owner acknowledgement are
  required; see the readiness checklist. Proposed decisions are not approvals.
- **Required before adopting UI policy as a governed product contract:**
  ADR-0015 (i18n/RTL) and ADR-0020 (metadata UI rendering) ratified or
  superseded; Q-15 authored-content language ownership and MI-31 terminology
  reviewed where those features are exposed.
- **Required before server drafts, publication or Production workflows:**
  ADR-0016 and ADR-0008 for lifecycle and tenant persistence, ADR-0004/0014
  for operational trust and identity, and ADR-0021/0024 release controls.
  MI-34 role holders must be named; no signatories are inferred.
- **Safe independent preparation while design is pending:** review schema
  keyword support, inventory frontend test tooling/licenses, refine synthetic
  fixtures and canonical vectors, and maintain CI/isolation checks. These
  activities do not alter Claude's worktree or implement the Builder.

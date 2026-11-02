# Phase 1A implementation plan — local visual metadata Builder

Status: conditional proposal, 2026-11-02. No Phase 1A implementation starts
until Phase 0B PR #1 is reviewed and merged, Claude's Phase 1 architecture and
UX design is approved and integrated, and conflicts with the normative
No-Code architecture are resolved. This plan does not ratify any Proposed ADR.

## Narrow outcome

A Test-only, browser-local workspace lets a user create and revise synthetic
`Manufacturer` and `InstrumentModel` metadata through schema-driven forms,
validate fields, preview a local draft revision, and compare two local draft
snapshots. It supports English and Hebrew with RTL and keyboard access. The
workspace never calls a write API and cannot publish, approve, sign, release,
execute, or produce a calibration result. Production rehearsal has no Builder
entry point. Local browser storage is disposable draft convenience, not a
governed `ConfigDraft`, `ConfigVersion`, audit record, or security boundary.

The design follows `NO_CODE_ARCHITECTURE.md` B-1…B-7,
`VISUAL_APPLICATION_BUILDER_SPEC.md` §§1–4, 12 and `UI_UX_SPEC.md` §§1–6.
The current Builder and UX documents are Draft, and ADR-0015/0020 are Proposed;
their detailed rendering and localization choices need formal review before
they become product contracts.

## Proposed file-level changes, after the gates

| File or directory | Planned responsibility |
| --- | --- |
| `schemas/instrument-model/v1.schema.json` | Closed `InstrumentModel` content contract with a Manufacturer reference and descriptive, non-metrological fields; no numeric limits or vendor-specific branches. Final field list follows the approved design. |
| `schemas/manufacturer/v1.schema.json` | Extend only if an approved field requirement demands it; version the schema instead of editing a published contract in place. |
| `catalog/kinds.json` | Register the model kind, schema version, permission metadata and generic editor hints. Keep labels as localization keys. |
| `fixtures/instrument-model/{valid,invalid-*}.json` | Synthetic positive and negative corpus; missing metrology inputs use `MI-nn` markers only if the approved schema includes those fields. |
| `tools/codegen.py`, `packages/ts/domain-types/src/`, `packages/py/calos_metadata/calos_metadata/generated/` | Generate types from the approved schemas and fail CI on drift; extend the generator only for schema keywords actually needed. |
| `packages/ts/editor-core/src/` | Pure draft commands, undo/redo, validation findings, revision snapshots and structural diff over typed metadata; injected storage/clock/ID ports, no API client import. |
| `packages/ts/ui-runtime/src/` | Generic field registry and schema-driven form renderer with typed widget props; reject unsupported schema keywords and unknown fields. No executable authored content. |
| `apps/web/src/builder/` | Test-only workspace, dynamic form host, validation summary, local revision preview and change comparison. All controls come from registered kind/schema/editor metadata. |
| `apps/web/src/builder/localDraftStore.ts` | Browser-local adapter for the editor-core storage port, namespaced to a Test deployment and synthetic workspace; bounded size, explicit reset/export-as-data, no automatic server synchronization. |
| `apps/web/src/i18n/`, `apps/web/src/style.css` | System UI message keys, English/Hebrew resources, `dir` and logical CSS, visible simulation/deployment badges, focus and responsive tokens. Authored content translation policy remains gated by Q-15. |
| `apps/web/src/App.tsx` | Mount the Builder only in the Test shell after the approved design is integrated; preserve the existing non-operational shell and Production rehearsal exclusion. Client gating is presentation only; no authoring API exists. |
| `tests/frontend/`, `apps/web/src/**/*.test.tsx` | UI, validation, command-stack, localization, accessibility and negative boundary tests. Exact test runner and dependencies undergo license/ADR-0022 tooling review before installation. |
| `.github/workflows/phase0a.yml`, `docs/NO_CODE_CAPABILITY_MATRIX.md`, `README.md` | Add frontend test and codegen gates; describe precisely which local draft operations exist and which governance capabilities do not. |

No Phase 0B verifier, trust snapshot, token validator, Compose identity, or
Production release flow is repurposed as a Builder persistence shortcut.

## Milestones and acceptance evidence

1. **Contract and fixtures.** Review the `InstrumentModel` field contract and
   reference shape with the approved design. Register it, generate types, and
   add positive/negative fixtures. Acceptance: codegen drift, unknown-field,
   required-field, reference-shape, schema-version and canonical digest tests
   pass in Python and TypeScript where the same behavior is implemented.
2. **Pure editor core and local storage.** Implement generic commands and
   validation, with undo/redo and two immutable local snapshots for visual
   comparison. Acceptance: create/edit/reload/reset tests pass; invalid data
   stays a draft and never gains a verified/published status; unsupported schema
   constructs fail closed; storage cannot cross Test deployment namespaces.
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

These are Phase 1A acceptance tests, not a claim that the full AC-NC-01…12
walkthroughs or the broader Phase 1 MVP are implemented.

## Decision dependencies and independent work

- **Required before starting this feature branch:** Phase 0B PR merged;
  Claude's architecture/UX design approved and integrated; the final
  `InstrumentModel` schema fields and local-draft UX reviewed for consistency
  with the No-Code architecture. Create a fresh branch from the resulting main.
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

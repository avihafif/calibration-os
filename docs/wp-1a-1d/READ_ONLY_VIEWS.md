# WP-1A-1d — read-only data views

This PR adds generic display components to `@calos/ui-kit` and a **Test-only, synthetic UI** demonstration in the existing AppFrame. The components receive rows, labels, formatted messages, sorting state, and callbacks from their caller. They do not interpret schemas or connect to a host. The demonstration has no persistence, network, instrument or metrology data. Production Rehearsal excludes its compiled sentinel.

## Criterion coverage

| Criterion | Status | Evidence |
|---|---|---|
| DV-01 semantic `DataTable`, caption, headers, caller-defined columns and stable row IDs | Implemented | `data-views.test.tsx`: caption/headers/row identity, duplicate-ID rejection; `data-views.e2e.spec.ts`: table/axe |
| DV-02 caller-controlled sort, `aria-sort`, locale collation and exact decimal comparator | Implemented | `data-views.test.tsx`: sort callback, en/he/pseudo collation, stable ties, 30-digit exact strings with caller comparator; browser Enter sort |
| DV-03 focusable, labelled horizontal-scroll region with sticky first column | Implemented | `data-views.e2e.spec.ts`: 320/768/1440 px × en/he/en-XA/he-XB × light/dark, no page overflow, keyboard ArrowRight scroll; logical CSS lint |
| DV-04 semantic `DetailList` and all five `StatePanel` states | Implemented | `data-views.test.tsx`: `dl`, loading/empty/no-results/error/read-only roles, busy state, SVG icons, localized state text; browser axe |
| DV-05 LTR isolates and full-value access for technical text | Implemented | `data-views.test.tsx`: long mixed-script value and full title; browser mixed Hebrew/English ID, RTL and pseudo-locale screenshots |
| DV-06 generic findings, grouping, callback navigation, no message namespace | Implemented for the display DTO | `data-views.test.tsx`: arbitrary message keys, severity/stage groups, LTR codes, pointer callback. `schemas/finding/v1.schema.json` produces the generated `Finding` types; `apps/web/src/finding-contract.proof.ts` asserts structural equality with the independent UI Kit type under strict TypeScript. No finding message-key namespace is selected. |
| DV-07 native keyboard behavior and named row actions | Implemented | `data-views.e2e.spec.ts`: Enter on sort and Inspect actions, focus moved to details, findings navigation; no custom arrow-key grid behavior |
| DV-08 deferred features | Excluded | No diff, tree, editing, chooser, export, paging backend or virtualization |

`DisplayText` uses a focusable full-value title and a `bdi dir="ltr"` for technical values. Ordinary free text uses `dir="auto"`. `DataTable` never calls `Number` or `parseFloat`; a column marked `exact-decimal` requires a caller comparator at compile time. The kit has no awareness of column content semantics.

The `Finding` schema is a build-time display DTO, **not a configuration kind or runtime validator**. It mirrors the fields of the existing Python lifecycle finding contract without changing that dataclass or exposing an API. A future host adapter must explicitly map Python `JsonPointer.value`, optional remediation, and message parameters into the DTO; this PR has no such host connection.

## Local verification (Windows, 2026-11-05)

- Locked pnpm install: 228 packages. Strict TypeScript and browser test typing, ESLint, logical CSS, 77 architecture/UI-string negative probes, 24 design-token contrast pairs, R-4 schema vectors: passed.
- Vitest: **58/58** tests; Playwright Chromium: **13/13** tests, including the new 24-combination data-view matrix and axe for all four locales. No page-level overflow at 320/768/1440 px. Viewport 640/320 emulates 200%/400% reflow from 1280 CSS px; actual browser zoom was not exercised.
- Test and Production Rehearsal builds and bundle checks: passed; the latter excludes both synthetic form and data-view sentinels. `pnpm audit`: no known vulnerabilities. CycloneDX 1.7: **228** components, approved licence inventory, **0** OSV advisories.
- Python: `tools/check.py` ran **37 core + 14 security** tests, including two positive/negative Finding DTO vectors; direct security suite **14/14**; Ruff, strict mypy (**19** source files), and **4** import contracts passed. No Python runtime behavior changes.
- Full-tree `pnpm format:ts:check` on Windows reports **28 untouched CRLF baseline files**. All changed TypeScript, CSS, JSON and tool files pass the pinned Prettier check. CI on Linux is the authoritative full-tree format gate; its PR result must be checked before review completion.

Screenshots from the real app: [full English AppFrame](screenshots/data-app-en.png), [full Hebrew AppFrame](screenshots/data-app-he.png), [forced colors](screenshots/data-forced-colors.png). The component matrix is in `screenshots/data-{en,he}-{light,dark}-{320,768,1440}.png` (12 files).

## Run locally

From the repository root with Node 22.22.2+ and pnpm 11.25.0:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm build:web
node tools/check_frontend_bundle.mjs
pnpm test:frontend
pnpm test:e2e
pnpm --filter @calos/web dev --host 127.0.0.1
```

Switch language and theme using the AppFrame controls. The data-view demonstration appears only in Test; the Production Rehearsal build retains the protected markings but omits the demo.

## Review limits

Real screen-reader and Windows Edge verification, actual 200%/400% browser zoom, and externally served CSP headers have not been verified here. The future Python-to-DTO host adapter and finding-key governance remain open. Hebrew terminology remains `needs_review`. These components do not establish operational or production readiness.

# WP-1A-1c-2 — enterprise form hardening

Status: Test-only synthetic UI foundation. PR #20 is merged. This follow-up
does not add a Builder, metrology logic, persistence, host API or operational
workflow. The A1–A13 criteria below came from Claude's final PR #20 review;
this table reports implementation evidence and does not ratify new architecture.

| Criterion | Status | Evidence / limit |
|---|---|---|
| A1 unique IDs | Implemented | `form-controls.test.tsx` checks `useId` IDs and explicit override on all five controls. |
| A2 visible required label | Implemented in demonstration | `SyntheticFormDemo` passes localized `requiredLabel`; unit and browser tests verify visible label and native `required`. A generic caller must supply localized text. |
| A3 summary and focus | Implemented | `FormSummary` has one polite live region, links focus fields; failed submit focuses summary. Unit and browser tests cover both paths. |
| A4 blur validation | Implemented in demonstration | Required/decimal errors appear on blur or submit; field errors have no live role. Unit and browser tests cover the initial typing and blur sequence. |
| A5 Hebrew shortcut | Implemented | AppFrame matches physical `KeyK` with Ctrl/Cmd; browser test dispatches Hebrew `key` with `code=KeyK`. Actual OS layout switching remains unverified. |
| A6 bidirectional fields | Implemented | Free text uses `dir=auto` and caller `lang`; decimal text remains LTR with autocomplete off. Unit and RTL browser tests cover attributes and layout. |
| A7 target size, forced colors | Implemented for form controls | Token targets 44 px and forced-colors rules preserve focus and error borders. Browser test checks dimensions and computed focus styles. This is not a manual assistive-technology audit. |
| A8 error-state matrix | Implemented in Chromium automation | Playwright runs axe and overflow checks at 320/768/1440 × en/he × light/dark; pseudo-locale error layouts are checked separately. Edge and screen readers are not yet verified. |
| A9 decimal negatives | Implemented for existing 128-code-unit validator | Unit corpus rejects CRLF, trailing LF and lone surrogate. Native single-line HTML text inputs strip newlines before React receives them. 200-digit paste and 200 deterministic exact-string round trips remain covered. A product policy for an overall paste ceiling is unresolved. |
| A10 Test-only bundle guard | Implemented | Distinct sentinel is required in Test build and rejected in Production Rehearsal. The bundle checker executes its own negative injection probe and preserves prior preview-ID rejection. |
| A11 decimal prop type | Implemented | `NumberTextField` omits `maxLength` from its public props and always sends `null` to the underlying text field; no native truncation. |
| A12 memory reset | Implemented | Browser test verifies Reset and full reload clear the local form. No storage or network calls added. |
| A13 evidence | Local pass; PR CI pending | Local checks below passed. GitHub Windows/Linux, browser and Compose jobs must pass on the PR head before review completion. |

`NumberTextField` intentionally preserves every browser-provided string. Its
128 UTF-16-code-unit syntax limit is a **validation** limit; the input has no
native `maxlength`, so a longer paste remains visible and is rejected after
blur or submit. The repository has no approved outer memory ceiling or paste
policy. `QuantityField` and `IntervalField` remain outside scope until BR-08.

## Local verification (PowerShell)

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm check:ts
pnpm check:browser-types
pnpm lint:ts
pnpm test:frontend
pnpm build:web
node tools/check_frontend_bundle.mjs
pnpm test:e2e
$env:VITE_ENVIRONMENT_KIND = 'production_rehearsal'
pnpm build:web
node tools/check_frontend_bundle.mjs
Remove-Item Env:VITE_ENVIRONMENT_KIND
```

The Test build must precede Playwright because the preview server serves the
current `apps/web/dist` directory. For manual use, run
`pnpm --filter @calos/web dev --host 127.0.0.1` and open the printed local URL.

Known gaps: manual Windows Edge and screen-reader evaluation; CSP HTTP response
headers before external deployment; Hebrew terminology review; owner decision
on an outer paste ceiling; BR-08 quantity and interval semantics. Full Gate A0
and operational trust remain closed.

## Local results (Windows, 2026-11-04)

- Strict TypeScript and browser typing, ESLint, changed-file Prettier,
  logical-CSS lint, 77 import/UI-string negative probes and 24 contrast pairs:
  passed.
- Vitest: 39/39; Playwright Chromium: 10/10, including error-state axe across
  12 locale/theme/width combinations, forced colors, Hebrew physical-key
  shortcut and pseudo-locale overflow checks.
- Python core: 35/35; security: 14/14; Ruff check/format, strict mypy on 18
  files, and four import contracts: passed.
- Test and Production Rehearsal bundle checks: passed; the latter excludes
  the form sentinel. The negative injection probe passed.
- Frozen pnpm install, CycloneDX 1.7 with 228 components, approved licences,
  zero OSV advisories and `pnpm audit` with no known vulnerabilities: passed.
  The initial offline-only SBOM lacked registry licence metadata; the gate
  correctly rejected it. A network-enabled frozen install restored metadata
  without changing the lockfile or dependencies, and the final gate passed.

Full-tree Prettier on this Windows checkout still flags untouched CRLF
baseline files; changed files pass. Docker Compose startup is verified by
GitHub CI, not by this local host. Final PR CI evidence will be linked in the
pull request description.

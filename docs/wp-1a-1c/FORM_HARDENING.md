# WP-1A-1c-2 — enterprise form hardening

Status: Test-only synthetic UI foundation. PR #20 is merged. This follow-up
does not add a Builder, metrology logic, persistence, host API or operational
workflow. The A1–A13 criteria below came from Claude's final PR #20 review;
this table reports implementation evidence and does not ratify new architecture.

| Criterion | Status | Evidence / limit |
|---|---|---|
| A1 unique IDs | Implemented | `form-controls.test.tsx` checks `useId` IDs and explicit override on all five controls. |
| A2 visible required label | Implemented | A discriminated TypeScript contract requires `requiredLabel` whenever `required: true`; an empty label fails at render. English and Hebrew tests verify the visible text and native `required`. |
| A3 summary and focus | Implemented with manual SR caveat | `FormSummary` is non-live, focusable and linked to fields without changing URL/history. A persistent, separate polite region receives one outcome per submit; tests observe its DOM mutations. Real screen-reader behavior remains unverified. |
| A4 blur validation | Implemented in demonstration | Required/decimal errors appear on blur or submit; field errors have no live role. Unit and browser tests cover the initial typing and blur sequence. |
| A5 Hebrew shortcut | Implemented | AppFrame accepts Latin `key=k` or physical `KeyK` with Ctrl/Cmd; browser vectors include Hebrew and a remapped Latin key. Actual OS layout switching remains unverified. |
| A6 bidirectional fields | Implemented | Free text uses `dir=auto` and caller `lang`; decimal text remains LTR with autocomplete off. Unit and RTL browser tests cover attributes and layout. |
| A7 target size, forced colors | Implemented for form controls | Token targets 44 px and forced-colors rules preserve focus and error borders. Browser tests check dimensions and Tab focus rings on checkbox, button and summary link. This is not a manual assistive-technology audit. |
| A8 error-state matrix | Implemented in Chromium automation | Playwright runs axe and overflow checks at 320/768/1440 × en/he × light/dark; pseudo-locale error layouts are checked separately. Edge and screen readers are not yet verified. |
| A9 decimal negatives | Implemented for existing 128-code-unit validator | Unit corpus rejects CRLF, trailing LF and lone surrogate. Browser normalization differs: Chrome converts inner line breaks to spaces, drops a trailing LF, and replaces a lone surrogate. These browser-provided strings are then validated. 200-digit paste and 200 deterministic exact-string round trips remain covered. An overall paste-ceiling policy is unresolved. |
| A10 Test-only bundle guard | Implemented | Distinct sentinel is required in Test build and rejected in Production Rehearsal. The bundle checker executes its own negative injection probe and preserves prior preview-ID rejection. |
| A11 decimal prop type | Implemented | `NumberTextField` omits `maxLength` from its public props and always sends `null` to the underlying text field; no native truncation. |
| A12 memory reset | Implemented | Browser test verifies Reset and full reload clear the local form. No storage or network calls added. |
| A13 evidence | Implemented; re-review pending | Local checks below and GitHub CI status are maintained in the PR description; a fresh independent review is required after the corrections. |

## Independent PR #24 review closure (2026-11-05)

| Finding | Disposition | Verification |
|---|---|---|
| M-1 URL/history mutation | Fixed | Summary link prevents default navigation before focusing its field. Unit and keyboard Playwright tests compare URL and history length. |
| M-2 optional required label | Fixed | Discriminated props require localized text on every required control, including the legacy `Input` wrapper; blank text throws. Type-level and en/he rendering tests cover this. |
| M-3 repeated live announcements | Fixed in DOM behavior | Editable summary is non-live. A separate persistent region changes only on submit, with a new keyed outcome for repeated submissions. Unit and browser mutation tests cover typing and resubmission. Real SR verification remains necessary. |
| M-4 mount/focus announcement risk | Reduced, manual check open | Live region now exists before validation and is separate from the focus target. Whether a particular screen reader announces the live outcome and focused summary twice needs a manual pass. |
| L-1 remapped Latin shortcut | Fixed | Latin `key=k` is accepted even when the physical code is not `KeyK`; Hebrew physical-key behavior is retained. |
| L-3 sticky overlap | Fixed | Summary and controls use a 64 px scroll margin; the 768 px browser regression checks the focused summary clears the sticky marking. |
| L-5 forced-colors coverage | Strengthened | Keyboard Tab checks focus rings on checkbox, button and summary link in forced-colors emulation. |
| L-7 newline wording | Corrected | Browser normalization is described above without claiming all newlines are stripped. |
| L-9 summary link size | Fixed | Links have at least a 24 px block target. |

Remaining low-severity items: empty `dir=auto` fields may begin LTR before
Hebrew text; Production Rehearsal retains inert form CSS and translation keys;
free-text caps still need an owner policy; blur errors are intentionally
non-live until submit. None adds an operational path. A manual NVDA/JAWS or
equivalent pass is required before claiming screen-reader acceptance.

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

Known gaps: manual screen-reader evaluation and real OS keyboard-layout
switching; CSP HTTP response headers before external deployment; Hebrew
terminology review; owner decision on an outer paste ceiling; BR-08 quantity
and interval semantics. Full Gate A0
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

Full-tree Prettier on this Windows checkout still flags 23 untouched CRLF
baseline files; changed files pass. Docker Compose startup is verified by
GitHub CI, not by this local host. The PR description carries current CI
run links and conclusions.

## Review-correction verification (Windows, 2026-11-05)

- Vitest: 41/41, including type-level required-label guards, blank-label
  rejection, URL/history invariance, and live-region mutation counts across
  repeated invalid and valid submissions.
- Playwright Chromium: 12/12, including keyboard Enter on a summary link,
  unchanged URL/history, Latin and Hebrew shortcut vectors, one live-region
  update per submit, sticky-header clearance, forced-colors keyboard rings,
  axe and responsive/pseudo-locale checks.
- Strict TypeScript, browser typing, ESLint, logical CSS, architecture
  boundaries, Test and Production Rehearsal bundle checks: see the exact
  final-head results in PR #24. The PR must receive a fresh independent review
  before merge.

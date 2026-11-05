# WP-1A-1c — interactive form controls

Status: Test/Simulation frontend foundation; PR #20 merged. No
operational calibration, metadata editing, persistence or publication.

## Implemented scope

- `@calos/ui-kit` provides controlled `TextField`, `TextArea`,
  `NumberTextField`, `Select` and `Checkbox` components. Labels, help and error
  messages have explicit IDs and accessibility associations. Required,
  disabled, read-only and invalid states are supported where applicable.
- `NumberTextField` preserves the complete input string, including paste. It
  omits the native `maxlength` attribute, then rejects noncanonical decimal
  syntax and values longer than 128 UTF-16 code units with a visible,
  localized error and `aria-invalid`. It does not convert through a JavaScript
  number, round, coerce or silently truncate. This is UI text validation, not
  a metrological quantity parser.
- The Test AppFrame has a synthetic local form with localized validation and
  reset. Its state is React memory only; submit has no operational effect.
  Production Rehearsal neither renders nor bundles this interactive form.
- No dependency, host call, browser storage, font or instrument behavior was
  added.

## Proposed FC-01–FC-12 criteria coverage

The FC criteria in `docs/review/lead-architect-2026-11-03/02_FRONTEND_ACCEPTANCE_CRITERIA.md`
were proposed for product-owner adoption. They were not individually approved
as PR #20 requirements. This table reports actual coverage; it does not record
an architecture or governance decision.

| Criterion | Coverage | Evidence and remaining work |
|---|---|---|
| FC-01 Field system | Partial | Label, hint, error, `aria-describedby`, `aria-invalid`, `aria-errormessage` and native required state exist. IDs are caller-supplied, and required is marked with a star rather than localized required/optional text. |
| FC-02 Controls and states | Partial | Five controlled controls cover the assigned scope. No `RadioGroup`; some proposed `autoComplete`, `lang`/`dir` override and state combinations are absent. |
| FC-03 Exact decimal text | Partial | `NumberTextField` keeps exact strings, trailing zeros and all pasted characters; bounded syntax validation rejects exponent, separators, Unicode digits and bidi controls. Unit tests include 200 seeded round trips and browser paste of 200 digits. Proposed outer-whitespace trimming and broader property testing remain. |
| FC-04 Quantity/interval compositions | Not implemented | Requires separate scope and review; no unit catalogue, dimension logic or inclusivity defaults were introduced. |
| FC-05 Localized text field | Not implemented | No per-locale field composition or required-locale policy. |
| FC-06 Validation presentation | Partial | Inline localized errors and the Test form submit validation exist. No error summary, focus transfer, blur validation or polite count announcement. |
| FC-07 Dialog hardening | Not implemented | Existing dialog remains as in WP-1A-1b; no PR #20 change. |
| FC-08 Layout-independent shortcuts | Not implemented | Existing command palette shortcut uses `event.key`, so Hebrew keyboard layouts remain a known limitation. |
| FC-09 SVG status icons | Not implemented | Existing glyph icons remain; no PR #20 change. |
| FC-10 Density and forced colors | Not implemented | No comfortable/compact density tokens, 44 px target guarantee or forced-colors test. |
| FC-11 No-Code boundary | Partial | Controls accept generic props and interpret no schema or editor hint. Existing 77 boundary probes pass; proposed dedicated source probes are absent. |
| FC-12 Synthetic demonstration | Partial | Test-only, memory-only interaction and reset exist. A reload-clears-state browser assertion is not yet present. |

The approved follow-up hardening is tracked in
[FORM_HARDENING.md](FORM_HARDENING.md). The FC coverage above records PR #20
at its merge; it does not retroactively change that PR's acceptance scope.

## Screenshots

- [English, light](form-en-light.png)
- [Hebrew, dark](form-he-dark.png)

## Local run (PowerShell)

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @calos/web dev --host 127.0.0.1
```

Open the Vite URL, choose English or Hebrew and a theme in the header, then
use the interactive form in the Test workspace. For the static preview tests,
build the **Test** artifact explicitly:

```powershell
$env:VITE_ENVIRONMENT_KIND = 'test'
pnpm build:web
pnpm test:e2e
```

## Verification on Windows, 2026-11-04

| Check | Result |
|---|---|
| Strict TypeScript, browser types, ESLint, logical CSS | Passed locally |
| Changed-file Prettier | Passed locally |
| Vitest | 34/34 passed, including 200 seeded decimal round trips |
| Playwright | 6/6 passed after an explicit Test build; includes en/he 200-digit clipboard paste, axe, 12 locale/theme/viewport frame combinations, no-JS marking and network/storage denial |
| Architecture, design tokens, R-4 vectors | 77 negative probes, 24 contrast pairs and all vectors passed |
| Test and Production Rehearsal bundle checks | Passed; Test form excluded from Production Rehearsal script |
| Python core/security, Ruff, mypy, imports | 35 + 14 tests passed; Ruff check/format passed, mypy strict passed on 18 files, 4/4 import contracts held |
| Frozen offline pnpm install, CycloneDX, licences, OSV, audit | 228 components; approved licences, zero OSV findings and no known npm vulnerabilities |
| GitHub Actions at `05b475f` | [Phase 0A run 164](https://github.com/avihafif/calibration-os/actions/runs/41784859667): 5/5 jobs passed, including Windows and Ubuntu Python, TypeScript, browser and Compose rehearsal. [Design prototype run 133](https://github.com/avihafif/calibration-os/actions/runs/41784859935): passed |

The full-tree Prettier command on this Windows checkout flags 26 untouched
baseline files because their checkout line endings are CRLF. The changed-file
check passes; Linux CI passed the full-tree gate on the earlier correction
head. PR #22 merged into main as `f1e5ab8`, and this branch merged that main
head without conflicts. The injected JWT test clock and the decimal-input
fixes are both present. On the integrated branch, local checks passed 35 core
and 14 security tests, 34 frontend unit tests, six Playwright tests, the Test
and Production Rehearsal bundle guards, and the 228-component supply-chain
gate. Current-head GitHub CI evidence is recorded in PR #20.

## Known limitations at PR #20 merge

- The subsequent [WP-1A-1c-2 hardening](FORM_HARDENING.md) addresses the
  Hebrew command-palette shortcut, error summary/focus behavior, 44 px form
  targets and forced-colors support. This section records the PR #20 baseline.
- Real screen-reader behavior and Windows Edge behavior have not been manually
  verified. Browser automation uses Chromium; axe results do not substitute
  for those manual checks.
- Hebrew terminology remains `needs_review` (MI-31). The static no-JS fallback
  uses English markings. F-05 CSP response headers are not enforced by the
  development preview, so external deployment remains blocked.
- Full Gate A0 and GA0-16 remain closed. Nothing here establishes operational
  or production security readiness.

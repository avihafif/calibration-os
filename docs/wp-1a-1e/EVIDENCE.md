# WP-1A-1e-A implementation evidence

Status: **review candidate with explicit H-4 and N-1 exclusions**. This is a
frontend-only simulation milestone, not a host integration or an operational
calibration capability. Claude is the independent reviewer; human GitHub
approval and merge remain separate.

## Entry and T0 baseline

- Branch `codex/wp-1a-1e-a-routing-host-status` was created from `origin/main`
  `df479b0b6f3bc7134216131d56fe1ce0af5f38da` in a dedicated worktree.
  PRs #25 and #26 were merged. The [Phase 0A push run](https://github.com/avihafif/calibration-os/actions/runs/42164191958)
  and [design-prototype run](https://github.com/avihafif/calibration-os/actions/runs/42164192001)
  for that exact main commit completed successfully.
- Confirmed `safeDisplayText`, `DisplayText`, the protected-marking height
  variable, `SyntheticDataViewsDemo` and its sentinel before editing.
- On that clean baseline, `pnpm install --frozen-lockfile --ignore-scripts`
  installed the locked 228 packages; `pnpm check:ts`, `pnpm lint:ts`,
  `pnpm test:ts-boundary` (80 probes), `pnpm test:design-tokens` (24 contrast
  pairs), `pnpm test:frontend` (62/62), `pnpm build:web`, and `pnpm test:e2e`
  (16/16) passed. Vite's existing `react-intl` module-directive warning
  appeared; the build completed.
- Host versions: Windows, Node 26.10.0, pnpm 11.25.0, Chrome 156.0.8078.79,
  Edge 156.0.4314.58. Edge was detected but **not run** for this PR.
- The specification's earlier CSP/sub-path/Edge measurements were not rerun
  on a pristine copy of this main commit. They are background measurements,
  not claimed as fresh T0 results. On this implementation, relative sub-path
  hosting remains unverified and gated by H-4.

## Implemented and evidence map

| Criteria | Evidence | Status |
|---|---|---|
| RO-01, RO-02 | `router.test.ts` hostile corpus, `routes.test.ts`; unknown-route Playwright test; Test/Rehearsal bundle runs | Implemented; Rehearsal deep-link browser check not run |
| RO-03–RO-08 | `routing.e2e.spec.ts` URL, title, native links, focus, skip-link, Back/Forward, locale, unknown routes; `App.test.tsx` | Implemented for tested routes |
| RO-09 | Relative asset URLs, sub-path mount and bundle-gate change | **Blocked by H-4; not implemented** |
| RO-10–RO-12 | Existing network/storage isolation browser test, route axe matrix; route-local form/data state unmounts | Implemented; real screen-reader check remains manual |
| KB-01–KB-03, KB-05–KB-07 | `AppFrame.test.tsx`, F6 browser test, updated tab order and Hebrew `KeyK` test | Implemented; browser accelerator precedence is not proven |
| KB-04 | Real Edge normal/app mode and Chrome manual check | **Not run** |
| PS-01–PS-06 | `search.test.ts` vectors and seeded idempotence test; Hebrew palette browser test | Implemented, with punctuation-vector conflict below |
| SR-01–SR-05, SR-08 | 60 route screenshots, per-route 44 px shell-target and horizontal-overflow assertions, 12 host screenshots, existing 320/768/1440 and pseudo-locale tests, focus overlap regression | Locally tested; Rehearsal short-page geometry not run |
| SR-06 | Status-bar height CSS variable and responsive sticky rule | Implemented; focused footer-overlap sweep not run |
| HS-01, HS-03–HS-04 | UI-side types; fake and unavailable injected ports; unit severity table and browser preset checks | Fake/local only; no real host adapter |
| HS-05–HS-08 | Text + SVG status summary, localized details, one polite region, mismatch alert, fixed fake host time; host browser screenshots | Partial: no untrusted normalization/identifier intake |
| HS-02, HS-09–HS-11 | Defensive normalizer, disabled-with-reason action, complete sentinel gate and hostile-input fuzz | **Deferred with T4 real intake pending N-1 / PR #27 and H-4** |
| AB-01, AB-02, AB-04–AB-07 | No new dependencies/lockfile; 90 negative boundary probes; Test/Rehearsal static builds; diff review | Implemented within scope |
| AB-08 | 10 additive negative probes for `navigator.onLine`, `history.pushState`, clock reads and `ui-kit` router access | Passed locally |
| AB-09, AB-10 | Capability Matrix note; manual three-sentinel Rehearsal scan | Full host-sentinel bundle-gate edit awaits H-4 |

All new Hebrew system messages remain `needs_review`. The router has no
storage, loaders, service worker or runtime network path. The fake port is an
in-memory push interface. No station, API, persistence, signing, publishing,
instrument or metrology code changed.

## Verification on the implementation worktree

| Command or check | Actual result |
|---|---|
| `pnpm check:ts`, `pnpm check:browser-types`, `pnpm lint:ts`, `pnpm lint:logical-css` | Passed |
| `pnpm test:ts-boundary` | 90 negative probes passed |
| `pnpm test:design-tokens` | 24 contrast pairs passed |
| `pnpm test:schema-vectors` | 3 digests, 3 manifest groups, 2 safe-grammar groups passed |
| `pnpm test:frontend` | 9 files, 97 tests passed; 0 failed |
| `pnpm build:web` + existing bundle gate, Test | Passed, one JS script |
| `pnpm build:web` + existing bundle gate, Production Rehearsal | Passed, one JS script; manual string scan confirmed form, data and host sentinels absent |
| Fresh Test `pnpm build:web` then `pnpm test:e2e` | 24/24 passed against the final source, including 60 route geometry/screenshot cases and 12 host screenshots; 0 failed |
| `python tools/check.py` via existing Python 3.12.16 venv and current-checkout `PYTHONPATH` | 35 core + 14 security passed; no skips |
| Ruff check and format | Passed; 39 Python files formatted |
| mypy strict | 18 source files passed |
| import-linter | Four contracts kept, none broken |
| `pnpm audit` | No known vulnerabilities |
| CycloneDX SBOM + licence/OSV checker | 228 components, licences approved, zero OSV advisories |
| `pnpm format:ts:check` on Windows | Fails on 30 **untouched baseline** files due CRLF; changed-file Prettier check passed |

The Python executable came from the existing PR #25 worktree's locked virtual
environment because this fresh worktree had no `uv` binary. `PYTHONPATH` was
pointed at this checkout's `packages/py/*/src` paths. The first attempt with
global Python 3.11 lacked dependencies and was not used as passing evidence.

## Screenshots and visual review

The browser test generates the full five-route × en/he × light/dark ×
320/768/1440 screenshot set and a 12-image host-page matrix in ignored
`artifacts/screenshots/`; CI's existing browser artifact upload can retain
them. Four representative images are committed here:

| English | Hebrew |
|---|---|
| [Overview, light desktop](screenshots/overview-en-light-1440.png) | [Overview, dark mobile](screenshots/overview-he-dark-320.png) |
| [Host, light desktop](screenshots/host-en-light-1440.png) | [Host, dark mobile](screenshots/host-he-dark-320.png) |

Geometry and axe assertions are automated; there are no pixel baselines.
Real NVDA/JAWS, physical display scaling, Windows High Contrast, touch and
browser-chrome F6 behavior still need manual checks.

## Open decisions, deviations and remaining work

1. **H-4 / RO-09.** The owner must approve the exact relative-URL change to
   `apps/web/vite.config.mjs`, `apps/web/index.html` and the strictly stronger
   `tools/check_frontend_bundle.mjs` check. The bundle gate was **not edited**.
   Until then this build is not proven to mount under a sub-path.
2. **N-1 / PR #27.** Untrusted host identifier validation and
   `normalizeHostStatus(unknown)` remain unimplemented. The host view accepts
   only the local fake and the unavailable port; there is no real adapter.
   T4's hostile-input, disabled-action and complete sentinel-gate criteria
   require a separate reviewed completion after N-1 and H-4.
3. **Specification search-vector inconsistency.** PS-01 mandates NFKD folding
   and PS-02 mandates normalized `includes`, which cannot match query
   `בדיקה v1` across the literal `)` in `CalOS (בדיקה) v1.2` from the
   §4.3 vector table. The implementation follows PS-01/02 exactly; the
   punctuation-spanning example needs an architecture clarification.
4. **PR B and external deployment.** Strict-CSP browser harness, Windows/Edge
   CI, forced-colors/scaling matrix and workflow changes are not in PR A.
   H-3/H-5 approvals remain required; no workflow was modified. The Station
   Agent must supply an actual CSP header before external deployment.
5. The static no-JavaScript fallback keeps the English protected markings and
   title. A reviewed host preference port does not yet exist.

## Local run

From the repository root in PowerShell:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @calos/web dev --host 127.0.0.1
```

Open `http://127.0.0.1:5173/#/overview` or `#/host` in the local browser.
Use the Language control, or the compact Settings disclosure on mobile.
`Ctrl+K` opens navigation search; `F6` cycles regions when the browser sends
that key to the page. The Host page changes fake status in React memory only.

```powershell
pnpm check:ts
pnpm check:browser-types
pnpm lint:ts
pnpm test:ts-boundary
pnpm test:frontend
pnpm build:web
node tools/check_frontend_bundle.mjs
pnpm test:e2e
```

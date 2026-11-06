# WP-1A-1e-A implementation evidence

Status: **corrected review candidate with explicit H-4 and N-1 exclusions**. This is a
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
| KB-01–KB-03, KB-05–KB-07 | `AppFrame.test.tsx`, F6 browser test, restored Hebrew `KeyK` and character-`k` assertions | Implemented; browser accelerator precedence is not proven |
| KB-04 | Real Edge normal/app mode and Chrome manual check | **Not run** |
| PS-01–PS-06 | `search.test.ts` vectors and seeded idempotence test; Hebrew palette browser test | Implemented; merged Errata 1 clarifies the punctuation vector |
| SR-01–SR-05, SR-08 | 60 route screenshots, per-route 44 px shell-target and horizontal-overflow assertions, 12 host screenshots, 320/768/1440 and pseudo-locale tests, bounded-frame focus overlap regression | Locally tested; Rehearsal short-page geometry not run |
| SR-06 | Status-bar height CSS variable and responsive sticky rule | Implemented; focused footer-overlap sweep not run |
| HS-01, HS-03–HS-04 | UI-side types; fake and unavailable injected ports; unit severity table and browser preset checks | Fake/local only; no real host adapter |
| HS-05–HS-08 | Text + SVG status summary, localized details, one polite region, mismatch alert, fixed fake host time; host browser screenshots | Partial: no untrusted normalization/identifier intake |
| HS-02, HS-09–HS-11 | Runtime sentinel and bundle presence/exclusion gate implemented; ASCII identifier validation, defensive normalizer, disabled-with-reason action and hostile-input fuzz remain absent | **Partial T4; separate reviewed work required. PR #27 merged a proposal, not implementation** |
| AB-01, AB-02, AB-04–AB-07 | No new dependencies/lockfile; 90 negative boundary probes; Test/Rehearsal static builds; diff review | Implemented within scope |
| AB-08 | 10 additive negative probes for `navigator.onLine`, `history.pushState`, clock reads and `ui-kit` router access | Passed locally |
| AB-09, AB-10 | Capability Matrix note; automated positive Test and negative Rehearsal checks for all three runtime sentinels | Implemented; relative-URL gate remains H-4 blocked |

## Independent-review correction record

The [PR #28 independent review](https://github.com/avihafif/calibration-os/pull/28#issuecomment-6678865755)
was a conditional NO-GO at `f018993`. The merged [PR #29 errata](https://github.com/avihafif/calibration-os/pull/29)
informed the corrections below; it approves no operational gate.

| Finding | Correction | Regression evidence |
|---|---|---|
| C-1 | Restored Ctrl/Cmd+K matching by character `k` **or** physical `KeyK`. | `AppFrame.test.tsx` covers Hebrew `ל/KeyK`, Dvorak-style `k/KeyV`, Ctrl/Cmd and no-modifier; `i18n.e2e.spec.ts` restores the visible-dialog assertion for `k/KeyV`. |
| C-2 | The synthetic host component now renders `CALOS_SYNTHETIC_HOST_STATUS_ONLY` as a DOM attribute. The existing bundle gate now requires it in Test and rejects it in Rehearsal, including a negative canary. | Both `VITE_ENVIRONMENT_KIND` builds passed `tools/check_frontend_bundle.mjs`; compiled JS string scan found all three Test sentinels in Test and none in Rehearsal. No relative-URL gate change. |
| C-3 | Replaced the five-second `expect.poll` with a fixed two-animation-frame settlement, followed by the original exact zero-overlap assertion for every focus step. | `data-views.e2e.spec.ts` focus case passed 10 consecutive Chromium repetitions (all five locale/width combinations per run), then passed in the full browser suite. See timing investigation below. |
| C-4 | Canonicalizes empty hashes on every `hashchange` with `history.replaceState`; defers route-heading focus one animation frame so AppFrame can close the palette and remove `inert` first. | `routing.e2e.spec.ts` tests `#` and `#/`, history length, Back, palette closure, focused headings, title and active navigation. |
| en-XA mobile | Mobile topbar retains the 44 px menu/settings targets and fits the command button beside settings through wrapped text and compact gaps. | `routing.e2e.spec.ts` checks en-XA/he-XB at 320×568: topbar ≤180 px, no horizontal page overflow, controls ≥44 px. Diagnostic measurement on en-XA was 157 px after the change versus 237 px before. |

### Linux CI history failure and follow-up

At `c535b86`, the [Phase 0A Linux browser job](https://github.com/avihafif/calibration-os/actions/runs/42179691565)
failed in `routing.e2e.spec.ts`: Back changed the URL to `#/overview`, but
the palette remained open. The other four jobs and the separate design check
passed. A repeated local Chromium run of the then-current test reproduced
the failure in four of its first five attempts; it was stopped after
reproduction. This is a state transition race:
the palette can open after a route URL changes but before React processes its
`hashchange`; a quick Back then returns to the last rendered `activeId`, so
AppFrame's `[activeId]` effect never fires. `popstate` delivery also varies in
timing relative to `hashchange`.

The correction subscribes the hash router to both history notifications,
closes AppFrame transient UI on each navigation event regardless of
`activeId`, and schedules heading focus on those events even when rapid
transitions collapse to one rendered route. The existing Back/Forward
assertions remain: URL, closed dialog, focused heading, `aria-current`, and
title. The test additionally waits for the first route to render before
opening the palette, checks three Back/Forward cycles, and adds a separate
rapid `pushState`/Back case. A new AppFrame unit test exercises a `popstate`
with unchanged `activeId`. The Vitest config now includes existing
`apps/web/src/**/*.test.ts` files, which had accidentally been excluded;
their router, route and host-port tests now execute. No timeout, skip or
explicit polling was added. The 20 targeted local browser repetitions passed.

This Windows host has neither Docker nor WSL. The failing Actions job is the
reproduction under the requested Linux Chromium CI conditions; the final
commit must pass a fresh Linux Actions run before independent review.

**Focus timing investigation.** The earlier assertion sampled immediately after a
keyboard event, while Chromium's native focus scrolling and the sticky
marking's ResizeObserver offset can settle across paint frames. The review
reported transient 47–52 px overlaps and zero in stable frames; a local
20-run instrumentation probe did not reproduce the transient overlap. The
replacement waits exactly two `requestAnimationFrame` callbacks and then
asserts **zero**. There is no retry or five-second tolerance. Ten repeated
browser runs passed. The precise scheduling trigger on Claude's machine
remains unproven; a fresh independent run should test it there.

**Changes to existing tests.** The first correction changes the existing
`i18n.e2e.spec.ts` KeyV assertion back to `toBeVisible()` and changes only
the timing before each zero-overlap assertion in the existing
`data-views.e2e.spec.ts` focus test. The Linux CI follow-up extends the
new `routing.e2e.spec.ts` Back/Forward test with a rendered-route precondition
and three cycles, and adds the rapid-history case. It adds a `popstate` unit
assertion to `AppFrame.test.tsx` and a router notification assertion to
`router.test.ts`. `vitest.config.mjs` now executes that previously excluded
router test and two other pre-existing `.test.ts` suites. No existing-test
assertion was removed, inverted or relaxed. The earlier PR implementation changed route
entry URLs to `/#/data` and `/#/forms`, introduced `selectDisplay` for mobile
settings, and adjusted form tab order for the new shell; those remain in the
PR and are not represented as new baseline behavior. The new routing and
unit tests are additive.

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
| `pnpm test:frontend` | 12 files, 130 tests passed; 0 failed, including the newly included existing `.test.ts` suites |
| `pnpm build:web` + bundle gate, Test | Passed, one JS script; all three runtime sentinels present |
| `pnpm build:web` + bundle gate, Production Rehearsal | Passed, one JS script; all three runtime sentinels absent |
| Fresh Test `pnpm build:web` then `pnpm test:e2e` | 28/28 passed, including the new rapid-history case; 0 failed |
| `pnpm exec playwright test tests/frontend/data-views.e2e.spec.ts --grep 'keyboard focus clears' --repeat-each=10` | 10/10 passed |
| `pnpm exec playwright test tests/frontend/routing.e2e.spec.ts --grep 'Back and Forward close\|rapid history reversal' --repeat-each=10` | 20/20 passed |
| `python tools/check.py` via existing Python 3.12.16 venv and current-checkout `PYTHONPATH` | 35 core + 14 security passed; no skips |
| Ruff check and format | Passed; 39 Python files formatted |
| mypy strict | 18 source files passed |
| import-linter | Four contracts kept, none broken |
| `pnpm audit` | No known vulnerabilities |
| CycloneDX SBOM + licence/OSV checker | 228 components, licences approved, zero OSV advisories |
| `pnpm format:ts:check` on Windows | Fails on 30 **untouched baseline** files due CRLF; all changed-file Prettier checks passed |

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
2. **T4 HostStatus follow-up.** PR #27 merged the N-1 *proposal*, not its
   implementation. The accepted [Errata 1](ERRATA.md) clarify that ASCII
   identifier validation (HS-02), unknown-by-default behaviour and HS-09
   can proceed in a separate reviewed PR without waiting for N-1 or H-4.
   They are **not implemented here**. A `normalizeHostStatus(unknown)` intake,
   disabled-with-reason action and hostile-input fuzz remain absent; the host
   view accepts only the local fake and unavailable port. Displaying
   non-ASCII technical text still depends on N-1 implementation. The runtime
   sentinel and Test/Rehearsal gate are complete; H-4 still blocks relative
   URL work.
3. **Search vector.** Merged Errata 1 resolves the former punctuation-vector
   inconsistency: `בדיקה) v1` matches the literal substring and
   `בדיקה v1` does not. The implementation follows PS-01/02; token-based
   matching would require a separate product decision.
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

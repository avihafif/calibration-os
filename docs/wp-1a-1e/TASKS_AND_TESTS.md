# WP-1A-1e — task breakdown, test inventory and manual verification

Companion to [`SPECIFICATION.md`](SPECIFICATION.md) (criteria IDs RO, KB, HS, CS, WE, FS, PS, SR, AB are defined there). Sizes are relative (S/M/L), not time estimates.

## 1. Recommended pull-request split

The owner may choose one PR (decision D-E2 in [`HUMAN_APPROVALS.md`](HUMAN_APPROVALS.md)). **Recommended: two sequential PRs**, each from the then-current `main`, so that waiting for the workflow approval (H-3) never blocks the code.

| PR | Title | Tasks | Needs human decision before it can merge |
|---|---|---|---|
| **A** | `WP-1A-1e-a: hash routing, host-status contract and shell hardening` | T0, T1, T2, T3, T4, T5, T6a (relative base, sub-path), T9a | D-E1 (router), D-E3 / H-4 (gate edit for the relative stylesheet link), independent review, human GitHub approval |
| **B** | `WP-1A-1e-b: strict-CSP verification, Windows/Edge harness, forced-colors and scaling` | T6b, T7, T8, T9b, T10 | H-3 (exact workflow diff), H-5 (Edge source), H-6 (visual-baseline policy), independent review, human GitHub approval |

```
T0 ─► T1 ─► T3 ─┐
 │      └──► T4 ─┼─► T5 ─► (A done) ─► T6b ─► T7 ─► T8 ─► T9b ─► T10 (B done)
 └──► T2 ─┬─► T3 │
          ├─► T4 ┘
          └─► T6a
```

## 2. Tasks

Every task lists its allowed paths. Paths not listed are forbidden (see also `SPECIFICATION.md` AB-05, AB-06, AB-07). The common allowed set is: `packages/ts/ui-kit/src/**`, `packages/ts/i18n/src/**`, `apps/web/src/**`, `tests/frontend/**`, `docs/wp-1a-1e/**`, `docs/NO_CODE_CAPABILITY_MATRIX.md`.

### T0 — Preconditions and baseline (S)
1. Confirm WP-1A-1d (PR #25) is merged to `main`; branch from `main`. If it is not merged, **stop**.
2. Confirm the [needs PR #25] facts exist: `safeDisplayText` and `DisplayText` in `ui-kit`, `--calos-protected-marking-height` set by `AppFrame`, `SyntheticDataViewsDemo` with sentinel `CALOS_SYNTHETIC_DATA_VIEWS_ONLY`, and the focus-versus-marking test.
3. Re-run the baseline measurements in `SPECIFICATION.md` §3 (CSP, sub-path, Edge, target sizes, top-bar height, short-page scroll) and record the numbers in `EVIDENCE.md`. Note any difference from this document; if a baseline figure moved, say so rather than adapting silently.
4. Run the full gate list from `docs/wp-1a-1b/UI_KIT.md` and record counts.

Exit: `EVIDENCE.md` section "Baseline" with commands, versions and counts.

### T1 — Search normalisation and messages (S) — PS-01…PS-04, PS-06 data part
Files: `packages/ts/i18n/src/search.ts`, `search.test.ts`, `index.ts` export, `messages.ts`, `index.test.ts` (extend the placeholder-argument list).
1. `normalizeSearchText` and `matchesSearchQuery` exactly as PS-01/PS-02. No `Intl.Collator` (it cannot do substring search; see baseline).
2. Vector table from §4.3 below as a data-driven test, plus a seeded property test (normalisation is idempotent; never throws; output length ≤ input length × 3).
3. Messages he/en for: `route.forms`, `route.data`, `route.host`, `route.notFound`, `route.notFoundBody`, `route.notFoundLink`, `shell.regionTopbar`, `shell.regionWorkspace`, `shell.regionStatus`, `shell.f6Hint`, `shell.searchResults` (ICU plural), and every `host.*` key listed in §4.2. Hebrew goes through the existing review-status mechanism and stays `needs_review`; pseudo-locales continue to be generated.

### T2 — Router, route table and pages (M) — RO-01…RO-12
Files: `apps/web/src/router.ts`, `routes.tsx`, `pages/*.tsx`, `App.tsx`, `main.tsx` if needed; `packages/ts/ui-kit/src/PageHeader.tsx` (+ export); `AppFrame.tsx` (controlled `activeId`, `href: #/${string}`, skip link); tests.
1. `parseHash(hash, ids): { kind: "route"; id } | { kind: "canonicalize" } | { kind: "unknown" }` pure (RO-01). `useHashRoute()` with `useSyncExternalStore` on `hashchange`; canonicalisation with `history.replaceState` once.
2. `buildRoutes(kind)` returns the table in §4.1. Test-only pages are registered inside an `environmentKind === "test"` branch.
3. Split `App.tsx` into pages. `PageHeader` renders the `h1` with `tabIndex={-1}` and forwards a ref. Title and focus effects run only after the first route change (RO-04, RO-05). Boundary keyed by route id (RO-11).
4. `AppFrame`: remove local `activeId`; skip link handler (RO-06); clicking the current route's link focuses the `h1` (RO-05).
5. Update `App.test.tsx` tab-order expectations; add `router.test.ts`, `routes.test.ts`, `tests/frontend/routing.e2e.spec.ts`.

### T3 — AppFrame behaviours: F6, landmarks, palette (M) — KB-01…KB-07, PS-05, PS-06, RO-12, SR-07
Files: `AppFrame.tsx`, `frame.css`, `primitives.tsx` only if the palette needs it; tests.
1. `data-frame-region` attributes and the four focus targets (§4 table of the specification); named landmarks.
2. F6 handler per KB-01…KB-05 (window `keydown`, `event.key === "F6"`, `preventDefault` when handled). Visibility via `checkVisibility?.()`; the unit tests inject visibility.
3. Palette: matching through `matchesSearchQuery` over `label` and optional `keywords`; Enter activates the first result; polite result-count status; the palette and drawer close on route change; hint line mentions `F6`.
4. `scroll-padding`/`scroll-margin` so region focus clears the marking (reuse the PR #25 variable).

### T4 — Host status (M) — HS-01…HS-11
Files: `packages/ts/ui-kit/src/host-status.ts(x)`, `HostStatusBar`/`HostStatusChip`/`ActionWithReason`, `AppFrame.tsx` (new optional `hostStatus` prop, status-bar slot), `frame.css`; `apps/web/src/host/*`, `pages/Host.tsx`; `tools/check_frontend_bundle.mjs` (third sentinel, additive), `eslint.config.mjs`, `tools/check_ts_boundary.mjs` (probes, additive); tests.
1. Types per specification §4.3; port, `normalizeHostStatus`, fake, unavailable port, `useHostStatus`.
2. Components render the severity table (HS-04) with text, SVG icon and shape (§4.2 table below); one persistent polite status region (HS-06); alert banner for errors; environment mismatch (HS-07); host time (HS-08); `ActionWithReason` and the demo action (HS-09).
3. `host` page: simulator controls and one card per state, Test only, sentinel `CALOS_SYNTHETIC_HOST_STATUS_ONLY` (HS-10). Rehearsal wiring uses the unavailable port.
4. Lint probes (AB-08) and bundle-gate sentinel with a negative probe.

### T5 — Responsive shell (S–M) — SR-01…SR-06, SR-08
Files: `frame.css`, `components.css`, `AppFrame.tsx`, `apps/web/src/style.css`, tests.
1. Raise every shell control to `--control-target-size` (SR-01), including the demo "−/+" buttons.
2. Top bar compaction at ≤ 700 px with a keyboard-reachable settings disclosure (SR-02).
3. Replace `calc(100vh - 3rem)` (SR-03). Optional sticky bottom status bar with `--calos-statusbar-height` (SR-06).
4. Do not touch any marking rule; run the marking assertions on every new route.

### T6a — Relative-safe build (S–M) — RO-09
Files: `apps/web/vite.config.mjs` (`base: "./"`), `apps/web/index.html` (stylesheet `href` only), `tools/check_frontend_bundle.mjs` (**after H-4**: relative link assertion plus failure on any root-absolute `src`/`href`), `tests/frontend/routing.e2e.spec.ts`.
Reference harness (measured pattern; adapt, do not copy blindly):
```ts
await page.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.pathname.startsWith("/sub/path/")) {
    const res = await route.fetch({ url: url.origin + url.pathname.slice("/sub/path".length) });
    await route.fulfill({ response: res });
  } else {
    await route.fulfill({ status: 404, body: "outside /sub/path/" }); // root-absolute URLs must fail
  }
});
await page.goto("/sub/path/#/data");
```
Assert `#root` has children, the route page renders, reload and Back/Forward work, and no request was answered 404.

### T6b — Strict CSP verification (M) — CS-01…CS-06
Files: `tests/frontend/csp-policy.ts`, `tests/frontend/csp.e2e.spec.ts`, `tools/check_frontend_bundle.mjs` (inline-script/style/attribute scan, additive).
Reference harness (measured pattern):
```ts
await page.route("**/*", async (route) => {
  const res = await route.fetch();
  await route.fulfill({ response: res, headers: { ...res.headers(), "content-security-policy": policy } });
});
await page.addInitScript(() => {
  (window as any).__violations = [];
  document.addEventListener("securitypolicyviolation", (e) =>
    (window as any).__violations.push({ d: e.violatedDirective, b: e.blockedURI }));
});
```
Run the journey, assert `__violations` is empty and the console has no errors or warnings. Add the two negative controls (CS-02) and the hardened variant (CS-03). Remember that the init-script variable is test-only harness code, not an application hook.

### T7 — Edge configuration and tags (S) — WE-01…WE-06
Files: `playwright.edge.config.ts`, root `package.json` (`test:e2e:edge` script only), `tests/frontend/**` (tags), `docs/wp-1a-1e/EVIDENCE.md`, `docs/wp-1a-1b/UI_KIT.md`.
1. Config per WE-01. Tag tests with `{ tag: "@edge" }` (supported by the pinned Playwright 1.64.1; verified `tag`, `grep` and `contrast` exist in its type definitions).
2. Run `pnpm test:e2e:edge` locally on Windows with Edge and record the version and counts. Baseline: `main` 12/12 with Edge 156.0.4314.58.
3. **Do not edit `.github/workflows/phase0a.yml` until the owner has approved the exact diff in `HUMAN_APPROVALS.md` §3 in the PR thread.** Then add only that one job, run it on the PR and report the log; investigate failures, never skip.

### T8 — Forced colors, scaling and the focus layer (M) — FS-01…FS-05
Files: `tests/frontend/forced-colors-scaling.e2e.spec.ts`, `packages/ts/ui-kit/src/tokens.css` (layer declaration and focus rule), `components.css`, `frame.css` (only non-marking rules), CSS-scan test.
1. FS-01 and FS-02 as written. For scaling use `browser.newContext({ viewport, deviceScaleFactor })`; assert `window.devicePixelRatio`.
2. FS-05: declare `@layer calos.base;` first; move the base `:focus-visible` rule into it without `!important`; component rules stay unlayered so they can override. Keep the forced-colors `Highlight` outline. **Do not touch the `!important` declarations on protected markings.**
3. Document the emulation limits (FS-03).

### T9 — Documentation (S)
T9a (PR A): `EVIDENCE.md` skeleton and criterion-to-test table for RO/KB/HS/PS/SR/AB; Capability Matrix rows; a short "limits of the static no-JS fallback" note (LA-13: markings and title stay English until a host preference port exists). T9b (PR B): CSP, Edge, FS evidence; CI documentation update.

### T10 — Gate run and evidence (S)
Run `pnpm check:ts`, `check:browser-types`, `lint:ts`, `lint:logical-css`, `test:ts-boundary` (report the probe count), `test:design-tokens`, `test:schema-vectors`, `test:frontend`, `build:web` (Test and Rehearsal) with `node tools/check_frontend_bundle.mjs`, `test:e2e`, `test:e2e:edge`, `format:ts:check`, `pnpm audit`, the SBOM/OSV/licence check and the Python checks. State counts, not assertions. List what is **not** verified.

## 3. Test inventory

| File | Layer | Covers |
|---|---|---|
| `packages/ts/i18n/src/search.test.ts` | unit | PS-01…PS-04 |
| `apps/web/src/router.test.ts` | unit | RO-01 |
| `apps/web/src/routes.test.ts` | unit | RO-02, RO-04 |
| `apps/web/src/host/host-status.test.ts` | unit | HS-01…HS-04, HS-11 (normaliser, derivation, fakes, corpus, fuzz) |
| `packages/ts/ui-kit/src/host-status.test.tsx` | unit | HS-04…HS-06, HS-09 per state × 4 locales; ICU plurals |
| `packages/ts/ui-kit/src/index.test.tsx` (extended) | unit | KB-01…KB-03, RO-03, SR-04, PS-05 |
| `apps/web/src/App.test.tsx` (updated) | unit | KB-07, RO-11 |
| `tests/frontend/routing.e2e.spec.ts` | e2e, edge | RO-01…RO-10, RO-12 (history, focus, title, skip link, sub-path, unknown route) |
| `tests/frontend/shell-keyboard.e2e.spec.ts` | e2e, edge | KB-01…KB-07 incl. Hebrew layout and drawer |
| `tests/frontend/host-status.e2e.spec.ts` | e2e, edge | HS-03…HS-10 (live region, mismatch, fixed clock, disabled-with-reason) |
| `tests/frontend/csp.e2e.spec.ts` | e2e, edge | CS-01…CS-05 |
| `tests/frontend/forced-colors-scaling.e2e.spec.ts` | e2e, edge | FS-01…FS-05 |
| `tests/frontend/shell-responsive.e2e.spec.ts` | e2e, edge | SR-01…SR-08, RU-01, RU-04 |
| `tools/check_ts_boundary.mjs` (probes) and `tools/check_frontend_bundle.mjs` | gate | AB-08, AB-10, RO-09, CS-04 |

Keep the existing tests unchanged except as listed in `SPECIFICATION.md` §5.

## 4. Normative tables

### 4.1 Route table

| id | Nav and title key | Test | Rehearsal | Page |
|---|---|---|---|---|
| `overview` | `shell.overview` | yes | yes | heading, notification, review note |
| `technical` | `shell.technical` | yes | yes | the existing technical card |
| `forms` | `route.forms` | yes | no | `SyntheticFormDemo` |
| `data` | `route.data` | yes | no | `SyntheticDataViewsDemo` **[needs PR #25]** |
| `host` | `route.host` | yes | no | host-status simulator and state cards |

### 4.2 Host-status presentation (normative)

| Severity | Icon shape (SVG, `aria-hidden`) | Used by |
|---|---|---|
| ok | circle with a tick | all fields ok |
| notice | circle with an "i" | offline, pending sync |
| warning | triangle | degraded, failed sync, clock skew, storage low, any unknown, environment absent |
| error | octagon with a cross | quarantined sync or journal, storage full, environment mismatch |

Message keys (each he/en; Hebrew `needs_review`): `host.summary.{ok,notice,warning,error}`, `host.connection.{label,online,offline,degraded,unknown}`, `host.sync.{label,idle,pending,failed,quarantined,unknown}` (`pending` takes `{count}` with ICU plural forms), `host.journal.{label,ok,quarantined,unknown}`, `host.clock.{label,ok,skew,unknown}`, `host.storage.{label,ok,low,full,unknown}`, `host.agentVersion`, `host.deploymentId`, `host.hostTime`, `host.timeUnavailable`, `host.mismatch.{title,body}`, `host.reason.{offline,degraded,unknown,error,mismatch}`, `host.action`, `host.simulator.{title,description,preset.*}`, `host.disclosure`.

### 4.3 Search vectors (minimum)

| Label or text | Query | Match |
|---|---|---|
| `בדיקה` | `בְּדִיקָה` | yes |
| `בראשית` | `בְּרֵאשִׁ֖ית` | yes |
| `א` (U+05D0) | U+FB2E | yes |
| `שלום` | `שלומ` | yes |
| `בית־ספר` | `בית-ספר` | yes |
| `ג׳ורג׳` | `ג'ורג'` | yes |
| `צה״ל` | `צה"ל` | yes |
| `café` | `cafe` | yes |
| `file` | `ﬁle` | yes |
| `ABC` | `ＡＢＣ` | yes |
| `CalOS (בדיקה) v1.2` | `בדיקה v1` | yes |
| `Overview` | `ov‎er` | yes |
| any | `\u0000` only, or only niqqud | matches all |
| any | 10 000-character query | no throw, bounded time |
| `Overview` | `settings` | no |

### 4.4 Router hostile corpus (minimum)

`""`, `#`, `#/`, `#/overview`, `#/overview/`, `#//overview`, `#/overview?x=1`, `#/overview#x`, `#/OVERVIEW`, `#/overview%20`, `#/%6fverview`, `#/__proto__`, `#/constructor`, `#/toString`, `#content`, `#technical`, a 10 000-character hash, a hash with U+202E and NUL. Only `#/<id>` for an id in the current table renders a page; the empty forms canonicalise; everything else is NotFound.

## 5. Manual verification (not performed by this specification)

Real Edge, normal window and `--app` mode, plus Chrome: does the page receive `F6` and `preventDefault` keep focus in the page (KB-04). NVDA and JAWS in English and Hebrew: route change announces once; status region announces only real changes; alert banner announces once; region names are spoken on `F6`. Windows High Contrast themes (Aquatic, Desert, Dusk, Night sky) and real display scaling at 125 % and 150 % on a physical or virtual display. Touch device or touch emulation on the drawer, palette and status disclosure. Real browser zoom at 200 % and 400 %. A run on a managed lab image if one exists. Hebrew terminology review by a human linguist.

## 6. Evidence template (`EVIDENCE.md`)

Baseline numbers (T0) · criterion-to-test table (ID → file → test name → layer) · commands run with counts · Chrome and Edge versions · Windows job log link (after H-3) · screenshots: each route en/he × light/dark × 320/768/1440, each host-status state en/he, forced colors, scaling matrix · CSP run output (violations 0, negative controls firing) · list of **not verified** items · deviations from the specification and why.

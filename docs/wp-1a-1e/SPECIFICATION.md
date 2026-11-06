# WP-1A-1e — Routing, host-status contract, strict-CSP verification and Windows/Edge harness: engineering specification

| | |
|---|---|
| Status | **Proposed specification for manual assignment.** Documentation only. It is not an ADR, approves no gate, changes no ADR status and authorises no workflow, dependency or governance change. |
| Refines | [`05_NEXT_THREE_WORK_PACKAGES.md` §4](../review/lead-architect-2026-11-03/05_NEXT_THREE_WORK_PACKAGES.md) and the OF/RU/RT/SB rows of [`02_FRONTEND_ACCEPTANCE_CRITERIA.md`](../review/lead-architect-2026-11-03/02_FRONTEND_ACCEPTANCE_CRITERIA.md) §5–§7. Where this text is more specific, it says so in §2. If it conflicts with `NO_CODE_ARCHITECTURE.md` or `ARCHITECTURE.md`, those win. |
| Written | 2026-11-06, from `main` at `1e94a9c` (WP-1A-1c merged). Facts about WP-1A-1d came from the reviewed head of PR #25 (`207599a`); PR #25 has since been merged (`24548d8`), so those facts are marked **(PR #25, merged)**. Task T0 still re-checks them. |
| Errata | **Errata 1 (2026-11-06)** corrects defects found in the independent reviews of PR #26 and PR #28. Every change is listed in [`ERRATA.md`](ERRATA.md). Clause IDs are unchanged. |
| Companion files | [`TASKS_AND_TESTS.md`](TASKS_AND_TESTS.md) · [`HUMAN_APPROVALS.md`](HUMAN_APPROVALS.md) · [`CODEX_HANDOFF.md`](CODEX_HANDOFF.md) |

## 1. Goal, scope and readiness

**Goal.** Make the Test-only simulation shell navigable by URL and by keyboard, give it an honest host-status surface that shows *unknown* as unknown, prove the build runs under the strict CSP, and run a reduced browser matrix on Windows with Microsoft Edge, in forced-colors mode and at 125 % and 150 % display scaling. Nothing here talks to a station, an instrument or a server.

**In scope** (details in §4): hash routing with history, focus and title; F6 region cycling; `HostStatusView` types, a fake and an "unavailable" `HostStatusPort`, and every status state in he/en; a CSP verification test; Windows/Edge configuration (and a workflow job that needs approval); forced-colors and scaling tests; Hebrew-aware palette search; shell responsive fixes.

**Out of scope.** `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.onLine`, timers or polling for status, any real API, token, service worker, browser storage (D-27), URL state for locale/theme/sort, Station Agent or API changes, schemas, codegen, `@calos/domain-types` exports, a Finding or HostStatus *contract*, Builder screens, authentication, instrument communication, fonts, new dependencies (unless decision D-E1 chooses `react-router`), and any change to the protected markings.

**Ready to assign when** (all must be true; state them in the PR): the owner has merged WP-1A-1d (PR #25) after human approval; the owner has answered the decisions in [`HUMAN_APPROVALS.md`](HUMAN_APPROVALS.md) §2 (or accepted the defaults); the branch is cut from the then-current `main`; an independent reviewer other than the author's agent is named. No open Gate A0 item is required, and none may be touched.

## 2. Clarifications and deviations from 05 §4 / 02 §7

| # | Source text | This specification | Why |
|---|---|---|---|
| C-1 | Routes `#/overview`, `#/forms`, `#/data` | Test: `overview`, `technical`, `forms`, `data`, `host`. Production Rehearsal: `overview`, `technical`. | The shell already has a "Technical text" item that the existing tests tab through; `host` hosts the Test-only host-status simulator. Rehearsal keeps today's two items. |
| C-2 | "in-house or `react-router@8.5.0`" | **Default: in-house hash router** (about 40 lines, pure parser, `useSyncExternalStore`). `react-router` only if the owner chooses it (D-E1). | `react-router` ships `fetch`/`sessionStorage` code paths (see `docs/gate-a0/09` R2). Three to five routes do not need it; no ADR-0026 evidence re-run, no lockfile change. `tools/ts_boundary_policy.mjs` already allow-lists it for `apps/web`; leave that line alone. |
| C-3 | "Windows/Edge CI job" | A **second config file** `playwright.edge.config.ts` and a script; the workflow job is **specified here but applied only after explicit owner approval** (H-3). | A `projects` array in the existing config would make the Linux job try to launch Edge. A second config cannot change the Linux job. |
| C-4 | OF-02 "route tests served from a sub-path" | Requires relative asset URLs. **Measured on `main`: the build fails to mount under a sub-path** because `index.html` uses `/assets/…` and `/status.css`. Needs `base: "./"`, a relative `status.css` link and an edit to the literal `href="/status.css"` check in `tools/check_frontend_bundle.mjs`. | See §4.1 RO-09 and decision D-E3 (a gate edit needs a human). |
| C-5 | OF-05 fields | Exactly OF-05 plus the two OF-06 fields (`wall_utc`, `time_zone_label`). No `stale`, `observed_at`, health score or anything else. | 05 §4 risk 3: extension needs a docs PR. |
| C-6 | (new) | A host that reports `environment_kind` different from the build is shown as an **error** and never relabels the protected markings. | ADR-0024 (Test and Production are separate); the UI must not let a host message change a protected marking. |
| C-7 | F6 "region cycling" | Defined concretely in §4.2. Playwright cannot prove F6 reaches the page before browser chrome; a **manual** check is required (KB-04). | Playwright injects key events into the page, bypassing browser accelerators. |
| C-8 | OF-05 lists `unknown` only for the clock | The types also allow `unknown` for sync, journal and storage (§4.3). | Needed so that "unknown is never OK" (HS-03) can be represented. A documented deviation, not a new field. |

## 3. Baseline measured on `main` `1e94a9c` (Windows 11, Chrome 156.0.8078.79 and Edge 156.0.4314.58)

These are facts to improve on, not requirements. Re-measure in T0.

| Area | Measurement |
|---|---|
| Navigation | `AppFrame` keeps a local `activeId`; items are `href="#content"` and `href="#technical"`. Clicking "Technical text" gives `location.hash="#technical"`, **focus on `body`**, page scrolled. Skip link is `href="#content"`. Title is fixed (`TEST · SIMULATION ONLY · CalOS · Frontend foundation`). |
| Form summary links | `href="#<field id>"` with `preventDefault` + focus (`form-controls.tsx`). A hash router must not treat them as routes. |
| Strict CSP (OF-09 string) | **0** `securitypolicyviolation` events and 0 console errors/warnings over locale, theme, palette, drawer and form interactions. Also 0 with `style-src-attr 'none'` and with `require-trusted-types-for 'script'`. No `[style]` attribute in the DOM. |
| Sub-path hosting | Build served under `/sub/path/` with other absolute paths returning 404: **fails to mount** (`#root` has 0 children); requests for `/status.css`, `/assets/*.js` and `/assets/*.css` 404. |
| Edge | Existing suite (12 tests on `main`) passes **12/12** under `channel: "msedge"` with `devices["Desktop Edge"]`. |
| CI | Only `ubuntu-latest` runs Playwright (`frontend-browser`). `python` already uses a `windows-latest` matrix, so Windows runners are in use. |
| Target size | Shell controls below 44 CSS px: menu button 31×32, command button 193×32, language and theme selects 32 tall, sidebar links 37 tall, skip link 37 tall; demo "−/+" buttons 36 wide. `--control-target-size` is `2.75rem` and is used by form controls only. |
| Mobile top bar | At 320×568: protected marking 104 px + top bar 184 px = 51 % of the viewport before any content. |
| Vertical layout | `.frame-layout { min-block-size: calc(100vh - 3rem) }` hard-codes the marking height. Rehearsal build at 768×1024 scrolls 37 px with short content. |
| Drawer | At ≤ 900 px the sidebar becomes an in-flow block above the content (not a modal); `main` is not inert; focus order passes into the command button. |
| Focus rule | `.calos-app :focus-visible { outline: … !important }` (`tokens.css`). Protected markings use `!important` on purpose and must keep it. |
| Palette search | `toLocaleLowerCase(locale).includes(query)`. Enter in the query field does nothing; no result-count announcement. Measured on Node/ICU: NFKD plus mark removal makes niqqud, cantillation and Hebrew presentation forms equal, but **not** final letters (ם/מ), geresh/gershayim versus ASCII quotes, or maqaf; `Intl.Collator("he", {sensitivity:"base"})` equates final letters and quotes but only for whole-string equality, so it cannot implement substring search. |

## 4. Requirements

Priority: **Must** blocks merge; **Should** is expected unless the PR records why not. Verification names the test layer: `unit` (Vitest), `e2e` (Playwright, Linux Chromium), `edge` (the new Windows/Edge config), `gate` (build or lint tooling), `manual`.

### 4.1 Hash routing, focus, title and history (RO)

Implementation lives in `apps/web` (`router.ts`, `routes.tsx`, `pages/*`). `ui-kit` never reads `location` or `history`.

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| RO-01 | Must | **Grammar.** A route is exactly `#/<id>` with `<id>` in the build's route table (`[a-z][a-z0-9-]*`, at most 32 characters). Empty hash, `#` and `#/` are canonicalised to `#/overview` with `history.replaceState` (no new entry, no `hashchange` loop) **on load and on every later `hashchange`** (for example when a user edits the address bar to `#/`): the URL and the displayed route must agree. Anything else (unknown id, extra segments, trailing slash, `?query`, second `#`, upper case, percent-escapes, `__proto__`, `constructor`, a hash longer than 64 characters) renders the **NotFound** page (h1, link to Overview), never a blank page or an exception. The parser is pure, case-sensitive, does not decode, and looks ids up in a `Map` or `Object.hasOwn`, never by bracket access on a plain object. | unit corpus: `#/data/`, `#//data`, `#/data?x=1`, `#/data#x`, `#/DATA`, `#/data%2e`, `#/__proto__`, `#/constructor`, `#/toString`, 10 000-character hash, bidi controls, NUL; e2e unknown route |
| RO-02 | Must | **Environment gating.** The route table is built from the build kind. Test: overview, technical, forms, data, host. Production Rehearsal: overview, technical. In Rehearsal `#/forms`, `#/data`, `#/host` render NotFound, their nav items do not exist, and the rehearsal bundle contains none of the three demo sentinels. Registration of Test-only pages sits inside an `environmentKind === "test"` branch so the bundler removes them. | unit (`buildRoutes("test")`, `buildRoutes("production_rehearsal")`); gate (existing bundle check plus the new sentinel); e2e on a rehearsal build (Should: second `webServer` with its own `outDir`) |
| RO-03 | Must | **Links.** Navigation items are native anchors `href="#/<id>"` (middle-click and open-in-new-tab work). `aria-current="page"` is on exactly one link and follows the route. `AppFrame` has **no** local active state; it receives `activeId`, and `FrameNavigationItem.href` is typed `#/${string}`. Modified clicks (Ctrl, Meta, Shift, middle button) are left to the browser: route links are never `preventDefault`-ed. | unit; e2e |
| RO-04 | Must | **Title.** `document.title = "{PREFIX} · SIMULATION ONLY · {route title} · {app.title}"` where PREFIX is `TEST` or `PRODUCTION REHEARSAL`. It updates on route and on locale change, and the protected prefix is present on every route and locale. The static `<title>` in `index.html` and its gate are unchanged. | unit; e2e over every route × en/he/en-XA/he-XB |
| RO-05 | Must | **Focus and scroll.** After an in-app route change (link, palette result, Back or Forward), focus moves to the page `h1` (`tabIndex={-1}`) and the window scrolls to the top. Not on the initial load. Re-selecting the current route's link also focuses the `h1`. No extra live region (the focus move and the title change are the announcement). | e2e: `document.activeElement` is the `h1`; initial load leaves focus at document start; `manual`: NVDA/JAWS announce once |
| RO-06 | Must | **Skip link.** It must not change `location.hash` and must focus `main`. Keep it an `<a>` whose `href` is the current route (so it is harmless without the handler). Today's `href="#content"` would be read as an unknown route. | e2e: hash unchanged; Back leaves the page in one press |
| RO-07 | Must | **History.** Each user navigation adds exactly one entry. Canonicalisation, locale, theme, palette, drawer, sort, form and host-status actions add none. Back and Forward restore route, title, `aria-current` and focus on the `h1`. Back or Forward while the palette or drawer is open closes it, and focus still lands on the `h1` in that case: the dialog's focus restoration must not move it to `body` or to an element of the previous route. | e2e: `history.length` deltas; `page.goBack()`/`goForward()` |
| RO-08 | Must | **Fragment-only links.** In-page links such as the form summary's `href="#<id>"` never change the route (they already `preventDefault`). | e2e: summary link click leaves `location.hash` unchanged |
| RO-09 | Must | **Relative-safe build (OF-02).** `base: "./"`; `index.html` links `status.css` relatively; the build mounts when served from `/sub/path/` while every other absolute path returns 404; direct load of `#/data`, reload, Back and Forward work there. The `<aside id="static-markings">` block and `status.css` are unchanged: compare the block in `apps/web/index.html` and the file `apps/web/public/status.css` with a recorded SHA-256 after normalising CRLF to LF, in the Linux gate layer only and never under `@edge` (Windows checkouts are CRLF and the repository has no `.gitattributes`). The bundle gate must be **stricter**: assert the relative stylesheet link and fail on any root-absolute `src`/`href` in `dist/index.html`. Needs H-4 before the gate edit. | e2e with a path-mapping route handler (see `TASKS_AND_TESTS.md` T6); gate |
| RO-10 | Must | **No storage or network.** Routing adds no `localStorage`, `sessionStorage`, cookie, `fetch` or `history.pushState`. The route is the only state in the URL: locale, theme, sort and form values are never serialised (D-27). | lint probes; e2e (`localStorage.length === 0`, no cookies) |
| RO-11 | Must | **Pages.** Exactly one `h1` per route, from a shared `PageHeader` (forwards a ref for RO-05). Pages render inside `WorkspaceErrorBoundary`; the boundary is keyed by route id so navigating away from a failed page recovers. NotFound is a page, not an error. Existing Overview content splits into Overview, Technical (the existing technical card), Forms (`SyntheticFormDemo`), Data (`SyntheticDataViewsDemo`, **(PR #25, merged)**) and Host (RO/HS demo). Review note and Hebrew `needs_review` message stay visible on every page where they are visible today. | unit; e2e axe on each route |
| RO-12 | Should | Route change closes the palette and drawer; page-local state (form values, sort) is not preserved across routes and the docs say so. | e2e |

### 4.2 Keyboard model and F6 region cycling (KB)

Regions are marked in `AppFrame` with `data-frame-region`. Order is **navigation → top bar → workspace → status bar** and wraps. The order is the DOM order and does not change in RTL.

| Region | Element focused (`tabIndex={-1}`) | Accessible name (new he/en keys) |
|---|---|---|
| navigation | the `nav` inside the sidebar | existing `shell.navigation` |
| top bar | `header.frame-topbar` | `shell.regionTopbar` |
| workspace | `main#content` | `shell.regionWorkspace` |
| status bar | `footer.frame-statusbar` | `shell.regionStatus` |

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| KB-01 | Must | `F6` moves to the next region, `Shift+F6` to the previous, wrapping. Regions that are not rendered or not visible (closed drawer, `display:none`) are skipped; the drawer's navigation is included while open. If focus is outside every region (for example on `body`), `F6` goes to the first region and `Shift+F6` to the last. Use `element.checkVisibility?.()` with a documented fallback so jsdom tests can inject visibility. | unit; e2e forward, backward, wrap, RTL, 320 px closed drawer |
| KB-02 | Must | Focus lands on the **region container**, never activates anything, shows a visible focus indicator inside the container's bounds, and is not covered by the protected marking or the status bar (use the existing `--calos-protected-marking-height` offset **(PR #25, merged)**). | e2e overlap check at 320×400 and 768×400 |
| KB-03 | Must | The handler ignores `F6` with Ctrl, Alt or Meta, when `event.defaultPrevented`, during IME composition, and while a modal is open (palette open: focus stays trapped). The key is `event.key === "F6"`, which does not depend on the keyboard layout (Hebrew layout test). | unit; e2e with Hebrew-layout event |
| KB-04 | Must | Handled `F6` calls `preventDefault()`. **Not verifiable by Playwright** (events go to the page, bypassing browser accelerators). Manual check in Edge (normal window and `--app` mode) and Chrome that the page, not the browser toolbar, receives `F6`. If it does not, stop and report; do not invent a different key. | manual (checklist in `TASKS_AND_TESTS.md` §5) |
| KB-05 | Must | Existing keys keep working: `Ctrl/Cmd+K` is accepted when `event.key.toLowerCase() === "k"` **or** `event.code === "KeyK"` (the behaviour on `main`). The Hebrew-layout test includes the vector `key: "k", code: "KeyV"`, which must still open the palette (on Dvorak the key labelled K sits at `KeyV`); narrowing the handler to `code` alone is a regression. `Escape` closes the drawer or palette and returns focus to its trigger. | existing tests unchanged |
| KB-06 | Should | Discoverability: one palette hint line and the docs mention `F6`. New strings are he/en with the review-status mechanism (Hebrew stays `needs_review`). | unit |
| KB-07 | Must | Tab order is documented and tested: skip link → navigation links → menu button (when visible) → command button → language → theme → workspace → status-bar controls. Update the two existing tab-order tests. | e2e, unit |

### 4.3 Host-status contract (HS)

**Where things live.** `ui-kit` gets presentational types and components only. The port, the defensive normaliser and the fakes live in `apps/web/src/host/`. Nothing is added to `schemas/`, `catalog/`, codegen or `@calos/domain-types`; the shape is a **UI-side structural type, not a published contract**, so the wire format stays open (PR #25's Finding schema is the cautionary example). Field names follow OF-05 (camelCase in TypeScript; an adapter that maps a future wire format is a later package).

```ts
// packages/ts/ui-kit/src/host-status.ts (types only, no behaviour)
export type HostConnection = "online" | "offline" | "degraded" | "unknown";
export type HostSync =
  | { state: "idle" }
  | { state: "pending"; count: number } // integer >= 1
  | { state: "failed" }
  | { state: "quarantined" }
  | { state: "unknown" };
export type HostJournal = "ok" | "quarantined" | "unknown";
export type HostClock = "ok" | "skew" | "unknown";
export type HostStorage = "ok" | "low" | "full" | "unknown";
export interface HostStatusView {
  connection: HostConnection;
  sync: HostSync;
  journal: HostJournal;
  clock: HostClock;
  storage: HostStorage;
  agentVersion?: string; // technical text, LTR isolate
  deploymentId?: string; // technical text, LTR isolate
  environmentKind?: "test" | "production_rehearsal"; // host's claim
  wallUtc?: string; // RFC 3339 UTC, host time (OF-06)
  timeZoneLabel?: string; // host-supplied label
}
// apps/web/src/host/host-status-port.ts
export interface HostStatusPort {
  getSnapshot(): HostStatusView | undefined; // undefined = nothing received
  subscribe(listener: () => void): () => void; // push only; no polling
}
```

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| HS-01 | Must | Types as above (names may differ, fields may not). `createFakeHostStatusPort(initial?)` with `set(partial)` and `clear()`; `createUnavailableHostStatusPort()` always returns `undefined`. A `useHostStatus(port)` hook uses `useSyncExternalStore`. `getSnapshot()` returns a **referentially stable** value between changes (`Object.is` across repeated reads, asserted by a test); normalise and freeze inside `set`, never inside `getSnapshot`. **Default in Test:** the shell starts with the *unavailable* snapshot (every field unknown); the fake drives the shell only after a simulator preset is chosen on `#/host`, and while it does the chip and the status bar carry a persistent localised "simulated host status" label (he/en). On channel loss a future adapter publishes `undefined` (all unknown); the fake's `clear()` covers it in tests. | unit |
| HS-02 | Must | `normalizeHostStatus(input: unknown): HostStatusView \| undefined` is the only way data enters. Strict allow-list: a non-object gives `undefined`; an unknown enum value or wrong type gives that field `unknown`; `pending.count` must be a safe integer ≥ 1 (a count of 0 is `idle`; negative, fractional, NaN, string or huge is `unknown`); strings are length-capped (agentVersion 64, deploymentId 128, timeZoneLabel 64) and `agentVersion`, `deploymentId` and `timeZoneLabel` are **rejected, not cleaned**: a value that does not match `^[\x21-\x7E]+(?: [\x21-\x7E]+)*$` makes that field absent or `unknown` (rule R7 of the N-1 proposal, PR #27). `safeDisplayText` never strips anything and is not a sanitiser. This rule needs no N-1 classifier, so HS-02 does not wait for N-1; displaying any non-ASCII technical text still does. `wallUtc` must match `YYYY-MM-DDTHH:MM:SS(.fff)?Z` else the clock time is unavailable. `__proto__`, `constructor`, extra keys and getters are ignored; the result is frozen. | unit hostile corpus and a seeded fuzz of ≥ 5 000 cases (no throw, always valid or `undefined`) |
| HS-03 | Must | **Unknown is never OK.** Absent port data, an `undefined` snapshot, or an absent field is displayed as *unknown* with its own icon and text. | unit; e2e with the unavailable port (Rehearsal) |
| HS-04 | Must | **Severity (normative).** `ok` only if every field is ok. connection: online ok, offline **notice**, degraded warning, unknown warning. sync: idle ok, pending notice, failed warning, quarantined **error**, unknown warning. journal: ok ok, quarantined **error**, unknown warning. clock: ok ok, skew warning, unknown warning. storage: ok ok, low warning, full **error**, unknown warning. environment: equal to the build ok, different **error** (HS-07), absent warning. Overall = the maximum. Offline is a *notice*, not an error, because the station is offline-first; it is never shown as ok. | unit table test of every state |
| HS-05 | Must | **UI.** A summary chip in the top bar (worst severity, text and icon) and the status bar with one item per field (replacing the static `shell.localHost` text, whose meaning stays as one persistent item). At ≤ 700 px the detail collapses into one disclosure button (≥ 44 px target). Every state has text, an SVG icon and a shape; never colour alone. Versions and ids are LTR isolates; numbers are Western digits; counts use ICU plural categories (Hebrew 0, 1, 2, 3, 10, 11, 20, 21, 100). All strings he/en/en-XA/he-XB; Hebrew `needs_review`. | unit per state × 4 locales; e2e screenshots en/he light/dark at 320/768/1440; axe; he-XB at 320 with all warning/error states shows no clipping |
| HS-06 | Must | **Announcements.** One persistent polite status region. It changes only when the overall severity or the *set* of non-ok field states changes; a pending-count change (3 → 4) does not announce. Error severities also show an `alert` banner at the top of the workspace, which is announced once on appearance; its text is not mirrored in the live region. The live-region text is the severity plus, for each non-ok field, the field name **and its state** (for example "Sync: failed"); it changes when the overall severity or the set of (field, state) pairs changes, so "unknown" becoming "degraded" is announced. | e2e: read live-region text before and after count ticks; unit |
| HS-07 | Must | **Environment mismatch.** If `environmentKind` from the host differs from the build kind, show the error state, disable host-dependent actions with a reason, and leave the protected markings untouched (assert their text, `data-deployment` and CSS unchanged before and after). | e2e |
| HS-08 | Must | **Time comes from the host (OF-06).** Show `wallUtc` as a `<time dateTime>` with the zone label; show the ISO string verbatim in the detail view (also as `title`, never as the only access). The code never calls `Date.now()` or `new Date()` without an argument. | e2e with `page.clock.setFixedTime` to a different instant: display unchanged; lint probes |
| HS-09 | Must | **Disabled-with-reason (OF-07).** A small `ActionWithReason` (`aria-disabled="true"`, focusable, `aria-describedby` pointing at visible reason text, click does nothing) is used by one demo action that requires `connection === "online"`, no error-severity field and an environment match. Already-rendered data (the data-view demo) stays readable in every state. | unit; e2e toggling the fake port |
| HS-10 | Must | **Test-only.** The `host` route shows the simulator (a labelled `select` per field plus presets) and every state card, behind `environmentKind === "test"` with sentinel `CALOS_SYNTHETIC_HOST_STATUS_ONLY`. The sentinel is a **string literal used at runtime** (for example a `data-` attribute value, as the form demo does), never a comment: a minifier deletes comments, so a comment sentinel is absent from the Test bundle too and its absence from the Rehearsal bundle proves nothing. The bundle gate checks presence in Test and absence in Rehearsal with a negative probe (as for the form and data sentinels). Rehearsal uses the unavailable port, so its status bar says *unknown*. No `window` test hooks. | gate; e2e |
| HS-11 | Must | No `fetch`, no `navigator.onLine`, no timers or polling. Lint probes added (see AB-08). The fetch allow-list for `apps/web/src/host/*` described in OF-04 is **not** opened in this package. | gate |

### 4.4 Strict CSP verification (CS)

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| CS-01 | Must | `tests/frontend/csp-policy.ts` holds the exact OF-09 policy: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`. A test serves the built app with that header (route handler that re-fulfils the document response with the header), listens for `securitypolicyviolation` from an init script, runs a journey over every route, locale, theme, palette, drawer, form, data, host state and forced colors, and asserts **0 violations and 0 console errors or warnings**. | e2e, edge |
| CS-02 | Must | **Negative controls** prove the harness can fail: injecting an inline `<script>` yields a `script-src` violation; `fetch` to a non-routable origin yields `connect-src`. Otherwise "0 violations" proves nothing. | e2e |
| CS-03 | Must | A hardened variant adds `style-src-attr 'none'` and `require-trusted-types-for 'script'`. Baseline on `main` is 0 violations for both; if 1e code introduces one, fix the code, not the policy. | e2e |
| CS-04 | Must | `dist/index.html` has no inline `<script>`, no inline `<style>`, no `style=` attribute and no event-handler attribute (gate). | gate |
| CS-05 | Should | The same test runs against the Production Rehearsal build. | e2e |
| CS-06 | Must (docs) | The docs state: the header is a Station Agent responsibility (ST-03); Vite preview does not set it; this test proves the UI half only. | doc |

CSS custom properties set from script (`documentElement.style.setProperty`, as `AppFrame` does for the marking offset **(PR #25, merged)**) use CSSOM and are not blocked by `style-src`; do not replace them with inline `style` attributes or `<style>` elements.

### 4.5 Windows and Edge coverage (WE)

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| WE-01 | Must | `playwright.edge.config.ts`: `devices["Desktop Edge"]`, `channel: "msedge"`, `grep: /@edge/u`, `retries: 0`, `workers: 1`, same `testDir` and a preview `webServer`. Script `test:e2e:edge` in root `package.json`. The existing `playwright.config.ts` and its Linux behaviour do not change. | `edge` |
| WE-02 | Must | Reduced matrix (tag `@edge`): shell tab order and F6; routing with Back/Forward and sub-path; palette Hebrew search; the data-view long-identifier geometry; one pseudo-locale at 320 px; forced colors; the scaling matrix (FS-02); the CSP journey; host-status states (en/he). Target under 10 minutes. | `edge` |
| WE-03 | Must | Workflow job per `HUMAN_APPROVALS.md` §3, **applied only after the owner approves the exact diff in the PR thread (H-3)**. It must fail if Edge is not preinstalled and print the Edge version; no `playwright install msedge` (an extra browser download is a separate approval, H-5); no retries; artifacts uploaded. Whether the job becomes a *required* check is a repository setting only the owner changes. | CI log |
| WE-04 | Must | No test is skipped or retried to make the job pass. A failure is investigated and either fixed or reported. | review |
| WE-05 | Must | **Visual baseline policy (H-6): no pixel-baseline assertions in this package.** Screenshots are artifacts and documentation; assertions are geometric and semantic. | review |
| WE-06 | Must | `docs/wp-1a-1e/EVIDENCE.md` records the commands, counts, Edge and Chrome versions, and what the Windows job did and did not cover; `docs/wp-1a-1b/UI_KIT.md` gate list gains the Edge command. | doc |

### 4.6 Forced colors and display scaling (FS)

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| FS-01 | Must | In `forcedColors: "active"`, for every route in en and he at 320 and 1440 px: every visible interactive element has a non-`none` border or a visible outline on `:focus-visible` (computed style); protected markings are visible with their text, shape and a border of at least 2 px; sort arrows and state icons have a non-transparent stroke. A CSS scan test fails on `forced-color-adjust: none` in shipped CSS. | e2e, edge |
| FS-02 | Must | Scaling matrix (emulated with `deviceScaleFactor` and the CSS viewport a Windows scale produces): 1536×864 @ 1.25, 1280×720 @ 1.5, 1093×614 @ 1.25, 911×512 @ 1.5, 853×480 @ 1.5. At each: no horizontal page scroll; markings visible and unclipped; shell targets ≥ 44 CSS px; no focused control under the protected marking or status bar (sweep as in the PR #25 review); every route's `h1` visible. | e2e, edge |
| FS-03 | Must (docs) | State plainly that this is **emulation**, not real OS scaling or the Windows High Contrast themes; list the manual checks (§5 of `TASKS_AND_TESTS.md`). | doc |
| FS-04 | Should | `emulateMedia({ contrast: "more" })` run adds no overflow or contrast regression; no new CSS required. | e2e |
| FS-05 | Must | **LA-18.** The base focus outline moves into a cascade layer declared first (`@layer calos.base;` at the top of `tokens.css`) so component CSS can override it without `!important`; a test asserts that every focusable component kind in the demos shows an outline of at least 2 px on keyboard focus, also in forced colors. The `!important` on protected markings, and all marking CSS, are **not touched**. | e2e |

### 4.7 Hebrew-aware command-palette search (PS)

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| PS-01 | Must | `normalizeSearchText(value: string): string` in `@calos/i18n`, pure and deterministic: NFKD → remove `\p{Mn}` (niqqud, cantillation, Latin accents) → remove `\p{Cf}` (bidi controls, zero-width) → fold final Hebrew letters ך ם ן ף ץ to כ מ נ פ צ → map maqaf U+05BE to `-`, geresh U+05F3 and curly apostrophes to `'`, gershayim U+05F4 and curly quotes to `"` → `toLowerCase()` (locale-neutral, so no Turkish `İ`/`ı` surprises) → collapse whitespace → trim. | unit vectors |
| PS-02 | Must | `matchesSearchQuery(label, query)` = normalised `includes`. The query is capped at 256 characters before processing; a query that normalises to empty matches everything. Cost is linear in the label length. | unit |
| PS-03 | Must | Used for palette matching only. **Never** for identifiers, keys, sorting or equality. Documented next to the function and in the Capability Matrix row. | review |
| PS-04 | Must | Vectors include: `בְּדִיקָה`↔`בדיקה`; cantillation; presentation forms U+FB2A/U+FB2E; `שלום` matched by `שלומ`; maqaf, geresh, gershayim; `café`↔`cafe`; `ﬁ`↔`fi`; fullwidth; mixed `CalOS (בדיקה) v1.2`; bidi controls and ZWSP inside a query; NUL; 10 000 characters; the real en/he/en-XA/he-XB navigation labels. | unit |
| PS-05 | Should | Enter in the query field activates the first result; one polite result-count status uses ICU plurals (he/en); the existing no-results message stays. | e2e |
| PS-06 | Must | `FrameNavigationItem` may carry optional `keywords` (data, not code) that are searched too. The palette stays navigation-only (LA-16): the docs say commands arrive with the action catalog (ADR-0020). | unit |

### 4.8 Responsive enterprise shell (SR)

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| SR-01 | Must | Every shell control (menu button, command button, language and theme selects, sidebar links, skip link when focused, status-bar disclosure, demo "−/+" buttons) is at least `--control-target-size` (44 CSS px) in both dimensions. Inline text links are exempt. | e2e bounding-box audit at 320/768/1440 and the FS-02 viewports |
| SR-02 | Must | At 320×568 in en and he the top bar is at most 140 px tall (en-XA/he-XB: 180 px). Language and theme may collapse into one settings disclosure but must stay keyboard-reachable. Baseline 184 px. | e2e |
| SR-03 | Must | Replace `calc(100vh - 3rem)` with a layout that does not hard-code the marking height (`100dvh` column or grid). Rehearsal build: `scrollHeight − innerHeight ≤ 1` at 1440×900, 1024×768 and 768×1024 (baseline +37 at 768×1024). | e2e on a rehearsal build |
| SR-04 | Must | Landmarks have unique, localized names; `main` is named; each route has one `h1` (`PageHeader`); axe clean on every route. | e2e |
| SR-05 | Must | The top-bar chip and status bar wrap or collapse without clipping at 320 px in he-XB with all warning and error states. | e2e |
| SR-06 | Should | On viewports at least 700 px wide and 560 px tall the status bar is sticky at the bottom, publishes `--calos-statusbar-height`, and `scroll-padding-block-end` uses it so focus is not obscured; otherwise it is static. | e2e overlap sweep |
| SR-07 | Must | Drawer: `Escape` closes and returns focus to the menu button (existing); choosing a route closes it; F6 includes it while open. | e2e |
| SR-08 | Must | RU-01 (no horizontal scroll at 320/375/768/1024/1440) and RU-04 (text-spacing override) hold on the shell and every new page; the focus-versus-marking sweep from the PR #25 review passes on each route. | e2e |

### 4.9 Architecture and governance boundaries (AB)

| ID | Pri | Requirement | Verification |
|---|---|---|---|
| AB-01 | Must | `ui-kit` has no `location`, `history`, `navigator`, router, port subscription, `fetch`, `Date.now` or zero-argument `new Date`. `AppFrame` is controlled (`activeId`, `navigation`, `hostStatus`) and host-neutral. | lint, boundary probes |
| AB-02 | Must | `@calos/i18n` gains only pure helpers and messages. | review |
| AB-03 | Must | `apps/web/src/host/` contains types, the normaliser, the fake and the unavailable port only. No adapter, no `fetch`. | review, lint |
| AB-04 | Must | No dependency or lockfile change (unless D-E1 = `react-router`, which then needs the ADR-0026 evidence re-run and human approval). | `git diff` of `package.json` dependency fields and `pnpm-lock.yaml` |
| AB-05 | Must | No change under `schemas/`, `catalog/`, `packages/py/`, `apps/api/`, `apps/station-agent/`, `deploy/`, `docs/adr/`, governance and Gate A0 documents, and no `@calos/domain-types` export. | diff review |
| AB-06 | Must | **Protected markings untouched:** `ProtectedFrame.tsx`, the marking CSS rules in `frame.css`, `apps/web/public/status.css`, and the `<aside id="static-markings">` block. The only allowed edit near them is the stylesheet `href` in `index.html` (RO-09); a gate test compares the block and `status.css` with recorded SHA-256 digests after CRLF to LF normalisation (RO-09). | test, review |
| AB-07 | Must | `.github/**` is not modified until H-3 is approved, and then only `phase0a.yml` gains the one job in `HUMAN_APPROVALS.md` §3. | diff review |
| AB-08 | Must | Additive lint and boundary probes (each with a negative probe, counts reported): forbid `navigator.onLine`, `history.pushState`, `Date.now`, zero-argument `new Date()` in `ui-kit` and `apps/web`; forbid `location`, `history` in `ui-kit`. Never loosen an existing probe or contract. | `pnpm test:ts-boundary` |
| AB-09 | Must | Capability Matrix rows for routing, host status and palette search as trusted-platform **DEV** primitives; no building-block or editor claim. Requirement tags `@req` on code and tests (FR-UI-02, P1A-AC-05/09, OF-02/04/05/06/07/09, RU-01/02/03/04, RT-01…08, SB-01…06). | review |
| AB-10 | Must | Test-only content stays out of Rehearsal: three sentinels (form, data, host) with presence and absence checks. | gate |

## 5. Regression guard

Existing tests that must stay green and unchanged: network isolation; Hebrew `KeyK` shortcut; persistent live region on submit; sticky marking does not overlap the form summary; pseudo-locale 320 px tests; no-JS static markings; PR #25's data-view matrix, focus-versus-marking and state-panel tests. **Expected to change** (legitimately): the two tab-order tests (`tests/frontend/i18n.e2e.spec.ts` and `apps/web/src/App.test.tsx`), because Test gains navigation items and a status bar; the bundle gate's `/status.css` literal (H-4). **No existing assertion may be weakened, replaced or converted to polling.** The only permitted edits to existing tests are the two tab-order tests and mechanical navigation helpers (for example opening the compact settings disclosure), and every edit to an existing test is listed in `EVIDENCE.md` with its reason.

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Windows runner flakiness | reduced matrix, `retries: 0`, investigate every failure, no skips (WE-04) |
| A router adds storage or network paths | in-house router, lint probes, CSP test, `localStorage.length === 0` check |
| Over-modelling the host | exactly the OF-05/OF-06 fields (C-5); no schema, no codegen, no domain-types export |
| Host message relabelling a marking | environment mismatch is an error and never alters markings (HS-07) |
| `F6` intercepted by the browser | manual check in Edge and Chrome (KB-04); stop and report rather than pick another key |
| Layout churn from the status bar | SR-02/03/06 measured; protected markings untouched |
| `base: "./"` breaking the static no-JS fallback | RO-09 digest comparison of the static markings (CRLF-normalised) and gate; no-JS test stays |
| Scope too large for one PR | recommended split A/B in `TASKS_AND_TESTS.md` §1 |

## 7. Stop conditions (Codex stops and reports)

A dependency or lockfile change seems necessary; storage, `fetch`, `navigator.onLine`, polling or `Date.now` seems necessary; a host field outside OF-05/OF-06 seems necessary; a change to the protected markings, `status.css` or the static marking block seems necessary; `F6` is received by the browser instead of the page; the Edge job cannot run without downloading a browser; a gate, an architecture contract or an existing test assertion would have to be weakened or replaced; PR #25 is not merged or its measurements in this document no longer hold; a workflow edit would be needed before H-3 is approved; anything touches metrology, safety, trust roots, authentication, instruments or Production.

## 8. Definition of done

Criteria met with tests; the evidence bundle in `EVIDENCE.md` (criterion-to-test table, screenshots en/he × light/dark × 320/768/1440 for each route, host-status state screenshots, CSP run, Edge run log, forced-colors and scaling screenshots, full gate list with counts, honest **not verified** list); Capability Matrix and CI documentation updated; independent review posted; **human GitHub approval** recorded; merged by the owner. This specification and any agent review are not approvals.

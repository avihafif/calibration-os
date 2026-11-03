# 01 — Current implementation assessment and findings

Basis: `main` at `b0ccadf` (WP-1A-1a and WP-1A-1b merged). Method: reading `AGENTS.md`, the accepted ADRs, `ARCHITECTURE.md`, `UI_UX_SPEC.md`, the Phase 1A plan/gate documents, and the source of `packages/ts/{i18n,ui-kit,domain-types}`, `apps/web`, `apps/station-agent`, `packages/py/*`. Test and CI counts below are **as recorded** in `docs/wp-1a-1b/UI_KIT.md` and `HARDENING.md`; this documentation-only review did not re-run the suites. Severity scale: **Critical** (violates a non-negotiable rule or can mislead about calibration), **High** (blocks the next stage until resolved), **Medium** (fix within the named package), **Low** (hygiene).

## 1. Implemented, prototype, planned — kept apart

| Area | Actually on `main` | Prototype only (non-shipping, `design/`) | Planned, not started |
|---|---|---|---|
| Schemas/metadata (Python) | R-4 fail-closed schema engine, canonical JSON/digests, `Finding` model, lifecycle **Protocols (types only)**, package verification (verification-only), one kind: `Manufacturer` | Phase 1A and Procedure Designer prototypes (data model, form engine, diff, simulation lab) | Kinds `InstrumentFamily`/`InstrumentModel`, TS structural validator, registry-driven codegen |
| Frontend packages | `i18n` (ICU en/he, `en-XA`/`he-XB`, exact-decimal and bidi-guarded formatters), `ui-kit` (light/dark tokens, `Button`, `Input`, `Select`, `Badge`, `Card`, `Notification`, `Dialog`, `AppFrame`, `ProtectedMarkings`, `WorkspaceErrorBoundary`), `domain-types` (generated) | Inspector, designers, data views | `editor-core`, `designers`, `ui-runtime`, `expr-presentation`, `api-client` (names reserved in the boundary policy; no code) |
| Web app | `apps/web` demo shell on in-page anchors; Test / Production-Rehearsal builds; static no-JS marking fallback | Builder screens | Router, shells, Synthetic Host, Builder |
| Station / central | FastAPI stubs: `apps/station-agent` serves only `/local/v1/status` (`simulator_stub`, `non_operational`); `apps/api` has one probe migration; Compose Test/Rehearsal isolation | — | Engine, journal, SQLite, broker, drivers, transports, sync, local auth, MSI, update |
| Safety/metrology | Nothing operational; AHL/Safety Profile model exists only as ADR-0023 + docs | Prototype Safety Console | Everything |

The code is an honest, small, non-operational foundation. The risk is not what is built; it is that three work-package definitions disagree (LA-02), the station delivery decisions are all still *Proposed* (LA-01), and the frontend has no host-port contract yet (LA-05).

## 2. What is good (keep)
* Boundaries are enforced mechanically (A1 table in `tools/ts_boundary_policy.mjs`, ESLint element rules, 77 recorded negative probes, per-package external import allow-list, dynamic-import/asset/DOM/storage restrictions). `ui-kit` depends only on React and `i18n`.
* Protected TEST / SIMULATION markings are outside the error boundary, sticky, present in the build-time HTML and the no-JS fallback, and cannot be themed or dismissed (`ProtectedMarkings`, `frame.css`, `index.html`).
* Exact-decimal discipline already exists in `i18n` (`formatQuantity` takes a decimal **string**; bidi controls rejected; technical text bounded).
* Pseudo-locales are selectable in the Test build and exercised by Playwright at three widths; theme tokens have a contrast gate (24 pairs).
* Supply-chain gate (exact pins, SBOM, licence allow-list, OSV, audit) and the decision records for the single transitive exception (gate-a0/14).

## 3. Findings by severity

### Critical
None found in the reviewed scope. Nothing on `main` can present simulation as calibration, reaches an instrument, writes persistent state, or weakens an Absolute Hardware Limit.

### High
| ID | Where | Finding | Required resolution | Blocks |
|---|---|---|---|---|
| **LA-01** | ADR-0011/0012/0014/0009 (all *Proposed*); `AGENTS.md §12` | Product direction is an "Offline-First **Windows desktop application**", but the only documented UI delivery is a **local web app** (Station Agent serves the React build on `127.0.0.1`, opened in Edge/Chrome app-mode — ADR-0011). Electron, Tauri and a WebView2 shell are not in the accepted baseline. Of the station ADRs only ADR-0003 (SQLite journal) is Accepted. | Decide the delivery model by ADR (proposal LA-DP-01 in [03](03_BUILDER_READINESS_AND_H2_PROPOSAL.md) §5 and [04](04_OFFLINE_STATION_ARCHITECTURE_REVIEW.md)). Keep the frontend host-neutral until then (it already is). | Any station/operational UI work; **not** WP-1A-1c/d/e |
| **LA-02** | `docs/gate-a0/10 §2`, `docs/autonomy/tasks.json` + prompts, `PHASE1A_IMPLEMENTATION_PLAN.md` | **WP-1A-1c is defined three ways.** Gate-A0 record: `QuantityInput`, `IntervalInput`, `InputRequiredBadge`, `LocalizedTextField`, `DataGrid`, `TreeView`, `DiffViewer`, `ValidationDrawer`; its 1d is routing/palette/skip links and 1e the CI harness. Autonomy queue: 1c = generic text/number/select form primitives, 1d = `DataTable`/`DetailList`. Reality: the command palette, skip link and the Playwright/axe harness already exist (1a/1b). A task started from the wrong definition either under-delivers or pulls in gated work (`DiffViewer` needs `editor-core`; `ValidationDrawer` touches the H-2 key namespace). | Adopt one re-baselined split. Proposed in [05](05_NEXT_THREE_WORK_PACKAGES.md): 1c forms, 1d read-only data views + findings list, 1e routing/host-status contract/Windows CI. Record it in the next governance PR. | Starting 1c |

### Medium — frontend / UX (fix inside the named package)
| ID | Where | Finding | Required correction | Gate |
|---|---|---|---|---|
| **LA-03** | `ui-kit/src/AppFrame.tsx` (Ctrl/Cmd+K handler) | The shortcut tests `event.key.toLowerCase() === "k"`. With a Hebrew keyboard layout active, `event.key` is a Hebrew letter, so the palette **cannot be opened by Hebrew-layout users**. Hebrew is a first-class locale. | Use `event.code === "KeyK"` (layout-independent); add a test that dispatches a Hebrew-layout event (`key: "ל"`, `code: "KeyK"`). Apply the same rule to every future shortcut. | 1c |
| **LA-04** | `ui-kit/src/primitives.tsx` (`Input`, `Select`) | Not yet usable as form primitives: text only (no `type`, `inputMode`, `autoComplete`, `maxLength`, `readOnly`, `disabled`, `dir`/`lang`); caller-supplied ids (collision risk) instead of `useId`; an error **replaces** the hint instead of both being announced; no `aria-errormessage`/error summary/live announcement on submit; no `textarea`, checkbox, radio, fieldset/legend; required is a visual `*` only (`aria-hidden`) with no text alternative; `Select` has no placeholder/empty-option semantics. | Implement the field system in [02 §1](02_FRONTEND_ACCEPTANCE_CRITERIA.md). | 1c |
| **LA-05** | `apps/web`, `AppFrame` footer (`shell.localHost`) | No **host-port contract**. The status bar is static text, so there is nowhere to show offline/sync/journal/clock/disk state; the UI would later invent it ad hoc. Offline-first operation needs a typed `HostStatus` port with a test double before any operational screen. | Define the port (types + fake adapter + `AppFrame` binding) in 1e; see [02 §7](02_FRONTEND_ACCEPTANCE_CRITERIA.md). | 1e |
| **LA-06** | `primitives.tsx` (`Dialog`) | Fixed `id="ui-dialog-title"` (duplicate ids when two dialogs/frames coexist); backdrop `mousedown` closes the dialog (silent loss of typed form data); background is not inert (only `AppFrame` sets `inert` for the palette); focus-trap selector omits `textarea`, checkbox and non-`0` tabindex; close button is the literal glyph `×`; no scroll lock. | `useId` for the title, dirty-state-aware backdrop (opt-in `dismissOnBackdrop`, default off for forms), generic inert background, complete tabbable selector, SVG close icon. | 1c |
| **LA-07** | `primitives.tsx` (`toneIcon`), `AppFrame` (`☰ ⌕ ◆`), `Dialog` (`×`), `App.tsx` (`−`, `+`) | Status and control icons are **Unicode glyphs** resolved by OS font fallback. Accepted **ADR-0015 B4** says status icons are SVG components, not font glyphs (the earlier font evidence showed `✔ ✖ ⚠` are in none of the candidate fonts). Rendering will differ across lab PCs and locked Windows images. | Small internal SVG icon set (`aria-hidden`, `currentColor`, mirrored where directional), no icon font or new dependency. | 1c (status icons) |
| **LA-08** | `components.css` (`.ui-button` 2 rem, `.ui-field input` 2.25 rem, `frame-*` 2 rem); no density tokens | `UI_UX_SPEC` makes **comfortable density (≥ 44 px touch targets) the station default**; shipped controls are 32–36 px and there are no density tokens. WCAG 2.2 AA target size (24 px) passes, the station spec does not. | Add `--density` tokens (`comfortable` default for Operator shell, `compact` for Builder/Admin); controls use the token; test target size per density. | 1c |
| **LA-09** | `frame.css`, `tokens.css` | No `forced-colors`/`prefers-contrast` handling. Windows High Contrast is common on managed lab PCs; borders defined only by `background`/`box-shadow` vanish and `!important` focus outlines are ignored. `prefers-reduced-motion` is handled. | Add `@media (forced-colors: active)` rules (system colours, visible borders, markings retain text + shape); add a Playwright `forcedColors: "active"` test. | 1c/1e |
| **LA-10** | CI (`phase0a.yml` `frontend-browser`), `playwright.config.ts` | Browser tests run on **Linux Chromium**; the station target is **Windows + Edge** with Segoe UI (the `1b` CI failure was already a Linux-only layout overflow). Fonts, scrollbars, IME, scaling (125–150 %) differ. | Add a `windows-latest` + `msedge` Playwright job (read-only, same specs, smaller matrix), keep Linux for baselines. | 1e |
| **LA-11** | `ui-kit` tests (4 unit tests), `tests/frontend` (5 specs) | Coverage is thin for the next package: no Hebrew-layout keyboard test, no mobile axe, no 200 %/400 % zoom and text-spacing reflow check, no forced-colors test, no `Dialog` RTL/focus test beyond one, no visual-regression baselines (screenshots are documentation, not assertions). | See criteria FC-/RT-/RU- in [02](02_FRONTEND_ACCEPTANCE_CRITERIA.md). | 1c–1e |
| **LA-12** | `Card` (`primitives.tsx`) | `aria-label` duplicates the visible `h2`; heading level is fixed at 2, which will break hierarchy in nested panels and dialogs. | `headingLevel` prop (2–4), drop the redundant `aria-label`. | 1c |
| **LA-13** | `apps/web` / `ProtectedMarkings` | The static no-JS fallback and document title are English-only (documented limitation). Acceptable for Test; for a Hebrew-first station the title/`lang` must follow the stored preference. | Preference must come from a host port later (browser storage is forbidden by D-27); record as an open design item, no code now. | 1e / station |

### Low
| ID | Finding | Correction |
|---|---|---|
| LA-14 | `AppFrame` navigation uses local `activeId` and `href="#content"` — it is not tied to the URL hash, back/forward, or deep links. | Resolve in 1e with hash routing (works offline from any static host, no server fallback). |
| LA-15 | Palette matching is `toLocaleLowerCase` + `includes`; Hebrew niqqud/final-form variants and Latin diacritics will not match. | Normalise (`NFKD`, strip combining marks) via an `i18n` helper with unit tests. |
| LA-16 | Palette is a navigation filter only; it is labelled a command palette. | Keep scope; rename strings or document that commands arrive with the action catalog (ADR-0020). |
| LA-17 | `font-variant-numeric: tabular-nums` and Hebrew line-height rules are global on `.calos-app`; no per-locale numeric alignment tests. | Cover in table tests (1d). |
| LA-18 | `:focus-visible { outline … !important }` blocks component-level focus design. | Use cascade layers (`@layer`) instead of `!important`; keep the visible-focus guarantee as a test. |

## 4. Gaps that are by design (not defects)
No persistence (D-27), no network, no authentication, no real publish, no fonts (GA0-06b), no Builder. These are correctly absent; the findings above only concern *readiness for the next steps*.

## 5. Findings that live elsewhere
Station/offline findings (ST-01…ST-15) are in [04](04_OFFLINE_STATION_ARCHITECTURE_REVIEW.md); Builder/gate findings (BR-01…BR-12) and the H-2 proposal are in [03](03_BUILDER_READINESS_AND_H2_PROPOSAL.md). Open items from the PR #11 review that are still open on `main`: **F-05** (no CSP headers or enforcement test; static preview server) — now ST-03 because the real control point is the Station Agent's Local API, not Vite preview.

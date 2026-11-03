# 02 — Frontend requirements and acceptance criteria (WP-1A-1c onward)

Status: **recommended requirements for the product owner to adopt**; not approved by this document. Every criterion is testable and uses only already-accepted decisions (ADR-0001 A1–A4, ADR-0015 B1–B6, ADR-0026, D-23, D-27, D-28, D-29). Nothing here depends on an open gate; items that would are fenced in §3–§4 and in [03](03_BUILDER_READINESS_AND_H2_PROPOSAL.md).

**Universal rules** (apply to every package below): no new third-party dependency; no network, browser storage, cookies or `Intl`-free number parsing of metrological values; no `kind`/manufacturer/model/customer names in code or tests of runtime packages; every user-visible string is an i18n key (he/en, pseudo-locales pass); logical CSS only; every control keyboard-operable; protected TEST/SIMULATION markings untouched; all demo data is labelled UI-only placeholder text — **no measurement, tolerance, range, standard, interval or specification values** (`AGENTS.md §2.1`). A requirement is *met* only with an automated test, or a named manual check recorded in the PR.

## 1. Enterprise form controls (WP-1A-1c) — `FC-*`

| ID | Requirement | Verification |
|---|---|---|
| FC-01 | **Field system.** `FormField` (label, optional description, error, required/optional text) wires `for`/`id` (via `useId`, never caller ids), `aria-describedby` (description **and** error), `aria-invalid`, `aria-errormessage`, and `aria-required`/native `required`. Required and optional are both stated in text (not by `*` alone); the marker is localized. | RTL unit tests (name, description, error, required text in en/he); axe |
| FC-02 | **Controls:** `TextField`, `TextArea`, `DecimalField`, `SelectField`, `Checkbox`, `RadioGroup` (fieldset + legend), each with `disabled`, `readOnly` (where applicable), `invalid`, `required`, empty state, `maxLength` (bounded: no unbounded input), `autoComplete="off"` default for technical text, and `dir`/`lang` overrides. Controls are **controlled**, return strings, and never coerce. | Unit tests per control and state |
| FC-03 | **`DecimalField`** holds an exact decimal **string** (pattern per `i18n`; bounded length). It never calls `Number`/`parseFloat`; shows the parse error for `1e3`, `+1`, `1,5`, `٣`, spaces, bidi/control characters; preserves trailing zeros and leading `-`; paste is normalised only by trimming outer whitespace, never by guessing separators. `inputMode="decimal"`, `dir="ltr"`, text-aligned to the logical start in both locales. | Property test: for generated decimal strings `value → onChange → value` is identity; negative corpus; browser test pasting `1,5` |
| FC-04 | **Optional compositions (no domain logic):** `QuantityField` = `DecimalField` + unit selector where `units` is supplied by the caller (the kit has **no unit catalogue**, no dimension logic, no conversion); `IntervalField` = two `DecimalField` + two inclusivity radios with **no default selection** and a required-state error until both are chosen (`PR-015`-style rule, generic text). `InputRequiredMarker` renders a caller-supplied marker id as icon + text (no colour-only meaning). | Unit tests; a test that fails if the kit imports a unit or dimension table |
| FC-05 | **`LocalizedTextField`**: renders one row per locale from a `locales` prop (default `en`, `he`), each with `lang`, `dir="auto"`, its own label and error; required-locale policy is a prop, never hard-coded; a missing optional locale is a visible hint, not an error. | Unit + RTL tests; mixed-direction value test ("Voltmeter (חשבון) 2") |
| FC-06 | **Validation presentation:** inline error on blur, **error summary** at submit (`FormSummary`: heading, count, links that move focus to the field), and a polite live announcement of the count. Findings are shown as `{ code, severity, message }` supplied by the caller; the kit does not validate. Error text never relies on colour alone (icon + text + `aria-invalid`). | Keyboard-only test: submit → focus lands on summary → link → field |
| FC-07 | **`Dialog` hardening** (LA-06): `useId` title; backdrop dismissal off by default for forms; background inert; complete focus trap incl. `textarea`/checkbox/radio; focus returns to the opener; Escape closes only the top dialog. | Unit + e2e (en, he, mobile) |
| FC-08 | **Shortcuts are layout-independent** (LA-03): `event.code`, never `event.key`, for letter shortcuts; shortcut hints are localized. | Event-simulation test with Hebrew `key`/Latin `code` |
| FC-09 | **Icons:** status icons are internal SVG components (`aria-hidden`, `currentColor`); glyph characters removed from `Badge`, `Notification`, `Dialog`, `AppFrame`. | Lint/test: no glyph from the Dingbats/Misc-Symbols ranges in `ui-kit` `.tsx` |
| FC-10 | **Density:** `comfortable` (default; interactive targets ≥ 44 × 44 CSS px) and `compact` tokens; the demo exposes both; no component hard-codes a height. | Playwright target-size assertion per density |
| FC-11 | **No-code boundary:** props are generic (`label`, `value`, `onChange`, `error`, `units`, `locales`); no schema, hint, widget-id, `kind` or `x-calos-editor` interpretation. | Boundary lint + a test that greps `ui-kit` sources for `x-calos`, `widget`, `kind ===` |
| FC-12 | **Demonstration** on synthetic UI-only data, reset on reload; no persistence; "submit" produces a local summary only. | Browser test reload clears state |

## 2. Advanced read-only data views (WP-1A-1d) — `DV-*`

| ID | Requirement | Verification |
|---|---|---|
| DV-01 | **`DataTable`**: semantic `<table>` with `<caption>`, `<th scope>`, column definitions supplied as data (`id`, header key, `render(row)`), stable row keys. No virtualisation library; paging is caller-driven (props), not built in. | Unit + axe |
| DV-02 | **Sorting** only of caller-supplied strings/identifiers with `aria-sort` on the single sorted header, a real `<button>` in the header, and locale-aware collation (`Intl.Collator(locale, { numeric: true })`); decimal strings sort by **exact string compare via a supplied comparator** (the kit never parses numbers). | Unit: en/he orderings; decimal strings with 30 digits |
| DV-03 | **Responsive**: < 700 px either card-list rendering with the same data and accessible names, or a horizontally scrollable region that is itself focusable (`tabindex=0`, labelled) with a sticky first column using `inset-inline-start`; no page-level horizontal scroll. | 320/768/1440 px Playwright; 200 % and 400 % zoom |
| DV-04 | **`DetailList`** (`<dl>`), **`StatePanel`** for loading / empty / no-results / error / read-only (each with a distinct role, icon and text; error uses `role="alert"`, loading `aria-busy`). | Unit tests per state; axe |
| DV-05 | **Bidi:** every identifier/hash/unit cell is an LTR isolate (`bdi dir="ltr"`); mixed cells truncated with logical `text-overflow`, full value available by focusable tooltip/`title` alternative and copy-safe; column order and sort arrows mirror in RTL. | RTL screenshot tests, pseudo-locale (`he-XB`) overflow test |
| DV-06 | **`FindingsList`** (the generic `ValidationDrawer` body): accepts `{ code, severity, pointer, message: { key, params }, stage }`, groups by severity/stage, links to a pointer through a callback, and assumes **no message-key namespace** (H-2). The type is declared structurally in `ui-kit`; a type-level test in `apps/web` asserts equality with the generated `Finding` type. | Unit + type test |
| DV-07 | **Selection/keyboard:** native table semantics; arrow-key grid navigation is **not** added (APG data-grid is out of scope); row actions are buttons inside cells with accessible names including the row's identifying value. | Keyboard-only test |
| DV-08 | **Out of scope until their gates:** `DiffViewer` (needs the `editor-core` diff model), `TreeView` (only with a real consumer), editable grids, column chooser/saved views/CSV export (permissioned features need the permission model), virtualised lists. | Review checklist |

## 3. Generic schema-driven rendering boundaries — `SB-*`

What the UI layer **may** do now vs. **must not** do until H-2/GA0-16 closes:

| ID | Rule |
|---|---|
| SB-01 | `ui-kit` and `apps/web` contain **no** `x-calos-editor` hint interpretation, widget registry, schema walker or JSON-Pointer addressing. These belong to `editor-core` (model) and `designers/inspector` (React) per ADR-0001 A2/A3 and are created only in WP-1A-3. |
| SB-02 | `ui-kit` components take plain typed props and return typed values; they must be usable by a future registry **without modification**. The future widget registry will map widget ids → these components; that mapping is the only place a widget id appears. |
| SB-03 | Conformity of the control contract with the future widget table is proven now by a **contract test** per control: "given only `label`, `value`, `onChange`, `error`, `disabled/readOnly`, `locale` the control is fully operable". No schema fixture is read. |
| SB-04 | No component imports `@calos/domain-types` (A1 forbids it for `ui-kit`); shared shapes (`Finding`, locale ids) are declared structurally and equality-tested in `apps/web`. |
| SB-05 | Unknown/unsupported inputs render a **visible** localized error placeholder component (`UnsupportedControl`), never nothing — ready for the inspector's `err.unknown_widget` (PD-style fail-closed) without deciding any widget id. |
| SB-06 | A boundary lint probe is added for each new rule (`x-calos`, `widget:`, `.kind ===`, `JSON.parse` of schemas inside `ui-kit`). |

## 4. Metadata-editing prerequisites (checklist, **not** a work package)

Editing metadata (WP-1A-3/4/5) may start only when every row is true. The status column is today's state.

| # | Prerequisite | Status |
|---|---|---|
| ME-01 | H-2/GA0-16: one closed, versioned `x-calos-editor` vocabulary decided by a named owner | **Open** (proposal in [03](03_BUILDER_READINESS_AND_H2_PROPOSAL.md) §4) |
| ME-02 | Finding message-key namespace fixed and implemented identically in Python and TypeScript | Open (part of H-2) |
| ME-03 | Field contract for `InstrumentFamily`/`InstrumentModel` reviewed; every missing metrological value is an `{"$input":"MI-nn"}` marker | Open (D-11, MI register) |
| ME-04 | TypeScript structural validator for the supported schema subset (P1A-AC-01…04 are not fully met on `main`) with shared conformance vectors | Open |
| ME-05 | Registry-driven codegen (`catalog/kinds.json`) so a kind is not a tool edit (ADR-0001 A5 — **not accepted**, needs a CI budget figure) | Open |
| ME-06 | `editor-core` design: command stack, patch/undo, `InspectorModel`, revision snapshots, diff — host ports only; property tests (`undo∘apply = id`, no float round-trip) | Not started |
| ME-07 | Synthetic Host and `host-conformance` contract (D-23 approved; D-21 lease defaults **open**) | Open |
| ME-08 | Focus- and caret-preserving structural rebuild specified and test-planned | Spec exists (phase1a/03 §5); not implemented |
| ME-09 | ADR-0020 (metadata UI rendering) ratified or explicitly scoped out for Test-only use | Proposed |
| ME-10 | No persistence/credentials/network in the Test host (D-27) — memory only | Approved; must stay enforced |
| ME-11 | Capability Matrix updated for each new widget/kind (adding a control shape is DEV) | Process |

## 5. Responsive desktop and mobile — `RU-*`

Breakpoints follow `UI_UX_SPEC` (sm < 768, md 768–1199, lg ≥ 1200; 16 px gutters at sm).

| ID | Requirement | Verification |
|---|---|---|
| RU-01 | No horizontal page scroll at **320, 375, 768, 1024, 1440 px** in en, he, light, dark, both densities. | Playwright matrix (subset in CI, full nightly) |
| RU-02 | Reflow at **200 % and 400 % browser zoom** (equivalent to 1280 → 320 CSS px) with no loss of content or function (WCAG 1.4.10). | Playwright `deviceScaleFactor`/viewport test |
| RU-03 | **Windows display scaling** 125 % and 150 % keep targets ≥ 44 px in comfortable density and do not clip the protected markings. | Windows CI job (LA-10) |
| RU-04 | Text spacing override (line-height 1.5, letter 0.12em, word 0.16em, paragraph 2em) causes no clipping (WCAG 1.4.12). | Injected-style test |
| RU-05 | Forms stack to one column below `md`; labels above controls; submit/cancel actions reachable without scrolling past a sticky protected marking. | Screenshot + assertions |
| RU-06 | Touch: ≥ 44 px targets (comfortable); no hover-only information; drawer, dialog and palette usable by touch and keyboard. | Playwright `hasTouch` |
| RU-07 | Orientation changes keep state and focus. | e2e |
| RU-08 | The protected markings never overlap or are covered by content, drawers or dialogs at any width. | Existing assertions extended per component |

## 6. English / Hebrew RTL — `RT-*`

| ID | Requirement | Verification |
|---|---|---|
| RT-01 | `html lang/dir` and every component root follow the locale; layout uses logical properties only (existing lint stays green). | Existing lint + e2e |
| RT-02 | Keyboard: arrow keys in custom composite widgets are **mirrored** in RTL (`ArrowRight` = previous); native radios/selects are left to the browser. Shortcuts are layout-independent (FC-08). | Unit/e2e |
| RT-03 | Identifiers, units, decimals, hashes, expressions, file names: LTR isolates; free text: `dir="auto"`; mixed strings tested (`"CalOS (בדיקה) v1.2"`). | Unit + screenshot |
| RT-04 | Numerals Western in both locales; decimal separator `.`; **display** via `Intl.NumberFormat`, **input** only the canonical string (FC-03). | Unit |
| RT-05 | Directional icons mirror (chevrons, sort arrows, "back"); semantic icons (check, warning) do not. | Visual test |
| RT-06 | Pluralisation uses ICU categories; tests cover Hebrew 0, 1, 2, 3, 10, 11, 20, 21, 100 and decimals. | Unit |
| RT-07 | Pseudo-locales (`en-XA` +40 %, `he-XB`) render every new component at 320/768/1440 px without clipping or overlap. | Existing harness extended |
| RT-08 | Hebrew remains **`needs_review`** (MI-31/Q-15): every new Hebrew string is added through the same review-status mechanism; the review note remains visible; no claim of reviewed terminology. | Unit |
| RT-09 | The static no-JS fallback keeps English markings; limitation documented until a host preference port exists (LA-13). | Doc |

## 7. Offline-compatible frontend architecture — `OF-*`

The same React build must run (a) from the Vite preview/Compose rehearsal today and (b) when served by a local Station Agent without Internet, under either delivery model (browser app-mode or a future wrapper — LA-01).

| ID | Requirement | Verification |
|---|---|---|
| OF-01 | **No external origin at runtime**: no CDN, web font, analytics, remote image, `<link rel>` to another origin; all assets hashed and same-origin. | Existing e2e network-isolation test + bundle gate |
| OF-02 | **Relative-safe routing**: hash-based routing (works with any static server, no fallback rules); no reliance on `history.pushState` server support. | 1e route tests served from a sub-path |
| OF-03 | **No service worker** (extra persistence/attack surface; D-27). Offline is a property of local serving, not caching. | Bundle gate: no `serviceWorker` |
| OF-04 | All host interaction is through **injected ports** (`HostStatusPort` first; later `DraftPort`, `ConfigPort`); `fetch`/`XMLHttpRequest`/`WebSocket` stay restricted in packages; the single adapter that may use `fetch` is `apps/web/src/host/*` and only for the same origin. | Lint allow-list + probe |
| OF-05 | **Connectivity is host-reported**, not `navigator.onLine` (unreliable on a bench PC with a LAN but no route). `HostStatus` carries `connection` (`online | offline | degraded | unknown`), `sync` (`idle | pending(n) | failed | quarantined`), `journal` (`ok | quarantined`), `clock` (`ok | skew | unknown`), `storage` (`ok | low | full`), `agent_version`, `deployment_id`, `environment_kind`. Unknown ⇒ shown as unknown, never as OK. | Component tests with a fake port, each state in both locales |
| OF-06 | **Time shown to users comes from the host** (`wall_utc` + time-zone label), not the browser clock; ISO value available on focus/hover (UI_UX_SPEC). | Unit with a fake clock |
| OF-07 | **Stale/offline states are explicit** and never block read access to already-loaded data; any action that needs the host is disabled-with-reason, not hidden. | e2e with the fake port toggled |
| OF-08 | **Build identity**: the UI build exposes version, commit digest, `environment_kind`; N/N-1 compatibility with the Local API is tested when the API exists. | Build gate |
| OF-09 | **CSP is shippable**: the build works under `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'` with no `unsafe-inline`/`unsafe-eval`; a Playwright test serves the build with that header and asserts zero violations. (Closes the UI half of F-05; the header itself is a Station Agent responsibility — ST-03.) | Playwright with header |
| OF-10 | **Reproducible, budgeted build**: bundle-size budget per route, no source maps in release, deterministic file names for a given input. | Build gate |

## 8. Acceptance criteria for the next Codex PR — **WP-1A-1c "Form foundation"**

**Branch/scope.** One PR, base current `main`, title `WP-1A-1c: accessible form foundation`. Allowed paths: `packages/ts/ui-kit/**`, `apps/web/src/**`, `tests/frontend/**`, `docs/wp-1a-1c/**`, `docs/NO_CODE_CAPABILITY_MATRIX.md` (rows for form primitives). Forbidden: `schemas/**`, `catalog/**`, `packages/py/**`, `apps/api/**`, `apps/station-agent/**`, workflows, root dependency/tool policy, ADRs, governance docs, any font, any new dependency (ADR-0026 pins only).

**Must deliver:** FC-01 … FC-12, with the cross-cutting rows RU-01/02/05/06, RT-01…RT-08, SB-01…SB-06, OF-01/04/09 applicable to the new components; DV-/ME- items are explicitly **not** part of this PR.

**Evidence the PR must contain** (the reviewer will not accept "CI is green" alone):
1. A criterion-to-test table in `docs/wp-1a-1c/README.md` (FC-xx → test file + name).
2. Screenshots: en/he × light/dark × 320/768/1440, comfortable and compact; one forced-colors screenshot; error-summary state.
3. Negative evidence: failing-then-fixed boundary probes for SB-06; `DecimalField` negative corpus; a test that rejects any unit/dimension table in `ui-kit`.
4. Local run of the full gate list in `docs/wp-1a-1b/UI_KIT.md` (check, lint, logical-CSS, tokens, boundary, unit, build, bundle, e2e) plus the supply-chain gate; counts stated, not asserted.
5. A statement of what is *not* verified (e.g., real screen reader; Windows/Edge until LA-10 lands).

**Review gates before merge:** independent review (not the author's agent), human GitHub approval, Capability Matrix updated, no new `TODO` without an issue, `@req` tags (`FR-UI-02`, P1A-AC-09/12/13/14).

**Stop conditions (Codex must stop and report instead of proceeding):** a control seems to need a unit catalogue, dimension logic, a locale rule not in `i18n`, a new dependency, a schema/hint concept, persistence of any kind, or a change to the protected-marking markup/CSS.

**Definition of done:** reviewer can operate every form control by keyboard only in en and he (including with a Hebrew keyboard layout), see every state with text + icon + shape, and no criterion in this section depends on a decision that is still open.

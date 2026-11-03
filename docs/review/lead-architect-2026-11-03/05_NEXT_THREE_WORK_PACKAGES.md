# 05 — Recommended development order and plan for the next three work packages

Status: **recommendation for manual assignment.** Autonomous development is disabled; each package below is assigned by the product owner, built on a fresh branch from current `main`, reviewed independently, and merged only by the owner. No package depends on an unresolved approval gate (BR-01…BR-12 in [03](03_BUILDER_READINESS_AND_H2_PROPOSAL.md) stay closed and are not touched). Sizes are relative (S/M/L), not time estimates.

## 1. Recommended order (whole programme, in sequence)

| Step | Work | Type | Gate/dependency |
|---|---|---|---|
| 0 | Adopt this review's re-baseline (LA-DP-02) and decide LA-DP-01 direction | Governance docs | Product owner / architecture owner |
| 1 | **WP-1A-1c** Form foundation | Code (Codex) | Step 0 |
| 2 | **WP-1A-1d** Read-only data views + findings list | Code (Codex) | 1c merged |
| 3 | **WP-1A-1e** Routing, host-status contract, Windows/Edge + forced-colors CI | Code (Codex) | 1d merged |
| — | *In parallel (docs/spikes only):* BR-01…BR-10 decision records; ST spikes SP-1…SP-6; ADR-0011/0012 revision | Docs | Owners as in 03/04 |
| 4 | WP-1A-2 kinds, fixtures, codegen | Code | Entry conditions in 03 §2 |
| 5 | WP-1A-3 editor-core + inspector | Code | WP-1A-2, BR-09, BR-11 |
| 6 | WP-1A-4 Synthetic Host → 1A-5 Builder screens → 1A-6 new-kind proof → 1A-7 quality gate | Code | BR-05 etc. |
| 7 | Station phase (libraries with fake ports → SQLite → Local API → sync → installer) | Code | [04 §4](04_OFFLINE_STATION_ARCHITECTURE_REVIEW.md) |

## 2. WP-1A-1c — Form foundation (next Codex PR)  · size M

**Goal.** An accessible, bilingual, exact-decimal-safe set of generic form controls in `ui-kit`, plus the corrections to existing primitives the controls depend on.
**In scope.** FC-01…FC-12 ([02 §1](02_FRONTEND_ACCEPTANCE_CRITERIA.md)): field system, `TextField`/`TextArea`/`DecimalField`/`SelectField`/`Checkbox`/`RadioGroup`, optional `QuantityField`/`IntervalField`/`InputRequiredMarker` (caller-supplied units/markers, no domain logic), `LocalizedTextField`, `FormSummary`, `Dialog` hardening, layout-independent shortcuts, SVG status icons, density tokens, forced-colors baseline; demo on synthetic UI-only data. Cross-cutting RU/RT/SB/OF rows listed in 02 §8.
**Out of scope.** Data views, routing, host ports, any schema/hint/widget concept, persistence, new dependencies, fonts.
**Depends on.** Nothing open. Needs the re-baseline (LA-DP-02) recorded so the scope is unambiguous.
**Exit evidence.** The criterion-to-test table, screenshots matrix, negative corpora, full gate run with counts, "not verified" list (02 §8).
**Main risks and mitigations.** (1) *Scope creep into metrology* → `QuantityField` takes units as data; test forbids unit/dimension tables. (2) *Decimal coercion* → property tests on strings; lint bans `Number`/`parseFloat` in `ui-kit`. (3) *Hebrew-layout shortcuts* → `event.code` test. (4) *Visual regressions in the frozen markings* → existing marking assertions run on every new demo view.
**Hand-off prompt skeleton for Codex.** Read AGENTS.md; ADR-0001 A1–A4, ADR-0015 B1–B6, ADR-0026; `docs/review/lead-architect-2026-11-03/02_FRONTEND_ACCEPTANCE_CRITERIA.md` §1–§8; `docs/wp-1a-1b/*`. Implement exactly FC-01…FC-12 within the allowed paths; do not touch workflows, governance files, ADRs or dependencies; stop and report on any stop condition in 02 §8; return a PR with the evidence listed there.

## 3. WP-1A-1d — Read-only data views and findings list  · size M

**Goal.** Accessible, responsive, display-only data components for lists and detail panels, and the generic findings presentation the Builder will later feed — without any editing, schema or network.
**In scope.** DV-01…DV-07 ([02 §2](02_FRONTEND_ACCEPTANCE_CRITERIA.md)): `DataTable` (semantic, sortable supplied strings, responsive card/scroll region), `DetailList`, `StatePanel` (loading/empty/no-results/error/read-only), `FindingsList` (generic `Finding` shape, no key namespace), bidi-safe identifier cells, RTL mirroring, pseudo-locale checks; type-level equality test against the generated `Finding` type in `apps/web`.
**Out of scope.** `DiffViewer`, `TreeView`, editable grids, column chooser/saved views/CSV export, virtualisation, any query/paging backend (DV-08).
**Depends on.** 1c merged (form/`StatePanel` patterns, icons, density tokens). **Does not** depend on BR-01/BR-02: `FindingsList` assumes no namespace.
**Exit evidence.** Criterion-to-test table; 320/768/1440 px × en/he × light/dark screenshots; 200 %/400 % zoom evidence; keyboard-only table walkthrough; axe results; bidi corpus.
**Main risks.** (1) *Findings contract divergence* → structural type + equality test + a note that the key namespace is deferred. (2) *Wide tables on mobile* → pick one pattern (card list **or** focusable scroll region) per table and test both widths. (3) *Number sorting* → comparator supplied by the caller; the kit never parses numbers.

## 4. WP-1A-1e — Routing, host-status contract and Windows/Edge CI harness  · size M–L

**Goal.** Make the shell navigable and offline-ready, and close the remaining F-05/LA-09/LA-10 gaps, so Builder work later composes into a verified frame.
**In scope.**
1. *Routing:* hash-based routes for the existing shell areas (`#/overview`, `#/forms`, `#/data`), `aria-current` and title derived from the route (title keeps the protected prefix), focus moved to the page heading on route change, F6 region cycling, browser back/forward. Implementation either in-house or `react-router@8.5.0` **in library mode only** under the accepted ADR-0026 constraints (evidence re-run at installation; the conditions in gate-a0/09 §2.1 apply). No `ScrollRestoration`, loaders/actions, `<Form>`, `useFetcher`.
2. *Host-status contract (OF-05…OF-07):* `HostStatusView` structural type in `ui-kit`, `AppFrame` status-bar binding with every state in he/en, a fake `HostStatusPort` in `apps/web/src/host` used by the demo and tests; **no `fetch`, no real agent**; unknown ⇒ shown as unknown.
3. *CSP-ready build (OF-09):* Playwright serves the build with the strict CSP header and asserts zero violations (the header itself is a later Station Agent responsibility, ST-03).
4. *CI harness:* a `windows-latest` + `msedge` Playwright job running a reduced matrix (LA-10); `forcedColors: "active"` and 125/150 % scaling tests (LA-09, RU-03); visual baselines policy decision recorded (store baselines from the Linux job only, or none) — implemented only if it needs no new dependency.
5. *Housekeeping:* Hebrew-aware palette search normalisation (LA-15), `@layer` instead of `!important` focus rule (LA-18), documentation of the static no-JS fallback limits (LA-13).
**Out of scope.** Any real API, token, service worker, storage, preference persistence, Station Agent change, workflow *policy* change beyond adding the new job (the owner approves the workflow edit explicitly, since workflows are governance-controlled).
**Depends on.** 1d merged; the owner's approval to edit `.github/workflows/phase0a.yml` for the Windows job (LA-10); if `react-router` is chosen, the evidence re-run required by ADR-0026.
**Exit evidence.** Route/focus tests, host-status state screenshots (en/he), CSP zero-violation test, Windows/Edge job log, forced-colors screenshots, updated CI documentation.
**Main risks.** (1) *Windows runner flakiness* → reduced matrix, retries disabled, failures investigated not skipped. (2) *Router adding storage/network paths* → library mode + lint probes + CSP test. (3) *Over-modelling the host* → port carries only the fields in OF-05; extension needs a docs PR.

## 5. Definition of ready / done for every package above
**Ready:** assigned manually; branch from current `main`; allowed/forbidden paths stated; criteria IDs listed; no open gate required (state this explicitly in the PR); independent reviewer named (not the author's agent).
**Done:** criteria met with tests, evidence bundle attached, Capability Matrix and `docs/wp-1a-1x/` updated, full gate list run with counts, "not verified" list honest, independent review posted, **human GitHub approval** recorded (agent review is not a substitute), merged by the owner.

## 6. After 1e: what to prepare while waiting for gates
Decision records for BR-01/02/03/04/08/10 (a docs-only PR each, owner-signed); the `editor-core` design note (ME-06); the TypeScript structural-validator design and shared vectors (BR-09); SP-1…SP-6 spike plans. These produce documents and test vectors only; none touches `schemas/**` or `catalog/**` until BR-01 is decided.

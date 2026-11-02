# 13 — Phase 1A implementation plan: the schema-driven Builder on synthetic data

| | |
|---|---|
| Status | Proposal for approval (decision **D-23**). Refines [02](02_PHASE1_PLAN.md): Phase 1A = the *frontend-first* half of slices S0 and S1, run against an in-memory **Synthetic Host**. Server-backed identity, persistence and import remain Phase 1B (the rest of S0/S1) and stay gated by ADR-0004/0008/0014/0016. |
| First visible milestone | **A professional, bilingual, schema-driven No-Code Application Builder, operating entirely on synthetic data, in which a non-programmer creates, edits, reviews (under separation of duties), publishes and compares versions of instrument manufacturers and models — with no instruments, no persistence, no real authentication and no production publication.** |
| Audience | Codex (implementer); product owner (approver) |

## 1. Why this order

| Constraint | Consequence |
|---|---|
| ADR-0014 (identity), ADR-0016 (metadata lifecycle), ADR-0008 (RLS), ADR-0004 (trust) are Proposed ([14](14_PHASE0B_SECURITY_REVIEW.md)); the Phase 0B verifier has three open High gates | No server-side drafts, accounts, approvals or imports may be built yet |
| The Builder's greatest risks are UX and the schema-driven approach (R-03, R-19), not persistence | Prove them first, cheaply, with real components and real schemas |
| All designers talk to injected **host ports** (06 §2) | A Synthetic Host and a real API host are interchangeable; the same acceptance tests run against both |
| AGENTS rules 3, 4, 11, 13, 14 | Synthetic mode must be impossible to mistake for a real deployment and impossible to ship to Production |

**Design principle:** *nothing in 1A is throw-away.* Schemas, `ui-kit`, `i18n`, `editor-core`, inspector, designers, Playwright scripts and visual baselines are the Phase 1B product. Only `SyntheticHost` is replaced.

## 2. Scope

### 2.1 In scope
* Frontend foundation (S0 front half): `i18n`, `ui-kit` (tokens, protected components, frame, chips, banners, inputs), contrast validator, routing, query cache, test harness (unit, Playwright, axe, visual regression, pseudo-locales).
* Schemas and fixtures for `Manufacturer` (corrected per D-11), `InstrumentFamily`, `InstrumentModel` with shared definitions; generated TS types; registry fields (07 §3, §8).
* `editor-core` and the **schema-driven inspector** with the closed hint vocabulary (07 §2).
* **Synthetic Host** implementing the host ports with *clearly labelled* synthetic personas, in-memory only.
* Builder shell: Home (SCR-01 A, synthetic), Instruments workspace (SCR-05a), validation drawer, History/Where-used, structural diff, View-as-data, Review queue, Publish wizard (synthetic versions), lease/conflict simulation, command palette, he/en + RTL, light/dark.
* Capability Matrix rows and docs for the above.

### 2.2 Explicitly out of scope (must not be built in 1A)
Real login/accounts/tokens; any database write; package import/export or verification endpoint use; signing; drivers/SCPI; metrology values; procedures/engine/simulator; stations; reports; **production publication** or any Release workflow; any real or simulated *instrument* behaviour; Hebrew content claims beyond placeholders.

## 3. Entry conditions (gate A0)

| # | Condition | Evidence |
|---|---|---|
| A0-1 | PR #1 merged by its owner **or** 1A branches cut from PR #1's head with the owner's written agreement | PR state |
| A0-2 | Review corrections **R-4** (validator subset incl. `x-calos-editor`, `$defs/$ref` local, `oneOf`, `const`, integer bounds, `uniqueItems`; pattern semantics settled) and **R-7** (lifecycle ports redesigned; no implementation) merged | [14 §6](14_PHASE0B_SECURITY_REVIEW.md) |
| A0-3 | Decisions recorded: **D-23** (this plan), **D-11** (locale handling/Manufacturer schema), **D-12** (S0 frontend dependencies), **D-13** (palette/fonts), **D-18** (media/`.calrel` naming), **D-21** (lease defaults; only simulated in 1A) | [11](11_DECISIONS_REQUIRED.md) |
| A0-4 | ADR-0015 (i18n/RTL) and ADR-0001 (boundaries) ratified (needed for `i18n`/`ui-kit` structure) | ADR status |
| A0-5 | He/en string ownership acknowledged (Q-15 may remain open: strings are marked `needs_review`) | Owner note |

## 4. Work packages

Each package is one PR (or a short series). Order is mostly sequential; WP-1A-1 and WP-1A-2 can run in parallel.

### WP-1A-0 · Schema subset, canonical vectors (backend, small)
**Deliver:** R-4 implementation in `packages/py/calos_metadata/calos_metadata/schema.py`, `tools/codegen.py` (emit unions/definitions to Python and TS), hint-vocabulary validator for `x-calos-editor`; RFC 8785 canonical-JSON **vectors** shared by Python and TS (`tests/vectors/canonical/*.yaml`); TS canonicalizer + SHA-256 digest in `packages/ts` (no new heavy dependency: Web Crypto), proven against the vectors.
**Accept:** P1A-AC-01…04.

### WP-1A-1 · Frontend foundation
**Deliver:** `packages/ts/i18n` (ICU, locale/direction, bidi helpers, `en-XA`/`he-XB` pseudo-locales), `packages/ts/ui-kit` (tokens from 03 §4, contrast validator, protected set, `FrameBadges`, `AppFrame`, chips, banners, `QuantityInput`, `IntervalInput`, `InputRequiredBadge`, `LocalizedTextField`, `DataGrid`, `TreeView`, `DiffViewer`, `JsonViewer`, `ValidationDrawer`, dialogs, `CommandPalette`), `apps/web` routing + query cache + shells, hard-coded-string lint, Storybook-class catalogue **only if D-12 approves it**; Phase 0A strings moved to i18n keys; axe + Playwright + visual harness in CI.
**Accept:** P1A-AC-05…14.

### WP-1A-2 · Kinds, schemas and fixtures
**Deliver:** `schemas/_common/*` (07 §1.1), `schemas/{manufacturer,instrument-family,instrument-model}/v1.schema.json` with `x-calos-editor` hints; `catalog/kinds.json` entries (+ `change_classes`, `availability`), `catalog/capabilities.json` (grammar only; entries user-authored, none vendor-specific); fixtures (valid-min/full, invalid corpus) incl. Hebrew strings with embedded LTR fragments; generated Python/TS types; digest vectors.
**Accept:** P1A-AC-15…18.

### WP-1A-3 · editor-core and the schema-driven inspector
**Deliver:** `packages/ts/editor-core` (document model, commands with inverses, JSON Patch, selection, clipboard, autosave queue, lease client against ports); `packages/ts/designers/inspector` (InspectorModel builder, widget registry, validation binding, permission-aware read-only/disabled-with-reason, provenance + Input-required handling, union/list/record editors, quick-fix hooks).
**Accept:** P1A-AC-19…26.

### WP-1A-4 · Synthetic Host
**Deliver:** `apps/web/src/dev/synthetic-host/` implementing `DraftPort`, `CatalogPort`, `ReferencePort`, `AuditPort`, `AuthPort`, `NotifyPort`, `ExprPort` (not needed in 1A → absent, not stubbed with fake results), with:
* seed data labelled `synthetic_demo` (a few manufacturers/families/models with `Input required` ranges — **no real instrument or value**);
* three clearly synthetic personas (Calibration Engineer, Metrology Approver, Quality Manager) selectable in a **persona switcher that exists only in the synthetic sandbox** — it is *not* a login and is visibly labelled "SYNTHETIC PERSONA";
* a separation-of-duties demonstrator (author ≠ approver; approvals bound to digest) implemented client-side **for demonstration only** and labelled "server-side enforcement arrives in Phase 1B";
* in-memory state only (reset on reload; no `localStorage`/`IndexedDB`/network);
* a **host-port conformance suite** (`packages/ts/host-conformance`) that Phase 1B's API host must also pass.
**Guardrails:** [§6](#6-guardrails-synthetic-mode-must-not-be-mistakable-or-shippable).
**Accept:** P1A-AC-27…33.

### WP-1A-5 · Builder shell and workspaces
**Deliver:** SCR-01 A (Home), Review queue (SCR-14), Instruments workspace (SCR-05a: manufacturers, families, models; tabs General/Functions & ranges/Options/Capabilities with Identification/Connections/Safety tabs present but showing "available in a later slice"), validation drawer, History + Where-used + blame panels, kind-aware diff (property list), View-as-data, publish wizard (steps 1–6 of 09 §2, pipeline stages limited to schema/ref/semantic/l10n for these kinds), lease banner with simulated takeover, conflict dialog (simulated second editor), command palette, shortcut sheet, he/en/RTL/dark.
**Accept:** P1A-AC-34…44.

### WP-1A-6 · The No-Code proof
**Deliver:** a CI test that registers a **test-only kind** (defined solely by a schema + hints in `tests/fixtures/`) and shows the inspector, list, validation, diff and publish flow work with **zero kind-specific UI code**; lint rule forbidding imports of kind-specific modules from `designers/inspector`; Capability Matrix updates (rows for each Builder operation delivered).
**Accept:** P1A-AC-45…47.

### WP-1A-7 · Quality, demo and handoff
**Deliver:** Playwright GUI-only scripts equivalent to AC-NC-01 and AC-NC-09 on the Synthetic Host (he and en); axe + visual baselines (LTR/RTL × light/dark × sm–xl for Home/Review); pseudo-locale passes; keyboard-only walkthrough record; demo script and recording; moderated **Round 0** protocol dry-run with the demo (not a pass/fail gate); defect list; update [10](10_ACCEPTANCE_TESTS.md) status table.
**Accept:** P1A-AC-48…52 and §5.

## 5. Phase 1A acceptance criteria

All must be green in CI (Linux and Windows where relevant) unless marked **[M]** manual.

| ID | Criterion | Type |
|---|---|---|
| P1A-AC-01 | Schema validator accepts the 1A schemas (`$defs/$ref`, `oneOf`, `const`, integer bounds, `uniqueItems`, `x-calos-editor`) and still **fails closed** on any other keyword, open object, unresolved/cyclic `$ref`, invalid pattern, or hint outside the closed vocabulary (negative corpus). | U |
| P1A-AC-02 | `pattern` semantics are documented and identical in Python and TS (vector suite, anchored patterns enforced at registration). | G |
| P1A-AC-03 | RFC 8785 canonical bytes and SHA-256 digests match across Python and TS for the shared vector set including Hebrew strings, escapes, key ordering and integer edge cases; floats rejected. | G |
| P1A-AC-04 | Generated Python/TS types are in sync (`codegen --check`) for all 1A schemas; hand edits fail. | U |
| P1A-AC-05 | `FrameBadges` shows `TEST` and the synthetic-sandbox banner on every route, both locales and themes; cannot be hidden by theme/config/CSS (computed-style assertions). | E |
| P1A-AC-06 | Contrast validator recomputes every token pair (light/dark) and fails below WCAG AA. | U |
| P1A-AC-07 | Protected components (`FrameBadges`, `ModeChip`, `HazardRibbon`, `LimitCheckChip`) reject style/theme overrides. | U |
| P1A-AC-08 | No hard-coded user-visible strings (lint); `en-XA` and `he-XB` show no clipped/overflowing text from `sm` to `xl`. | U, V |
| P1A-AC-09 | Measurement values, units, IDs, hashes, versions, expressions render with LTR isolation inside RTL (DOM check on tagged elements). | E |
| P1A-AC-10 | axe: zero critical/serious violations on every 1A route × {en, he} × {light, dark}. | A |
| P1A-AC-11 | Visual baselines approved for Home, Instruments list, Model editor, Review queue, Diff in LTR/RTL × light/dark. | V |
| P1A-AC-12 | Keyboard-only: skip links, region cycling, command palette, dialog focus return, grid navigation. | E, [M] |
| P1A-AC-13 | `QuantityInput` stores decimal **strings**; property test over generated decimals shows no float round-trip; dimension mismatch rejected inline. | P |
| P1A-AC-14 | `IntervalInput` has no pre-selected inclusivity; saving without both flags yields the finding. | E |
| P1A-AC-15 | Every 1A schema has valid-min, valid-full and ≥ 5 invalid fixtures, plus digest vectors, run in Python and TS. | G |
| P1A-AC-16 | `Manufacturer` accepts a single-locale display name when policy requires one locale and rejects a missing required locale only through the *validation pipeline* (policy-driven), not the schema (F-14). | U |
| P1A-AC-17 | `catalog/kinds.json` entries include permission group, approval roles, change-class pointers and availability for all 1A kinds; registry loader rejects entries without them. | U |
| P1A-AC-18 | Capability vocabulary contains no vendor/model strings (lint) and follows `<domain>.<name>`. | U |
| P1A-AC-19 | Property: for generated command sequences, `undo ∘ apply = identity`; patches round-trip; redo after undo restores state. | P |
| P1A-AC-20 | The inspector for each 1A kind is generated from schema + hints: golden `InspectorModel` tests; unknown widget → visible placeholder; unknown hint → registration failure. | G |
| P1A-AC-21 | *Input required · MI-nn* renders for `$input` markers, links to a synthetic MI entry, and is replaced by a value only with provenance `draft` or `synthetic_demo` chosen explicitly. | E |
| P1A-AC-22 | Provenance rules (07 §5) enforced client-side in the sandbox: `verified_by ≠ entered_by`; editing resets status; `approved` is not user-settable. | U, E |
| P1A-AC-23 | Findings from local and host validation merge by `(code, pointer)`; clicking a finding focuses the field. | E |
| P1A-AC-24 | Fields requiring an unavailable permission are disabled **with a reason** (not hidden) in the sandbox. | E |
| P1A-AC-25 | Union/list/record editors work for `InstrumentModel` functions, options, capabilities, aliases with reorder, duplicate, delete-with-where-used check. | E |
| P1A-AC-26 | Autosave batches carry `base_revision`; simulated stale save yields the conflict dialog with keep-mine/theirs/merge-by-field. | E |
| P1A-AC-27 | The Synthetic Host and the host-port conformance suite exist; the suite is written against the **ports**, not the host. | U |
| P1A-AC-28 | Synthetic mode shows a **non-dismissible** "SYNTHETIC SANDBOX — NO PERSISTENCE — NOT A DEPLOYMENT" banner and a "SYNTHETIC PERSONA" chip; neither can be hidden. | E |
| P1A-AC-29 | Reloading the page resets all state; a test asserts no `localStorage`/`sessionStorage`/`IndexedDB` writes and no network requests (Playwright route blocking). | E |
| P1A-AC-30 | Production-target builds (`production_rehearsal` and any `production` kind) **exclude** the Synthetic Host, personas and Builder routes (bundle analysis test); the route renders the "authoring disabled" state. | S |
| P1A-AC-31 | Author cannot approve own snapshot; approval bound to digest; stale digest rejected; second persona approves; publish creates an immutable synthetic version with a digest; editing creates a new draft (sandbox demonstration of AC-GOV-01/02/03). | E |
| P1A-AC-32 | Published synthetic versions are frozen objects: any attempted mutation path in the host throws and is covered by a test. | U |
| P1A-AC-33 | Package export/import, signing, release and "publish to Production" controls are **absent or disabled with explanation** ("Phase 1B / requires approved trust model"). | E |
| P1A-AC-34 | Home shows work queue, awaiting-my-review (with "You authored this" state) and readiness blockers from synthetic data. | E |
| P1A-AC-35 | Create manufacturer → family → model via GUI only; draft validates with only *Input required* warnings; Hebrew and English names persist through edits. | E |
| P1A-AC-36 | Validation drawer groups findings by stage with stable codes and quick fixes where defined. | E |
| P1A-AC-37 | Structural diff shows exactly the changed properties between two versions (oracle test on generated mutations). | P |
| P1A-AC-38 | History/blame shows who changed a field and when (synthetic personas). | E |
| P1A-AC-39 | Where-used shows dependents (model → family → manufacturer) and blocks deletion/withdrawal where referenced. | E |
| P1A-AC-40 | View-as-data shows canonical JSON + digest and has no edit path. | E |
| P1A-AC-41 | Publish wizard enforces version bump ≥ computed minimum from change class (raise-only) and localized release notes per policy. | E |
| P1A-AC-42 | Lease banner: second-session simulation shows read-only live view and takeover with reason. | E |
| P1A-AC-43 | Command palette searches items/versions/MI ids; shortcut sheet is localized. | E |
| P1A-AC-44 | All 1A screens render in `en` and `he` with correct mirroring, in light and dark, `md`–`xl` (Home/Review also `sm`, no horizontal scroll). | V |
| P1A-AC-45 | **No-Code proof:** a test-only kind defined by schema + hints works end to end in the Builder with no kind-specific UI code. | E |
| P1A-AC-46 | Lint/architecture: `designers/inspector` imports no kind-specific module; designers don't import `api-client`; no `any` in `editor-core`; no `dangerouslySetInnerHTML`. | S |
| P1A-AC-47 | Capability Matrix updated for every Builder operation delivered; CI manifest check passes. | U |
| P1A-AC-48 | GUI-only Playwright script equivalent to AC-NC-01 passes in `en` and `he` (RTL). | E |
| P1A-AC-49 | GUI-only script equivalent to AC-NC-09 (modify and republish; second persona approves; distinct digest; both versions exist) passes. | E |
| P1A-AC-50 | Harness fails if the browser performs any network request not initiated by static asset loading (sandbox is offline). | E |
| P1A-AC-51 | **[M]** Dry-run of usability Round 0 with ≥ 3 non-programmer participants using the demo script; findings logged (no pass/fail threshold; D-10 pending). | M |
| P1A-AC-52 | **[M]** Stakeholder demo recorded; reviewer checklist (§7) completed. | M |

## 6. Guardrails: synthetic mode must not be mistakable or shippable

1. **Build-time exclusion.** Synthetic Host lives under `apps/web/src/dev/` and is imported only from a dev entry point; eslint-boundaries forbid imports elsewhere; a CI test inspects the production bundle for the Synthetic Host and persona symbols (P1A-AC-30).
2. **Visible labelling.** Non-dismissible sandbox banner and persona chip; `FrameBadges` still shows `TEST` (never `PRODUCTION`).
3. **No persistence, no network.** Enforced by a Playwright guard (P1A-AC-29/50).
4. **No credentials.** Personas are not accounts; there is no password field anywhere in 1A.
5. **No real data.** Seed data and fixtures are `synthetic_demo`; MI ranges remain `Input required`; CI scans fixtures for numbers followed by units in `functions[].ranges`.
6. **No false security claims.** The client-side SoD demonstrator is documented as a UX demonstration; every governed action's confirmation panel says where enforcement will live.
7. **No ADR changes.** 1A relies only on Accepted ADRs (0003, 0022, 0023, 0024) plus 0001/0015 once ratified; it does not presuppose 0004/0014/0016 outcomes beyond the host-port contract.

## 7. Demo script (≈ 10 minutes) and reviewer checklist

1. Open the Builder in **English, light**: Home shows synthetic work queue and readiness blockers.
2. As **Calibration Engineer**: Instruments → Manufacturers → New "Demo Maker"; add Hebrew display name; add a family; add a model with a function whose ranges show **Input required · MI-02**; validation drawer shows only expected warnings.
3. Toggle **Hebrew/RTL** and **dark**: layout mirrors, values/IDs stay LTR, contrast holds.
4. Submit for review; try to approve as the same persona → blocked with explanation (separation of duties).
5. Switch persona to **Metrology Approver**: review diff, impact, readiness; approve on digest; publish v1.0.0 (synthetic) — digest shown; export/production controls visibly unavailable.
6. Switch back: edit → publish v1.1.0; compare versions; View-as-data; History/blame.
7. Simulate a second editor: lease banner, takeover, conflict dialog.
8. Show the **No-Code proof**: the test-only kind appearing in the Builder with no new UI code.
9. Reload: everything resets; banner says why.

**Reviewer checklist:** no real instrument or metrology value anywhere; sandbox banner always visible; Production build excludes sandbox; he/en parity; keyboard path; no network requests; synthetic personas labelled; capability matrix updated.

## 8. Hand-over to Phase 1B

Phase 1B replaces `SyntheticHost` with an API-backed host (S0 backend: accounts, RBAC, SoD, RLS, audit; S1 backend: drafts/leases/patch/validate/approve/publish/versions/diff/impact, signed `.calapp` export/import via `calos_trust`). Entry: ADR-0004/0008/0014/0016 ratified; review gates R-10…R-12 for any use of the verifier. Exit: the same host-port conformance suite and the same Playwright scripts pass unmodified against the real host (adding server-side negative tests from [10](10_ACCEPTANCE_TESTS.md)).

## 9. Risks specific to 1A

| Risk | Mitigation |
|---|---|
| Sandbox mistaken for a real system or demo data mistaken for metrology | Guardrails §6; reviewer checklist; MI ranges remain `Input required` |
| Client-side SoD gives false assurance | Labelling; no security claim; server enforcement acceptance tests in 1B |
| Inspector cannot express a field and teams hand-code a form | Hint additions only via reviewed change; WP-1A-6 test and lint |
| Host ports designed for the demo diverge from the real API | Ports derived from `API_CONTRACT` + 08; conformance suite shared with 1B |
| Dependency sprawl in the frontend | D-12 approval list; ADR-0022 addendum per addition |
| Hebrew strings unreviewed | `needs_review` flags; no claim of reviewed terminology |

## 10. Prompt for Codex (use after gate A0 is green)

> Implement **Phase 1A** exactly as specified in `docs/phase1/13_PHASE1A_PLAN.md`, one work package per PR (WP-1A-0 … WP-1A-7), under all rules in `docs/phase1/12_CODEX_IMPLEMENTATION_PROMPT.md §3` and `AGENTS.md`. Do not implement anything listed in §2.2. Before each package: re-read the package section, the cited screens (04A SCR-01/05a/14), components (06), schemas (07) and the P1A-AC rows; verify gate A0 and the recorded decisions; write failing negative tests first. Stop and ask (12 §6) on any metrological value, role/permission change, new dependency, ADR gap, weakened contract, or any request to persist, authenticate, sign, import, export or publish. Report in the format of 12 §8, listing P1A-AC rows with test names and CI run links, and state explicitly what is not verified. Never present the Synthetic Host as a deployment or its personas as accounts.

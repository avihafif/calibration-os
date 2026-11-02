# 03 — ADR-0001 and ADR-0015: review and Accept/Revise recommendations

> **Update 2026-11-02 (later):** the architecture, dependency, MPL-2.0 and ADR items in this document were recorded **by delegation** in [13](13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md) (ADR-0001 with A1–A4 only; A5 not accepted). That is not independent review. Nothing else in this document changed.

Status: **recommendations for the authorized architecture owner.** Both ADRs are *Proposed*; this document does not accept, edit or supersede either. Proposed amendment text is given so the owner can adopt it verbatim into the ADR (a Proposed ADR may be edited; an Accepted one may only be superseded). Decision forms: [02](02_GATE_A0_APPROVAL_FORMS.md) `GA0-09`, `GA0-10`.

## 1. ADR-0001 — Modular monorepo with enforced boundaries

**Recommendation: ACCEPT WITH AMENDMENTS (A1–A5).** The core decision (one monorepo; `uv` + `pnpm` workspaces; machine-enforced boundaries; `schemas/` as source of truth; apps never import apps) is sound and already implemented for Python (import-linter) and, minimally, for TypeScript.

### Conflicts between the existing architecture and the design handoff
| # | Existing source | Handoff / current state | Conflict |
|---|---|---|---|
| C-1 | ARCHITECTURE §6.1: "TS packages `ui-runtime`, `editor-core`, `designers` do not import `api-client`" is the **only** TS rule; `eslint.config.mjs` defines two elements (`web`, `domain-types`) and `tools/check_ts_boundary.mjs` probes two cases | The handoff creates `ui-kit`, `i18n`, `editor-core`, `designers/*` | The packages the ADR says must be machine-enforced have **no rules**; WP-1A-1 would define them ad hoc |
| C-2 | ARCHITECTURE §6: the schema-driven inspector belongs to `editor-core` ("Document model, commands, patch, undo/redo, schema-driven inspector") | `docs/phase1a/07 §2.3(5)` and `docs/integration/01 §3`: inspector in `packages/ts/designers/inspector` | Two homes for the same component. A React inspector inside a framework-neutral `editor-core` would force `editor-core → ui-kit` |
| C-3 | ARCHITECTURE §6 lists **one** `designers/` package ("procedure-canvas, driver, metrology, ui-layout, report-page, i18n workspaces") | Handoff uses sub-packages `designers/inspector`, `procedure`, `driver`, `metrology`, `safety`, `sim-lab` | Granularity undefined (one package with folders vs several workspace packages) |
| C-4 | ARCHITECTURE §6 repository layout | `design/` (two prototypes, tools) and `.github/workflows/design-prototype.yml` exist on `main` | Layout does not mention non-shipping prototype code or a second workflow; rule "prototype code is never imported by production packages" is not stated |
| C-5 | ADR-0001 consequence: CI cost needs affected-only builds; revisit trigger "CI time > agreed budget" | WP-1A-1 adds Playwright (browser download) and visual baselines | No budget is defined; trigger cannot fire |
| C-6 | ADR-0001: `schemas/` is the single source and generates types; "new kinds need registry entry + schema + … + enumerating test" | `tools/codegen.py` has a fixed `SCHEMAS` tuple (PR #6) | Generation is not registry-driven (adding a kind means editing a tool) |
| C-7 | ADR template: `Status · Date · Deciders` | ADR-0001 has no date | Minor format gap |

### Proposed amendments (adopt verbatim or revise)
* **A1 — TypeScript dependency table (resolves C-1).** Add to ADR-0001 / ARCHITECTURE §6.1:
  `i18n` → *(leaf: no repo imports)*; `domain-types` → *(leaf)*; `expr-presentation` → `domain-types`; `ui-kit` → `i18n`; `editor-core` → `domain-types`, `expr-presentation` (**no React, no `ui-kit`**); `designers/*` → `editor-core`, `ui-kit`, `i18n`, `domain-types`, `expr-presentation`; `ui-runtime` → `ui-kit`, `i18n`, `domain-types`, `expr-presentation`; `apps/web` → any package; **no package imports `apps/web`; no package other than `apps/web` (and the generated client's own tests) imports `api-client`.** Enforce with `eslint-plugin-boundaries` elements for every package and add one negative probe per forbidden edge to `tools/check_ts_boundary.mjs` (existing pattern).
* **A2 — Inspector placement (resolves C-2).** The schema-driven inspector **model** (`InspectorModel` builder, hint interpretation, validation binding — framework-neutral) lives in `editor-core`; the **React widgets and form rendering** live in `designers/inspector` (or `ui-kit` for primitives). Update `docs/phase1a/07 §2.3(5)` and `docs/integration/01 §3` accordingly.
* **A3 — Designers granularity (resolves C-3).** State whether `designers/` is one package with internal folders (recommended for WP-1A-1: fewer manifests, same boundary enforcement via path patterns) or several workspace packages; sub-packages may be introduced when a second consumer exists.
* **A4 — Non-shipping design assets (resolves C-4).** Add to §6 layout: `design/` holds non-shipping prototypes and design-only tools; **nothing under `design/` may be imported by production packages**; the design workflow (`.github/workflows/design-prototype.yml`) is separate from application CI and its checks are not product tests.
* **A5 — CI budget and codegen (resolves C-5, C-6).** Define the CI time budget that makes the revisit trigger testable (owner supplies the number); require `tools/codegen.py` to enumerate `catalog/kinds.json` instead of a fixed list when the first Phase 1A kind lands (WP-1A-2).

### If ADR-0001 is revised instead
The owner may choose a different package split; in that case `docs/phase1a/07`, `docs/integration/01` and `docs/procedure-designer/03` must be updated together, and WP-1A-1 should not start until they are.

## 2. ADR-0015 — Internationalization and RTL

**Recommendation: ACCEPT WITH AMENDMENTS (B1–B6).** The decisions (ICU MessageFormat, `en`/`he`, logical CSS properties, LTR isolation of measurements/identifiers, Western digits, ISO-8601 storage, CLDR plurals) match both prototypes and the proposed dependency (`react-intl` 12.1.5, BSD-3-Clause).

### Conflicts and gaps against the design handoff
| # | ADR-0015 | Handoff / current state | Gap |
|---|---|---|---|
| G-1 | "Translation bundles are **configuration items** (`TranslationBundle`) so engineers can maintain them in the GUI; platform strings ship as system bundles" | Phase 1A scope (D-29 tiers) has no `TranslationBundle` kind; WP-1A-1 ships i18n as code | Scope of 1A is unstated: build-time system bundles only, or a runtime loader for config-item bundles |
| G-2 | No pseudo-locales, no string lint | phase1/13 P1A-AC-08 requires `en-XA`/`he-XB` and no hard-coded user-visible strings | Requirements live only in the plan, not in the architecture decision |
| G-3 | No message-key naming convention | PR #6 emits `schema.schema_*`; Phase 1A uses `f.<CODE>`; Designer uses `pd.*` | Three conventions; findings from the engine must render without per-kind mapping |
| G-4 | "Reports render fonts embedded with Hebrew coverage" | Evidence ([04 §3](04_DEPENDENCY_AND_FONT_EVIDENCE.md)): Heebo covers Hebrew but lacks `Ω ≤ ≥ →`; Inter lacks Hebrew; none has `✔ ✖ ⚠` | A single font cannot render Hebrew text with SI units; a fallback order and an icon set are needed |
| G-5 | "Hebrew glossary is a reviewed `Glossary` item (MI-31)" | Proposed glossary (`UI_UX_SPEC §5.1`) is unreviewed; prototypes follow it (e.g. simulation = הדמיה) | Status mismatch: strings are draft, not reviewed |
| G-6 | Bidi: `<bdi>`/`dir="ltr"` islands; CSS logical properties | Prototypes enforce islands via `ltr()` and a logical-property check | The checks (logical-CSS lint, bidi isolation components, `lang`+`dir` on localized inputs) are not in the ADR |
| G-7 | Pluralization via CLDR rules | Prototype strings use `{n}` placeholders without plural forms | Counts must use ICU `plural` so Hebrew categories work |
| G-8 | ADR header lacks Date/Deciders | Template requires them | Format |

### Proposed amendments
* **B1 (G-1):** "In Phase 1A, platform strings are **system bundles compiled into the web app**; `TranslationBundle` configuration items and any runtime bundle loader are out of scope until the kind is approved (not in D-29 tiers). The i18n package exposes a bundle-provider port so config-item bundles can be added later without API change."
* **B2 (G-2):** "The i18n package provides pseudo-locales `en-XA` (accented, +40 % length) and `he-XB` (RTL expansion) for tests, and CI fails on hard-coded user-visible strings (in-house ESLint rule)."
* **B3 (G-3):** "Message keys are namespaced `<area>.<id>`; engine and validation findings use `finding.<CODE>[.<detail>]` with the code and parameters supplied by the finding; no per-kind key mapping in UI code." (Owner to confirm against `GA0-16`.)
* **B4 (G-4):** "UI and report font stacks must provide Latin (with Greek/µ/Ω/≤/≥), Hebrew, and monospace coverage; status icons are SVG components, not font glyphs. Font files are self-hosted (CSP `font-src 'self'`) and each ships with its licence text."
* **B5 (G-5, G-7):** "Hebrew terminology follows the glossary once reviewed; until MI-31 is closed all Hebrew is marked `needs_review`. Counts use ICU `plural`."
* **B6 (G-6, G-8):** "CSS uses logical properties only (lint-enforced); localized fields carry `lang` and `dir`; measurement values, units, identifiers, hashes and expressions render in `bdi`/LTR islands. Add Status · Date · Deciders to the ADR."

### If ADR-0015 is revised instead
If `TranslationBundle` must exist in 1A, add a kind scope entry to D-29, a loader port, and CSP/storage analysis to the plan before WP-1A-1.

## 3. Non-silent-change statement
No ADR text, architecture document or Codex file was edited by this review. Differences between the design handoff and the architecture are listed above for the owner to resolve; the handoff documents already flag the inspector placement as an "amendment when the owner approves" (`docs/phase1a/07 §2.3`).

# 03 — No-Code Builder readiness and the H-2/GA0-16 proposal

Status: **recommendations only. Nothing here is approved, and no gate is changed.** Decision ids `D-nn` refer to `docs/phase1/11_DECISIONS_REQUIRED.md`; `GA0-nn` to `docs/gate-a0/02`. The Builder is not implemented and must not be until the rows marked **blocks** are closed by a named decider.

## 1. Where the Builder stands
* `NO_CODE_ARCHITECTURE`, `VISUAL_APPLICATION_BUILDER_SPEC`, `phase1a/*` and two prototypes describe the target. On `main` the only metadata kind is `Manufacturer`; the R-4 engine accepts a *provisional* editor-hint subset that was explicitly **not** declared the Builder contract.
* Product-owner decisions approve a narrow Phase 1A: Test-only in-memory Synthetic Host (D-23), memory-only drafts (D-27), synthetic review/approve/publish demonstration (D-28), Tier 1 kinds `Manufacturer`/`InstrumentFamily`/`InstrumentModel` (D-29), prototypes as visual reference only (D-32).
* Full Gate A0 is **closed**. WP-1A-1 ran under the scoped Path B record. WP-1A-2/3 are *not* covered by that record.

## 2. What blocks WP-1A-2 (kinds, fixtures, codegen) and WP-1A-3 (editor-core, inspector)

| ID | Open item | Needed by | State today | Decider (per repository records) | Blocks |
|---|---|---|---|---|---|
| BR-01 | **H-2 / GA0-16**: one closed, versioned `x-calos-editor` vocabulary (widgets, hints, label form, versioning, unknown-id behaviour) | WP-1A-2 (registration), 1A-3 | Open; proposal in §4 | Architecture owner + Builder design owner | **1A-2, 1A-3** |
| BR-02 | Finding message-key namespace (`schema.<code>` in R-4, `f.<CODE>` in design, `finding.<CODE>` in accepted ADR-0015 B3 pending GA0-16) | 1A-2 | Open; part of BR-01 | Architecture | **1A-2** |
| BR-03 | D-11 — remove the hard-coded `en`+`he` requirement from `Manufacturer`; v1 correction vs v2 + migrator; legal-name vs display-name | 1A-2 | Open | Architecture | **1A-2** |
| BR-04 | D-18 — `media` vs `assets`; Release Package extension | 1A-2 (names enter schemas) | Open | Architecture | 1A-2 |
| BR-05 | D-21 — lease/heartbeat/offline-buffer defaults | 1A-4 (Synthetic Host) | Open | Architecture | 1A-4 (not 2/3) |
| BR-06 | D-25 — `environment_kind` vocabulary (`production_rehearsal` is already in code and Compose; ADR-0024 says `{test, production}`) | before any new signed schema embeds it | Open | Architecture + security | **1A-2** if a kind embeds it; otherwise 1B |
| BR-07 | R-6 package split and R-8 permission/error alignment | dependent backend work | Open | Architecture | 1B |
| BR-08 | `InstrumentFamily`/`InstrumentModel` field contract; every unknown metrological value is a `$input` marker (MI-nn); no invented specifications | 1A-2 | Open (review of field list not recorded) | Architecture + metrology (MI register) | **1A-2** |
| BR-09 | TypeScript structural validator for the supported schema subset + shared Python/TS conformance vectors (P1A-AC-01…04 not fully met) | 1A-3 (client validation) | Not started | Engineering | **1A-3** |
| BR-10 | ADR-0001 **A5** (CI time budget; registry-driven codegen) — not accepted; `tools/codegen.py` still enumerates a fixed list | 1A-2 (first new kind) | Open; needs a budget number only the owner can supply | Architecture | 1A-2 |
| BR-11 | ADR-0020 (metadata UI rendering) is Proposed; ADR-0010 (decimals), ADR-0013 (simulation marking), ADR-0017 (expressions) are Proposed although `AGENTS.md` treats their rules as binding | 1A-3 | Proposed | Architecture | 1A-3 (scope it explicitly or ratify) |
| BR-12 | Governance capacity: full Gate A0 closed; GA0-06b fonts not granted (system fonts only); MI-31/Q-15 Hebrew terminology review and named role holders (MI-34) open; **one person holds the architecture, security and legal designations**, so no independent human review exists for decisions recorded by delegation | all | Open | Product owner | Not a technical blocker; a **risk** to the validity of any Builder approval |

**Not blockers for WP-1A-1c/d/e** (they build generic UI only): BR-01…BR-12 all fall outside the allowed paths of those packages ([05](05_NEXT_THREE_WORK_PACKAGES.md)). Starting the Builder early would only produce rework.

### Entry conditions (proposed)
* **WP-1A-2 starts when:** BR-01, BR-02, BR-03, BR-04, BR-06 (if applicable), BR-08, BR-10 have a recorded outcome; the prerequisite audit commands (codegen drift, R-4 tests) are green on current `main`.
* **WP-1A-3 starts when:** WP-1A-2 is merged, BR-09 is delivered (or WP-1A-3 explicitly includes it as its first PR), BR-11 is scoped, and the `editor-core` design note (ME-06) is reviewed.
* **WP-1A-4 (Synthetic Host)** additionally needs BR-05.

## 3. Technical requirements before WP-1A-2 and WP-1A-3 (beyond decisions)
1. **Single source for hints**: one machine-readable vocabulary in `catalog/`, from which Python registration checks, TypeScript hint types and the normative document are generated; the two existing lists (R-4 `_HINT_KEYS`/`_WIDGET_TYPES` and `phase1a/03 §3`) are removed as duplicates.
2. **Widget ↔ schema-type compatibility** table (already partly in `schema.py`) is part of the vocabulary file and is tested both ways.
3. **Golden `InspectorModel` tests** per kind and a **widget-registry exhaustiveness** test (every widget id in any registered schema is implemented; no implementation without a registered id).
4. **Registration negative corpus**: unknown hint, unknown widget, wrong type, malformed condition, unsupported vocabulary version, hint carrying an expression or HTML.
5. **Decimal pipeline end to end**: decimal strings in schema, fixtures, codegen, editor commands and display; property test `no float round-trip`; `{"$input":"MI-nn"}` marker handling.
6. **Finding contract parity**: same fields and keys in `calos_metadata.findings` and TypeScript; vectors shared in `tests/`.
7. **`editor-core` boundary**: framework-neutral (no React, no `ui-kit`); host ports only; command stack, patch, undo, structural diff; changes written only through commands.
8. **"New kind with no UI code" proof** (P1A-AC-45/46) designed before the first kind is added so adding `InstrumentModel` proves the architecture rather than special-casing it.
9. **Capability Matrix** rows for every new control shape and kind (adding either is DEV).
10. **Safety fencing**: no kind in Tier 1 carries AHL/Safety Profile fields; any such field is out of scope until ADR-0023 workflows exist.

## 4. Recommended resolution of H-2 / GA0-16 — **proposal, not approved**

The decision record must name the governing document, decider and date (`docs/PHASE1A_EDITOR_HINT_DECISION.md`). The proposal below is designed so the first slice (Tier 1 kinds, Test-only) can proceed while the riskiest parts stay deferred.

| # | Question | Recommended outcome | Rationale |
|---|---|---|---|
| 1 | Where is the vocabulary? | `catalog/editor-hints.v1.json` is the **only** list (schema-validated, versioned: `vocabulary_version: 1`); documents and generated types derive from it | Removes the two divergent lists |
| 2 | Label form | **Plain message-key string** for `label`/`help`/`placeholder`/`pattern_help`/`add_label`; migrate the R-4 `{"$t": key}` form with one migrator step and reject literal text | A wrapper adds nothing and "never literal text" is enforced by key lookup |
| 3 | Widgets in v1 (**core**) | `text`, `localized`, `enum`, `enum-multi`, `bool`, `record`, `string-list`, `record-list`, `reference`, `reference-list` | Enough for `Manufacturer`/`InstrumentFamily` and the non-numeric parts of `InstrumentModel`; no metrology semantics |
| 4 | Widgets in v1 (**metrology**, separate flag) | `decimal-string`, `quantity-or-input`, `interval-or-input` — admitted only together with BR-08 (field contract) and with decimal-pipeline tests; `interval-or-input` carries **no default inclusivity** | Keeps numeric/quantity widgets from being approved by accident with the core set |
| 5 | Widgets/hints **deferred** (v1.1+) | `derived`/`derive`/`show_fields`, `visible_when`, `readonly_when`, `permission`, `quick_fixes`, `explain`, `wizard_step`/`initial` | Unexercised by the prototype; conditions would need the typed expression subset (ADR-0017, Proposed); permissions must not be a hidden UI rule; derivations need registered trusted functions (ADR-0020, Proposed) |
| 6 | Hint keys in v1 | `version`, `widget`, `label`, `help`, `placeholder`, `group`, `order`, `title`, `mono`, `pattern_help`, `multiline`, `localized_required`, `unique_by`, `item_title`, `add_label`, `ref_kind`, `optional`, `filter_by`, `enum_prefix`, `disabled_options`, `vocabulary`, `unit_dimension_from`, `default_input`, `no_default`, `input_marker`, `provenance` | The set the prototype exercised; each needs fixture + golden test + localized strings + a11y note (registration rule of phase1a/03 §3) |
| 7 | Unknown ids | **Registration fails** for unknown hint/widget/vocabulary version; at render time an encountered unknown id shows a visible localized error placeholder and a registry finding — never silently skipped | Fail closed (NO_CODE B-1…B-7) |
| 8 | Finding keys | `finding.<CODE>[.<detail>]` (matches accepted ADR-0015 B3 text); the finding carries `code`, `severity`, JSON pointer, `stage`, `message.{key,params}`; UI has **no per-kind mapping**; R-4's `schema.*` is mapped once in `calos_metadata.findings` (compat shim removed at the next vocabulary version) | One convention for Python and TS; no namespace assumption in `FindingsList` |
| 9 | Versioning/migration | `x-calos-editor.version` (integer) per schema node; vocabulary additions are additive minor changes; removal/rename is a breaking change with a migrator and a fixture kept forever | Matches existing schema policy |
| 10 | Governance of additions | New hint/widget = reviewed catalog change (schema fragment + fixture + golden test + strings + a11y note + Capability Matrix row) | Prevents drift into per-kind UI |

**Residual risks if adopted:** the metrology flag may still need revision once the `InstrumentModel` field contract (BR-08) is reviewed; the label-form migration touches R-4 fixtures; condition/derivation deferral may force a v1.1 before Tier 2 kinds. **What adopting it would not do:** it approves no metrological value, opens no persistence, and does not ratify ADR-0020.

## 5. Decision proposals raised by this review (not approvals)

| ID | Proposal | Needed before | Decider |
|---|---|---|---|
| LA-DP-01 | **Station delivery model** — keep ADR-0011 (local web app opened in Edge/Chrome app-mode by an MSI-installed agent) as the baseline for the "Windows desktop application"; evaluate a thin WebView2 host only if kiosk lock-down or protocol-handler needs prove it necessary, and then by ADR (Electron/Tauri remain outside the baseline) | station UI work; MSI design | Architecture owner |
| LA-DP-02 | **Re-baseline WP-1A-1 remainder** as 1c forms / 1d read-only data views + findings list / 1e routing, host-status contract, Windows CI ([05](05_NEXT_THREE_WORK_PACKAGES.md)); supersede the splits in gate-a0/10 and the autonomy queue | starting 1c | Product owner + architecture |
| LA-DP-03 | **H-2/GA0-16** as in §4 | WP-1A-2 | Architecture + Builder design owner |
| LA-DP-04 | **Ratify or scope ADR-0010, ADR-0013, ADR-0017/0020** that `AGENTS.md` already relies on (decimal quantities, simulation marking, expressions, metadata UI), or record that Phase 1A implements only the stated subsets | WP-1A-3 | Architecture |
| LA-DP-05 | **Independent review capacity**: name a reviewer distinct from the author/delegate for decisions that matter operationally (safety, trust, release) before Phase 1B; agent reviews do not count as human approval | Phase 1B | Product owner |
| LA-DP-06 | **Station spikes before any operational station code** (SP-1…SP-6 in [04](04_OFFLINE_STATION_ARCHITECTURE_REVIEW.md) §3) as documentation-and-prototype work in a branch that never enables real instruments | Phase 1B/4 | Architecture |

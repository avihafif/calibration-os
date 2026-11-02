# 07 — Metadata schemas, kinds, catalog and editor hints for Phase 1

| | |
|---|---|
| Status | Proposal. Normative schema files will live in `schemas/<kind>/vN.schema.json` (AGENTS §4); this document specifies *what they must contain* and proposes bodies for kinds the specification leaves undefined (F-09). |
| Rule | **No metrological values appear anywhere in this document.** Required values are `{"$input":"MI-nn"}` markers. Proposed bodies are *structure*; each needs the kind owner's review, and metrological kinds need the metrology reviewer. Every schema uses `additionalProperties:false` (B-1). |
| Process | Per AGENTS §4: schema → registry entry (approval policy, change classes, editor hints) → semantic validators (stable codes) → fixture corpus kept forever → editor binding → docs/Capability Matrix. |

## 1. Kind inventory by slice

Status legend: **S** = body specified in `PROCEDURE_SCHEMA` · **P** = proposed here (§4) · **I** = implemented in repo · **D2** = deferred to Phase 2 (viewer or none in P1).

| Kind | Body | Slice | Designer | Notes |
|---|---|---|---|---|
| `Manufacturer` | I (needs F-14 fix) | S1 | Instrument editor | Display name vs legal name; locale policy |
| `InstrumentFamily` | P | S1 | Instrument editor | Shared capabilities, library refs |
| `InstrumentModel` | S (D.1) | S1 (identification live test S3) | Instrument editor | |
| `DriverDefinition` | S (D.2) | S3 | Driver Designer | |
| `CommandLibrary` | P (subset of D.2) | S3 | Driver Designer | IEEE 488.2 common set shipped as platform content |
| `SimulationProfile` | S (D.4) | S3 | Driver Designer (Sim tab) | Values `synthetic_demo` |
| `SafetyProfile` | S (D.3) | S3 | Safety Console | Separate permission chain |
| `StandardRole` | S (D.5) | S5 | Equipment & Stations | |
| `StationRequirement` | P | S5 | Equipment & Stations | |
| `SpecTable` | S (E.1) | S2 | Metrology | |
| `LimitsPolicy` | P | S2 | Metrology | Explicit inclusivity, no default |
| `Calculation` | S (E.4) | S2 | Expression editor | Test vectors required |
| `UncertaintyBudget`, `DecisionRule`, `CorrectionSet`, `TURPolicy`, `CMCTable`, `UnitDefinition`, `RoundingRule` | S (METROLOGY §11A, E.2–E.3) | S2 (schema + **viewer** only) | Viewers | Editors D2 |
| `Procedure`, `SubProcedure` | S (Part C) | S4 | Procedure Designer | |
| `ApplicationTest` | P | S4 | Simulation Lab | Required to publish |
| `UiForm` | S (F.1) | S6 | Screen Designer | |
| `UiPage` (operator screen overlay) | P | S6 | Screen Designer | Generated default + overlay |
| `UiNavigation` | P (minimal) | S6 | Screen Designer | Menus editor D2 |
| `UiTheme` | P | S0 (shipped, read-only) / D2 editor | Token viewer | Non-themeable tokens excluded |
| `UiDashboard` | — | D2 | — | |
| `ReportTemplate` | S (F.2) | S6 | Report Designer | |
| `ReportDatasetContract` | P (F.3 detail) | S6 | Dataset explorer | `calibration-result@1` platform-defined |
| `TranslationBundle` | P | S1 (key table) / S6 | Localization | |
| `Glossary` | D2 | D2 | — | MI-31 |
| `Policy` | P (P1 subset) | S0/S7 | Admin → Policies | Production via Change Requests |
| `WorkflowDefinition` | — | D2 | — | |
| `ApplicationManifest` | S (Part G) | S7 (composition UI from S1) | Application workspace | |

Not kinds: `HardwareLimitsPack` (own signed channel), `Release`, `ChangeRequest`, `ReleaseManifest` (governance records; see [09](09_PACKAGING_AND_PUBLISHING.md)).

### 1.1 Common definitions (`schemas/_common/`)

| Definition | Shape | Notes |
|---|---|---|
| `LocalizedString` | `object` keyed by BCP-47 tag (`minProperties:1`, pattern-constrained keys, string `minLength:1`) **or** `{"$t":"i18n.key"}` | Locale completeness is *policy*, not schema (F-14) |
| `Quantity` | `{"value": <decimal string>, "unit": <symbol>}`; value pattern `^-?\d+(\.\d+)?([eE][+-]?\d+)?$` | Never JSON numbers (AGENTS rule 8) |
| `InputMarker` | `{"$input": "MI-nn" \| "Q-nn", "note"?: LocalizedString}` | `Q-nn` allowed for policy inputs (§4.7) — clarification to PROCEDURE_SCHEMA Part A |
| `Ref` | `{"$ref": {"kind","key","range"\|"version"[,"digest"]}}` | Floating in drafts, pinned at publish |
| `Provenance` | `{status, source?, entered_by, verified_by?}` (§5) | `entered_by`/`verified_by` are user IDs |
| `Interval` | `{lower: Quantity, upper: Quantity, lower_inclusive: bool, upper_inclusive: bool}` | Inclusivity **required, no default** (PR-015) |
| `Identifier` / `Key` | `[a-z][a-z0-9_]{0,47}` / `[a-z0-9][a-z0-9-]{1,62}` | |
| `Digest` | `sha256:<64 hex>` | |

## 2. Editor hint vocabulary (`x-calos-editor`)

A **closed, versioned** set of annotations on JSON Schema nodes that drives the inspector (06 §4). Adding a hint is a reviewed change with a fixture and an inspector implementation (R-19). Unknown hints are a schema-lint error; unknown *widgets* render a visible placeholder.

| Hint | Type | Meaning |
|---|---|---|
| `group` | string | Inspector section id |
| `order` | integer | Order within section |
| `label` / `help` / `placeholder` | `{"$t": key}` | Localized text keys (never literal strings) |
| `widget` | enum | One of: `text`, `localized`, `integer`, `decimal-string`, `quantity`, `interval`, `enum`, `bool`, `reference`, `expression`, `provenance`, `list`, `record`, `table`, `union`, `hazard`, `media`, `code-readonly` |
| `unit_dimension` | string | Restricts the unit selector for `quantity` fields |
| `ref_kind` / `ref_filter` | string / object | Allowed referenced kinds and filters (e.g., only published, only `simulated:false`) |
| `visible_when` / `readonly_when` | presentation expression | Over sibling/ancestor fields only (no metrological functions) |
| `no_default` | bool | Control must start unselected (inclusivity, hazard class on new command) |
| `input_marker` | `{allowed: bool, registry: "MI"\|"Q"}` | Field may hold an `InputMarker` and shows the *Input required* badge |
| `provenance` | `required\|optional\|none` | Whether the field carries a provenance chip |
| `table` | `{row_key, columns[], paste: bool, csv_import: bool}` | Grid configuration |
| `permission` | string | Extra permission to edit this field (e.g., `driver.author.hazardous`) |
| `derived` | bool | Computed by the platform; displayed read-only |
| `quick_fixes` | array of ids | Quick-fix actions the validator may attach to findings on this node |
| `explain` | `{"$t": key}` | "Why is this required?" help id |

### 2.1 Findings contract (shared)
`Finding{ code, severity (error|warning|info), pointer (JSON Pointer), message ({$t, params}), fix?: {id, params}, stage }` — identical for local and server validators; localised by key.

### 2.2 Catalog entries for Phase 1 (`catalog/`)
`type_id@major.minor` with schema, semantics, `required_capabilities`, `editor_metadata{icon, palette_group, hints}`, implementation ref, conformance vectors.

| Category | `type_id` (v1.0) | Availability in P1 |
|---|---|---|
| Flow | `flow.sequence`, `flow.if`, `flow.foreach`, `flow.repeat_until`, `flow.delay`, `flow.wait_until`, `flow.try`, `flow.call`, `flow.checkpoint`, `flow.fail`, `flow.abort` | available |
| Flow | `flow.switch`, `flow.while` | **deferred** (shown under "Not yet available") |
| Compute | `compute.set`, `compute.calc` | available |
| Instrument | `driver.call`, `source.apply`, `source.off`, `measure.acquire` | available |
| Operator | `operator.instruct`, `operator.confirm`, `operator.input`, `operator.choice` | available; `operator.capture` deferred |
| Metrology | `evaluate.limits`, `evaluate.decision` (offered only when prerequisites exist), `record.result`, `record.condition` | available |
| Phases | `phase.begin` (implicit via `phases`), `adjust.apply`, `repair.record` | model supported; **authoring UI disabled for real instruments** (DESIGNER §18) |
| Parser types | `number_with_unit`, `enum_map`, `delimited_numbers`, `regex_groups`, `string_trim` | available; `ieee_block`, `register_bits`, `scpi_bool` schema-only (UI D2) |
| Transport kinds | `simulator` (active), `visa` (stub, not selectable in P1 stations) | |
| Widgets | `field.*` (text, quantity, enum, bool, integer), `reading_display`, `table`, `instruction_panel`, `prompt_dialog`, `progress`, `stat_tile` | available; `chart` D2 |
| Actions | `navigate`, `start_run`, `submit`, `respond_prompt`, `open_report` | available |
| Report blocks | `heading`, `text`, `kv_grid`, `table`, `section`, `signature` (placeholder), `header`, `footer`, `page_break` | available; `chart`, `image`, `repeater` D2 |
| Expression functions | Exact set (`abs,min,max,sum,count,round_to,floor,ceil,pow,convert,value_in,deviation,rel_deviation,within,present,or_else,len,any,all,lookup`) + `pending_review` set (`interp_linear,mean,stdev_sample,sqrt,t_factor`) | `pending_review` allowed in simulation only |

### 2.3 Capability vocabulary grammar
`capabilities` on an `InstrumentModel` gate step/op availability. Vocabulary lives in `catalog/capabilities.json`; each entry `{id, title, unlocks[], requires_dimension?}`. Grammar: `<domain>.<name>` in lower snake case; domains `measure`, `source`, `scpi`, `io`, `adjust`. Names are **function/ability based, never model- or vendor-based** (B-3). Examples already in the spec: `measure.dc_voltage`, `scpi.error_queue`, `adjust.supported`. Additions are catalog PRs reviewed by the metrologist; the set is not invented here beyond the grammar.

## 3. Kind, permission and approval mapping (proposal)

Addresses F-10 and extends `catalog/kinds.json` (which today lists only `Manufacturer`). Defaults follow GOVERNANCE §2/§4 ("strictest wins") pending MI-30. **All entries need owner confirmation (D-07).**

| Kind | Draft permission | Approval | Default change-class triggers | Special rules |
|---|---|---|---|---|
| `Manufacturer`, `InstrumentFamily` | `config.draft.instrument` | `config.approve.instrument` | editorial: names/aliases; functional: capability sets | |
| `InstrumentModel` | `config.draft.instrument` | `config.approve.instrument` (+ `metrology.approve` if `functions[].ranges` change) | metrological: ranges/functions | Safety Profile ref is a *reference*; model edit cannot edit it |
| `DriverDefinition`, `CommandLibrary` | `config.draft.driver` (+ `driver.author` H0/H1; `driver.author.hazardous` H2/H3) | `config.approve.driver`; **Safety Officer** for any H2+ command | functional: H0/H1 added; safety/hazardous: any H2+ | H4 not authorable in Class A |
| `SimulationProfile` | `config.draft.driver` | `config.approve.driver` | functional | `simulated` always; barred from production-targeted packages |
| `SafetyProfile` | `safety.manage` (**not** a `config.draft.*` group) | `safety.approve` (+ `safety.approve.compliance` when classified) | safety/hazardous | Author ≠ approver ≠ contributors |
| `StandardRole`, `StationRequirement` | `config.draft.instrument` | `config.approve.instrument` | metrological if capability/uncertainty fields change | |
| `Procedure`, `SubProcedure` | `config.draft.procedure` | `config.approve.procedure` (+ `metrology.approve` for metrological nodes; Safety Officer for H2+/adjust) | derived from structural diff | |
| `Calculation`, `SpecTable`, `LimitsPolicy`, `CorrectionSet`, `UncertaintyBudget`, `TURPolicy`, `DecisionRule`, `CMCTable`, `UnitDefinition`, `RoundingRule` | `config.draft.metrology` | `metrology.approve` (≠ author) + independent review | metrological | Test vectors required (MR-CFG-09) |
| `UiForm`, `UiPage`, `UiNavigation`, `UiTheme` | `config.draft.ui` | **`config.approve.ui` — no default holder in GOVERNANCE §2.2 (F-32)**; proposal: Metrology Approver | editorial/functional | Theme excludes non-themeable tokens |
| `ReportTemplate`, `ReportDatasetContract` | `config.draft.report` | `config.approve.report` (Quality Manager) | functional/metrological (bindings to results) | Watermark/legend cannot be defined |
| `TranslationBundle`, `Glossary` | `config.draft.i18n` | `config.approve.i18n` (Quality Manager) | editorial | Review flag per Q-15 |
| `Policy`, `WorkflowDefinition` | `config.draft.policy` | `config.approve.policy` (Quality Manager); Safety Officer for safety-relevant | functional | Production: via Change Request |
| `ApplicationManifest`, `ApplicationTest` | proposed new group `config.draft.application` | `config.approve.application` (Quality Manager) + the component approvals it pins | functional | Publish requires all pinned components published and app tests passing |

Role bundles to add/adjust (proposals): **Hazardous Driver Author** (`driver.author.hazardous`, no approval rights, toxic with Safety Officer on the same change — F-11); give Metrology Approver `config.approve.ui` and `config.approve.application` or assign to Quality Manager (F-32).

## 4. Proposed bodies for kinds the spec leaves undefined

Envelope (Part A) wraps each body. All user-facing strings are `LocalizedString`/`$t`. Quantities, intervals and policy values use `InputMarker` unless the author supplies them with provenance.

### 4.1 `InstrumentFamily`
```json
{
  "title": {"en": "…"},
  "description": {"en": "…"},
  "capabilities": ["scpi.error_queue"],
  "libraries": [ {"$ref": {"kind":"CommandLibrary","key":"…","range":"^1"}} ],
  "identification_defaults": {"parse": {"type":"delimited","separator":",","fields":["manufacturer","model","serial","firmware"]}}
}
```

### 4.2 `CommandLibrary`
```json
{ "protocol": "scpi_text",
  "commands": [ /* CommandTemplate objects exactly as DriverDefinition.commands (PROCEDURE_SCHEMA D.2) */ ],
  "parsers": [ /* parser objects as D.2 */ ],
  "state": [ /* optional state variable declarations */ ] }
```
IEEE 488.2 common commands ship as platform content marked `verification: "standard"`; nothing else is pre-verified.

### 4.3 `StationRequirement`
```json
{
  "title": {"en": "…"},
  "transports": ["simulator"],
  "plugins": [],
  "min_runtime": "1.0.0",
  "catalog_requirements": {"driver.call": "1.0"},
  "environment_inputs": [
    {"id": "temperature", "quantity": "temperature", "source": "operator", "limits": {"$input": "MI-15"}}
  ],
  "operator_capabilities": ["…"]
}
```
`catalog_requirements` is *computed* and shown read-only; manual additions allowed only to **tighten**.

### 4.4 `LimitsPolicy` (METROLOGY §11A)
```json
{
  "applies_to": {"$ref": {"kind":"SpecTable","key":"…"}},
  "selection": [
    { "id": "default", "when": "true", "source": {"$ref": {"kind":"SpecTable","key":"…"}},
      "tightening": null,
      "boundary": {"lower_inclusive": {"$input":"MI-14"}, "upper_inclusive": {"$input":"MI-14"}} }
  ],
  "source": {"title": {"$input":"MI-05"}}
}
```
`when` is an expression over job attributes (no clock). `boundary.*_inclusive` has **no default**; `PR-015` blocks publish while any is `$input`/missing. Tightening is a typed expression, not a number.

### 4.5 `ApplicationTest`
```json
{
  "target": {"$ref": {"kind":"ApplicationManifest","key":"…"}},
  "scenario": {"simulation": {"$ref": {"kind":"SimulationProfile","key":"…"}}, "scenario_id": "nominal"},
  "operator_responses": [ {"prompt_node": "confirm_connections", "response": {"confirmed": true}} ],
  "faults": [ {"fault_id": "timeout_at_n", "params": {"after_commands": 12}} ],
  "interruption": {"kill_at_node": "read", "then": "resume"},
  "assertions": [
    {"id":"completes","kind":"run_outcome","equals":"completed"},
    {"id":"no_safety","kind":"no_safety_violation"},
    {"id":"resume_parity","kind":"dataset_parity","against":"uninterrupted"},
    {"id":"points_recorded","kind":"count","path":"as_found.points","equals":{"$input":"MI-32"}}
  ],
  "provenance": {"status":"synthetic_demo","entered_by":"…"}
}
```
Assertion expected values are authored by the metrologist (MI-32) — never generated. Assertion kinds are catalog items (extensible by platform release). The fault parameter (`12`, the same example integer `PROCEDURE_SCHEMA D.4` uses for `after_commands`) is a simulation-control count, not metrology; scenario values live in the `SimulationProfile`.

### 4.6 `UiTheme`
```json
{
  "mode_pair": {"light": {"tokens": {}}, "dark": {"tokens": {}}},
  "tokens_schema_ref": "calos-ui-tokens@1",
  "typography": {"scale": "system", "font_stack_ref": "system"},
  "density_default": "compact"
}
```
Editable token set is the **allow-list** in `calos-ui-tokens@1`: `bg, surface, surface-2, text, text-muted, border, primary, primary-contrast, ok, warn, error, info`, type scale, radius, density. **Excluded (schema rejects them): `sim`, `deployment-test`, `deployment-prod`, `hazard`, `focus`** (F-24). Publish validation computes WCAG ratios; below AA ⇒ `UIB-005`. In P1 only the shipped system theme exists (read-only).

### 4.7 `Policy` (P1 subset)
```json
{
  "scope": "lab",
  "required_locales": ["en"],
  "preflight_gates": [ {"id":"standards.valid","severity":"block"}, {"id":"config.status_vs_mode","severity":"block"} ],
  "staleness": {"max_age": {"$input":"Q-06"}, "action": "warn"},
  "separation_of_duties": {"publisher_may_approve_editorial": false},
  "lease": {"heartbeat_seconds": 30, "expiry_seconds": 120}
}
```
Gate ids come from the platform catalog (cannot be removed below the platform minimum). `required_locales` feeds PR-017. Production changes only via Change Request.

### 4.8 `UiPage` (operator-screen overlay) and `UiNavigation`
```json
{ "generated_from": {"$ref": {"kind":"Procedure","key":"…","range":"^1"}},
  "overlay": [ {"op":"hide","target":"widget:…"}, {"op":"add","after":"widget:…","widget":{"widget":"field.quantity","bind":"param.settle_time","label":{"$t":"…"}}} ],
  "layout": {"breakpoints":{"sm":1,"md":2,"lg":3}},
  "actions": [ {"id":"go","action":"start_run","label":{"$t":"…"},"enabled":"ctx.preflight_ok"} ] }
```
`overlay` operations are a closed set (`hide`, `add`, `move`, `set`) over stable generated widget IDs so regenerate-from-procedure preserves customisations. `UiNavigation`: `{items:[{id,label,target,icon(allow-list),roles[]}]}`.

### 4.9 `ReportDatasetContract`
Platform-defined `calibration-result@1` (PROCEDURE_SCHEMA F.3) is shipped as read-only content. Lab extensions: `{"extends":"calibration-result@1","fields":[{"path":"custom.<id>","type":"string|quantity|bool|…","source":"form|procedure"}]}`. Contracts are additive within a major.

### 4.10 `TranslationBundle`
```json
{ "namespace": "app.{key}", "locales": ["en","he"],
  "entries": [ {"key":"form.settle","en":{"text":"…","review":"needs_review"},"he":{"text":"…","review":"needs_review"},"usage":["UiForm:…"]} ] }
```
`review ∈ {needs_review, reviewed}` with `reviewed_by`. ICU syntax is validated (`I18N-002`).

## 5. Provenance rules (proposal)

Applies to every metrological field and to item-level provenance (F-13, D-09).

| Status | Meaning | Who/what sets it | Constraints |
|---|---|---|---|
| `draft` | Value entered by an author, unverified | Default on any edit by a user | Allowed in Test; blocks Production release only if policy requires `verified` |
| `synthetic_demo` | Value invented by the *user* for demonstration | Explicit author declaration (cannot be implicit) | **Never** released to Production (PR-014); watermarks in outputs; Test only |
| `verified` | A second person confirmed the value against its `source` | Reviewer with `config.review` ≠ `entered_by`; requires a `source` reference | `verified_by ≠ entered_by` |
| `approved` | Included in a version approved under the governing approval policy | **Computed** at publish from approvals; not user-editable | Any later edit resets to `draft` in the new draft |

Additional rules: status and `entered_by`/`verified_by` are part of the content digest; user fields are stable **user IDs** (not free strings); the Phase 0A fixture's `"fixture-author"` string is acceptable only in fixtures; copy/clone resets `approved`/`verified` to `draft`; `InputMarker` values have no provenance until replaced by a value; Hebrew/English display of statuses is fixed vocabulary (UI_UX §5.1 glossary pending MI-31).

## 6. Lint-code namespaces and clarifications

### 6.1 Namespaces
`PR-nnn` (existing, unchanged) plus new namespaces for Builder-level findings. Codes are stable once published; messages are localized via keys; each code has a fixture that triggers it (AC-PD-02 pattern).

| Namespace | Scope | Proposed initial codes |
|---|---|---|
| `DRV-` | Driver/command | 001 placeholder without parameter · 002 parameter not in template · 003 forbidden character in template · 004 quantity parameter of H1+ without bounds · 005 string parameter without allow-pattern · 006 retry on non-idempotent command · 007 unverified command in production-targeted package · 008 identification test strings missing |
| `MET-` | Metrology | 001 spec row without test vector · 002 calculation without test vector · 003 mixed dimensions in accuracy terms · 004 function `pending_review` in production-targeted package (alias of PR-016 for editors) |
| `UIB-` | Screens | 001 widget without accessible name · 002 visibility expression uses metrological function · 003 binding type mismatch · 004 unknown widget · 005 theme below AA / references non-themeable token · 006 action not in catalog |
| `RPT-` | Reports | 001 binding path not in contract · 002 binding type mismatch · 003 template defines a system-injected element · 004 missing locale key · 005 contract version mismatch |
| `I18N-` | Localization | 001 missing required locale (policy) · 002 ICU syntax error · 003 placeholder mismatch across locales · 004 untranslated authored content with fallback |
| `APP-` | Application | 001 pinned component unpublished · 002 requires unresolved · 003 no passing application test · 004 production readiness blocked (aggregate with child findings) |
| `REL-` | Release | 001 issuer untrusted · 002 signature/digest invalid · 003 schema/catalog incompatible · 004 production validation failed (children: PR-013/014/016/023/024/025) |

### 6.2 `PR-003` clarification (F-17)
| Construct | Required bounds |
|---|---|
| `flow.foreach` | `max_iterations` |
| `flow.while`, `flow.repeat_until` | `max_iterations` **and** `timeout` |
| `flow.wait_until` | `timeout` (and `poll`) |
| `driver.call`, `measure.acquire` | `timeout` (default from driver) |
The designer cannot create a node without its required bounds; the validator reports each missing field as a separate finding at the field's pointer.

### 6.3 Interval and inclusivity
`Interval` has no default for either inclusivity flag; the schema marks them `required` and the inspector uses `no_default`. A missing flag is `PR-015`.

## 7. Fixture corpus plan (kept forever; Part H)

For every kind and `schema_version`: `valid-min`, `valid-full`, `invalid-unknown-property`, `invalid-missing-required`, `invalid-type`, `invalid-boundary`, plus kind-specific negatives (e.g., `DriverDefinition` with control character in template; `LimitsPolicy` missing inclusivity; `UiTheme` referencing `sim`; `ReportTemplate` defining a watermark). Digest vectors (RFC 8785 canonical JSON → SHA-256) for each valid fixture, shared by Python and TS. Localization fixtures include Hebrew strings with embedded LTR fragments. All numeric content in fixtures is `synthetic_demo`-labelled or `$input`; CI forbids fixtures in production-targeted packages (PR-014).

## 8. Registry entry template (per kind)

```json
{
  "kind": "…", "schema_version": 1, "schema": "schemas/…/v1.schema.json",
  "draft_permission": "config.draft.<group>", "approval_roles": ["…"],
  "change_classes": {"editorial": ["/title","/description"], "metrological": ["/rows"], "safety": []},
  "semantic_validators": ["…"], "editor": {"group": "…", "label_key": "kind.…", "designer": "…"},
  "availability": {"slice": "S1", "environments": ["test"]}
}
```
`change_classes` maps JSON-pointer prefixes to classes so the structural diff can propose a class (raise-only). Generated TS/Python types come from the schemas; no hand-edits (AGENTS §2).

# PROCEDURE_SCHEMA.md — Procedure & Configuration Schemas

| | |
|---|---|
| Status | Draft 0.2 — covers the procedure IR **and** the metadata schemas that the No-Code designers read and write |
| Format | JSON Schema 2020-12 (normative files live in `schemas/<kind>/v<schema_version>.schema.json`); this document is the human-readable specification with examples |
| Related | [NO_CODE_ARCHITECTURE](NO_CODE_ARCHITECTURE.md) · [VISUAL_PROCEDURE_DESIGNER_SPEC](VISUAL_PROCEDURE_DESIGNER_SPEC.md) · [METROLOGY_REQUIREMENTS](METROLOGY_REQUIREMENTS.md) |

> **Examples contain no real metrology.** Wherever a metrological value is required, examples use the **input marker** `{"$input":"MI-nn"}`. The validator treats an unresolved `$input` as a **blocking error** in production mode; in simulation mode a `synthetic_demo` substitution (authored in the Builder, carrying `provenance.status="synthetic_demo"`) is required. SCPI command text in examples is marked `verification: "unverified_against_manual"` (MI-01) except IEEE 488.2 mandatory common commands.

---

## Part A — Common envelope and conventions

Every configuration item has the same envelope; `content` is the kind-specific body.

```json
{
  "envelope_version": 1,
  "kind": "Procedure",
  "key": "dmm-dcv-verification",
  "schema_version": 1,
  "version": "1.0.0",
  "title": { "en": "DC voltage verification", "he": "אימות מתח DC" },
  "description": { "en": "…" },
  "provenance": {
    "source": { "title": "…", "issuer": "…", "revision": "…", "locator": "§…" },
    "entered_by": "user:…", "verified_by": null, "status": "synthetic_demo"
  },
  "labels": ["demo", "dmm"],
  "requires": { "catalog": { "step.driver_call": "1.0", "step.measure_acquire": "1.0" },
                "expr_lang": "1.0", "runtime_min": "1.0.0" },
  "deps": [ { "kind": "DriverDefinition", "key": "…", "version": "1.2.0", "digest": "sha256:…" } ],
  "content": { }
}
```

**Conventions**
- `key`: lowercase slug `[a-z0-9][a-z0-9-]{1,62}`, unique per (deployment, tenant, kind).
- `title`/`description`/any user-facing string: `LocalizedString` = object keyed by BCP-47 tag; or `{"$t":"i18n.key"}` referencing a `TranslationBundle`.
- Identifiers inside content (`node.id`, `param`, `var`): `[a-z][a-z0-9_]{0,47}` (stable, never reused after publish within a lineage).
- Quantities: `{"value":"<decimal string>","unit":"<symbol>"}`. Never JSON numbers for metrological values. Decimal strings: `-?\d+(\.\d+)?([eE][+-]?\d+)?`.
- `$input`: `{"$input":"MI-nn","note":"…"}` marker for missing metrological input.
- `$ref`: `{"$ref":{"kind","key","range|version"}}` → floating in drafts, pinned at publish (adds `digest`).
- Unknown properties are **errors** (`additionalProperties:false`).
- The `presentation` object (canvas positions, collapsed state, colors) is permitted in content but excluded from the **semantic digest** (digest of content minus `presentation`), used for change-class "editorial" detection. The **content digest** covers everything.

---

## Part B — Expression language reference

Normative semantics: NO_CODE_ARCHITECTURE §7. This part is the function/error catalog.

### B.1 Function library v1

`metrology_status`: `exact` = defined by exact decimal arithmetic, no policy; `pending_review` = numerically or statistically policy-dependent (MI-12), **blocked in production mode** until a metrologist marks it `approved`.

| Function | Signature | Semantics | `metrology_status` |
|---|---|---|---|
| `abs(x)` | `quantity<D> → quantity<D>` | absolute value | exact |
| `min(a,b)`, `max(a,b)` | same dimension | | exact |
| `sum(list)` | `list<q<D>> → q<D>` | exact | exact |
| `count(list)` | `→ int` | | exact |
| `round_to(x, step)` | q<D>, q<D> → q<D> | round to nearest multiple of `step` using declared rounding mode (recorded) | exact |
| `floor(x)`, `ceil(x)` | decimal | | exact |
| `pow(x, n)` | n integer literal | | exact |
| `convert(x, UNIT)` | same dimension → same quantity in UNIT | exact decimal factor | exact |
| `value_in(x, UNIT)` | q<D> → decimal | numeric value in UNIT | exact |
| `deviation(measured, nominal)` | q<D>,q<D> → q<D> | `measured − nominal` | exact |
| `rel_deviation(measured, nominal)` | → dimensionless | `(m−n)/n`; error if `n=0` | exact |
| `within(x, interval)` | q<D>, Interval<D> → bool | honors interval's explicit inclusivity | exact |
| `present(o)`, `or_else(o, d)` | option | | exact |
| `len(list)`, `any(list<bool>)`, `all(list<bool>)` | | | exact |
| `lookup(table, k1, …)` | config table row/cell by key; error if absent | | exact |
| `interp_linear(table, x)` | linear interpolation | rounding per context | pending_review |
| `mean(list)` | arithmetic mean | decimal division in context | pending_review |
| `stdev_sample(list)` | experimental std dev (n−1) | requires `sqrt` | pending_review |
| `sqrt(x)` | decimal square root in context | | pending_review |
| `t_factor(dof, p)` | Student-t coverage factor from a **configured** table (`cfg.table`), no built-in values | | pending_review |

New functions: platform release or Class B `algorithm` plugin (matrix 3.13).

### B.2 Evaluation error codes
`E_DIM_MISMATCH` (design-time; runtime defense), `E_DIV_ZERO`, `E_EMPTY_AGG`, `E_LOOKUP_MISS`, `E_UNIT_UNKNOWN`, `E_BOUND_EXCEEDED` (list/decimal size), `E_BUDGET_EXCEEDED`, `E_TYPE` (design-time), `E_UNRESOLVED_INPUT` (`$input` reached evaluation).

### B.3 Examples
```
deviation(step.read_dcv.out.mean, param.nominal)                      # q<V>
within(deviation(var.reading, param.nominal), cfg.limits.dcv_point.interval)
if(ctx.mode == "simulation", "SIM", "PROD")
rel_deviation(var.reading, param.nominal) * 100 %                      # dimensionless in percent
```
Compiled form (excerpt):
```json
{ "op":"call","fn":"within","args":[
  {"op":"call","fn":"deviation","args":[{"op":"ref","path":"var.reading"},{"op":"ref","path":"param.nominal"}]},
  {"op":"ref","path":"cfg.limits.dcv_point.interval"} ],
  "type":"bool", "lang":"1.0" }
```

---

## Part C — Procedure schema

### C.1 Top-level structure (`content` of kind `Procedure`)

```json
{
  "applies_to": [ { "$ref": {"kind":"InstrumentModel","key":"…","range":"^1"} } ],
  "roles": [
    { "id":"uut", "title":{"en":"Instrument under test"}, "kind":"instrument",
      "model": { "$ref": {"kind":"InstrumentModel","key":"…"} } },
    { "id":"ref_source", "title":{"en":"Reference source"}, "kind":"standard",
      "requirement": { "$ref": {"kind":"StandardRole","key":"…"} } }
  ],
  "parameters": [
    { "id":"settle_time", "type":"quantity", "dimension":"T", "default":{"$input":"MI-16"}, "editable":"author" }
  ],
  "tables": [ { "id":"points", "$ref": {"kind":"SpecTable","key":"…"} } ],
  "variables": [ { "id":"reading", "type":"quantity", "dimension":"V" } ],
  "preconditions": [ { "id":"std_valid", "check":"standards.valid", "severity":"block" } ],
  "environment": [ { "id":"temp", "quantity":"temperature", "required":true, "limits": {"$input":"MI-15"} } ],
  "lifecycle": {
    "setup":      [ /* nodes */ ],
    "phases": [
      { "id":"as_found", "kind":"as_found", "body":[ /* nodes */ ] },
      { "id":"adjust",   "kind":"adjustment", "optional":true, "when":"…", "body":[ /* nodes */ ] },
      { "id":"as_left",  "kind":"as_left", "optional":true, "body":[ /* nodes */ ] }
    ],
    "teardown":   [ /* nodes — always run */ ],
    "safe_state": [ /* nodes — H0/H1/H2-to-safe only; run on abort/fault */ ]
  },
  "evidence_requirements": [ { "id":"ev_env", "type":"environment_log", "phase":"as_found", "required":true } ],
  "decision": { "rule": {"$ref":{"kind":"DecisionRule","key":"…"}}, "uncertainty": {"$ref":{"kind":"UncertaintyBudget","key":"…"}} },
  "report": { "template": {"$ref":{"kind":"ReportTemplate","key":"…"}}, "dataset_contract": "calibration-result@1" },
  "ui": { "operator_screen": {"$ref":{"kind":"UiPage","key":"…"}} },
  "presentation": { }
}
```

### C.2 Node common fields

| Field | Type | Meaning |
|---|---|---|
| `id` | identifier | Stable node ID (unique in procedure) |
| `type` | catalog `type_id` | See C.3 |
| `title` | LocalizedString | Shown in UI/reports |
| `when` | expression → bool (optional) | Guard; node skipped if false (recorded) |
| `resume_policy` | `idempotent \| resumable \| non_repeatable` | **Required** for nodes with side effects; derived default: H0/H1 → idempotent, H2 → resumable, H3/H4 → non_repeatable (author may only make it *stricter*) |
| `timeout` | duration quantity | Required for waits, driver calls (default from driver) |
| `on_error` | ErrorPolicy | See C.4 |
| `evidence` | refs to `evidence_requirements` | Evidence produced/required |
| `inputs`/`outputs` | bindings | Typed bindings (expressions) |
| `permissions` | derived, read-only | Union of permissions needed (hazard classes etc.) |
| `notes` | LocalizedString | Author-facing |

### C.3 Step type catalog v1

| `type_id` | Purpose | Key fields |
|---|---|---|
| `flow.sequence` | Group | `body[]` |
| `flow.if` | Branch | `cond` (expr), `then[]`, `else[]` |
| `flow.switch` | Multi-branch on enum | `on` (expr), `cases[{value, body[]}]`, `default[]` |
| `flow.foreach` | Iterate list/table rows | `over` (expr/table), `as` (id), `max_iterations` **required**, `body[]` |
| `flow.while` | Condition loop | `cond`, `max_iterations` **required**, `timeout` **required**, `body[]` |
| `flow.repeat_until` | Loop until condition | `until`, `max_iterations`, `timeout`, `body[]` |
| `flow.delay` | Fixed wait | `duration` |
| `flow.wait_until` | Wait for condition | `cond`, `poll`, `timeout`, `on_timeout` |
| `flow.try` | Controlled error handling | `body[]`, `handlers[{match, body[]}]`, `finally[]` |
| `flow.call` | Sub-procedure | `procedure` ($ref SubProcedure), `args` (typed bindings), `returns` |
| `flow.checkpoint` | Explicit durable resume point | — |
| `flow.fail` / `flow.abort` | Terminate with reason | `reason` (LocalizedString), `severity` |
| `compute.set` | Assign variable | `var`, `expr` |
| `compute.calc` | Call `Calculation` item | `calc` ($ref), `args`, `returns` |
| `driver.call` | Invoke named driver operation | `role` (uut/ref_source), `op`, `args` (typed bindings), `result_var?` |
| `source.apply` / `source.off` | Convenience for H2 output ops (resolved to driver ops) | `role`, `value`, `settle?` |
| `measure.acquire` | Take N readings | `role`, `op`, `count`, `settle?`, `trigger?`, `aggregate` (expr list), `outlier_policy?` (MI-24), `store_as` |
| `evaluate.limits` | Limit check | `measured` (expr), `nominal` (expr), `limits` ($ref SpecTable row selector), `result_var` |
| `evaluate.decision` | Conformity decision | `rule`, `inputs` — outcome `not_evaluated` unless prerequisites pinned |
| `record.result` | Add to result dataset | `dataset_path`, `value` |
| `record.condition` | Environment/operator-entered condition | `quantity`, `source (sensor|operator)`, `limits?` |
| `operator.instruct` | Show instruction | `content` (restricted Markdown, localized), `media[]` |
| `operator.confirm` | Confirmation | `prompt`, `required_role?`, `evidence?` |
| `operator.input` | Typed value entry | `prompt`, `type`, `bounds`, `var` |
| `operator.choice` | Choose option | `options[]`, `var` |
| `operator.capture` | Attach file/photo | `accept` MIME allow-list, `evidence_id` |
| `phase.begin` | Enter As Found/Adjust/As Left (usually implicit via `phases`) | |
| `adjust.apply` | **H3** adjustment through named driver op | `role`, `op`, `args`, `before_after_evidence` required |
| `repair.record` | Manual repair record | `description`, `parts?`, `approval_required` |

### C.4 ErrorPolicy

```json
{ "match": ["E_TIMEOUT","E_INSTRUMENT_ERROR","E_PARSE"],
  "actions": [
    { "do":"retry", "max_attempts": 3, "backoff": {"value":"1","unit":"s"}, "only_if_resume_policy":["idempotent","resumable"] },
    { "do":"escalate_operator", "message": {"en":"…"}, "choices":["retry","skip","abort"] },
    { "do":"fail_run" } ] }
```
`retry` on a node with hazard ≥ H2 or `non_repeatable` is a **validation error**. `skip` allowed only if node `skippable:true` and the skip is recorded as evidence.

### C.5 Example — measurement loop (illustrative; no real values)

```json
{ "id":"loop_points","type":"flow.foreach","title":{"en":"For each test point"},
  "over":"table.points.rows","as":"tp","max_iterations": 200,
  "body":[
    { "id":"set_source","type":"source.apply","role":"ref_source",
      "value":"item.tp.nominal","settle":"param.settle_time","resume_policy":"resumable" },
    { "id":"cfg_uut","type":"driver.call","role":"uut","op":"configure_dc_voltage",
      "args":{"range":"item.tp.range","nplc":"item.tp.nplc"},"resume_policy":"idempotent" },
    { "id":"read","type":"measure.acquire","role":"uut","op":"read",
      "count":"item.tp.readings","aggregate":["mean"],"store_as":"var.reading","resume_policy":"idempotent" },
    { "id":"check","type":"evaluate.limits",
      "measured":"var.reading","nominal":"item.tp.nominal",
      "limits":{"table":"points","row":"item.tp.id"},"result_var":"var.point_result" },
    { "id":"rec","type":"record.result","dataset_path":"as_found.points[]","value":"var.point_result" }
  ] }
```

### C.6 Static validation codes (lint catalog)

| Code | Severity | Rule |
|---|---|---|
| PR-001 | error | Schema violation / unknown property |
| PR-002 | error | Unresolvable or cyclic `$ref` |
| PR-003 | error | Loop/wait missing `max_iterations` or `timeout` |
| PR-004 | error | Variable used before definite assignment |
| PR-005 | error | Unreachable node / dead branch (constant guard) |
| PR-006 | error | Expression type or **dimension** error |
| PR-007 | error | `retry` on `non_repeatable` or ≥H2 node |
| PR-008 | error | `resume_policy` weaker than derived minimum |
| PR-009 | error | Driver op not found in pinned DriverDefinition or arg type mismatch |
| PR-010 | error | H2+ op without covering Safety Profile (real transport) |
| PR-011 | error | Missing required evidence for phase |
| PR-012 | error | `adjustment` phase without `as_found` before it, or `as_left` without prior phase |
| PR-013 | error | Unresolved `$input` (production) |
| PR-014 | error | `synthetic_demo` provenance in production-targeted package |
| PR-015 | error | Interval without explicit inclusivity |
| PR-016 | error | Function with `metrology_status=pending_review` used in production-targeted package |
| PR-017 | warning | Missing translation for a required locale |
| PR-018 | warning | `teardown` absent while H2+ ops present (becomes error) |
| PR-019 | error | `safe_state` contains an operation not marked safe-state-eligible |
| PR-020 | error | Decision node pins rule but no approved uncertainty budget (outcome would be `not_evaluated`; allowed only with explicit `allow_not_evaluated:true`) |
| PR-021 | error | Raw text sent to instrument (any construct bypassing `driver.call`) |
| PR-022 | warning | Test vector coverage < required |
| PR-023 | error | Safety Profile envelope/forbidden entry not contained in (or contradicting) the Absolute Hardware Limits for its target, or target has no AHL entry (real transport) |
| PR-024 | error | Production-targeted package references a `simulated` Safety Profile/pack or a simulator-only driver |
| PR-025 | error | Production release candidate contains `validation`/`simulation`-only `intended_modes` |

---

## Part D — Instrument model, driver, safety, simulation

### D.1 `InstrumentModel`
```json
{
  "manufacturer": { "$ref": {"kind":"Manufacturer","key":"…"} },
  "family": { "$ref": {"kind":"InstrumentFamily","key":"…"} },
  "model_name": "34401A",
  "aliases": ["…"],
  "functions": [ { "id":"dcv","title":{"en":"DC voltage"},"quantity":"V",
                   "ranges":{"$input":"MI-02"} } ],
  "options": [ { "id":"…","title":{"en":"…"},"detect":{"query_op":"…","parse":"…"} } ],
  "capabilities": ["measure.dc_voltage", "scpi.error_queue"],
  "identification": {
    "driver_op": "identify",
    "parse": { "type":"delimited","separator":",","fields":["manufacturer","model","serial","firmware"] },
    "match": { "manufacturer_in":["…"], "model_regex":"^34401A$" },
    "simulation_marker_field": "serial"
  },
  "driver": { "$ref": {"kind":"DriverDefinition","key":"…"} },
  "default_safety_profile": { "$ref": {"kind":"SafetyProfile","key":"…"} },
  "simulation": { "$ref": {"kind":"SimulationProfile","key":"…"} }
}
```
`identification.match` results: `exact` (all fields), `partial` (model ok; firmware/option differ), `mismatch`.

### D.2 `DriverDefinition`
```json
{
  "protocol": "scpi_text",
  "connection_profiles": [
    { "id":"gpib", "transport":"visa", "resource_pattern":"GPIB\\d*::\\d+::INSTR",
      "settings":{"timeout":{"value":"2","unit":"s"},"termination":{"write":"\\n","read":"\\n","eoi":true}} },
    { "id":"serial","transport":"visa","resource_pattern":"ASRL\\d+::INSTR",
      "settings":{"baud":{"$input":"MI-01"},"data_bits":8,"parity":"none","stop_bits":1,"flow":"…",
                  "timeout":{"value":"2","unit":"s"},"termination":{"write":"\\n","read":"\\n"}} },
    { "id":"lan","transport":"visa","resource_pattern":"TCPIP\\d*::.+::(inst\\d+|\\d+)::(INSTR|SOCKET)",
      "settings":{"timeout":{"value":"2","unit":"s"}} }
  ],
  "libraries": [ { "$ref": {"kind":"CommandLibrary","key":"ieee488-2-common"} } ],
  "commands": [
    { "name":"identify","kind":"query","template":"*IDN?","hazard":"H0",
      "response":{"parser":"string"},"timeout":{"value":"2","unit":"s"},"verification":"standard" },
    { "name":"configure_dc_voltage","kind":"write",
      "template":"CONFigure:VOLTage:DC {range},{res}",
      "params":[
        {"name":"range","type":"quantity","dimension":"V","bounds":{"$input":"MI-02"},"format":{"style":"engineering","unit_suffix":false,"si_base":true}},
        {"name":"res","type":"quantity","dimension":"V","optional":true,"bounds":{"$input":"MI-02"}} ],
      "hazard":"H1","idempotent":true,"verification":"unverified_against_manual",
      "state_effects":[{"set":"function","value":"dcv"}] },
    { "name":"read","kind":"query","template":"READ?","hazard":"H0",
      "response":{"parser":"number_with_unit","unit":"V"},"idempotent":true,
      "timeout":{"value":"10","unit":"s"} }
  ],
  "parsers": [ { "id":"string","type":"string_trim" } ],
  "error_handling": {
    "error_query_op":"read_error","loop_until":"no_error","max_reads": 20,
    "map":[{"match":{"code_regex":"^[+-]?0,"},"severity":"none"},{"match":{"any":true},"severity":"error"}] },
  "lifecycle": {
    "init": ["clear_status","reset"], "teardown": ["local_mode"], "safe_state": []
  },
  "state": [ { "id":"function","type":"enum","values":["dcv","…"] } ]
}
```
**Parameter formatting** (`format`): typed formatter — decimal style (`fixed|scientific|engineering`), digits, SI scaling, boolean as `ON/OFF` or `1/0`, enum → mapped token. **Allowed placeholder grammar:** `{name}` only; no nested expressions in templates; templates must not contain unescaped `;`, CR, LF unless `compound:true`.

**Parser types**: `string_trim`, `number_with_unit` (strip suffix, parse decimal directly), `enum_map`, `delimited_numbers`, `regex_groups` (named groups → typed record), `ieee_block`, `register_bits`, `scpi_bool`.

### D.3 `SafetyProfile`
```json
{
  "applies_to": [ {"$ref":{"kind":"InstrumentModel","key":"…"}} ],
  "simulated": false,
  "envelopes": [
    { "target":"command:configure_dc_voltage.param:range", "min":{"$input":"MI-26"}, "max":{"$input":"MI-26"} },
    { "target":"role:ref_source.output", "dimension":"V", "max_abs":{"$input":"MI-26"} } ],
  "forbidden": [ { "op":"…", "reason":{"en":"…"} } ],
  "required_states": [ { "before":"hazard>=H2", "state":"…", "message":{"en":"…"} } ],
  "safe_state": "safe_state_sequence",
  "interlocks": [ { "id":"cables_checked", "confirm":{"en":"Confirm connections are made with source output OFF."} } ]
}
```
Kind permission: `safety.manage` (Lab Safety / Metrology Administrator); approval: `safety.approve` (Safety Officer / Technical Authority, ≠ author) plus `safety.approve.compliance` (Quality Manager) when classified metrological/compliance-affecting (ADR-0023). **Every envelope must be contained in the Absolute Hardware Limits for its target (lint PR-023); a profile can only narrow.** Elements may carry `"tags":["compliance"]` / `"metrological_impact":true` which drive the classification (MI-35).

### D.3b `HardwareLimitsPack` (Absolute Hardware Limits — **not a configuration kind**)
Separately signed artifact on the `hardware-limits` channel; **no editor or API can modify it** (ADR-0023). Shown for specification only; values are inputs (MI-26).
```json
{
  "pack_version": 7, "schema": 1, "expires": "2027-06-30T00:00:00Z",
  "entries": [
    { "applies_to": { "identity": { "manufacturer_in": ["…"], "model_regex": "…" } },
      "limits": [
        { "target":"command:configure_dc_voltage.param:range", "dimension":"V", "min":{"$input":"MI-26"}, "max":{"$input":"MI-26"} },
        { "target":"role:ref_source.output", "dimension":"V", "max_abs":{"$input":"MI-26"} } ],
      "forbidden": [ { "op":"…", "reason":{"en":"…"} } ],
      "compliance_impact": true,
      "source": { "title":{"$input":"MI-01"}, "locator":"…" } } ],
  "signatures": [ { "key_id":"ed25519:…", "role":"safety_officer" }, { "key_id":"ed25519:…", "role":"quality_manager" } ],
  "signing_policy": { "threshold": 2, "mandatory_roles": ["safety_officer"], "compliance_requires": ["quality_manager"] }
}
```
Simulator-scope packs mark `"simulated": true`, are signed with a non-production key in Test only, and are rejected by Production.

### D.4 `SimulationProfile`
```json
{
  "applies_to": {"$ref":{"kind":"InstrumentModel","key":"…"}},
  "identity": { "manufacturer":"SIMULATED", "model":"34401A", "serial":"SIM-0001", "firmware":"sim-1.0" },
  "state_vars": [ {"id":"function","type":"enum","initial":"dcv"}, {"id":"applied","type":"quantity","dimension":"V","initial":{"value":"0","unit":"V"}} ],
  "rules": [
    { "match":"^\\*IDN\\?$", "respond":"{identity.manufacturer},{identity.model},{identity.serial},{identity.firmware}" },
    { "match":"^CONF:VOLT:DC\\b.*", "update":[{"set":"function","value":"dcv"}], "respond": null },
    { "match":"^READ\\?$", "respond":"{reading}", "where":{"reading":"applied + offset + noise"} }
  ],
  "models": { "offset":{"$scenario":"offset"}, "noise":{"dist":"normal","sigma":{"$scenario":"noise_sigma"},"seed":42} },
  "scenarios": [
    { "id":"nominal","params":{"offset":{"value":"SYN","unit":"V"},"noise_sigma":{"value":"SYN","unit":"V"}},"provenance":{"status":"synthetic_demo"} },
    { "id":"marginal","params":{ } }, { "id":"failing","params":{ } } ],
  "faults": [ {"id":"timeout_at_n","kind":"timeout","after_commands":12}, {"id":"garbled","kind":"corrupt_response"},
              {"id":"error_queue","kind":"push_error","code":"…"}, {"id":"disconnect","kind":"disconnect"} ]
}
```
`respond` expressions use the **same expression language** with `applied`, `offset`, `noise` being state/model references; randomness only through seeded `models` (the simulator is the only component allowed noise, never the evaluator). Values written `SYN` stand for demo values **authored by the user** in the builder, labeled synthetic.

### D.5 `StandardRole`
```json
{ "role_id":"ref_source", "title":{"en":"DC voltage source"},
  "required_capability": { "quantity":"V", "range":{"$input":"MI-06"}, "max_uncertainty":{"$input":"MI-06"} },
  "allowed_models": [ {"$ref":{"kind":"InstrumentModel","key":"…"}} ],
  "simulated_substitute": {"$ref":{"kind":"SimulationProfile","key":"…"}} }
```

---

## Part E — Metrology configuration kinds (bodies)

### E.1 `SpecTable`
```json
{
  "columns": [ {"id":"id","type":"string"}, {"id":"function","type":"enum:function"},
               {"id":"range","type":"quantity","dimension":"V"}, {"id":"nominal","type":"quantity","dimension":"V"},
               {"id":"readings","type":"int"}, {"id":"nplc","type":"decimal"},
               {"id":"accuracy","type":"accuracy_expression"}, {"id":"interval_inclusive","type":"bool"} ],
  "rows": [ { "id":"tp1","function":"dcv","range":{"$input":"MI-03"},"nominal":{"$input":"MI-03"},
              "readings":{"$input":"MI-03"},"nplc":{"$input":"MI-03"},
              "accuracy":{"combine":"algebraic","terms":[
                 {"kind":"reading_fraction","coefficient":{"$input":"MI-04"}},
                 {"kind":"range_fraction","coefficient":{"$input":"MI-04"}} ]},
              "interval_inclusive":{"$input":"MI-14"} } ],
  "source": { "title":{"$input":"MI-01"}, "locator":"…" },
  "test_vectors": [ { "inputs":{ "reading":"…","nominal":"…","row":"tp1" }, "expect":{ "within": true } } ]
}
```
Rows with unresolved `$input` cannot be used in production; demo rows are replaced by user-authored `synthetic_demo` rows.

### E.2 `DecisionRule`
```json
{ "kind":"simple_acceptance", "parameters":{}, "text":{"en":"…","he":"…"},
  "source":{"$input":"MI-08"}, "requires_uncertainty": false }
{ "kind":"guard_banded_acceptance", "parameters":{"w":{"expr":"…"}}, "requires_uncertainty": true }
```
### E.3 `UncertaintyBudget` — as METROLOGY §5.1 (components with `expr` for sensitivity, distribution, evidence_ref). `TURPolicy`, `CorrectionSet`, `CMCTable`, `UnitDefinition`, `RoundingRule`, `Calculation` follow METROLOGY §11A; every numeric field accepts a Quantity or `$input`.

### E.4 `Calculation`
```json
{ "inputs":[{"id":"measured","type":"quantity","dimension":"V"},{"id":"nominal","type":"quantity","dimension":"V"}],
  "outputs":[{"id":"error","type":"quantity","dimension":"V","expr":"deviation(measured, nominal)"}],
  "test_vectors":[ {"in":{"measured":{"value":"…","unit":"V"},"nominal":{"value":"…","unit":"V"}},
                    "out":{"error":{"value":"…","unit":"V"}}} ] }
```

---

## Part F — UI, report, localization kinds (bodies; full UX in BUILDER_SPEC §7–8)

### F.1 `UiForm` (excerpt)
```json
{ "layout": { "type":"grid","breakpoints":{"sm":1,"md":2,"lg":3},
              "items":[ {"widget":"reading_display","bind":"var.reading","span":{"lg":2}},
                        {"widget":"field.quantity","bind":"param.settle_time","label":{"$t":"form.settle"},
                         "validate":[{"expr":"param.settle_time >= 0 s","message":{"$t":"err.nonneg"}}],
                         "visible":"ctx.role == \"engineer\"" } ] },
  "actions":[ {"id":"go","label":{"$t":"act.start"},"action":"start_run","enabled":"ctx.preflight_ok"} ] }
```
### F.2 `ReportTemplate` (excerpt)
```json
{ "contract":"calibration-result@1",
  "page":{"size":"A4","margins":"…","header":{"blocks":[…]},"footer":{"blocks":[…]}},
  "blocks":[
    {"type":"heading","text":{"$t":"rpt.title"}},
    {"type":"kv_grid","items":[{"label":{"$t":"rpt.instrument"},"value":"data.instrument.model"}]},
    {"type":"table","rows":"data.as_found.points","columns":[
        {"header":{"$t":"rpt.nominal"},"value":"row.nominal"},
        {"header":{"$t":"rpt.reading"},"value":"row.reading"},
        {"header":{"$t":"rpt.limit_check"},"value":"row.limit_check_label"} ]},
    {"type":"section","when":"data.as_left.present","blocks":[…]},
    {"type":"signature","role":"approver","when":"data.kind == \"issued\""} ] }
```
System-injected (not in template): `watermark`, `simulation_banner`, `draft_legend`, `config_footer`, `integrity_code`.

### F.3 Report dataset contract `calibration-result@1` (top-level shape)
`header{run_id, mode, kind(draft|issued), generated_at, locale}`, `lab{…}`, `customer?`, `instrument{identity snapshot, asset?, simulated}`, `standards[]{role, id, certificate snapshot}`, `environment[]`, `phases{as_found, adjustment?, as_left?}` each `points[]{id, nominal, readings[], aggregate, deviation, limits{lo,hi,inclusive}, limit_check, decision?}`, `evaluations{decision{outcome,reason}, uncertainty{state:"not_evaluated"|…}}`, `evidence[]`, `config{versions & digests}`, `approvals[]`, `flags{simulated, draft, superseded}`. Contract versions are additive within a major; templates declare the contract they bind to.

---

## Part G — Compatibility and packaging fields

`ApplicationManifest` content:
```json
{ "application_key":"…", "title":{"en":"…"}, "version":"1.0.0",
  "contains": [ {"kind":"…","key":"…","version":"…","digest":"sha256:…"} ],
  "entry": { "procedures":["…"], "default_ui":"…" },
  "requires": { "catalog": {"step.measure_acquire":"1.0"}, "plugins": [], "transports":["visa"], "schema_versions": {"Procedure":1}, "runtime_min":"1.0.0" },
  "intended_modes": ["simulation"],
  "tests": [ {"$ref":{"kind":"ApplicationTest","key":"…"}} ] }
```
`intended_modes ∈ {simulation, validation, production}`: a package without `production` cannot be released to a Production deployment (PR-025) — this is what keeps the 34401A demo in Test.

## Part H — Schema evolution policy
1. Additive optional field → same `schema_version`, minor catalog bump.
2. Rename/remove/semantics change → new `schema_version` + migrator + semantic-equivalence tests; both versions supported for the deprecation window.
3. The Builder offers "Upgrade to schema vN" which creates a new draft; nothing is changed in place.
4. All shipped fixtures for each `(kind, schema_version)` are kept forever as regression corpus.

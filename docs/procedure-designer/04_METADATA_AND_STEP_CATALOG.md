# 04 — Metadata and step-catalogue requirements

Source of truth in the prototype: `js/pd-data.js` (`STEP_CATALOG`). The product equivalent lives in `catalog/` + `schemas/` (new building blocks follow AGENTS §4 "Add a building block"). Reuse `docs/PROCEDURE_SCHEMA.md` and `docs/NO_CODE_CAPABILITY_MATRIX.md`; this file lists **additions and gaps only**.

## Catalogue (17 prototype types → required fields)
Every entry: `type_id@major.minor`, `group`, `glyph`, `lanes` (where placeable), `slots`, `hazard` (where applicable), a **closed** JSON Schema (`additionalProperties:false`), `x-calos-editor` hints (label, help, group, order, tab, widget).

| Group | Types | Notes |
|---|---|---|
| Instrument | `driver.call`, `source.apply` (H2), `source.off` (H1) | named op + typed args only |
| Standard | `standard.require` | **proposal** — no catalogue entry in existing docs (gap G-1) |
| Measurement | `measure.acquire` (H0) | count, aggregate, store_as |
| Calculation / results | `compute.set`, `evaluate.limits`, `record.result` | limit check ≠ conformity decision |
| Flow | `flow.if`, `flow.foreach`, `flow.repeat_until`, `flow.delay`, `flow.wait_until`, `flow.try` | every loop/wait **bounded** |
| Operator | `operator.instruct`, `operator.confirm`, `operator.input` | not allowed in the safe state |

Required building blocks **not** in the prototype: identification as a first-class step (done via `driver.call identify`, G-2), reference-standard *selection* (prototype only requires a role, G-3), report data collection beyond `record.result` (G-4), uncertainty and decision-rule steps (Phase 2, G-5).

## Hints/widgets required
`expression`(+`expect` dimension), `select-from`(`options`: roles, standard_roles, ops, query_ops, tables), `op-args`, `duration`, `integer`, `bound`, `error-policy`, `resume-policy`, plus existing `localized`, `enum`, `quantity-or-input`. Tabs via hint `tab`. Unknown widget → visible placeholder.

## Expression language (closed, total, deterministic)
Operators `+ - * /`, comparisons, `and or not`; functions `abs min max deviation mean count`; refs `var.x`, `item.<name>.<field>`; unit literals. No loops, recursion, I/O, clock, randomness, locale. Decimal-exact (BigInt+scale); dimension-checked; AST ≤ 200 nodes; unresolved `Input required` can never be evaluated. Python evaluator authoritative; TS subset must pass shared vectors. Statistical functions start `pending_review` (**D-11**: the prototype's `mean` has 12-digit division precision, which is **not** a metrological rounding rule).

## Proposed lint codes (to be registered in the lint namespace)
Used in the prototype: PR-001 schema/placement · 002 refs · 003 bounds · 004 unassigned var · 005 constant condition · 006 expression type/dimension/syntax · 007 retry on hazardous/non-repeatable · 008 resume weaker than derived · 009 operation/arguments · 010 no covering Safety Profile · 013 unresolved MI input · 014 synthetic data · 015 inclusivity not explicit · 018 no teardown/safe-state for hazardous · 019 non-safe op in safe state / hazardous in `finally` · 021 raw/script-like content · 023 bound wider than envelope / no AHL · 024 simulation-only · I18N-001.
**New/proposed:** DRV-001…DRV-014 (see 02). **Contradiction flagged:** the PR-003 wording in earlier specs covers only loops; the prototype also uses it for wait/retry bounds (**D-12**).

## Hazard and resume
Hazard H0–H4 (H3/H4 reserved). Derived minimum resume policy by hazard; author may only strengthen. Retry forbidden for H2+ and non-repeatable.

## Provenance
`synthetic_demo` → `draft` → `verified` → `approved`; only governance may set verified/approved (disabled in UI). Missing value = `{"$input":"MI-nn"}`.

## Fixtures to carry into the product
One failing fixture per lint code (see `tests/pd.test.js`), safe-expression rejection corpus, resume-parity and kill-at-boundary cases, closed-schema tests (no raw/script/command-like property names).

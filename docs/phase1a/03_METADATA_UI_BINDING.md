# 03 — Generic metadata-driven editor: binding requirements

| | |
|---|---|
| Status | Final proposal. Extends [phase1/06 §4](../phase1/06_COMPONENT_ARCHITECTURE.md#4-schema-driven-property-inspector) and [phase1/07 §2](../phase1/07_METADATA_SCHEMAS.md#2-editor-hint-vocabulary-x-calos-editor) with what the prototype proved. These are **requirements for the production inspector**; the prototype ([`js/ui.js`](../../design/phase1a-prototype/js/ui.js), [`js/data.js`](../../design/phase1a-prototype/js/data.js)) is the executable reference. |
| Mandate | NO_CODE_ARCHITECTURE B-1…B-7, §12: designers are *views over one document model*; per-kind screens are a defect. This is enforced in the prototype by a test (*no kind names in the renderer*), and must be enforced by lint in the product (P1A-AC-46). |

## 1. Contract

```
 Kind metadata (registry entry + JSON Schema + x-calos-editor hints)
        │                                        ┌── document (JSON content, pointers)
        ▼                                        │
  InspectorModel  ◄── policy (required locales) ─┤── permissions (read-only / disabled-with-reason)
  (sections → fields → widget + props)           └── lookup/reference port (candidates, status)
        │
        ▼
  one widget registry → controls → commands (set/add/remove/move) → editor-core → draft patch
        ▲                                   │
        └──── findings (code, severity, JSON pointer, stage) ◄── validators (local + server)
```
**Invariants:** (1) the renderer receives *only* schema, hints, document, policy, permissions and ports; (2) it never branches on `kind`; (3) values are written only through commands; (4) unknown widget ⇒ visible error placeholder (never skipped); (5) unknown hint ⇒ registration failure; (6) metrological values are decimal **strings**, absent values are `{"$input":"MI-nn"}`, references are `{"$ref":{"kind","key"}}`, localized text is `{ "<bcp47>": "text" }`.

## 2. Schema → widget mapping

| Schema shape (+ hint) | Widget | Value written | Notes |
|---|---|---|---|
| `string` | `text` | string (empty ⇒ property removed) | `pattern` + `pattern_help`; `mono` for identifiers/keys (LTR) |
| `string`, `widget: decimal-string` | `decimal-string` | decimal string `^-?\d+(\.\d+)?([eE][+-]?\d+)?$` | never a JS number |
| `object`, `widget: localized` | `localized` | `{en?, he?, …}` | rows per locale from the platform locale list; policy decides required locales (warning `I18N-001`); `multiline`, `localized_required:false` |
| `string` + `enum` (+ `enum_prefix`) | `enum` | one value or absent | first option "— choose —", **no pre-selection** |
| `array` of enum + `uniqueItems` | `enum-multi` | array of values | `disabled_options{value→reasonKey}`, `vocabulary:true` adds catalog note |
| `object` with `$ref` + `widget: reference` (+ `ref_kind`, `optional`, `filter_by`) | `reference` | `{ "$ref": {kind,key} }` | candidates exclude withdrawn; shows status; *Open* link; inline **+ New** |
| `array` of references, `widget: reference-list` | `reference-list` | array of `$ref` objects | add/remove; `minItems` finding |
| `array` of strings, `widget: string-list` | `string-list` | array of strings | add/remove; duplicates flagged (`uniqueItems`) |
| `array` of objects, `widget: record-list` (+ `item_title`, `unique_by`, `add_label`) | `record-list` | array of objects | collapsible record per item, move/remove, id uniqueness by `unique_by` |
| `object`, `widget: record` | `record` | nested object | `fieldset` + legend |
| `oneOf [InputMarker, array<Quantity>]`, `widget: quantity-or-input` (+ `unit_dimension_from`, `default_input`) | `quantity-or-input` | `{ "$input":"MI-nn" }` **or** `[ {value, unit} … ]` | units restricted to the sibling dimension; disabled with hint until dimension chosen |
| `oneOf [InputMarker, Interval]`, `widget: interval-or-input` | `interval-or-input` | `{ "$input" }` or `{lower, upper, lower_inclusive, upper_inclusive}` | **no default inclusivity** (`PR-015`) |
| `widget: derived` (+ `derive`, `show_fields`, `enum_prefix`) | `derived` | *(not stored)* | calls a registered, kind-agnostic derivation |
| `boolean` | `bool` | boolean | |

Any other `widget` value renders `err.unknown_widget` (visible, localized) and logs a registry error.

## 3. Hint vocabulary (final; closed and versioned)

`x-calos-editor` keys. Bold = added or sharpened by Phase 1A prototyping (propose to phase1/07 §2).

| Hint | Type | Meaning |
|---|---|---|
| `widget` | enum | one of §2 |
| `label` · `help` · `placeholder` | message key | localized; **never literal text** |
| `group` · `order` | key · integer | section grouping and ordering (stable sort; undefined `order` last) |
| `title` | bool | **field supplies the item title in lists, breadcrumbs, palette** (a localized object or a string) |
| `mono` | bool | **render value LTR in monospace (identifiers, keys)** |
| `pattern_help` | message key | **explains the `pattern` in plain language; appended to the pattern finding** |
| `multiline` | bool | **textarea** |
| `localized_required` | bool | **false ⇒ locale policy does not apply to this field** |
| `unique_by` | field name | **uniqueness of a sibling field across a record list (finding)** |
| `item_title` | field name | **which field titles each record summary** |
| `add_label` | message key | **text of the add button** |
| `ref_kind` · `optional` · `filter_by` | kind · bool · field | reference target, whether empty is allowed, **sibling field restricting candidates** |
| `enum_prefix` | string | **message-key prefix for enum value labels (`dim.`, `mode.`, `tr.`)** |
| `disabled_options` | `{value: reasonKey}` | **options shown disabled with a reason** |
| `vocabulary` | bool | **values come from the platform catalog vocabulary** |
| `unit_dimension_from` | field name | **sibling field naming the dimension; restricts the unit list** |
| `default_input` | `MI-nn \| Q-nn` | **marker used by "Mark as input required"** |
| `derive` · `show_fields` | derivation id · field names | **derived widget source; fields summarised** |
| `wizard_step` · `initial` | 1\|2 · default value | **the creation wizard is metadata too: a field declares which step shows it and its initial value; the registry flag `wizard: true` names the kind the wizard produces** |
| `visible_when` · `readonly_when` · `no_default` · `input_marker` · `provenance` · `permission` · `quick_fixes` · `explain` | as phase1/07 §2 | unchanged; **not yet exercised by the prototype** (listed so Codex implements them) |

**Registration rule.** Every kind's schema is checked against this list at load; a key not in the list, or a `widget`/`derive` not implemented, fails registration (fail-closed). New hints/widgets are *reviewed catalog changes* with: schema fragment, fixture, golden `InspectorModel` test, localized strings, a11y notes.

## 4. Kind registry data the UI depends on
Beyond phase1/07 §8, the **registry entry** must supply (all data, no code): `nav` (list route), `wizard` (flag), `icon` glyph key, `change_classes: [{match: <JSON-pointer regex>, cls}]` evaluated first-match-wins, with these generic escalation rules built into the diff classifier: removal of a record **id** or of a **capability** ⇒ *breaking*; otherwise unmatched pointers ⇒ *functional*. The class is a **suggestion**: the author may raise, never lower; the server computes the authoritative class.

## 5. Rendering algorithm (normative)
1. Take `properties` of the (sub)schema; optionally filter by `only` (wizard steps); stable-sort by `hint.order`.
2. Group by `hint.group` (first appearance order); each group → `section` with `h2` (message key).
3. For each property: resolve widget; compute `required` from `schema.required`; pass `value` at its JSON pointer; pass parent object (for `filter_by`, `unit_dimension_from`).
4. Fields get a stable id, label (`for`), help (`aria-describedby`), message region keyed by pointer.
5. Read-only mode (frozen, permission, second session, offline) disables controls but keeps them visible, with the reason shown once at page level.
6. Change handling: **non-structural** (typing) updates the document and re-validates without rebuilding the form; **structural** (add/remove/move/enum/reference/oneOf switch) updates, re-validates and rebuilds the form **preserving focus** (by pointer) and caret position.
7. Findings are painted onto the nearest rendered ancestor of the finding's pointer; `aria-invalid` is set on the exact control; messages carry the code in LTR brackets.
8. *Required-field* errors are painted only after the field was visited or the user pressed Validate/Submit; counts and the drawer always include them.

## 6. Findings contract (UI view)
`{ code, sev: error|warning|info, ptr, stage, params?, fix? }`. Message key = `f.<code>[.<detail>]`; params interpolate (`{mi}`, `{locale}`, `{key}`); `params.hint` appends a `pattern_help`. Stages: `schema`, `refs`, `semantic`, `i18n`, `metrology`. Local and server findings merge by `(code, ptr)`. Prototype codes: `PR-001` (schema; details: required, pattern, type, enum, unknown, unique, duplicate, decimal, minItems, minLength, maxLength, const, oneOf), `PR-002` unresolved reference, `PR-013` input required (warning in simulation), `PR-015` inclusivity missing, `I18N-001` missing required locale (warning), `APP-001` referenced item unpublished (warning; blocks publish). Quick fix in 1A is **Go to field** only (no value is ever suggested for a metrological input).

## 7. References, withdrawn items, and where-used
* Candidates = published or draft items of `ref_kind`, excluding withdrawn; each option shows title + status.
* A reference to an unpublished item is allowed in drafts (floating) and raises `APP-001` (publish blocked: `DEPENDENCY_UNPUBLISHED`). At publish, references are pinned `(kind,key,version,digest)`.
* *Where used* is computed by scanning content for `$ref` objects (kind-agnostic); a referenced item cannot be withdrawn.
* **Inline create** (`+ New`): opens the generic create dialog for `ref_kind`, creates a valid-but-incomplete draft, and writes the reference in place — no navigation.

## 8. Derived fields
A derivation is a registered, **kind-agnostic** function `(context, hint) → UI` (prototype: `closure-requirements` aggregates `capabilities` found on every referenced item and prints the fields named by `show_fields`). Derivations are catalog entries implemented in trusted code; they never write to the document.

## 9. Adding capability without UI code — worked examples
**Add a new kind** (e.g., a new `CommandLibrary`): registry entry + schema with hints + fixtures + localized strings → appears in navigation lists, create dialog, editor, validation, diff, history, where-used, palette and data tab with **zero renderer changes**. (Proof in the prototype: `StandardRole`, `StationRequirement` and `ApplicationManifest` — including its creation wizard — were added after the renderer and needed only `data.js` and strings. The renderer `ui.js` names no kind (test-enforced); `views.js` names kinds only in the two tab definitions of the Instruments/Equipment pages (tab → kind), which the product derives from registry `nav` data.)

**Add an optional field to a kind:** add a property + hint ⇒ field, validation, diff row, change-class entry. The prototype's *Data & metadata → Preview an extra optional field* demonstrates this live without a code change. (In the product a schema change is a versioned, reviewed platform change.)

**When code *is* needed:** a control shape not in §2 (e.g., a waveform viewer) ⇒ new widget — a DEV item recorded in the Capability Matrix.

Fragment (prototype) of the `functions` field and what it renders:
```jsonc
"functions": { "type": "array", "x-calos-editor": { "widget": "record-list", "label": "f.functions", "unique_by": "id", "item_title": "title", "add_label": "a.add_function", "group": "g.functions" },
  "items": { "type": "object", "required": ["id","title","quantity","ranges"], "additionalProperties": false, "properties": {
    "id":       { "type": "string", "pattern": "[a-z][a-z0-9_]{0,47}", "x-calos-editor": { "widget": "text", "label": "f.id", "pattern_help": "help.identifier", "mono": true } },
    "title":    { "type": "object", "x-calos-editor": { "widget": "localized", "label": "f.title" } },
    "quantity": { "type": "string", "enum": ["V","A","Ω","Hz","s","°C"], "x-calos-editor": { "widget": "enum", "enum_prefix": "dim.", "label": "f.quantity" } },
    "ranges":   { "oneOf": [ {"$ref":"#/$defs/InputMarker"}, {"type":"array","minItems":1,"items":{"$ref":"#/$defs/Quantity"}} ], "x-calos-editor": { "widget": "quantity-or-input", "unit_dimension_from": "quantity", "default_input": "MI-02", "label": "f.ranges" } } } } }
```
→ a collapsible list of functions; each has a monospace LTR identifier (unique), EN/HE title rows, a dimension picker, and a *ranges* control that starts as **⚠ Input required · MI-02** and, when the engineer chooses *Enter values*, becomes decimal-string + unit rows restricted to the chosen dimension.

## 10. Prohibited patterns (lint/review rules)
No `if (kind === …)`; no per-kind components or routes; no literal user-visible strings; no `innerHTML`/`dangerouslySetInnerHTML`; no number parsing of metrological values (`Number`, `parseFloat`) in quantity paths; no widget that writes outside its pointer; no hidden permission checks (use disabled-with-reason); no unbounded recursion in schema `$ref` (local, acyclic only); no network access from the renderer.

## 11. Test requirements
Golden `InspectorModel` per kind; widget-registry exhaustiveness test (every `widget` in any registered schema is implemented); registration negative tests (unknown hint/widget/keyword); property tests: *undo∘apply = identity*, patch round-trip, **no float round-trip for decimal strings**; focus/caret preservation test for structural changes; finding-painting test (pointer walk-up); a11y (axe) on a form generated from every widget; pseudo-locale and RTL screenshots; **"new kind with no UI code"** end-to-end test (P1A-AC-45).

## 12. Prototype → product module mapping
| Prototype | Product home (phase1/06) | Notes |
|---|---|---|
| `engine.js` `h`, `SHA`, `canon`, `diff`, `classify`, validator | *not copied* — product uses audited implementations: `calos_metadata` canonical JSON + digest vectors (S1), `editor-core` diff, server validators | Prototype SHA is synchronous for convenience only |
| `ui.js` form engine | `designers/inspector` + `ui-kit` | Same algorithm; typed props; no `any` |
| `ui.js` components | `ui-kit` | Re-implemented to the design-system spec |
| `data.js` kinds | `schemas/*`, `catalog/kinds.json`, hints | Real schemas, generated types |
| `views.js` | `apps/web/src/builder/*` routes composing designers | Uses host ports, not globals |
| `i18n.js` | `packages/ts/i18n` + message catalogs (ICU) | Hebrew reviewed (Q-15) |
| `Store` | `SyntheticHost` (1A) → API host (1B) behind `DraftPort`… | Conformance suite shared |

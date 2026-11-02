# 02 — Instrument Command Builder: UX specification

Prototype screenshot: `screenshots/03-command-builder-en-light.jpg` (if present). **The driver in the prototype is invented** (`SYNT:` mnemonics, "synthetic unit" su). It describes no real instrument. Real mnemonics must come from reviewed documentation (Q-08 / MI-01).

## Principles
1. Procedures, screens and operators call **named operations** with typed values only. The Builder has no "send raw" control; a disabled control with the reason is shown deliberately so the absence is explained.
2. Command text = fixed template + typed values. One command per operation (`;` and control characters rejected).
3. Only the **Instrument Broker** puts bytes on a wire; the Builder's test panel runs the same path (hazard → effective envelope → state preconditions → write) against the synthetic instrument.

## Layout
Operation list (library/lock/hazard/verification badges) · editor tabs **Definition · Parameters · State · Response · Simulation** · test panel.

## Definition
Name (`snake_case`, unique) · kind (query/write) · **template** with `{param}` tokens, live token preview and a sample-wire preview · **hazard class** H0–H4 (H3/H4 reserved and disabled; H2 enabled only for the *Hazardous Driver Author* role — **proposed role, D-06**) · timeout (positive decimal) · automatic retries (disabled for H2+) · verification status (`unverified_against_manual` → `standard` → `verified_by_reviewer` (reviewer only)) · documentation reference (reference only, no vendor text — Q-08).

## Parameters
Types: quantity (dimension + units), choice (fixed list; each choice maps to a fixed wire token, validated), yes/no, whole number. Quantity bounds are `Input required` unless supplied by a reviewed source. A hazardous quantity parameter carries a **safety-limit target** that cannot be removed or hidden; the Broker decides from the definition.

## State
Preconditions (`state = value`) and effects; "safe operation" flag (may run in the safe state).

## Response
Parsers: none, text, number-with-unit (decimal kept exact). Sample-reply tester shows parsed value or `E_PARSE`.

## Simulation
Read-only presentation of how the synthetic instrument answers (seeded offsets/noise per scenario) and the fault kinds the Lab can inject. Fault injection is not part of the driver definition.

## Libraries
Platform libraries are read-only and locked; **Copy to local** creates an editable copy with lineage (`copied_from`) that starts `unverified`.

## Lint (proposed codes, see 04): DRV-001…014 — name, template/placeholder mismatch, control/multi-command, enum tokens, quantity dimension, hazardous setter without limit target, limit target with hazard < H2, reserved hazard class, retry on hazardous, query without parser, parser unit, unknown state/value, unverified (info), timeout.

## Driver test panel
Choose operation → typed arguments (expression language: `2 su`, `"level"`) → *Call operation*. Shows state, sent/not-sent, wire text, reply, parsed value, stable error code. Preconditions and envelope refusals are demonstrable (call `read_value` before `set_function`; call `set_source_level` with `9 su`).

## Open decisions
D-06 (role), PD-DEC-001 (verification gate before use in a simulation vs production), PD-DEC-002 (driver library lineage/versioning), Q-08 (vendor documentation use).

# ADR-0017: Typed, dimension-checked, terminating expression language

Status: Proposed

## Context
Calculations, limits, conditions, bindings, validation and visibility rules need a formula language usable by non-programmers, safe, reproducible, and dimension-aware.

## Decision
Define a custom **total** expression language (no loops/recursion/I/O/time/random), types incl. `quantity<D>`, decimal arithmetic, library of versioned functions with `metrology_status`, reuse via `Calculation` items, canonical AST authoritative (digest-covered), evaluation traces stored. Python evaluator authoritative; TS presentation-subset evaluator for UI-only expressions; shared conformance vectors gate releases. Spec: NO_CODE_ARCHITECTURE §7, PROCEDURE_SCHEMA Part B.

## Options
1. Embed Python/JS (`eval`, restricted `ast`) — unsafe, non-terminating, non-dimensional. Rejected.
2. CEL / JSONLogic / Excel formulas — CEL is close (non-Turing complete, typed) but lacks dimensions and decimal-first semantics; JSONLogic is untyped; Excel semantics are float and implicit. We borrow ideas (CEL's cost bound, no side effects) but need dimensioned decimals. Rejected as-is; **may adopt CEL syntax conventions** where harmless.
3. **Purpose-built language** — chosen; small enough to specify fully and test exhaustively.

## Consequences
+ Static type/dimension errors at design time; terminating; reproducible. − We own a language: parser, checker, docs, editor support (autocomplete, error recovery). Mitigated by tiny surface and conformance suite.

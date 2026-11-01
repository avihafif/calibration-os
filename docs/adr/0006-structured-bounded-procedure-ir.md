# ADR-0006: Structured, bounded procedure IR (the visual graph is a view)

Status: Proposed

## Context
The Procedure Designer must offer drag-and-drop workflows with branches, loops, retries, error handling, sub-procedures, pause/resume. Free-form node-and-wire graphs allow arbitrary back-edges and are hard to analyze, hard to resume reliably, and may not terminate.

## Decision
Store and execute procedures as a **structured block tree** (sequence, branch, bounded loop, try/handle, call) with typed variables. The canvas renders it as a flow diagram; editing operations are tree operations, so every graph is expressible and no `goto` exists. Every loop and wait has an explicit bound/timeout. Each node has a stable `id`, `resume_policy`, optional `on_error`, hazard-class summary derived from its calls. Lifecycle blocks `setup`/`main`/`teardown`/`safe_state`.

## Options
1. Arbitrary DAG/graph with cycles (BPMN-like) — expressive; undecidable termination, complex resume semantics. Rejected.
2. Embedded script language — violates no-code and safety. Rejected.
3. **Structured IR + flow-diagram view** — chosen.

## Consequences
+ Static analysis: definite assignment, reachability, termination, hazard path analysis, resume correctness.
+ Natural diff/merge at node granularity.
− Some patterns (state machines with arbitrary transitions) are awkward → expressed with `repeat_until` + enum state variable or sub-procedures; if still inadequate, a catalog gap (matrix row 2.15/2.16).

## Revisit triggers
Repeated authoring friction reports; need for parallel branches (`flow.parallel`) with deterministic join.

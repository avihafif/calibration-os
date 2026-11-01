# ADR-0002: Execution engine — build our own vs. integrate OpenTAP

Status: Proposed · Deciders: Architecture, Product · **Does not change the baseline stack.**

## Context
We need a runtime that executes calibration procedures. OpenTAP (open-source test automation framework originating at Keysight; .NET-based; plugin/step/instrument/result-listener model; package manager; Python support through a plugin) is a credible alternative to building an engine. This ADR evaluates both against CalOS's actual requirements, **including the No-Code-First mandate**.

> Facts about OpenTAP below reflect general knowledge and **must be verified in the spike** (licensing text, current runtime requirements, package signing, Python plugin maturity, resume capabilities). They are stated as assumptions (OT-A#), not as verified fact.

OpenTAP assumptions to verify:
- OT-A1: Open source (believed MPL-2.0-class license); compatible with commercial redistribution.
- OT-A2: Runs on .NET (modern .NET on Windows/Linux); requires a .NET runtime on each station.
- OT-A3: Test plans are step trees with settings, resources (instruments/DUTs), and result listeners; package manager with versioned packages and (optional) signing.
- OT-A4: Python integration is via an OpenTAP Python plugin using a .NET–Python bridge, not the same as our "Python agent + PyVISA" baseline.
- OT-A5: No built-in notion of crash-safe, mid-plan **resume** with a hash-chained journal, evidence model, As-Found/As-Left, immutable approvals, offline sync, or a hazard/safety enforcement layer.

## Requirements that discriminate
| # | Requirement | Why it matters |
|---|---|---|
| R1 | Execute a **typed, bounded, versioned, declarative** procedure IR authored in a no-code designer | Core of the mandate |
| R2 | **Crash-safe resume** at node granularity with reconciliation & operator decisions | FR-EXEC-03/04 |
| R3 | Hash-chained journal as source of truth; replayable | NFR-01/03 |
| R4 | Hazard classes & Safety Profiles enforced outside editable workflows | FR-EXEC-12 |
| R5 | Decimal/dimensioned quantities end-to-end | Metrology |
| R6 | Fit with baseline: Python agent, PyVISA, Windows service | Brief |
| R7 | Operational footprint on stations (runtimes, installers, updates) | Fleet cost |
| R8 | Ecosystem leverage (existing instrument plugins/steps) | Time-to-market |
| R9 | Long-term control, security review surface, licensing certainty | Commercial |

## Options
**A. Build a thin metadata-interpreting engine (`calos_engine`) in Python.**
**B. Embed OpenTAP as the execution engine** (our procedures compiled to OpenTAP plans; agent drives OpenTAP).
**C. Hybrid: A now behind an `ExecutionEnginePort`; OpenTAP as optional adapter/step provider later.**

| Criterion | A: Build | B: OpenTAP | C: Hybrid |
|---|---|---|---|
| R1 declarative IR | Native (engine *is* the IR interpreter) | Needs compiler IR→TapPlan; semantics (bounded loops, typed vars, evidence) wrapped in custom steps → much custom .NET | Native, with port |
| R2 resume | Designed in | Must be added around OpenTAP (plan runs are not designed for mid-run process-crash resume — OT-A5) | Designed in |
| R3 journal | Native | Result listeners can write events but source-of-truth semantics must be built | Native |
| R4 safety layer | Broker is ours | Still ours; must interpose in .NET instrument layer | Ours |
| R5 decimal/dims | Native | .NET `decimal` limited range/precision; dimension system custom | Native |
| R6 baseline fit | Exact | Introduces .NET runtime + bridge; departs from "Python agent" spirit | Exact |
| R7 footprint | One runtime | Two runtimes (Python + .NET) per station, two update chains | One (OpenTAP optional) |
| R8 ecosystem | None initially (but our drivers are *declarative* data, so reuse is by shared libraries) | Large set of generic steps; few calibration-specific; instrument plugins are C# code, not data | Option value |
| R9 control/licensing | Full control; maintenance burden ours | Third-party roadmap; license/IP to confirm | Balanced |
| Build cost | Moderate: the engine core is small if scope is disciplined (structured IR, no parallelism v1) | Moderate-high: integration + bridging + all calibration semantics anyway | Moderate + small port cost |
| Risk | Under-estimating engine edge cases | Impedance mismatch; bridge failures; dual-stack ops | Port abstraction cost |

## Decision
**Option C with A as the implementation now:** build `calos_engine` as the single execution engine for v1, defined behind `ExecutionEnginePort` so that an OpenTAP adapter can be added without changing procedures or journals. **Do not adopt OpenTAP as the core engine.**

Rationale: the discriminating requirements (R1–R5) are exactly the calibration-specific semantics OpenTAP would not provide and we would have to build anyway; OpenTAP's main strength (a large library of generic .NET instrument/test-step plugins) is largely orthogonal to a *declarative, no-code* instrument model, because our drivers are data, not C#. A second runtime and bridge per station adds operational and security surface.

## Mitigating the risks of building
- Keep the engine small: structured IR only; no parallelism, no arbitrary scripting (NO_CODE_ARCHITECTURE §9).
- Heavy testing: golden vectors, property tests, fault injection at every journal boundary, mutation testing on evaluators.
- `ExecutionEnginePort` + procedure IR are engine-agnostic.

## Time-boxed OpenTAP spike (Phase 1 end, ≤ 2 weeks, outcome recorded as addendum)
1. Verify OT-A1…A5 against current docs/releases.
2. Prototype: compile a trivial procedure IR → TapPlan; run with a custom step calling our broker over IPC; test kill/restart behavior.
3. Measure: station footprint, install complexity, update path, signing options.
4. Output: go/no-go for an optional **OpenTAP interop adapter** (e.g., exposing existing OpenTAP steps as Class B "step provider" or exporting procedures as TapPlans) — not a core replacement.

## Revisit triggers
- A customer requirement for broad reuse of existing OpenTAP plugins/test plans.
- Verified OpenTAP support for crash-safe resume and pluggable journals.
- Engine maintenance cost exceeds budget for two consecutive quarters.
- Need for parallel multi-instrument sequencing that exceeds our engine roadmap.

## Addendum — No-Code mandate
The mandate raises the cost of B further (the designer's output must map losslessly into OpenTAP concepts *and* retain our static guarantees) and raises the value of A (the IR is the product). The recommendation is unchanged and reinforced.

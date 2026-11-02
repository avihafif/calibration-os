# 03 — Component architecture (product target)

The prototype is **not** the production structure; this describes how the product should be built so it stays inside the No-Code architecture and package boundaries (AGENTS §3). **Do not copy prototype code into production packages.**

## Packages (proposed split)
| Package | Responsibility | May import |
|---|---|---|
| `packages/ts/designers/procedure` | Canvas, outline, palette, dock, review panels (React) | `editor-core`, `ui-kit`, `i18n`, `domain-types`, `expr-presentation` via **injected host ports** |
| `packages/ts/editor-core` (existing) | Command stack (undo/redo), schema-driven inspector, validation presentation | — |
| `packages/ts/designers/driver` | Command Builder | same |
| `packages/ts/designers/metrology`, `…/safety` | Metrology and Safety workspaces | same |
| `packages/ts/designers/sim-lab` | Simulation Lab UI (trace, vars, wire log, prompt, resume, report preview) | host port `SimulationPort` |
| `packages/ts/expr-presentation` | Presentation subset of the expression language | must pass the shared conformance vectors |
| `calos_procedure` (Python, existing target) | Authoritative validation (PR-/DRV- codes), tree ops, diff/classification | `calos_domain`, `calos_expr`, `calos_metadata` |
| `calos_engine`, `calos_simulator` | Interpreter and seeded simulator **server/station side** | ports only |

## Host ports (injected, never `api-client` directly)
`ProcedureStore` (load/save drafts, versions), `ValidationPort` (authoritative validation; the client may preview), `CatalogPort` (step catalogue, schemas, hints), `DriverLibraryPort`, `MetrologyPort`, `SafetyPort` (read-only AHL, profile lifecycle), `ReviewPort` (workflow, step-up), `SimulationPort` (start/step/pause/inject/resume/stream events), `I18nPort`, `PermissionPort`.

## Authoritative vs presentation
Validation, hazard/coverage/effective-limit, diff classification and all simulation run **server-side or in the engine**; the UI shows results and never decides safety. The prototype computes them client-side only because it has no backend (**D-10**: where simulation runs — central vs station — is open; central must not talk to instruments, simulator only).

## Editor state
Command stack with merge window for typing (prototype: 900 ms); every structural op is one command; selection and focus restored after re-render; live-region announcements are part of the command result.

## View-model contract
One `ProcedureViewModel` (flat list with id, lane, slot, depth, parent) feeds canvas and outline so they cannot diverge; a test must assert identical id order.

## Generic inspector
Step forms come from `schemas/` + `catalog/` hints. New widgets are registered (`expression`, `select-from`, `op-args`, `duration`, `error-policy`, `resume-policy`, `bound`) with schema contracts; adding a step must not require a new screen.

## Simulation Lab contract
Event stream = the journal (hash-chained, gapless `seq`); UI renders `kind`, `node`, detail; every record carries `simulated: true`; the report object has `simulated=true, issued=false, approvable=false` and a non-optional watermark list. Resume parity (interrupted+resumed = uninterrupted) is a required engine test.

## Security notes for implementers
No `innerHTML`/`eval`; strict CSP; no secrets in fixtures; RLS on any tenant tables; audit events for state changes; Test/Production separation (ADR-0024): authoring only in Test.

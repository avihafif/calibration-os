# 03 — Component architecture (product target)

The prototype is **not** the production structure; this describes how the product should be built inside the No-Code architecture and accepted ADR-0001 A1–A4 boundaries. **Never import or bundle `design/` into production packages or copy prototype code.** The Procedure Designer remains a later, separately gated work package.

## Packages (one `designers` workspace package)
| Package | Responsibility | May import |
|---|---|---|
| `packages/ts/designers` (internal `procedure/`, `driver/`, `metrology/`, `safety/`, `sim-lab/`, `inspector/`) | React workspaces and inspector rendering; internal boundaries enforced by path patterns | `editor-core`, `ui-kit`, `i18n`, `domain-types`, `expr-presentation` via **injected host ports** |
| `packages/ts/editor-core` | Framework-neutral command stack and `InspectorModel` (hint interpretation, field tree, validation binding); no React or `ui-kit` | `domain-types`, `expr-presentation` |
| `packages/ts/expr-presentation` | Presentation subset of the expression language | `domain-types`; shared conformance vectors |
| `calos_procedure` (Python, existing target) | Authoritative validation (PR-/DRV- codes), tree ops, diff/classification | `calos_domain`, `calos_expr`, `calos_metadata` |
| `calos_engine`, `calos_simulator` | Interpreter and seeded simulator **server/station side** | ports only |

The complete TypeScript import table is [ARCHITECTURE §6.1](../ARCHITECTURE.md#61-dependency-rules-enforced-in-ci).
`apps/web` is the only product importer of `api-client`; no production
package imports `apps/web` or `design/`. Prototype checks run in separate
design CI and do not count as product tests.

## Host ports (injected, never `api-client` directly)
`ProcedureStore` (load/save drafts, versions), `ValidationPort` (authoritative validation; the client may preview), `CatalogPort` (step catalogue, schemas, hints), `DriverLibraryPort`, `MetrologyPort`, `SafetyPort` (read-only AHL, profile lifecycle), `ReviewPort` (workflow, step-up), `SimulationPort` (start/step/pause/inject/resume/stream events), `I18nPort`, `PermissionPort`.

## Authoritative vs presentation
Validation, hazard/coverage/effective-limit, diff classification and all simulation run **server-side or in the engine**; the UI shows results and never decides safety. The prototype computes them client-side only because it has no backend (**PD-DEC-004**: where simulation runs — central vs station — is open; central must not talk to instruments, simulator only).

## Editor state
Command stack with merge window for typing (prototype: 900 ms); every structural op is one command; selection and focus restored after re-render; live-region announcements are part of the command result.

## View-model contract
One `ProcedureViewModel` (flat list with id, lane, slot, depth, parent) feeds canvas and outline so they cannot diverge; a test must assert identical id order.

## Generic inspector
Step forms come from `schemas/` + `catalog/` hints. The framework-neutral
inspector model lives in `editor-core`; `designers/inspector` renders it with
React and `ui-kit` primitives. Proposed widgets (`expression`, `select-from`,
`op-args`, `duration`, `error-policy`, `resume-policy`, `bound`) cannot be
registered or consumed until H-2/GA0-16 approves one authoritative closed
vocabulary with schema contracts. Adding a step must not require a new screen.

## Simulation Lab contract
Event stream = the journal (hash-chained, gapless `seq`); UI renders `kind`, `node`, detail; every record carries `simulated: true`; the report object has `simulated=true, issued=false, approvable=false` and a non-optional watermark list. Resume parity (interrupted+resumed = uninterrupted) is a required engine test.

## Security notes for implementers
No `innerHTML`/`eval`; strict CSP; no secrets in fixtures; RLS on any tenant tables; audit events for state changes; Test/Production separation (ADR-0024): authoring only in Test.

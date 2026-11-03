# AGENTS.md — Working rules for AI coding agents and contributors

> **Repository status: Phase 0A/0B simulation-only skeleton.** Specifications
> remain in [`docs/`](docs/README.md). The original command list in §6 is a
> target list; use the verified subset below and do not infer production readiness.

## 1. What this product is
**CalOS** — a *No-Code-First, metadata-driven* Calibration Operating System: central services (FastAPI + PostgreSQL + React/TS) and a Windows **Station Agent** (Python + PyVISA) that runs calibrations offline. Calibration applications (instruments, SCPI drivers, procedures, metrology, screens, reports) are **versioned configuration** built in the visual Application Builder and interpreted by a small **trusted runtime**. Code is for the runtime and for rare **Trusted Technical Plugins** (Class B).

Read first, in order: `docs/NO_CODE_ARCHITECTURE.md` → `docs/ARCHITECTURE.md` → `docs/PRODUCT_REQUIREMENTS.md` → the spec for the area you touch. If two documents conflict, **NO_CODE_ARCHITECTURE wins**, then ARCHITECTURE; open an issue/ADR rather than silently choosing.

## 2. Non-negotiable rules

1. **Never invent metrology.** No instrument specifications, accuracy figures, tolerances, test points, ranges, environmental limits, uncertainty values, safety limits, calibration intervals, standards data, or rounding rules — not from memory, not "typical values", not copied from the web. Missing value ⇒ use the `{"$input":"MI-nn"}` marker, add/extend an entry in `docs/METROLOGY_REQUIREMENTS.md §12`, and ask a human. Demo values are only allowed as user-authored `synthetic_demo` configuration, never in code or schemas.
2. **Never represent simulation as calibration.** Simulation is propagated (`simulated` flags), watermarked by the renderer, non-approvable. Do not add code paths that let simulation data reach issued reports/approvals. Do not make the watermark optional.
3. **No-Code boundary (B-1…B-7 in NO_CODE_ARCHITECTURE §2.1).**
   - No instrument-, manufacturer-, model-, customer-, or method-specific logic in runtime packages (`if model == "34401A"` is a defect). A lint test enforces this.
   - Do not hardcode procedures, drivers, UI screens, report templates, translations of authored content, or business rules that are supposed to be configuration. If a capability is missing, **add a building block** (catalog entry + schema + implementation + editor binding + tests) and update `docs/NO_CODE_CAPABILITY_MATRIX.md` — don't special-case one application.
   - Class A content contains no executable code. No `eval`, scripts, raw HTML/JS, or SQL in configuration.
4. **Safety is outside editable content (ADR-0023).** Two tiers: *Absolute Hardware Limits* (signed Hardware Limits Pack, read-only, enforced by loader + Instrument Broker, **never** editable or overridable by any configuration/API/admin) and *Safety Profiles* (governed config that may only narrow). Effective limit = AHL ∩ profile ∩ procedure bounds. Never add a bypass, override flag, "skip safety" option, debug backdoor, or any path that writes AHL or widens limits. Fail closed. LSMA authors profiles, Safety Officer approves (+ Quality Manager if compliance-affecting); platform admins and execution roles never approve or edit.
5. **Free-form SCPI never originates from procedures, UI or operators.** Procedures call named driver operations with typed parameters. Wire traffic goes only through the Broker.
6. **Central never talks to instruments.** No endpoint, worker or import path from `apps/api`/central packages to transport adapters.
7. **Immutability.** Published config versions, approved results, audit and journal events are append-only. Never write code that UPDATEs/DELETEs them. Corrections are new versions/revisions.
8. **Decimals and units.** No binary floats for metrological values anywhere in records, schemas, APIs or evaluation. Quantities are `Decimal` + unit with dimension checks. Intervals require explicit inclusivity (no default).
9. **Determinism.** Expression evaluation and limit logic must be pure and reproducible: no clock, randomness, I/O, locale dependence. Randomness exists only in the simulator (seeded).
10. **Secrets** never in code, config items, logs, fixtures, diagnostics, or error messages.
11. **Tenant isolation.** Every tenant-scoped table has `tenant_id` + RLS + a test. Never bypass RLS in app code.
12. **Do not change the baseline stack silently.** Baseline: React+TS, Python+FastAPI, PostgreSQL, Windows Station Agent (Python+PyVISA), independently versioned plugins, Docker for central, offline-capable station. Extensions E1–E6 (SQLite at station, Postgres-backed queue, S3-compatible object store, OpenTelemetry, listed tooling, Ed25519/TUF-style signing) are **accepted** (ADR-0022) — don't add other infrastructure without a new ADR.

13. **Test and Production are separate deployments (ADR-0024).** Never share a database, volume, network, secret, key, queue, trust root or station between them; never add an authoring/draft/edit path that works in Production (`PRODUCTION_CHANGE_CONTROL`); never copy production data into Test; configuration crosses only as a verified, independently approved Release Package. Preserve the isolation test.
14. **No role bypass.** Do not add code that lets a platform administrator, migration role, or support path alter approvals, versions, audit, or role conflicts. Toxic role combinations and dual-control grants are enforced in code, not just policy.

## 3. Repository layout and boundaries
See `docs/ARCHITECTURE.md §6`. Summary:

```
apps/{api,station-agent,web}      composition roots; never import each other
packages/py/calos_*               domain → expr → metadata → procedure → engine; driver/transport/simulator; report; sync; security; plugin_sdk (public) / plugin_host
packages/ts/*                     api-client, domain-types (generated), editor-core, designers, ui-runtime, expr-presentation, ui-kit, i18n
schemas/                          JSON Schemas = source of truth (generate Pydantic + TS; never hand-edit generated code)
catalog/                          building-block definitions
content/                          shipped configuration (system UI, shared libraries, demo app package) — produced with the Builder
plugins/                          Class B plugins (import only calos_plugin_sdk)
tests/                            e2e, contract, fault-injection, golden vectors
docs/                             specifications and ADRs
```
Rules: `calos_domain`/`calos_expr` import nothing else from the repo; `calos_engine` depends on ports, never on FastAPI/SQLAlchemy/SQLite/PyVISA; `ui-runtime`/`editor-core`/`designers` use injected host ports (not `api-client` directly). CI enforces with import-linter and eslint-plugin-boundaries — **do not weaken contracts to make a change pass**; fix the design or write an ADR.

## 4. How to do common tasks

### Add or change a configuration kind
1. Update/add JSON Schema in `schemas/<kind>/vN.schema.json` (`additionalProperties:false`).
2. Registry entry (approval policy, change classes, editor hints), semantic validators (with stable codes), migrator if breaking.
3. Fixture corpus (valid + invalid) kept forever; round-trip tests; digest/canonicalization tests.
4. Editor binding (schema-driven inspector hints), API exposure via generic config endpoints (no bespoke endpoints unless justified).
5. Update `docs/PROCEDURE_SCHEMA.md`, `docs/NO_CODE_CAPABILITY_MATRIX.md` (adding a kind is DEV by definition).

### Add a building block (step, function, parser, widget, report block)
Define `type_id@major.minor` in `catalog/`, JSON Schema, implementation in the trusted runtime (or Class B plugin if appropriate), editor metadata (palette group, icon, inspector hints), validators/lint codes, conformance vectors, tests, docs. New expression **functions** declare `metrology_status`; statistical/numerical functions start as `pending_review`.

### Touch the expression engine
Update grammar/semantics docs and the shared conformance vectors **first**; the Python evaluator is authoritative; the TS presentation subset must pass the same vectors. Add property + fuzz tests. Never add I/O, time, randomness, loops, or recursion.

### Touch the driver interpreter / broker
Typed formatting only; reject control characters; every command carries a hazard class; broker order is hazard permission → Safety Profile envelope → state preconditions → write. Add negative tests (injection, out-of-envelope). Do not add a raw-write API reachable from configuration.

### Touch the engine / journal
Every state change is a journal event written *before* effects are visible; events are hash-chained; resume policy semantics (`idempotent|resumable|non_repeatable`) are normative. Add kill-at-boundary tests. Event schema changes need upcasters.

### Write an ADR
`docs/adr/NNNN-title.md` using the template in `docs/adr/README.md`; accepted ADRs are immutable — supersede, don't edit.

## 5. Quality bar (Definition of Done)
- Requirement IDs referenced in code/tests (`@req FR-…`); traceability stays green.
- Tests: unit + property/golden where applicable + negative/security tests + fault-injection for engine/sync changes. Metrology-critical logic requires mutation-tested coverage.
- he/en strings (ICU keys), RTL check, a11y check for UI changes; no hard-coded user-visible strings.
- Audit events for state-changing actions; structured logs with correlation IDs; no secrets/PII in logs.
- Docs and Capability Matrix updated; schemas/codegen in sync; migrations (central: Alembic expand→contract; station: forward-only with backup).
- No new `TODO` without an issue reference; no commented-out code.

## 6. Commands (TARGET — to be created in Phase 0)
```bash
uv sync                       # Python workspace
pnpm install                  # TS workspace
just check                    # lint + types + unit + property + architecture contracts
just test-golden              # expression / limits / report golden vectors
just test-fault               # kill-at-every-journal-boundary + chaos suite
just test-e2e                 # Playwright (he/en, RTL)
just codegen                  # schemas → Pydantic/TS; fails if drift
just docs-trace               # requirement traceability matrix
docker compose --profile core up   # central services
```
If a target command doesn't exist yet, say so rather than inventing output.

**Phase 0A verified subset (2026-11-02, Windows workspace):** after installing
dependencies as described in the repository `README.md`, `uv sync --all-packages
--frozen` (using the workspace-local uv executable), `pnpm install
--frozen-lockfile --store-dir .pnpm-store`, `python tools/check.py`,
`pnpm check:ts`, `pnpm lint:ts`, `pnpm format:ts:check`,
`pnpm test:ts-boundary`, `pnpm build:web`, `ruff check`, `ruff format --check`,
`mypy --strict` on the two core packages, and `lint-imports --no-cache` have
been run successfully. The `just` commands, Docker Compose startup, and
database migration have **not** been verified on this host and remain targets.

**Phase 0B verified subset (2026-11-02):** `python tools/check.py` now includes
the verification-only package, JWT, Ed25519, tamper, authorization and isolation
vectors in `tests/security`. The verifier accepts only injected public trust
snapshots; the API returns `VERIFIER_UNAVAILABLE` without one. Test signing
keys exist in memory during tests only. ADR-0004 and ADR-0014 remain Proposed;
the trust/identity provisioning and their expiry/revocation decisions require
ratification before operational use. No production trust root or private signing
key has been configured. The Phase 0A Compose migrations and shells passed in
GitHub Actions, not on the initial Windows host.

**Phase 0B review note:** the temporary test-key approval is limited to keys
generated in process memory. No ADR-0004/0014 ratifier or approved policy was
named. The PR must remain a verification-only proposal until those decisions
are recorded; the [Phase 0C proposal](docs/PHASE0C_PROPOSAL.md) separates
independent preparatory work from decision-gated trust and identity work.
The [Phase 1A plan](docs/PHASE1A_IMPLEMENTATION_PLAN.md) is conditional on
Phase 0B review/merge and approval of the separate Builder architecture/UX
design; no Builder implementation is present in this branch.
The [Phase 0B security closure matrix](docs/PHASE0B_SECURITY_CLOSURE.md)
records three open High **activation gates** from independent review; the
[Gate A0 checklist](docs/PHASE1A_GATE_A0.md) remains unapproved.

**WP-1A-1a local verification (2026-11-03, Windows workspace):** the bilingual
React demonstration and `packages/ts/i18n` pass `pnpm check:ts`,
`pnpm check:browser-types`, `pnpm lint:ts`, `pnpm lint:logical-css`,
`pnpm test:ts-boundary` (60 negative probes), `pnpm test:frontend` (17 tests),
`pnpm build:web`, `node tools/check_frontend_bundle.mjs` and
`pnpm test:e2e` (one English/Hebrew keyboard, RTL and accessibility browser
test). `pnpm test:schema-vectors` and the existing Python checks pass. The
frozen pnpm install, `pnpm audit`, OSV and licence gates pass on the
228-component CycloneDX SBOM. The two exact transitive release-age exceptions
are recorded in [WP-1A-1a dependency evidence](docs/wp-1a-1a/DEPENDENCY_EVIDENCE.md)
and remain subject to CI and independent PR review. These checks do not open
Gate A0 or enable Builder,
operational signing, storage, hardware or calibration capabilities.

## 7. Style
- Python ≥ 3.12, `mypy --strict` on core packages, `ruff`; Pydantic v2 models generated from `schemas/` where applicable; no global mutable state in the runtime; time/IDs/random via injected ports.
- TypeScript `strict`; no `any` in `ui-runtime`/`editor-core`; React function components; state via query cache + editor command stack; all text via i18n; logical CSS properties only.
- Error handling: typed errors with stable codes (`PR-xxx`, `E_*`, API `code`); never swallow exceptions in the engine.
- Naming: config `key` slugs `kebab-case`; identifiers in procedures `snake_case`.

## 8. Things to ask a human before doing
- Any metrological value, limit, test point, safety limit, interval, or standard data.
- Anything that widens permissions, bypasses governance (approval, SoD), or touches signing keys/trust roots, Trusted Release Issuers, Hardware Limits Packs or the deployment-isolation boundary.
- Adding infrastructure or dependencies outside ADR-0022; adding a dependency with a non-permissive license.
- Weakening a CI gate or architecture contract.
- Using or redistributing vendor documentation, logos or trademarks (Q-08, MI-01).

## 9. Forbidden
Committing secrets; sharing any secret/key/database/network/station between Test and Production; enabling authoring or direct configuration edits in Production; widening, overriding or "temporarily disabling" Absolute Hardware Limits; fabricating test "reference data" and presenting it as real; disabling signature/digest verification "for dev"; adding `debug` backdoors to the broker, journal or approval path; auto-merging conflicts in sync; deleting superseded readings; presenting limit checks as conformity decisions; shipping `synthetic_demo` content in production-targeted packages.

## 10. Where things are specified
| Topic | Document |
|---|---|
| Vision, requirements, acceptance | `docs/PRODUCT_REQUIREMENTS.md` |
| No-code architecture & boundaries | `docs/NO_CODE_ARCHITECTURE.md`, `docs/NO_CODE_CAPABILITY_MATRIX.md` |
| System architecture, flows, failure scenarios, versioning | `docs/ARCHITECTURE.md` |
| Schemas (procedure, driver, safety, simulation, metrology kinds), expression catalog, lint codes | `docs/PROCEDURE_SCHEMA.md` |
| Domain model & invariants | `docs/DOMAIN_MODEL.md` |
| APIs | `docs/API_CONTRACT.md` |
| Builder / Procedure Designer | `docs/VISUAL_APPLICATION_BUILDER_SPEC.md`, `docs/VISUAL_PROCEDURE_DESIGNER_SPEC.md` |
| Governance | `docs/CONFIGURATION_GOVERNANCE.md` |
| Class B plugins & packaging | `docs/PLUGIN_SDK_SPEC.md` |
| Security & threat model | `docs/SECURITY_MODEL.md` |
| Metrology mechanisms & unknown inputs | `docs/METROLOGY_REQUIREMENTS.md` |
| UX/i18n/a11y | `docs/UI_UX_SPEC.md` |
| Roadmap, test strategy, VS-1 & AC-NC criteria | `docs/IMPLEMENTATION_ROADMAP.md` |
| Decisions | `docs/adr/` |

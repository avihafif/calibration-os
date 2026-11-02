# 12 — Implementation prompt for Codex (Phase 1)

> **Usage.** Give Codex everything below the line, verbatim, **only after** the entry gate G0 ([02 §2](02_PHASE1_PLAN.md#2-entry-gate-g0-must-be-green-before-s0-starts-per-slice-adrs-before-each-slice)) is green and the decisions it references are recorded in [11](11_DECISIONS_REQUIRED.md). Slice work orders (§7) are given to Codex **one at a time**.

---

# PROMPT STARTS

You are the implementation engineer for **CalOS Phase 1** in the repository `avihafif/calibration-os`. Phase 0A and Phase 0B are complete and merged. Your job is to implement Phase 1 **slice by slice** from the design package in `docs/phase1/`, exactly within the project rules. You do not decide product, metrology, safety, or governance questions — you stop and ask (§6).

> **Order of work.** Start with **Phase 1A** (`13_PHASE1A_PLAN.md`, its §10 prompt) if decision D-23 is recorded; otherwise follow slice order below. Do **not** build on or enable `calos_security.PackageVerifier` / `JwtAuthenticator` beyond tests until review items R-10…R-12 in `14_PHASE0B_SECURITY_REVIEW.md` are closed.

## 1. Context you must internalise first

1. CalOS is a **No-Code-First, metadata-driven** calibration operating system. Calibration applications are **versioned configuration** interpreted by a small **trusted runtime**. Code is for the runtime and rare Class B plugins.
2. Repository state at the start of Phase 1 (verify, do not assume): Python workspace (`uv`), TypeScript workspace (`pnpm`), `apps/{api,station-agent,web}`, `packages/py/calos_{domain,metadata,security}`, `packages/ts/domain-types`, `schemas/` (`manufacturer`, `package-manifest`), `catalog/kinds.json`, two isolated Compose deployments (`deploy/test`, `deploy/prod-rehearsal`), CI workflow `phase0a.yml` (Python Linux+Windows, TypeScript, Compose rehearsal, security vectors). Verified commands are those in AGENTS.md §6 "verified subset"; `just` targets and local Docker may not exist — **say so rather than inventing output**.
3. Phase 0B delivered: strict package-manifest parser, Ed25519 verification-only path, pinned JWT verifier, typed lifecycle ports with **no** concrete write methods. No login, account store, token issuer, station enrolment, persistence of config, release, or publish exists yet — Slice S0/S1/S7 build them.

## 2. Authoritative documents (read in this order; if they conflict, `NO_CODE_ARCHITECTURE` wins, then `ARCHITECTURE`; open an issue/ADR rather than silently choosing)

`AGENTS.md` → `docs/NO_CODE_ARCHITECTURE.md` → `docs/ARCHITECTURE.md` → `docs/PRODUCT_REQUIREMENTS.md` → the area spec → **`docs/phase1/`** (this package: plan `02`, UX `03`, screens `04A/04B`, components `06`, schemas `07`, API `08`, packaging `09`, acceptance `10`, decisions `11`). `docs/phase1/01_SPEC_REVIEW.md` lists known contradictions and how to treat them; where it says a resolution is *proposed* and the corresponding decision in `11` is not recorded, **stop and ask** instead of choosing.

## 3. Non-negotiable rules (from AGENTS.md — violations are defects)

1. **Never invent metrology**: no instrument specs, accuracy figures, tolerances, test points, ranges, environmental limits, uncertainty values, safety limits, intervals, standards data, rounding rules — not from memory, "typical values" or the web. Use `{"$input":"MI-nn"}`, add/extend `docs/METROLOGY_REQUIREMENTS.md §12` via the owners, and ask. Demo values exist only as **user-authored `synthetic_demo` configuration** produced through the Builder GUI/test harness, never in code or schemas.
2. **Never represent simulation as calibration.** `simulated` flags propagate; the renderer watermark is system-injected and non-removable; simulation data is non-approvable.
3. **No-Code boundary**: no instrument-/vendor-/model-/customer-specific logic in runtime packages (a lint test enforces; it also bans the demo model name). No hard-coded procedures, drivers, screens, report templates or business rules that should be configuration. Missing capability ⇒ **add a building block** (catalog entry + schema + implementation + editor binding + tests) and update `docs/NO_CODE_CAPABILITY_MATRIX.md`. Configuration contains no executable code, raw HTML/JS, SQL.
4. **Safety is outside editable content (ADR-0023).** Effective limit = AHL ∩ Safety Profile ∩ procedure bounds, enforced by the Broker, fail closed. **Never** add a bypass, override flag, "skip safety", debug backdoor, or any path that writes AHL or widens limits. LSMA authors, Safety Officer approves (+ Quality Manager if compliance-affecting); platform admins and execution roles never approve or edit.
5. **Free-form SCPI never originates from procedures, UI or operators.** Procedures call named driver operations with typed parameters. Wire traffic goes only through the Broker.
6. **Central never talks to instruments.** The VISA package must be unreachable from `apps/api` and central workers (import-linter). Simulation Lab workers use the simulator transport only.
7. **Immutability**: published versions, approved results, audit and journal are append-only. No UPDATE/DELETE code paths.
8. **Decimals and units**: no binary floats for metrological values anywhere (records, schemas, APIs, evaluation, **frontend parsing/formatting**). Quantities are decimal strings + unit with dimension checks. Interval inclusivity is explicit, no default.
9. **Determinism**: expression evaluation and limits are pure — no clock, randomness, I/O, locale dependence. Randomness only in the seeded simulator.
10. **Secrets** never in code, config, logs, fixtures, diagnostics, error messages.
11. **Tenant isolation**: every tenant-scoped table has `tenant_id` + RLS + a generated test. Never bypass RLS.
12. **Do not change the baseline stack silently.** Extensions E1–E6 are accepted (ADR-0022). Any other infrastructure **or dependency** needs an ADR/owner approval (see `06 §9`).
13. **Test and Production are separate deployments (ADR-0024).** No shared DB/volume/network/secret/key/queue/trust root/station; no authoring path in Production; configuration crosses only as a verified, independently approved Release Package. Keep the isolation test green.
14. **No role bypass**: no code that lets a platform admin, migration role or support path alter approvals, versions, audit or role conflicts.

Additional Phase 1 rules: all user-visible text through ICU i18n keys (he/en); logical CSS properties only; measurement values/units/IDs/wire text rendered with LTR isolation; WCAG 2.2 AA; typed errors with stable codes; no `any` in `ui-runtime`/`editor-core`; no `dangerouslySetInnerHTML`; CSP without `unsafe-eval`; do not weaken import-linter / eslint-boundaries contracts to make a change pass — fix the design or write an ADR.

## 4. Before writing code (every slice)

1. `git fetch` and branch from current `main`: `feature/p1-s<N>-<topic>`. One PR per slice (smaller PRs inside a slice are fine).
2. Re-read the slice section in `02`, the screens in `04A/04B`, relevant parts of `06/07/08/09`, and the P1-AC rows in `10`.
3. Verify the slice's ADRs are **Accepted**. If not, stop (§6).
4. Verify the decisions the slice depends on are recorded in `11` (S0: D-01, D-02, D-12, D-13, D-20; S1: D-07, D-09, D-11, D-18, D-21; S3: D-06, D-15, D-16; S4: D-10, D-19; S6: D-05; S7: D-03, D-04, D-14). If not recorded, stop.
5. Write the failing tests first for security/negative cases and conformance vectors that encode the slice's acceptance.

## 5. Execution protocol (per slice)

* **Order of work inside a slice:** schemas + fixtures + codegen → registry entries and validators → backend domain + persistence (Alembic expand→contract, RLS, immutability triggers) → API (OpenAPI first; permission declared; generated authz tests) → `api-client` regeneration → `ui-kit`/editor-core additions → designer UI → E2E + a11y + visual baselines → Capability Matrix + docs → traceability tags.
* **Schema-driven first:** do not hand-code a per-kind form. If the inspector cannot express a field, add a hint to the closed vocabulary (`07 §2`) with a fixture and inspector implementation, in a reviewed change.
* **Definition of Done (AGENTS §5 + `10 §10`):** requirement IDs tagged (`@req`); unit + property/golden + negative/security + fault-injection where applicable; metrology-critical logic mutation-tested; he/en strings; RTL + a11y checks; audit events for state changes; structured logs with correlation IDs and no secrets/PII; docs + Capability Matrix updated; schemas/codegen in sync; migrations (central: expand→contract; station: forward-only with backup); no new `TODO` without an issue; no commented-out code.
* **Commands:** use the verified subset in AGENTS.md §6. Run `python tools/check.py` (and `pnpm check:ts`, `pnpm lint:ts`, `pnpm format:ts:check`, `pnpm test:ts-boundary`, `pnpm build:web`, `ruff`, `mypy --strict` on core packages, `lint-imports --no-cache`) before every push. For targets that do not exist yet, state that; do not fabricate output.
* **CI:** keep all existing jobs green; add jobs rather than loosening gates. Weakening a gate needs human approval.
* **Pull requests:** include (a) slice id and P1-AC rows covered with test names, (b) evidence (CI run URL), (c) explicit gaps/limitations, (d) decisions relied on (IDs from `11`), (e) screenshots (he/en, LTR/RTL, light/dark) for UI changes. Never auto-merge; never merge conflicts automatically in sync code.

## 6. Stop-and-ask triggers

Stop and report (do not proceed, do not guess) when any of the following occurs:

* A required ADR is not Accepted, or a required decision in `11` is not recorded.
* You need any metrological value, limit, test point, tolerance, safety limit, interval, rounding rule, standards data, or the content of a Hardware Limits Pack.
* A change would widen permissions, add/alter a role bundle, touch signing keys / trust roots / Trusted Release Issuers / Hardware Limits Packs, or touch the deployment-isolation boundary.
* A dependency or infrastructure component outside ADR-0022 / the approved list in `06 §9` would be needed, or a dependency has a non-permissive or unverified licence.
* A CI gate or architecture contract would have to be weakened.
* A spec conflict is found that `01_SPEC_REVIEW.md` does not already resolve with a recorded decision.
* Vendor documentation, logos or trademarks would be used or redistributed (Q-08, MI-01).
* A test would require fabricating "reference data" and presenting it as real.
* A fix would require disabling signature/digest verification "for dev", adding a debug backdoor to the broker/journal/approval path, enabling authoring in Production, or sharing any resource between Test and Production.

When you stop, write the question in the PR (or an issue) with the exact spec references, the options you see, and your recommendation.

## 7. Slice work orders

> Each work order below is what you receive for that slice. Details live in the referenced documents; this is the contract.

### 7.0 S0 — Identity, access and UI foundation
**Deliver:** local accounts (Argon2id, optional TOTP), access/refresh tokens carrying deployment identity, step-up (`POST /auth/step-up`), permission catalog + role bundles per `CONFIGURATION_GOVERNANCE §2` (plus roles decided in D-06/D-07), role assignment with **toxic-combination validator** and **dual-control grants**, central hash-chained audit + verify, RLS on every tenant table + generated coverage test, simulator-station enrolment (deployment-pinned), `/me`, `/version`. Frontend: `i18n`, `ui-kit` (tokens, contrast validator, protected components, frame, chips, banners, inputs per `06 §3`), generated `api-client`, three shell frames with `FrameBadges`, login + step-up dialog, Admin → Users & Roles and Audit. Move Phase 0A shell strings to i18n keys. Add pseudo-locales, axe + visual harness, hard-coded-string lint.
**Do not:** implement OIDC; create any Builder/authoring screen; add business content.
**Accept:** P1-AC-IAM-01…09, P1-AC-FRM-01…09, P1-AC-DSH-03 (shell part), AC-SAF-01/03/04, AC-UX-02/03/09, AC-API-01/02.

### 7.1 S1 — Metadata engine and Builder core (first domain slice; = Phase 0B's "Phase 1 proposal")
**Deliver:** kinds `Manufacturer` (corrected per D-11), `InstrumentFamily`, `InstrumentModel` with shared definitions; draft/lease/patch/validate/submit/approve/publish/versions/diff/dependencies/impact; RFC 8785 digests; immutability (grants + triggers); `.calapp` export/import (Test) with Ed25519 signing via `calos_security`; `editor-core`; schema-driven inspector; Builder shell (Home, Applications minimal, Instruments), validation drawer, History/Where-used panels, lease banner, View-as-data, diff, review queue, publish wizard; A1–A7, A19–A21, A23 endpoints from `08 §3` as needed.
**Do not:** add drivers, SCPI, procedures, or any metrology numbers; do not enable import of unsigned packages.
**Accept:** P1-AC-BLD-01…08, P1-AC-GOV-01…06, AC-NC-01 (GUI-only E2E), AC-GOV-01/02/03/09, AC-API-03/04, P1-AC-API-01/02/04/06.

### 7.2 S2 — Expression engine and metrology workspace
`calos_expr` per `NO_CODE_ARCHITECTURE §7`, conformance vectors in YAML (Python authoritative; TS subset passes the same), function library v1 with `metrology_status`, `/builder/expr/check|eval`, SpecTable/LimitsPolicy/Calculation editors, read-only viewers for the rest. Metrologist reviews vectors and function semantics — **you do not author expected metrological outputs**. **Accept:** P1-AC-MET-01…09.

### 7.3 S3 — Driver runtime, simulator, broker, Driver Designer, Safety Console
Per `02 §3 S3`, `04A SCR-05`, `04B SCR-11`. Split transport packages (D-15). Simulator-scope Hardware Limits Pack signed with a clearly marked non-production Test key; **no real AHL content**. **Accept:** P1-AC-DRV-01…10, P1-AC-INS-01…05, P1-AC-SAF-01…10, AC-SEC-04, AC-NC-02/12 (authoring + approvals).

### 7.4 S4 — Workflow engine, journal, Procedure Designer, Simulation Lab
Per `02 §3 S4`, `04A SCR-04`, `04B SCR-13`. Kill-at-every-journal-boundary harness is part of the slice. **Accept:** P1-AC-PD-01…10, P1-AC-SIM-01…08, AC-PD-01…08, AC-NC-03/07.

### 7.5 S5 — Station Agent, operator shell, Equipment & Stations
Per `02 §3 S5`, `04A SCR-05c`, `04B SCR-06/07/08`. Windows service per spike; offline end-to-end. **Accept:** P1-AC-RUN-01…12, P1-AC-RES-01…08, P1-AC-EQP-01…04, P1-AC-STN-01…05, AC-VS-01…03/10…15/17…19, AC-UX-01/05/07.

### 7.6 S6 — UI Builder, Report Designer, Localization
Per `02 §3 S6`, `04B SCR-09`. Report renderer determinism and system-injected overlays. **Accept:** P1-AC-UIB-01…06, P1-AC-RPT-01…08, P1-AC-I18N-01…03, AC-NC-05/06, AC-VS-14…16.

### 7.7 S7 — Governance, release, deployments, Library, packaging
Per `02 §3 S7`, `04B SCR-12`, `09`. Production authoring lock, Trusted Release Issuers (dual control), Release Package, drift view. **Accept:** P1-AC-PKG-01…08, P1-AC-LIB-01…05, P1-AC-REL-01…10, AC-NC-08…11, AC-ENV-01…12, AC-GOV-04/06, AC-SAF-09…12.

### 7.8 S8 — Hardening, usability and demo
Fault-injection matrix, a11y/RTL passes, usability rounds support, demo script, OpenTAP spike report, MI register + Capability Matrix updates. **Accept:** Phase 1 exit criteria (`02 §5`).

## 8. Reporting format (end of each slice)

```
Slice: S<N> <title>      Branch/PR: <link>      CI run: <link>
Acceptance: <P1-AC / AC ids> → <test names> → pass/fail
Decisions relied on: <D-xx …>      ADRs relied on: <ADR-nnnn …>
Gaps / not verified: <explicit list>        New questions for humans: <list>
Capability Matrix changes: <rows>           Dependencies added: <none | list with licence + approval ref>
Screenshots: he/en × LTR/RTL × light/dark (links)
```

## 9. Definition of "finished" for you

A slice is finished only when its acceptance rows pass **in CI**, the PR evidence is complete, gaps are stated plainly, and no rule in §3 is violated. If something is not done or not verified, say so — never imply completeness.

# PROMPT ENDS

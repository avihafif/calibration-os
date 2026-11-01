# PRODUCT_REQUIREMENTS.md — Calibration OS ("CalOS")

| | |
|---|---|
| Status | Draft 0.3 — **No-Code-First mandate**; **Q-13 (Safety Profile ownership) and Q-14 (separate Test/Production deployments) RESOLVED** by ADR-0023 / ADR-0024; specification only, no application code exists |
| Audience | Product, engineering, metrology/quality, security, UX |
| Related | [NO_CODE_ARCHITECTURE](NO_CODE_ARCHITECTURE.md) · [NO_CODE_CAPABILITY_MATRIX](NO_CODE_CAPABILITY_MATRIX.md) · [ARCHITECTURE](ARCHITECTURE.md) · [METROLOGY_REQUIREMENTS](METROLOGY_REQUIREMENTS.md) · [SECURITY_MODEL](SECURITY_MODEL.md) · [CONFIGURATION_GOVERNANCE](CONFIGURATION_GOVERNANCE.md) · [IMPLEMENTATION_ROADMAP](IMPLEMENTATION_ROADMAP.md) |

> **Standing rule (applies to every document in this repo).** This specification contains **no instrument specifications, tolerances, test points, or uncertainty values**. Anywhere such a value is needed it is a named *input* tracked in the Unknown Inputs Register ([METROLOGY_REQUIREMENTS §12](METROLOGY_REQUIREMENTS.md#12-unknown-metrology-inputs-register)), supplied by a competent metrologist, and carried with provenance. Numeric literals in examples are **syntax placeholders with no metrological meaning**.

---

> **MANDATORY ARCHITECTURE PRECEDENCE — NO-CODE FIRST.** CalOS is a *No-Code-First, metadata-driven, configuration-driven* platform. Anything that can reasonably be data (instrument definitions, SCPI drivers, procedures, metrology configuration, forms, dashboards, navigation, themes, report/certificate templates, translations, policies, workflows) is a **versioned configuration item** managed through graphical tools, governed by draft → review → publish → immutable lifecycle. Source code is reserved for the *trusted runtime* (generic interpreters/renderers/engines) and for *Trusted Technical Plugins* that add genuinely new building blocks. This requirement overrides any earlier assumption in this set that procedures, drivers or UI would be written as code. See [NO_CODE_ARCHITECTURE](NO_CODE_ARCHITECTURE.md). Requirement groups added for it: FR-NC, FR-PD, FR-META, FR-DRV, FR-EXPR, FR-UIB, FR-RPD, FR-GOV (§6.12).

---

## 1. Vision and problem statement

Calibration laboratories run vendor-specific, hard-to-audit scripts on bench PCs. Procedures drift, evidence is scattered, results are re-keyed into certificates, and nobody can prove which procedure version, reference standard, and software produced a number.

**CalOS** is a *Calibration Operating System*: a central platform plus a local **Station Agent** on each calibration bench, into which **independently versioned calibration applications** for specific instrument models/families are installed. A calibration application is, by default, a **No-Code Application Package** — pure, signed metadata built by a trained calibration engineer in the visual **Application Builder** (Class A). Capabilities that the existing building blocks cannot express are added by **Trusted Technical Plugins** (Class B, signed code). The platform owns everything that must be uniform and defensible — the trusted runtime, execution semantics, evidence, audit, traceability, approvals, immutability, security. Configuration owns everything instrument-, method-, lab-, and customer-specific.

### 1.1 Product principles

1. **Honesty over polish.** A number is never presented with more authority than its provenance supports. Simulation output is *always* labelled as such, in the UI, data, and every report.
2. **No invented metrology.** The platform ships mechanisms, not metrological content. Content is supplied, reviewed, versioned, and attributable.
3. **The bench keeps working.** A station must complete, persist, and resume calibrations with the network down.
4. **Records are evidence.** Approved results are immutable; corrections are new, linked revisions; the audit trail is complete and tamper-evident.
5. **Boundaries over cleverness.** Strict module boundaries, narrow plugin capabilities, no cloud-to-instrument SCPI.
6. **No-Code first, not no-code later.** New instruments, drivers, procedures, metrology content, screens and reports are created by configuration in graphical tools from day one. Code is the exception, confined to signed Technical Plugins and the trusted runtime.
7. **Configuration is a controlled record.** Every configuration is versioned, validated, reviewed, published immutably, dependency-tracked and auditable; changing a formula or rule creates a new version and never alters a historical approved result.
8. **Safety lives outside editable workflows.** Hardware safety limits are enforced by the runtime from separately governed Safety Profiles; no application, procedure, or form can widen them.

### 1.2 Scope of this specification set

In scope: product, architecture, domain, contracts, plugin SDK, procedure schema, security, metrology mechanisms, UX, roadmap, agent working rules.
Out of scope: application source code; any real instrument's specification data; legal/accreditation advice; hardware procurement.

---

## 2. Personas

| ID | Persona | Goals | Key needs |
|---|---|---|---|
| P1 | **Calibration Technician** (station operator) | Calibrate instruments quickly, correctly, repeatably | Guided run console, clear pass/fail, recover from interruptions, works offline, Hebrew/English |
| P2 | **Technical Approver / Authorized Signatory** | Review and approve results with confidence | Complete evidence view, diff vs previous, decision-rule outcome, independent of the executor |
| P3 | **Lab Manager** | Throughput, scheduling, station health, competence control | Fleet dashboard, sync status, who-is-authorized-for-what |
| P4 | **Quality Manager** | Audit-readiness, document control, conformity to quality system | Audit trail, controlled procedures, policy configuration, nonconformity flags |
| P5 | **Calibration Engineer / Application Builder** (metrologist, non-programmer) | Create and maintain calibration applications **without code**: instruments, drivers, procedures, limits, calculations, screens, reports | Visual Application Builder, Driver Designer, Procedure Designer, Report Designer, simulation lab, version compare/rollback |
| P6 | **Technical Plugin Developer** (internal or third-party) | Add building blocks the no-code catalog lacks (new protocol, algorithm, step type) | SDK, conformance harness, signing pipeline. *Not needed for ordinary applications.* |
| P10 | **Safety Officer / Technical Authority** | Approve safety-critical changes; guard hazardous-operation policy; custody of hardware-limit signing | Review queue with hazard-path summary, effective-limit viewer, impact analysis, approvals bound to digests, audit |
| P11 | **Lab Safety / Metrology Administrator** (LSMA) | Create and maintain Safety Profiles (and related metrological safety content) | Safety Console (graphical), validation against hardware limits, impact analysis, submit for approval |
| P7 | **Tenant / Platform Administrator** | Users, RBAC, tenants, labs, updates, secrets | SSO, enrolment, policy, observability, safe updates |
| P8 | **External Auditor / Assessor (read-only)** | Verify traceability and controls | Read-only scoped access, export of audit trail and hash-verification |
| P9 | **Customer (instrument owner)** | Receive a report | Controlled, localized report (future portal) |

---

## 3. Scope boundaries

### 3.1 First vertical slice (VS-1 = MVP) — **committed**

The MVP is **both** the Keysight 34401A demonstration **and** the no-code foundations that produce it. It contains:

**(a) Minimal but working No-Code foundation**
- A **versioned metadata engine** (configuration items, drafts, immutable published versions, dependency graph, content digests, audit) — see [CONFIGURATION_GOVERNANCE](CONFIGURATION_GOVERNANCE.md).
- A **minimal Application Builder** ([VISUAL_APPLICATION_BUILDER_SPEC](VISUAL_APPLICATION_BUILDER_SPEC.md)): instrument-model editor, declarative Driver Designer (SCPI command templates, parsers, identification, simulated responses), Procedure Designer ([VISUAL_PROCEDURE_DESIGNER_SPEC](VISUAL_PROCEDURE_DESIGNER_SPEC.md)) with core step types, spec-table/limits editor, typed expression editor, auto-generated operator screen with basic form customization, minimal report designer, simulation lab, validate/publish/export/import/rollback.
- The Station Agent's **generic runtime**: declarative driver interpreter, workflow engine, expression engine, UI renderer, report renderer.
- **Two separate deployments** (`calos-test`, `calos-prod` rehearsal) with the **Release workflow** (candidate → approvals → signed Release Package → Production import → independent approvals → release → assignment) — ADR-0024.
- **Safety governance**: Safety Console, role separation (LSMA authors, Safety Officer approves, Quality Manager additionally for compliance-affecting changes), and broker enforcement of **Absolute Hardware Limits ∩ Safety Profile** (simulator-scope packs in the MVP) — ADR-0023.

**(b) The 34401A demo calibration application — authored as a No-Code Application Package** (not as hand-written plugin code), operating **entirely against a declaratively-defined simulator**, demonstrating:

1. Instrument discovery (including the simulated instrument being clearly flagged).
2. Simulated identity verification (`*IDN?` parse and model-definition match).
3. A **versioned procedure** (immutable, digest-pinned).
4. Acquisition of **simulated readings** through the real execution path (engine → driver interpreter → broker → transport adapter → simulator).
5. **Limits evaluation** (limit check only; no conformity claim).
6. **Persistence** in the station's local store (journaled).
7. **Resume after interruption** (including hard kill of the agent).
8. A **draft results report** from a designed template, permanently watermarked as simulated and not a calibration certificate.
9. The **ten No-Code acceptance operations** (§10, AC-NC-01…10), performed by a non-programmer in the GUI.

Explicit non-claims for VS-1: not accredited, not validated, not a calibration, no real traceability, no uncertainty statement.

### 3.2 Beyond VS-1 (phased in [IMPLEMENTATION_ROADMAP](IMPLEMENTATION_ROADMAP.md))

Central multi-tenant hardening, full sync, review/approval, immutable sealing of issued results, issued certificates, real transports, Technical Plugin signing infrastructure, OIDC, secure updates, richer designers (dashboards/custom pages, sub-procedure libraries, guard-band/TUR tooling), second vendor application, environment promotion pipelines.

### 3.3 Non-goals (v1)

- Replacing a lab's LIMS/ERP (integration points only).
- Cloud-to-instrument remote control (explicitly prohibited — see SEC principles).
- Automatic adjustment of real instruments without per-application validation and explicit hazard-class authorization.
- A general-purpose programming environment: the builder is a constrained, typed, bounded, safe-by-construction tool, not an IDE. Arbitrary scripting is deliberately excluded from Class A.
- Providing instrument specification databases or uncertainty budgets.
- Acting as an accreditation body deliverable on its own: the lab remains responsible for validating the software within its quality system (ISO/IEC 17025:2017 §6.4, §7.11 — *verify clause numbers against the current edition*).

---

## 4. Assumptions (explicit)

| ID | Assumption | Impact if wrong | Owner to confirm |
|---|---|---|---|
| A-01 | Stations run **Windows 10/11 x64**, managed or semi-managed | Agent packaging/service model changes | Product |
| A-02 | A **VISA implementation** (e.g., vendor I/O libraries) may be installed on stations; `pyvisa-py` is the fallback | Transport coverage (esp. GPIB) shrinks | Engineering |
| A-03 | The physical 34401A offers **GPIB and RS-232** (no native LAN/USB); LAN/USB access would be via gateways/adapters. *Must be verified against the instrument documentation.* | Real-hardware transport tests plan | Metrology/Eng |
| A-04 | SCPI command set for the 34401A will be taken from the official programming reference and **verified**, not recalled | Driver correctness | Plugin dev |
| A-05 | Stations are *trusted-but-verified* edge devices; central never opens inbound connections to stations | Network design | Security |
| A-06 | Each station has a unique enrolled identity; shared station accounts are not permitted | Audit attribution | Security |
| A-07 | Central deployment is Docker Compose first; orchestration (K8s) is a later option | Ops complexity | Platform |
| A-08 | Laboratories operate under their own quality system; CalOS supplies controls and a validation pack, not the quality system | Compliance claims | Quality |
| A-09 | Approval (making a result immutable) requires central connectivity | Offline approval not supported in v1 | Product (Q-05) |
| A-10 | Hebrew and English are launch locales; Hebrew is RTL; measurement values/units remain LTR | UI work | UX |
| A-11 | Station local persistence uses an **embedded SQLite** store. *This is an extension to the stated baseline (PostgreSQL is central); requires confirmation* — see [ADR-0003](adr/0003-station-local-first-journal.md) | Local-first design | Architecture (Q-01) |
| A-12 | A "calibration application" is by default a **No-Code Application Package** (Class A): instruments, declarative SCPI drivers, procedures, metrology config, UI and report templates are **data**. Signed code appears only as **Trusted Technical Plugins** (Class B) that add new building blocks. | Extensibility model | Architecture |
| A-15 | Authoring (the Builder) is an online, central web application that exists **only in Test deployments**; Production has no authoring. Stations consume released configuration offline. | Offline authoring is not a v1 goal | Product (resolved with Q-14 / ADR-0024) |
| A-16 | A **generic SCPI/IEEE-488.2 text protocol** over VISA covers the 34401A and the majority of bench instruments; protocols outside this (binary, proprietary framing) require a Class B plugin. | Capability matrix | Architecture |
| A-17 | Absolute Hardware Limit values and Safety Profile envelope values are supplied by the Safety Officer / LSMA from manufacturer documentation and lab risk assessment, not by engineering (MI-26, MI-33, MI-35). | Safety content | Safety Officer |
| A-18 | Test and Production are **separate deployments** sharing no infrastructure; Phase 0/MVP uses two isolated Docker Compose projects on development infrastructure; Production requires separately secured infrastructure before operational use. | Ops model, release workflow | Product (decided, ADR-0024) |
| A-19 | Named role holders and deputies exist for Lab Safety/Metrology Administrator, Safety Officer / Technical Authority and Quality Manager (MI-34). | Approval availability | Lab management |
| A-13 | Time is synchronized by the OS (NTP/Windows Time); the agent detects, not corrects, skew | Timestamp trust | IT |
| A-14 | Interpretation of the 34401A calibration process (e.g., adjustment, security codes) is out of VS-1 | Scope | Metrology |

## 5. Open product questions

| ID | Question | Needed by |
|---|---|---|
| Q-01 | ~~Confirm SQLite as station local store (baseline extension).~~ **Closed 2026-11-01: accepted (ADR-0022, E1–E6).** | — |
| Q-02 | Are labs accredited under ISO/IEC 17025 at launch? Affects mandatory controls (decision rule statements, CMC handling). | Phase 2 |
| Q-03 | Is 21 CFR Part 11-style electronic signature required for any customer segment? | Phase 2 |
| Q-04 | Retention period for records, evidence, and audit logs (jurisdiction/customer-specific). | Phase 2 |
| Q-05 | Must offline approval be possible (e.g., remote lab with intermittent link)? | Phase 2 |
| Q-06 | Maximum permitted offline duration and staleness policy (revocations, standards due dates). | Phase 2 |
| Q-07 | Offline operator authentication model (cached grant + local PIN vs. none). | Phase 2 |
| Q-08 | Does Keysight (or other vendors) impose trademark/IP constraints on use of model names/logos in a commercial product? | Phase 1 |
| Q-09 | Target scale: stations per tenant, tenants per deployment, runs/day (drives load test targets). | Phase 2 |
| Q-10 | Hosted SaaS, on-prem, or both for commercial launch? | Phase 2 |
| Q-11 | Customer portal for report delivery in scope? | Phase 4 |
| Q-12 | Required report formats beyond PDF (PDF/A, signed PDF, machine-readable)? | Phase 2 |
| Q-13 | ~~Who owns Safety Profiles?~~ **RESOLVED 2026-11-01 → ADR-0023**: LSMA authors; Safety Officer / Technical Authority approves; Quality Manager additionally approves metrological/compliance-affecting changes; Calibration Engineers execute only; Platform Admins cannot bypass approvals; absolute hardware limits are immutable to no-code configuration. | — |
| Q-14 | ~~Environments: partitions or separate deployments?~~ **RESOLVED 2026-11-01 → ADR-0024**: separate Test and Production deployments; explicit approval-and-promotion workflow; no direct production edits. | — |
| Q-15 | Who translates authored content (procedure text, report text) into Hebrew/English — authors, or a translation workflow with reviewers? | Phase 1 |
| Q-16 | Do any customers require the Builder usable fully offline (air-gapped authoring)? | Phase 3 |

---

## 6. Functional requirements

Priority: **M** must, **S** should, **C** could. Phase refers to the roadmap (P1 = VS-1).
Requirement IDs are stable and referenced by tests (`@req FR-…` markers).

### 6.1 Instrument discovery and identity (DISC)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-DISC-01 | The Station Agent enumerates instrument resources via configured transports (LAN, USB, GPIB, serial) and the simulator, presenting resource string, transport, and reachability. | M | P1 (simulator) / P4 (hardware) |
| FR-DISC-02 | Discovery is **read-only**: only identification queries (`*IDN?`) are sent, only to resources inside the operator-approved discovery scope; no state-changing commands. | M | P1 |
| FR-DISC-03 | Identity verification compares the parsed identity (using the model's declarative identification rule) to the published `InstrumentModel` configuration; outcomes are `exact`, `partial` (model matches, firmware/option differs), `mismatch`, `unreachable`. `mismatch` and `unreachable` block the run. | M | P1 |
| FR-DISC-04 | Simulated instruments are always flagged `simulated=true`, identified by a reserved manufacturer/serial convention, and cannot be bound to a real asset record. | M | P1 |
| FR-DISC-05 | A verified instrument is bound to an Asset record by manufacturer+model+serial; unknown serials require an authorized "register asset" action. | S | P2 |

### 6.2 Execution (EXEC)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-EXEC-01 | A run executes exactly one **released** procedure version, pinned by semantic version *and* content digest; the pinned digest is verified at start. | M | P1 |
| FR-EXEC-02 | Execution is a state machine; every transition and measurement is appended to a hash-chained local journal before it takes effect in the UI. | M | P1 |
| FR-EXEC-03 | After interruption (crash, power loss, disconnect, restart) the run can be **resumed** from the last committed step boundary after a reconciliation phase (re-verify identity, re-assert instrument state, safe-state sources). | M | P1 |
| FR-EXEC-04 | Steps declare a repeat policy (`idempotent`, `resumable`, `non_repeatable`). After interruption, `non_repeatable` steps in flight require an explicit, attributed operator decision. | M | P1 |
| FR-EXEC-05 | Operators may pause/abort with a mandatory reason; sources are driven to a declared safe state on abort/fault. | M | P1 |
| FR-EXEC-06 | Each acquisition stores raw instrument response, parsed value, unit, UTC + monotonic timestamps, instrument settings snapshot, and attempt number. Superseded attempts are retained, never deleted. | M | P1 |
| FR-EXEC-07 | Limits evaluation is deterministic, decimal-based, and records inputs, limit source version, and outcome per test point. | M | P1 |
| FR-EXEC-08 | Operator prompts and evidence capture (confirmation, value entry, choice, file/photo) are first-class steps with attribution. | S | P1 (confirm/value) / P2 (files) |
| FR-EXEC-09 | Preconditions gate a run: required standards valid and in date, environmental conditions recorded, warm-up satisfied, operator authorized. Gate policy (block vs. warn) is lab-configurable but defaults to block in production mode. | M | P1 (structure) / P2 (full) |
| FR-EXEC-10 | Runs have `run_mode ∈ {simulation, production}`. Simulation runs can never reach `approved` as a calibration result and can never use a certificate report template. | M | P1 |
| FR-EXEC-11 | Free-form SCPI never originates from a procedure, form, or operator. Wire traffic originates only from (i) **published Driver Definitions** (typed command templates) interpreted by the trusted driver runtime or (ii) signed Class B plugins, always through the **Instrument Broker**, which enforces hazard-class permissions and the Safety Profile envelope. | M | P1 |
| FR-EXEC-12 | The **effective limit = Absolute Hardware Limits ∩ Safety Profile ∩ procedure bounds** is enforced by the broker on every command argument and every output-enabling operation, independent of procedure content; violations fail closed and are journaled (see FR-SAF-03). | M | P1 |
| FR-EXEC-13 | Procedure control flow is structured and bounded (every loop has a maximum iteration count and/or timeout), so termination and resumability are decidable. | M | P1 |

### 6.3 Procedures (PROC)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-PROC-01 | Procedures conform to a published, versioned JSON Schema ([PROCEDURE_SCHEMA](PROCEDURE_SCHEMA.md)). | M | P1 |
| FR-PROC-02 | A released procedure version is immutable; its canonical-JSON SHA-256 digest is its identity. | M | P1 |
| FR-PROC-03 | Quantities carry value (decimal string), unit (controlled registry), range, and tolerance with explicit provenance reference — never bare floats. | M | P1 |
| FR-PROC-04 | Procedures declare required evidence per step/phase; completion is blocked if required evidence is absent. | M | P1 |
| FR-PROC-05 | A static validator ("lint") runs before release: schema, reference integrity, unit dimensional consistency, unreachable steps, undeclared capability use, missing provenance. | M | P1 |
| FR-PROC-06 | Release workflow: draft → in review → released → deprecated → withdrawn, with author ≠ approver and audit. | S | P2 |
| FR-PROC-07 | Procedure version classification: any change to test points, limits, method order, units, or decision rule is a *major* or *minor* change that requires review; editorial-only changes are *patch*. | M | P2 |

### 6.4 Packages and plugins (PLUG)

Two installable classes (see [NO_CODE_ARCHITECTURE §3](NO_CODE_ARCHITECTURE.md#3-the-two-extension-classes)): **Class A — Application Packages** (`.calapp`, metadata only) and **Class B — Trusted Technical Plugins** (`.calplug`, signed code). Requirements below apply to *both* classes unless marked "(B)". Ordinary application creation and maintenance **must not** require Class B.

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-PLUG-01 | Plugins are distributed as packages with a **signed manifest** verified against a trust root before install and again before load. | M | P1 (local signing) / P3 (infrastructure) |
| FR-PLUG-02 | Manifests declare **capabilities** (transports, SCPI command patterns, filesystem, network, instrument families); undeclared use is denied at runtime. | M | P1 |
| FR-PLUG-03 | Compatibility checks (platform API, SDK API, procedure schema, OS/agent version, dependencies) run at install, at enable, and at run start. | M | P1 |
| FR-PLUG-04 | (B) Plugin code executes in an **isolated process** brokered by the agent. Class A packages contain no executable code and run only inside the trusted runtime. | M | P1 |
| FR-PLUG-08 | Application Packages declare the building-block versions they require (auto-computed by the Builder); the platform computes which stations/labs are compatible and explains incompatibilities. | M | P1 |
| FR-PLUG-09 | Application Packages can be exported and imported as signed, content-addressed bundles including their full dependency closure. | M | P1 |
| FR-PLUG-05 | Multiple plugin versions coexist; each run pins the exact plugin versions + digests used. | M | P1 |
| FR-PLUG-06 | Revocation: a compromised key or plugin version can be revoked; stations honor revocation lists subject to staleness policy. | M | P3 |
| FR-PLUG-07 | Labs explicitly enable plugin versions for their stations (change-controlled). | S | P2 |

### 6.5 Metrology (MET)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-MET-01 | Uncertainty budgets are versioned, approved records (components, distributions, sensitivity coefficients, sources). The platform ships **no** default budgets. | M | P2 (model P1 stub) |
| FR-MET-02 | Reference standards are registered with calibration certificate references, due dates, and traceability chain; use of an overdue/withdrawn standard is blocked. | M | P2 |
| FR-MET-03 | Decision rules are explicit, versioned entities (simple acceptance, guard-banded, etc.); a *conformity statement* requires an approved rule **and** an approved uncertainty evaluation. Otherwise the system emits a *limit check* only. | M | P1 (limit check) / P2 (conformity) |
| FR-MET-04 | **As Found / As Left** are distinct, linked datasets within a run; adjustments are recorded as non-repeatable steps with before/after evidence. | M | P1 (model) / P2 (policy) |
| FR-MET-05 | No metrological default: any missing limit, tolerance, test point, or budget causes a validation failure in production mode. | M | P1 |
| FR-MET-06 | Environmental conditions are recorded with units, instrument source, and timestamps and evaluated against procedure-declared requirements. | S | P2 |
| FR-MET-07 | Measurement/rounding/significant-digit rules are explicit and versioned (see METROLOGY_REQUIREMENTS §9). | M | P2 |

### 6.6 Results and audit (RES, AUD)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-RES-01 | Approved results are **immutable** (DB-enforced + hash-sealed snapshot). | M | P2 |
| FR-RES-02 | Corrections create a new *revision* linked to the superseded one with a mandatory reason; the original remains retrievable. | M | P2 |
| FR-RES-03 | Review states: draft → submitted → in_review → approved/rejected → superseded/withdrawn. Approver ≠ executor by default. | M | P2 |
| FR-RES-04 | The approved snapshot pins all inputs (procedure digest, plugin digests, standards snapshot, limits/budget/rule versions, raw data digests). | M | P2 |
| FR-AUD-01 | Every state-changing action and every authorization denial on sensitive resources is audited with actor, time, reason, correlation ID. | M | P1 (local) / P2 (central) |
| FR-AUD-02 | The audit trail is hash-chained and verifiable; verification is a built-in function and a CI/ops check. | M | P1 / P2 |
| FR-AUD-03 | Audit export (JSON/CSV) with chain proof for assessors. | S | P2 |

### 6.7 Reports (REP)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-REP-01 | A **draft results report** can be generated from any run at any state, including partial runs. | M | P1 |
| FR-REP-02 | Draft and simulation reports carry a non-removable watermark and banner: *"DRAFT — SIMULATED DATA — NOT A CALIBRATION CERTIFICATE — NOT ACCREDITED/VALIDATED"* (localized). | M | P1 |
| FR-REP-03 | Report templates are versioned, controlled artifacts; a report records template version + digest and source snapshot digest. | M | P1 |
| FR-REP-04 | Rendering is reproducible: same snapshot + template version ⇒ byte-identical content hash (modulo explicit generation metadata). | S | P2 |
| FR-REP-05 | Reports render in Hebrew (RTL) and English. | M | P1 |
| FR-REP-06 | Issued (non-draft) reports are only producible from **approved** snapshots, with controlled numbering. | M | P2 |

### 6.8 Synchronization (SYNC)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-SYNC-01 | Station writes all upstream data to a durable outbox (the journal); delivery is at-least-once, processing is exactly-once-effect via idempotency. | M | P2 (design validated P1) |
| FR-SYNC-02 | Conflicts (duplicate resume, stale basis, integrity mismatch, revoked artifact used) are detected, **quarantined, and surfaced**, never silently merged or dropped. | M | P2 |
| FR-SYNC-03 | Master data (procedures, plugins, standards, policies, revocations) flows down via a monotonic change feed with tombstones. | M | P2 |
| FR-SYNC-04 | Large evidence uploads are chunked/resumable with digest verification. | S | P2 |
| FR-SYNC-05 | Stations enforce a lab-configured staleness gate on safety-relevant master data. | S | P2 |

### 6.9 Security and tenancy (SEC)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-SEC-01 | RBAC with tenant and laboratory scoping; permission-based, auditable decisions ([SECURITY_MODEL](SECURITY_MODEL.md)). | M | P2 |
| FR-SEC-02 | Strong tenant isolation (application + Postgres Row-Level Security). | M | P2 |
| FR-SEC-03 | Local accounts and **optional** OIDC (Authorization Code + PKCE). | M | P2 |
| FR-SEC-04 | Secrets never in source, images, manifests, logs, or plugins; accessed via a `SecretProvider` port. | M | P1 |
| FR-SEC-05 | Station enrolment with per-station keypair; short-lived tokens; revocable. | M | P2 |
| FR-SEC-06 | Secure update channel for agent, plugins, and procedures (signed, rollback-safe). | M | P3–P5 |
| FR-SEC-07 | Electronic signature on approval (if Q-03 = yes). | C | P5 |

### 6.10 User interface (UI)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-UI-01 | Responsive across ≥360 px phones (read-only/approval), tablets, and desktop/touch station displays. | M | P1 (station) / P2 |
| FR-UI-02 | Full Hebrew/English localization with correct RTL mirroring; LTR isolation for measurements/units/identifiers. | M | P1 |
| FR-UI-03 | Station Operator Console: discovery → identity → procedure → preflight → guided run → results → draft report → resume. Run screens are **rendered from published UI configuration** (auto-generated default per procedure, customizable per application). | M | P1 |
| FR-UI-07 | The platform's own screens are built on the same metadata renderer wherever practical (system configuration is shipped read-only and customizable only through governed extension points). | S | P2 |
| FR-UI-04 | Central admin console: fleet, assets, standards, procedures, plugins, runs, review queue, audit, users. | M | P2 |
| FR-UI-05 | WCAG 2.2 AA conformance target; keyboard operable; non-color status cues. | M | P1 |
| FR-UI-06 | A persistent, unmissable **SIMULATION** indicator on every screen of a simulation run. | M | P1 |

### 6.11 Operations (OPS)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-OPS-01 | Structured JSON logs with correlation (`tenant_id`, `lab_id`, `station_id`, `run_id`, `trace_id`); secrets and PII redaction. | M | P1 |
| FR-OPS-02 | One-click **diagnostics bundle** (redacted logs, config, versions, journal integrity report). | M | P1 |
| FR-OPS-03 | Health/readiness endpoints and Prometheus-compatible metrics; OpenTelemetry tracing. | M | P2 |
| FR-OPS-04 | Backup/restore and disaster-recovery procedures for central DB and artifacts, with tested restores. | M | P5 |

### 6.12 No-Code platform (NC, META, DRV, EXPR, UIB, RPD, GOV) — **foundational, MVP**

**Application Builder (NC)** — detail in [VISUAL_APPLICATION_BUILDER_SPEC](VISUAL_APPLICATION_BUILDER_SPEC.md)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-NC-01 | Authorized users create **calibration applications** graphically: manufacturers, instrument families, models, capabilities, installed options, required reference standards and station requirements. | M | P1 (models, standards roles) |
| FR-NC-02 | A trained calibration engineer builds a complete application for a supported protocol **without writing code, SQL, or command-line operations**. | M | P1 |
| FR-NC-03 | Applications can be previewed, simulated, validated, versioned, published, cloned, and composed from shared reusable components. | M | P1 (clone/compose basic) |
| FR-NC-04 | Applications export/import as complete signed packages. | M | P1 |
| FR-NC-05 | The Builder performs **dependency tracking and impact analysis** before publish. | M | P1 (basic) / P2 |
| FR-NC-06 | The 34401A demo is authored and maintained **with** the Builder; no demo-specific code paths exist in the platform. | M | P1 |

**Procedure Designer** — detail in [VISUAL_PROCEDURE_DESIGNER_SPEC](VISUAL_PROCEDURE_DESIGNER_SPEC.md)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-PD-01 | Drag-and-drop workflow canvas with measurement, setup, teardown, manual-instruction, instrument-command, calculation, decision and evidence nodes. | M | P1 |
| FR-PD-02 | Conditional branches, bounded loops, delays, retries, controlled error handling (`try/handle`), reusable sub-procedures. | M | P1 (branch/loop/delay/retry/subprocedure) |
| FR-PD-03 | Typed variables and parameter binding; measurement calculations via the typed expression engine. | M | P1 |
| FR-PD-04 | Configurable pass/fail (limit-check) criteria; As Found / As Left phases; controlled adjustment and repair steps. | M | P1 (phases) / P2 (adjust policy) |
| FR-PD-05 | Pause/resume/recovery logic is configured per node (resume policy) and validated by the designer. | M | P1 |
| FR-PD-06 | Simulation and debugging: breakpoints, step-through, variable inspector, fault injection, using the production engine. | M | P1 (basic) |
| FR-PD-07 | Version comparison (structural diff) and rollback. | M | P1 |

**Metadata engine (META) and governance (GOV)** — detail in [CONFIGURATION_GOVERNANCE](CONFIGURATION_GOVERNANCE.md)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-META-01 | All configuration is stored as typed **Configuration Items** validated against registered, versioned schemas. | M | P1 |
| FR-META-02 | Lifecycle: **Draft → In Review → Approved → Published → Deprecated/Withdrawn**. Published versions are **immutable**; edits create new versions. | M | P1 |
| FR-META-03 | References between published items are pinned to exact versions with digests; floating references exist only in drafts and are resolved at publish. | M | P1 |
| FR-META-04 | Schema evolution via versioned migrations that produce **new** drafts; historical published versions are never rewritten. | M | P1 (mechanism) |
| FR-META-05 | Dependency graph with forward/reverse queries (what uses X; what does X need). | M | P1 |
| FR-META-06 | Safe multi-user editing: per-draft edit lease, optimistic concurrency, presence, conflict-safe forking. | M | P1 (lease + optimistic) |
| FR-GOV-01 | RBAC on every configuration kind and action (author, review, approve, publish, deploy, rollback). Separation of duties (author ≠ approver). | M | P1 |
| FR-GOV-02 | Complete audit history of configuration changes with diffs. | M | P1 |
| FR-GOV-03 | Validation pipeline blocks publish on any error (schema, semantic, dimension, safety, permission, localization, simulation tests). | M | P1 |
| FR-GOV-04 | **Deployment** is separate from publishing: published versions are *assigned* to labs/stations/channels; assignment is auditable and **rollback is re-assignment** to an earlier approved version. | M | P1 |
| FR-GOV-05 | Test and Production are **separate deployments** (FR-ENV); promotion only through the Release workflow with signed packages; identical digests prove content identity across deployments. | M | P1 |
| FR-GOV-06 | Scheduled configuration backups and verified restore. | S | P2 |
| FR-GOV-07 | Offline distribution: stations receive signed, content-addressed configuration bundles, stage and activate them without interrupting in-flight runs. | M | P1 (local-signed) / P2 |

**Driver Designer (DRV)** — SCPI/instrument driver, no code

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-DRV-01 | Declarative **Driver Definitions**: connection profiles (VISA resource patterns, LAN/USB/GPIB/serial settings through supported adapters), timeouts, terminators, retries, identification rule, init/teardown. | M | P1 |
| FR-DRV-02 | **Command templates** with typed, bounded parameters, formatting rules, and **declarative response parsers** (number-with-unit, enum map, delimited lists, regex groups, IEEE 488.2 block, status/event register bits). | M | P1 |
| FR-DRV-03 | Reusable **command libraries** (shared across models/families). | M | P1 (basic) |
| FR-DRV-04 | Each command is classified with a **hazard class** (H0 read-only … H4 system/destructive); authoring/using H2+ requires explicit permissions and review. | M | P1 |
| FR-DRV-05 | **Simulated instrument responses** are authored declaratively (response rules, state variables, noise/drift models, fault injection) and run by the generic simulator. | M | P1 |
| FR-DRV-06 | **Communication test and diagnostics** tool (sandboxed, audited; H0 only unless specially permitted; never available inside production runs). | M | P1 (H0) |
| FR-DRV-07 | **Safety Profiles** are separate, separately governed items (ADR-0023) enforced by the broker, narrow-only within **Absolute Hardware Limits**, and not editable from procedures or applications. | M | P1 |

**Typed expression engine (EXPR)**

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-EXPR-01 | A **typed, dimension-checked, deterministic, terminating** expression language for calculations, conditions, limits, bindings and visibility rules. No I/O, no loops, no recursion, no user code. | M | P1 |
| FR-EXPR-02 | Expressions compile to a canonical AST (stored, hashed); evaluation is reproducible across platforms. | M | P1 |
| FR-EXPR-03 | Function library is versioned; new functions arrive only via platform release or Class B plugin. | M | P1 |
| FR-EXPR-04 | Changing a formula, limit table, correction, or decision rule produces a new controlled version; historical approved results continue to reference the old version and are never recomputed in place. | M | P1 |

**UI/Form Builder (UIB)** — detail in [VISUAL_APPLICATION_BUILDER_SPEC §7](VISUAL_APPLICATION_BUILDER_SPEC.md#7-ui-and-form-builder)

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-UIB-01 | Forms, fields, tables/columns, validation rules, conditional visibility, instrument-specific operator screens, custom pages, menus/navigation, dashboards/widgets are metadata rendered by a generic runtime from an approved component registry. | M | P1 (forms, tables, operator screens) / P2 (dashboards, pages, menus) |
| FR-UIB-02 | Theming and branding (colors, logos, typography tokens) with contrast validation. | S | P2 |
| FR-UIB-03 | Localization: translation bundles, completeness check, RTL preview. | M | P1 |
| FR-UIB-04 | UI configuration cannot execute arbitrary script; actions are drawn from an approved action catalog. | M | P1 |

**Report/Certificate Designer (RPD)**

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-RPD-01 | Drag-and-drop report designer: layout, branding, dynamic data binding, conditional sections, tables, charts, signature blocks, multiple languages, PDF export. | M | P1 (minimal) / P2 |
| FR-RPD-02 | Templates bind to a **versioned Report Dataset contract**; templates are validated against it. | M | P1 |
| FR-RPD-03 | Approved certificates retain the exact template version/digest and dataset snapshot used. | M | P2 |
| FR-RPD-04 | Simulation watermark and "not a certificate" blocks are **system-injected** by the renderer and cannot be removed by template design. | M | P1 |
| FR-RPD-05 | Approval workflows and electronic signatures configured declaratively (Q-03). | S | P2–P5 |

**Safety ownership and hardware limits (SAF)** — ADR-0023

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-SAF-01 | Role-based ownership: LSMA creates/maintains Safety Profiles; Safety Officer / Technical Authority approves safety-critical changes; Quality Manager additionally approves changes affecting metrological or compliance requirements; Calibration Engineers execute approved profiles but cannot modify them; Platform Administrators cannot bypass mandatory safety approvals. | M | P1 |
| FR-SAF-02 | Safety Profile approval rules: author ≠ approver; Safety Officer approval always; Quality Manager approval when the change is classified metrological/compliance-affecting (computed, raise-only); lab policy may tighten. Approvals bind to the frozen snapshot digest. | M | P1 |
| FR-SAF-03 | **Absolute Hardware Limits (AHL)** are held in a signed Hardware Limits Pack, verified and enforced by trusted components (loader + broker). They cannot be created, edited, widened, narrowed or overridden by any configuration, procedure, UI, API or administrator. Effective limit = AHL ∩ Safety Profile ∩ procedure bounds. Missing AHL ⇒ H2+ on real transports blocked (fail closed). | M | P1 (enforcement, simulator-scope pack) / P4 (real packs) |
| FR-SAF-04 | Safety Profiles require versioning, audit trail, approval workflow, impact analysis, and controlled deployment (canary → stable) with rollback by re-assignment. | M | P1 |
| FR-SAF-05 | No change during calibration: runs pin profile versions and the pack digest; execution roles have no write path; a withdrawn pinned profile halts the run at the next node boundary into safe-state and it cannot resume under that profile. | M | P1 |
| FR-SAF-06 | The role-assignment validator rejects toxic combinations (platform admin with `safety.*`/approval permissions; LSMA with Safety Officer for the same lab). Grants of safety/approval roles use dual control and are audited. | M | P1 (validator) / P2 (full workflow) |
| FR-SAF-07 | The **Safety Console** (graphical) supports profile authoring, narrow-only validation against AHL, effective-limit inspection, hazard-path coverage, impact analysis, and hardware-limits candidate authoring; the signing ceremony itself uses offline keys. | M | P1 (console) / P4 (candidate + ceremony for real packs) |

**Deployments and release management (ENV)** — ADR-0024

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-ENV-01 | Test and Production are separate deployments with separate databases, credentials, secrets/KMS, signing keys, trust roots, execution agents, audit chains, object stores and backups. | M | P1 (isolated Compose rehearsal) |
| FR-ENV-02 | Each deployment has an immutable identity `{deployment_id, environment_kind}` embedded in signed metadata, tokens, journals and audit; agents and services reject any mismatch. | M | P1 |
| FR-ENV-03 | Test supports simulations, draft applications and validation workflows (`simulation` and `validation` run modes; validation only on allow-listed test instruments; never approvable/issuable). Production permits only `production` runs. | M | P1 |
| FR-ENV-04 | Production permits only approved, signed and validated application versions imported through the Release workflow; no drafts, no authoring, no direct configuration edits (`PRODUCTION_CHANGE_CONTROL`). | M | P1 |
| FR-ENV-05 | Release workflow: candidate → Test approvals → signed Release Package → Production import and verification → Production-mode validation → Production approvals (importer ≠ approver) → release → canary → stable. | M | P1 |
| FR-ENV-06 | Test agents cannot access production instruments or production data; stations are pinned to one deployment; run/production data never flows to Test. | M | P1 |
| FR-ENV-07 | Non-content production settings (lab policies, trusted issuers, thresholds) change only through audited, approved Change Requests. | M | P1 (basic) / P2 |
| FR-ENV-08 | Trusted Release Issuers (Test release-signing public keys) are managed under dual control (Platform Admin proposes; Quality Manager and Safety Officer approve). | M | P1 |
| FR-ENV-09 | Phase 0/MVP: isolated Docker Compose deployments on development infrastructure with an automated isolation test; production requires separately secured infrastructure before operational deployment (gate). | M | P0/P1; gate P4/P5 |
| FR-ENV-10 | All of the above (release management, approvals, issuer trust, change requests, deployment identity display, assignment, rollback) is operable through graphical interfaces without source or database edits. | M | P1 |

---

## 7. Non-functional requirements

| ID | Category | Requirement | Verification |
|---|---|---|---|
| NFR-01 | Durability | No acknowledged measurement is lost on process kill or power loss (after journal commit). | Fault-injection test: kill -9 at every journal boundary |
| NFR-02 | Offline | Station completes a full run and draft report with no network. | E2E with network blocked |
| NFR-03 | Integrity | Any alteration of journal or audit entries is detected by chain verification. | Tamper tests |
| NFR-04 | Determinism | Same inputs ⇒ same limits outcome across platforms/versions of the engine (golden vectors). | Golden tests, property tests |
| NFR-05 | Isolation | A crashing/hanging plugin cannot crash the agent or corrupt the journal. | Chaos tests |
| NFR-06 | Security | No critical/high findings open at release (SAST, SCA, container scan, pen test). | CI gates, pen test report |
| NFR-07 | Scalability | Target to be set from Q-09; architecture must scale central API horizontally and sync linearly with stations. | Load tests (k6/Locust) |
| NFR-08 | Availability | Central outage does not stop any station run. Central target availability is a deployment decision (Q-10). | Chaos / game days |
| NFR-09 | Performance | Local UI actions respond in a perceptually immediate time; journal commit overhead per reading must not bound instrument throughput (budget to be derived from instrument/SCPI timing in Phase 1 measurements). | Benchmarks |
| NFR-10 | Accessibility | WCAG 2.2 AA. | axe + manual audit |
| NFR-11 | Localization | No hard-coded user-visible strings; pseudo-localization and RTL snapshot tests in CI. | CI |
| NFR-12 | Maintainability | Module boundaries enforced by tooling in CI; no cyclic dependencies. | import-linter, eslint-boundaries |
| NFR-13 | Observability | Every run reconstructable from journal + logs by `run_id`. | Runbook drill |
| NFR-14 | Portability | Central services run via Docker Compose on Linux x64; agent on Windows x64. | CI matrix |
| NFR-15 | Supply chain | SBOM (CycloneDX) per build artifact; signed releases; pinned dependencies. | CI |
| NFR-16 | No-code coverage | ≥ the share of ordinary application-maintenance tasks defined in the Capability Matrix are achievable without code; every "DEV" row has a justification. | Capability matrix review per release |
| NFR-17 | Expression determinism | Expression results are bit-identical across Python versions/OS for golden vectors; evaluation always terminates within a bounded cost. | Golden + fuzz tests |
| NFR-18 | Configuration integrity | Any stored published configuration whose digest does not match content is rejected by server and station. | Tamper tests |
| NFR-19 | Builder usability | Non-programmer calibration experts complete the 10 acceptance operations unaided; success criteria in roadmap. | Moderated usability test |
| NFR-20 | Safe preview | Builder preview/simulation can never reach a real instrument or production data. | Network/permission tests |
| NFR-21 | Deployment isolation | No shared database, volume, network, secret, key, queue, object store or trust root between Test and Production; cross-deployment tokens, manifests and packages (other than verified Release Packages) are rejected. | Automated isolation test (CI) + deployment review |
| NFR-22 | Safety fail-closed | Any missing, unverifiable, expired or mismatching safety artifact (AHL pack, Safety Profile, signature) results in refusal of H2+ operations; no configuration or admin path overrides AHL. | Negative tests, fuzzing of loader |

---

## 8. Constraints inherited from the brief

- **Baseline stack is fixed**: React + TypeScript; Python + FastAPI; PostgreSQL; Windows Station Agent (Python + PyVISA); independently versioned plugins; Docker for central services; local offline-capable station.
- **Proposed extensions** (embedded SQLite at station, Postgres-backed job queue, S3-compatible object store, OpenTelemetry, tooling choices) are listed in [ARCHITECTURE §3](ARCHITECTURE.md#3-baseline-conformance-and-proposed-extensions) and require acceptance. None replaces a baseline element.
- **Execution engine**: build-vs-OpenTAP is evaluated in [ADR-0002](adr/0002-execution-engine-build-vs-opentap.md); the recommendation does not change the baseline. The No-Code mandate strengthens the "own metadata-interpreting engine" option (see ADR-0002 addendum).
- **Q-13 and Q-14 are binding decisions** (ADR-0023, ADR-0024): role-based safety ownership with separation of duties and immutable hardware limits; separate Test and Production deployments. They preserve No-Code First: all management is graphical; only the signed hardware-limit boundary and infrastructure provisioning sit outside no-code configuration, by design.
- **No-Code First is mandatory** (this document's header). It adds architecture (metadata engine, interpreters, builders) on top of the baseline stack without replacing any baseline element.

---

## 9. Success metrics

| Metric | Definition | Target (to set after pilot) |
|---|---|---|
| Time-to-first-run for a new plugin | SDK install → conformance-passing simulated run | TBD |
| Interrupted-run recovery rate | % of fault-injected runs resumed with zero data loss | 100% in test suite |
| Audit chain verification | Pass rate of scheduled verification | 100% |
| Operator task success | Usability test success on core flows (he/en) | TBD from UX research |
| Defects escaping to production in metrology-critical code | Count | 0 known at release |

---

## 10. Product-level acceptance criteria

Detailed slice criteria are in [IMPLEMENTATION_ROADMAP §4](IMPLEMENTATION_ROADMAP.md#4-vertical-slice-1-acceptance-criteria). Product-level criteria for general availability:

| ID | Criterion |
|---|---|
| AC-GA-01 | Every **M** requirement has at least one automated test tagged with its ID, and a traceability matrix is generated in CI. |
| AC-GA-02 | No simulation-originated record can be rendered, exported, or approved without the simulation marking (negative tests across API, UI, report, export). |
| AC-GA-03 | A full multi-station offline soak (days of simulated disconnects, duplicates, reorderings) ends with zero lost, zero duplicated, and every conflict surfaced. |
| AC-GA-04 | Cross-tenant and cross-lab access tests (generated per table/endpoint) all deny. |
| AC-GA-05 | An independent security assessment reports no unresolved critical/high issues. |
| AC-GA-06 | A metrologist-signed review confirms that every shipped metrological content item has provenance, and that none is invented by engineering. |
| AC-GA-07 | A lab can follow the validation pack to produce its own software-validation record. |

### 10.1 Mandatory No-Code acceptance (AC-NC)

A non-programmer with calibration expertise, using only the GUI (no source edits, no command line, no manual database edits), performs all of the following. Each is an automated end-to-end scenario **and** a moderated usability task ([IMPLEMENTATION_ROADMAP §5](IMPLEMENTATION_ROADMAP.md#5-no-code-acceptance-scenarios)).

| ID | Operation |
|---|---|
| AC-NC-01 | Create a new instrument model (manufacturer, family, model, options, capabilities). |
| AC-NC-02 | Define its supported communication configuration (connection profile, identification rule, timeouts, command templates, parsers). |
| AC-NC-03 | Build a calibration procedure from reusable visual steps. |
| AC-NC-04 | Configure standards (roles), measurements, limits, and calculations. |
| AC-NC-05 | Create the operator interface. |
| AC-NC-06 | Design the results report. |
| AC-NC-07 | Test the application against a simulator. |
| AC-NC-08 | Publish and install it on a compatible calibration station. |
| AC-NC-09 | Modify and republish it as a new version. |
| AC-NC-10 | Roll back to an earlier approved version. |

Additional no-code governance scenarios (also GUI-only) are **AC-NC-11** (release a package from Test to a Production deployment through the Release workflow) and **AC-NC-12** (author, review and approve a Safety Profile with LSMA / Safety Officer / Quality Manager roles) — see [IMPLEMENTATION_ROADMAP §5](IMPLEMENTATION_ROADMAP.md#5-no-code-acceptance-scenarios). Environment and safety acceptance criteria are **AC-ENV-01…12** and **AC-SAF-01…12** (roadmap §4.6–4.7).

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **As Found / As Left** | Measurement results before any adjustment / after adjustment (or equal to As Found if none). |
| **Calibration application** | A plugin (or set) providing procedures + driver(s) for an instrument model/family. |
| **Capability** | A declared, enforced permission of a plugin (e.g., `transport:gpib`, `scpi:allow:MEAS*`). |
| **Decision rule** | Documented rule for stating conformity considering measurement uncertainty (ILAC G8; JCGM 106). |
| **Journal** | Append-only, hash-chained local event log; source of truth for a run. |
| **Limit check** | Comparison of a result to a limit without uncertainty/decision rule. Informational only. |
| **Run** | One execution of a procedure version against an instrument. |
| **Deployment** | One complete, independent CalOS installation (Test or Production) with its own identity, data, keys and agents. |
| **Release Package** | Signed bundle (`.calapp` + release manifest + validation evidence) that is the only way configuration moves from Test to Production. |
| **Absolute Hardware Limits (AHL)** | Immutable, signed per-instrument limits enforced by trusted components; no configuration can override them. |
| **Safety Profile** | Governed no-code configuration that may only narrow operation within the AHL. |
| **Station** | A bench PC running the Station Agent and attached to instruments. |
| **UUT / DUT / IUT** | Unit/Device/Instrument under test. |
| **Simulation mode** | Run mode where instruments are simulated; output is never a calibration. |

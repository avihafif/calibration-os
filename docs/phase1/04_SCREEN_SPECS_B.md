# 04B — Screen specifications (2/2): Stations · Runner · Results · Reports · Admin · Safety / Release / Simulation consoles

| | |
|---|---|
| Status | Proposal. Same conventions and universal states as [04A](04_SCREEN_SPECS_A.md). Placeholders only — no metrology values. |

---

## SCR-06 · Test Station Manager (Equipment & Stations)

**Purpose.** (a) *Design* what a calibration application needs from the bench: reference-equipment roles and station requirements; (b) *manage* the enrolled stations that will run it: capability reports, compatibility, activation state. Two surfaces.

| Surface | Shell | Phase | Permissions |
|---|---|---|---|
| **6a. Equipment & Stations designer** | Builder | P1 (S5) | `config.draft.instrument` (StandardRole, StationRequirement) |
| **6b. Stations (minimal)** | Admin | P1 (S5/S7) | `station.admin` (enrol/revoke), `station.view`, `deploy.view` |
| Reference standards register, certificates, validity | Admin | **P2** (FR-MET-02) | — |

### 6a. Equipment & Stations designer

```
┌ Equipment & Stations ──────────────────  [Standard roles | Station requirements] ───────────────────────┐
│ Standard roles                                                          [+ New role] [Clone…]         │
│ ┌ ref_source ─────────────────────────────────────────────────────────────────────────────────────┐   │
│ │ Title (he/en) · Kind: standard · Required capability: quantity⟨…⟩  range [Input required MI-06]    │   │
│ │ Max uncertainty [Input required MI-06] · Allowed models [+ pick InstrumentModel versions]          │   │
│ │ Simulated substitute: [SimulationProfile ▾]  (shown with [SIMULATED] chip)                          │   │
│ │ Used by: {n} procedures   [Where used]                                                              │   │
│ └─────────────────────────────────────────────────────────────────────────────────────────────────┘   │
│ Station requirements (kind StationRequirement — proposed body, 07 §4)                                  │
│ Transports needed: [simulator ☑] [visa ☐]  ·  Plugins: none  ·  Runtime ≥ {computed}  ·  Catalog {…}    │
│ Environment sensors / manual-entry fields (names only, no limits: MI-15)                               │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Rules.** Required capability values are *always* `Input required` or user-supplied with provenance; the designer never suggests values. Roles reference `InstrumentModel` versions by pinned range; `simulated_substitute` is available only for `simulation` intended modes (PR-024 for production).
* **Binding in procedures.** The Procedure Designer's role picker lists these roles; binding to concrete instruments happens at run start on the station (Start-calibration wizard step 3).
* **API.** Generic `/config/*` for `StandardRole`, `StationRequirement`.
* **Acceptance.** P1-AC-EQP-01…04, AC-NC-04 (role bound), AC-NC-08 (compatibility).

### 6b. Stations (minimal)

```
┌ Stations ──────────────────────────────────────────  [+ Enrolment token] ┐
│ Name       State        Deployment  Agent   Last seen   Active manifest    │
│ {station}  ● Enrolled   TEST        {ver}   {time}      {app} v{x} sha:…   │
│ {station}  ○ Revoked    TEST        {ver}   {time}      —                  │
│ ▸ Detail drawer: capability report (runtime, catalog majors+minors, plugins, schema versions,│
│   transports available) · compatibility with chosen package · activation history · [Revoke]  │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Rules.** Stations are **pinned to one deployment**: attempting to enrol across deployments shows `DEPLOYMENT_MISMATCH` with explanation (AC-ENV-03). A Test station lists only the simulator and the allow-listed test instruments (MI-36 pending; simulator only in P1). Enrolment token is one-time, shown once, with expiry; revoke requires reason and step-up. No "send command to instrument" control exists anywhere (AC-API-06).
* **API.** `GET/POST /stations`, `POST /stations/enrolment-tokens`, `POST /stations/{id}/revoke`, `GET /stations/{id}/capability-report`, `GET /config/compat`.
* **Acceptance.** AC-ENV-03, AC-NC-08, P1-AC-STN-01…05.

---

## SCR-07 · Calibration Runner (Operator)

**Purpose.** Let a technician start, run, pause, resume and finish a calibration with calm clarity, offline, and with mode and safety status always visible.

* **Users/permissions.** Operator authorization for procedure/hazard (Authorization matrix MI-21 – roles only in P1). **Phase:** P1 (S5).
* **Spec basis.** `UI_UX_SPEC §7.3–§7.5`, `API_CONTRACT §4`. This section adds layout zones, state rules and keyboard/touch behaviour.

### 7.1 Start-calibration wizard
`① Instrument (identity verified) → ② Application & procedure (only compatible & active; version + short digest) → ③ Bind standards (role → standard; validity chips; simulated substitute shown for simulation) → ④ Preflight gates (pass / warn / block with reason and source reference) → ⑤ Confirm mode`.
* **Mode confirmation** explains SIMULATION in plain language; production-only gates are greyed with explanation in simulation. In a Production deployment the mode step is absent (only `production`); in Test, `simulation` or `validation` (validation limited to allow-listed instruments).
* Preflight response renders every gate from `POST /runs` (standards validity, config status vs mode, safety profile **and** AHL coverage, deployment identity/run-mode permitted, compatibility, authorization, staleness, resource availability). A `block` stops the wizard; `warn` requires acknowledgement with reason.

### 7.2 Run console

```
┌ ▌SIMULATION · NOT A CALIBRATION ▐ ────────── Run {id} · {application} v{x} (sha256:{short}) ─────────────┐
│ Phase: {As Found} ▸ Point {i} of {n}        State: RUNNING       Elapsed {t}        [Pause] [Abort…]     │
├────────────────────────────┬────────────────────────────────────────────────────────────────────────────┤
│ Steps                      │ NOW                                                                        │
│ ✔ Setup                    │  {node title — localized}                                                  │
│ ▾ As Found                 │  Acquiring readings ({k}/{n})…                                             │
│   ✔ TP1 ✔ TP2 ▶ TP3 ○ …   │  Reading  ‎{value} {unit}        Nominal ‎{value} {unit}                     │
│ ○ Teardown                 │  Deviation ‎{value} {unit}       Limit check  ⏳ pending                    │
│                            ├────────────────────────────────────────────────────────────────────────────┤
│ Evidence                   │ Readings (live)  [attempt 1]   # │ value │ time │ status                     │
│ ▫ Environment ✔            ├────────────────────────────────────────────────────────────────────────────┤
│ ▫ Instrument state ✔       │ Operator panel — prompts appear here and stay until answered               │
├────────────────────────────┴────────────────────────────────────────────────────────────────────────────┤
│ Event log ▾ · Safety: no violations · Journal ✔ verified · Sync: offline (queued {n})                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Zones.** *Top status strip* (non-themeable SIMULATION banner; run identity with pinned version + digest); *Steps* (left/logical start); *Now* (what to do next + live values); *Readings*; *Operator panel* (prompts: instruct/confirm/input/choice); *Footer* (event log, safety status, journal verification, sync).
* **Rules.** Values, units, IDs are `bdi dir="ltr"`. Prompts never auto-dismiss; responses attributed. Pause only at node boundaries (or cooperative mid-node where declared). Abort requires a reason and runs `teardown`/`safe_state`; the console shows what safe-state did. A `safety.violation` shows an assertive, persistent banner with the violated envelope source (AHL / Safety Profile / procedure bound), the action taken, and no override control. Hazard prompts name the consequence.
* **Touch/keyboard.** Comfortable density, ≥44 px targets; primary action reachable by keyboard focus order; no hover-only controls.
* **API.** Local: `POST /runs`, `/start|pause|abort`, `GET /runs/{id}/events` (SSE), `GET /runs/{id}/ui-model`, `POST …/prompts/{id}/respond`.
* **Acceptance.** AC-UX-01/05/07, AC-VS-04…13, P1-AC-RUN-01…12.

### 7.3 Resume after interruption
Home modal per `UI_UX_SPEC §7.5`: what was saved (N readings, nodes completed), interruption cause/time, **reconcile plan** (identity re-check, instrument-state re-assert, safe-state), **decisions required** for `non_repeatable` nodes (consequence text, attributed choice, journaled), buttons Resume (primary) / Abort run / View details. Each reconcile check shows live progress. The plan displayed must equal the engine's computed plan (contract test, AC-UX-07). Resume with a different instrument serial is blocked with explanation (AC-VS-13).

---

## SCR-08 · Measurement Results

**Purpose.** Show what was measured, how it relates to limits, and what is *not* claimed. In Phase 1 results are **drafts only**: no approval, sealing or issuance (those are P2).

* **Users.** P1 Technician (station); P5 Engineer (Simulation Lab results view); P2 Approver (P2).

```
┌ Results · Run {id}                       [Generate draft report]  [Export draft] ┐
│ ▌SIMULATED DATA — NOT A CALIBRATION ▐   Mode: simulation · Config {v/digest}      │
│ Phase tabs: [As Found] [Adjustment†] [As Left†]       † if present                  │
│ ┌ Points ───────────────────────────────────────────────────────────────────────┐ │
│ │ ID │ Nominal │ Reading (aggregate) │ Deviation │ Limit band (lo…hi, incl.) │ Limit check            │ │
│ │ {id}│ {q}     │ {q} (n={k})         │ {q}       │ {q}…{q} [✓lo ✓hi]         │ Within limits | Outside limits | Not evaluated │ │
│ └───────────────────────────────────────────────────────────────────────────────┘ │
│ Evaluation statements                                                              │
│  Uncertainty: not evaluated   ·   Conformity: not evaluated — no approved uncertainty budget │
│ Attempts & superseded readings ▸  Evidence ▸  Journal ✔ verified ▸  Standards snapshot ▸ │
└────────────────────────────────────────────────────────────────────────────────────┘
```
* **Rules.** Labels "Within limits (limit check)" / "Outside limits (limit check)" / "Not evaluated" — never PASS/FAIL/Calibrated (UI_UX_SPEC §11). Inclusivity of each limit boundary is displayed from the pinned configuration. **Unrounded** values are shown with an "unrounded" tag until rounding rules exist (MI-13). Superseded attempts are retained and visible, never deleted. Drill-down: reading → raw text, parsed decimal, unit, UTC + monotonic time, attempt, flags (`simulated`), expression trace for evaluations. Draft report preview is a PDF viewer with the system watermark; export/print keep the watermark.
* **Phase-2 hooks (designed, disabled):** Submit for review, review workspace (evidence viewer, diff vs previous revision, approve/reject with SoD hint), Issued report. Disabled controls explain "Available after Phase 2 — simulation data is never approvable".
* **API.** Local: `GET /runs/{id}`, `GET /runs/{id}/verify`, `POST /runs/{id}/draft-report`; Central read-only: `GET /runs/{id}/readings|evaluations|evidence`.
* **Acceptance.** AC-VS-05/06/14/15, AC-MET-04, P1-AC-RES-01…08.

---

## SCR-09 · Reports and Certificate Designer

**Purpose.** Design `ReportTemplate`s bound to a versioned `ReportDatasetContract`, with locked system-injected safety elements. Phase 1 produces **draft reports only**; certificate (`issued`) rendering is Phase 2.

* **Users/permissions.** `config.draft.report`; approval `config.approve.report` (Quality Manager). **Test only.**

```
┌ Report: {key} · draft r{n}   Dataset: calibration-result@1   Preview: [A4] [he|en] [LTR|RTL] [Sample: nominal|failing|partial] ┐
├────────────────┬──────────────────────────────────────────────────────────────┬─────────────────────────────────────┤
│ Dataset        │ ┌ Page ─────────────────────────────────────────────────────┐│ Inspector                           │
│ explorer       │ │ Header (logo, lab, title)                                  ││ Block: Table                        │
│ ▾ header       │ │ Instrument details  (kv grid)                              ││ Rows: data.as_found.points          │
│ ▾ instrument   │ │ As Found results   (table)                                 ││ Columns [+]  Format: RoundingRule ref│
│ ▾ phases       │ │ ⟨if As Left present⟩ As Left results                       ││ Visible when: [expression]          │
│   as_found     │ │ Evaluation statement                                       ││ Page break: avoid inside            │
│    points[]    │ │ Signatures (placeholder until P2)                          ││ Locale keys ✓  Accessible name ✓    │
│ ▾ evaluations  │ │ Footer — SYSTEM-INJECTED, locked                           ││                                     │
│ ▾ config       │ └────────────────────────────────────────────────────────────┘│                                     │
│ (drag a field) │  ▒▒ SYSTEM-INJECTED, NOT EDITABLE: watermark · banner · draft legend · config footer · integrity code ▒▒│
└────────────────┴──────────────────────────────────────────────────────────────┴─────────────────────────────────────┘
```
* **Blocks (P1):** heading, rich text (restricted subset), kv-grid, table, conditional section, signature *placeholder*, page header/footer, page-break controls. **Deferred:** chart, image/branding asset pipeline, repeater (P2).
* **Dataset explorer.** Contract tree with types; drag a field to bind; unmapped or mistyped bindings flagged (`RPT-` codes, 07 §6).
* **Locked overlays.** Watermark, SIMULATED banner, "not a certificate" legend, config footer and integrity code are rendered as locked overlays; the schema rejects templates that try to define them (AC-VS-16); there is **no toggle**.
* **Preview.** Server-rendered PDF with sample datasets (nominal/failing/partial) or a real run's draft dataset; he/en side-by-side; LTR/RTL; stores `{template digest, dataset digest, renderer version, output digest}`; re-render yields identical content hash (AC-VS-15). Tagged-PDF accessibility check where supported.
* **Certificate templates.** Authorable as `ReportTemplate` with `kind: certificate` in the contract but the preview always renders the draft watermark in P1 and `POST /reports kind=issued` returns `SIMULATION_NOT_APPROVABLE`/not-available (AC-API-07). Signatory roles/workflow definition are P2.
* **Template tests.** Snapshot approvals by digest per sample/locale; changes require re-approval.
* **API.** `/config/*` for `ReportTemplate`/`ReportDatasetContract`, `POST /builder/report-preview`, `POST /builder/translations/check`.
* **RTL/a11y.** Page direction follows template locale; side-by-side compare; fonts with Hebrew coverage embedded; reading order of generated PDF tags verified.
* **Acceptance.** AC-NC-06, AC-VS-14/15/16, AC-MET-04, P1-AC-RPT-01…08.

---

## SCR-10 · Administrative Settings

**Purpose.** Run the deployment safely: users and roles under dual control, deployment identity and policy visibility, trust, change control, audit. Production exposes this shell (no Builder).

| Area | P1 content | Permissions | Notes |
|---|---|---|---|
| **Users & Roles** | User list; role matrix (roles × permissions, read-only catalog); role assignment with live **toxic-combination check**; **privileged grant requests** (propose → distinct approver → effective); competence matrix is roles-only | `user.admin`, `role.admin`, `grant.propose`, `grant.approve` | Platform Admin proposes only; cannot approve (FR-SAF-06). Rejections audited |
| **Deployment** | Read-only identity `{deployment_id, environment_kind}`, version/schema/catalog versions, key fingerprints (public), health | `config.view` | Not a switcher; no secrets shown |
| **Policies** | Viewer of lab policies (gates, staleness, SoD parameters, required locales). Test: edit as `Policy` items via Builder governance; Production: via **Change Requests** | `policy.edit` / `change.request` | P1 policy bodies: required locales, preflight gates, staleness (proposed in 07) |
| **Trusted Issuers** (Production) | List of Trusted Release Issuers (public key fingerprint, label, added-by/approved-by); propose add/rotate/remove; approvals by Quality Manager **and** Safety Officer | `trust.issuer.propose` / `.approve` | Dual control (AC-ENV-08) |
| **Change Requests** | Raise → impact summary → approvals → apply; versioned, rollback-able | `change.request`, `change.approve` | Non-content settings only (FR-ENV-07) |
| **Audit** | Filterable list (actor, entity, action, time), chain verify, export is P2 | `audit.view` | Break-glass events flagged |
| **Localization defaults** | Default locale, required locales (policy) | `policy.edit` | Feeds PR-017 |
| **Telemetry** | UX telemetry opt-out/opt-in (D-17) | `policy.edit` | Off by default in Production |
| **Integrations/SSO, backups, plugins registry, tenants** | Visible as "Phase 2/3" placeholders in nav (disabled with explanation) — not hidden — so scope is honest | — | |

* **Role matrix UX.** Cells show `✓` (granted) / `—`; rows group by domain (config, safety, release, deploy, admin); selecting a role shows *why* a combination is rejected ("Platform Administrator may not hold safety.approve").
* **Grant request UX.** Request form (grantee, role, reason) → approver sees digest of the change, toxic-combination result and SoD status → step-up → effective immediately after approval; pending state visible to all parties.
* **API.** `/users`, `/roles`, `/users/{id}/role-grants`, `/role-grants/{id}/approve|reject`, `/deployment/trusted-issuers`, `/change-requests`, `/audit`, `/audit/verify`, `/policies/{key}`.
* **Acceptance.** AC-SAF-01/03/04, AC-ENV-04/08/09, AC-API-10, P1-AC-ADM-01…10.

---

## Supporting consoles (cross-cutting screens specified here for completeness)

### SCR-11 · Safety Console (Builder → Safety, Test; read-only views in Production)

```
┌ Safety Profile: {key} · draft r{n}   [SIMULATED]    Approval path: Safety Officer ✔ required · Quality Manager ○ not required │
├──────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────┤
│ Applies to: [InstrumentModel versions]│ Envelope: command:{command}.param:{param}   dimension ⟨…⟩                           │
│ Envelopes ({n})  Forbidden ({n})      │   ┌ AHL band (read-only, signed pack {digest short}) ────────────────────────┐        │
│ Required states ({n})  Interlocks ({n})│   │░░░░░░░░░░░░░░░░[ editable envelope ▓▓▓▓▓▓▓ ]░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│        │
│ Safe-state sequence                   │   └─────────────────────────────────────────────────────────────────────────┘        │
│ Coverage: H2+ commands covered {n}/{n}│   min [Input required · MI-26/35]   max [Input required · MI-26/35]                  │
│ Impact analysis ▸  History ▸          │   Effective limit viewer: AHL ∩ profile ∩ procedure bounds → {narrowest}              │
└──────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────┘
```
* **Rules.** AHL band is visually **and programmatically read-only** (`aria-readonly`, no input) and cannot be exceeded: an out-of-band value cannot be saved or submitted and the reason is announced (AC-UX-10, PR-023). If no AHL entry exists for the target, H2+ envelopes are disabled with "controlled release required" and simulator-scope profiles remain editable and marked `[SIMULATED]`. Coverage red blocks real-transport publish and Production release. Approval-path indicator is computed from change classification (raise-only; MI-35). Author/contributors cannot approve. **No override, bypass or "temporarily disable" control exists.**
* **Roles.** LSMA authors (`safety.manage`); Safety Officer approves (`safety.approve`); Quality Manager co-approves compliance-affecting (`safety.approve.compliance`); Calibration Engineers see read-only; Platform Admin sees nothing editable.
* **Hardware-limits candidate** export is stubbed in P1 (simulator-scope only, non-production key, Test only); signing ceremony tooling is P4.
* **Acceptance.** AC-NC-12, AC-SAF-01…12, AC-UX-10, P1-AC-SAF-01…10.

### SCR-12 · Release Management console (Admin; both deployments, different capabilities)

| Stage | Test | Production |
|---|---|---|
| Candidate | Select published package version; attach evidence (validation report, app tests, impact, change class); readiness checklist | — |
| Approvals | Test approvals on digest (QM; Metrology; Safety Officer(+QM) for safety content) | **Independent** approvals again; importer ≠ approver |
| Export / Import | Export signed Release Package; shows checksums | Import (file upload) → issuer/signature/digest/schema/compat verification result with findings |
| Production validation | — | Automatic production-mode pipeline; blocking findings: `synthetic_demo`, simulated profile, unresolved `$input`, `intended_modes` lacks production, untrusted issuer, tampered signature/digest, incompatible versions |
| Release | — | Create versions (`origin=release`, identical digests) |
| Assign | — | Canary → recorded sign-off → stable |
| Drift | — | Test vs Production digests (what is in Production not in Test; approved in Test not released) |

* **UX.** A horizontal **stage tracker** with owner, state, age and next action; every stage has a findings panel (what/why/fix); digest comparison shows identical short hashes side by side with a copy button. Stages cannot be skipped — controls for later stages are disabled with the blocking reason.
* **Acceptance.** AC-NC-11, AC-ENV-05…12, P1-AC-REL-01…10.

### SCR-13 · Simulation Lab (Builder; also docked inside designers)
Scenario picker (`nominal`/`marginal`/`failing`/custom — authored `synthetic_demo`), operator-response panel (interactive; scripted deferred), fault injection (timeout at command N, disconnect, garbled response, error-queue entry, safety-violation attempt), breakpoints/stepping/inspector/trace/wire log/journal view, **Kill & resume** (compares final dataset with uninterrupted run), coverage (deferred), draft report preview, **Application tests** (save run configuration + assertions on outcomes, counts, value ranges *as authored*, absence of safety violations; all must pass to publish). Every artefact is flagged `simulated` and `debug` where applicable and is non-approvable; preview workers have no path to a real transport (NFR-20). **Acceptance:** AC-NC-07, AC-PD-05/06, P1-AC-SIM-01…08.

### SCR-14 · Review queue (Builder → Review & Releases)
List of snapshots needing my permission, sorted by age/required role; detail view = structural diff + validation report + app-test results + impact + readiness + **hazard-path summary** (for safety/hazardous), per-node/field comments, approve/reject on digest with reason (+ step-up). SoD banner explains if the viewer is the author. **Acceptance:** AC-GOV-02/03, AC-API-04, P1-AC-GOV-01…06.

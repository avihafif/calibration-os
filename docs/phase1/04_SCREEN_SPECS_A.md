# 04A — Screen specifications (1/2): Dashboard · Application Library · Application Builder · Procedure Designer · Instrument Manager

| | |
|---|---|
| Status | Proposal. Wireframes are **structure only**: every value shown is a placeholder (`{…}`, `—`) or labelled synthetic. No instrument data, ranges, tolerances or uncertainties are depicted. |
| Conventions | Each screen lists: purpose · users and permissions · Phase 1 scope · layout · regions · interactions and rules · states · data and API · RTL/a11y specifics · acceptance IDs (defined in [10](10_ACCEPTANCE_TESTS.md)). Component names refer to [06 §3](06_COMPONENT_ARCHITECTURE.md#3-ui-kit-component-inventory). Permission names are from `CONFIGURATION_GOVERNANCE §2.1`. |
| Universal states | Every screen supports: **loading** (skeleton) · **empty** (what/why/next action) · **error** (code + retry) · **forbidden** (reason, request-access path) · **offline** (banner, reads cached where allowed) · **read-only** (lease held by another / permission / Production) · **withdrawn/deprecated** (badge + guidance). Only deviations are listed per screen. |

---

## SCR-01 · Main Dashboard

**Purpose.** One place to see *what needs my attention* and *whether the system is in a trustworthy state*. Three variants by shell; the first two ship in Phase 1.

| Variant | Shell | Phase | Users |
|---|---|---|---|
| **A. Builder Home** | Builder | **P1 (S1, extended in S7)** | P5 Calibration Engineer, P11 LSMA, release managers |
| **B. Station Home** | Operator | **P1 (S5)** | P1 Technician |
| **C. Admin Dashboard** | Admin | Designed now; **P2** (only release/governance cards ship in P1 under Admin → Release management) | P3 Lab Manager, P4 Quality Manager, P7 Admin, P10 Safety Officer |

### A. Builder Home

```
┌ Home ───────────────────────────────────────────────────────────────────────────  [+ New application ▾] ┐
│ ┌ My work ──────────────────────────────┐ ┌ Awaiting my review ───────────────┐ ┌ Releases ───────────┐ │
│ │ ▸ {item key}   Draft r23   ● Saved    │ │ ▸ {item}  v{x}  Metrological      │ │ Candidates: {n}     │ │
│ │ ▸ {item key}   Draft r4    ⚠ 2 errors │ │   Needs: metrology.approve        │ │ Awaiting Test appr. │ │
│ │ ▸ {item key}   Lease expires in {t}   │ │   Waiting {age}                   │ │ Awaiting Prod appr. │ │
│ │ [Continue where I left off]           │ │ [Open review queue]               │ │ [Open console]      │ │
│ └───────────────────────────────────────┘ └───────────────────────────────────┘ └─────────────────────┘ │
│ ┌ Validation failures (my drafts) ────────────────────────┐ ┌ Readiness blockers ─────────────────────┐ │
│ │ PR-006 Dimension error  · {procedure} · node {id}  [Go] │ │ Input required (MI-nn) ×{n}             │ │
│ │ PR-013 Unresolved input · {spec table}          [Go]    │ │ synthetic_demo content ×{n}             │ │
│ └─────────────────────────────────────────────────────────┘ │ pending_review functions ×{n}           │ │
│ ┌ Recent activity ─────────────────────────────────────────┐ └─────────────────────────────────────────┘ │
│ │ {user} published {item} v{x} · {time}      Audit ▸       │ ┌ Platform ───────────────────────────────┐ │
│ └──────────────────────────────────────────────────────────┘ │ Catalog {ver} · Runtime min {ver} · TEST │ │
│                                                              └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Regions/components.** `WorkQueueCard` (drafts, leases, errors), `ReviewQueueCard` (items needing *my* permission, with required-approver chips and age), `ReleaseSummaryCard`, `ValidationFailuresCard`, `ReadinessBlockersCard` (counts by kind: Input required, `synthetic_demo`, `pending_review`, unverified commands), `ActivityFeed`, `PlatformInfoCard`.
* **Rules.** Cards appear only if the user holds a relevant permission; counts come from a **single aggregate** (`GET /me/work-queue`, 08 §3) so the page makes one request. Review queue items the user *authored* are shown but marked "You cannot approve (author)". The readiness blockers card never offers "dismiss".
* **States.** First run: guided empty state with a three-step "Create your first application" checklist (Instrument → Driver → Procedure) and a link to the Library to clone an example. Production: this variant does not exist (Builder absent).
* **API.** `GET /me/work-queue`, `GET /config/items?filter[status]=…`, `GET /releases`, `GET /audit?limit=…`, `GET /version`.
* **RTL/a11y.** Card grid reflows (CSS grid, logical order); each card is a landmark `region` with heading; counts have text labels; "Go" links describe their target.
* **Acceptance.** P1-AC-DSH-01/02.

### B. Station Home (Operator)

```
┌ ▌SIMULATION AVAILABLE ▐  Station {name}  ● Connected | ◐ Offline ─────────────  EN|עב ┐
│ ┌ Needs attention ─────────────────────────────────────────────────────────────────┐  │
│ │ ⚠ Run {id} was interrupted at "{node title}" ({time})            [Review & resume] │  │
│ └──────────────────────────────────────────────────────────────────────────────────┘  │
│  [ ▶ Start calibration ]            Active configuration                               │
│                                     {application} v{x} sha256:{short}  ● active        │
│  Instruments seen: {n} (SIM {n})    Sync: last {time} · queued {n}   Journal ✔ verified │
│  Recent runs ▸ {run} {state} {mode}                                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
* **Rules.** The interrupted-run card is the first element and cannot be hidden (UI_UX_SPEC §7.1). "Start calibration" is disabled with reason when no compatible active application exists. Simulation indicator present whenever simulator scope is selected.
* **API.** Station Local API `GET /status`, `GET /config/active`, `GET /runs`, `GET /instruments`.
* **Acceptance.** AC-UX-01/05/07, P1-AC-DSH-03.

### C. Admin Dashboard (design for P2; shell in P1)
Cards: fleet health & sync lag · runs by state · awaiting review · deployments in progress · drift (Test vs Production digests) · alerts · approvals aging (MI-34 deputies). Layout reuses card grid; every card has a drill-down list with the shared table pattern. In P1 only **Releases**, **Drift** and **Approvals aging** cards are live (Release management console, SCR-12).

---

## SCR-02 · Application Library ("Marketplace" in Phase 1 = deployment-local)

**Purpose.** Discover, inspect, clone, import and export calibration applications and shared components *within this deployment*. A cross-organisation marketplace is **not** built in Phase 1 (F-05, D-03); the information model and trust tiers are designed so it can be added without rework ([09 §6](09_PACKAGING_AND_PUBLISHING.md#6-library-trust-tiers-and-the-future-marketplace)).

* **Users/permissions.** `config.view` to browse; `config.draft.*` to clone; `package.export` to export; `package.import` (Test) to import `.calapp`; Production Library is read-only and lists *released* versions with `origin = release`.
* **Entry points.** Builder → Library; Builder → Applications → "Clone from…"; Builder Home empty state.

```
┌ Library ────────────────────────────────  [Import .calapp] ──────────────────────────────┐
│ Search…  Kind ▾  Instrument family ▾  Trust ▾  Status ▾  Modes ▾         ☷ Cards | ▤ List │
│ ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐   │
│ │ {application title}      │ │ {application title}      │ │ {shared sub-procedure}   │   │
│ │ [Platform-shipped] v{x}  │ │ [Lab-authored] v{x}      │ │ [Lab-authored] v{x}      │   │
│ │ ⚠ synthetic_demo         │ │ ● Published  Sim only    │ │ Used by {n} applications │   │
│ │ Requires: catalog {…}    │ │ Compatible stations {n}  │ │                          │   │
│ │ [Open] [Clone]           │ │ [Open] [Clone] [Export]  │ │ [Open] [Insert as ref…]  │   │
│ └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Detail drawer** (right/logical end): description, **trust tier** chip, publisher & signature status, digest, intended modes, requirements (catalog/runtime/plugins/transports), dependency closure, provenance summary (counts of `synthetic_demo`/`draft`/`verified`/`approved`), validation report digest, release lineage (`origin=release(<deployment>, digest)`), version list, "Where deployed".
* **Trust tiers (proposal, 09 §6):** *Platform-shipped* (signed by the platform) · *Lab-authored* (published in this deployment) · *Imported release* (verified Release Package from a Trusted Issuer; Production) · *External/unverified* (**not available in P1**).
* **Actions.** Clone as draft (`derived_from` lineage; new keys; Test only) · Export `.calapp` · Import (verifies signature, digests, schemas, compat; unsigned/untrusted → blocked in P1) · Insert shared component as **reference** (version-range picker, "upgrade available" badge) or **copy**.
* **Rules.** Cloning never copies approvals or provenance `approved` status downward — cloned fields reset to `draft` unless `synthetic_demo`. Items with `synthetic_demo` show a persistent chip and are filtered out of Production by construction. No ratings, comments or external downloads in P1.
* **States.** Empty (no applications): explains Library contents and links to "Create application". Filtered-empty: "No applications match; clear filters".
* **API.** `GET /library/entries` (view over items + packages + releases, 08 §3), `GET /config/packages/{id}`, `POST /config/packages/import`, `POST /config/drafts/{id}/fork`, `GET /config/versions/{vid}/impact`.
* **RTL/a11y.** Cards are a list of articles; chips have text; keyboard `Enter` opens the drawer, `Esc` closes.
* **Acceptance.** P1-AC-LIB-01…05, AC-NC-08 (import/export step), AC-ENV-06.

---

## SCR-03 · No-Code Application Builder (Application workspace)

**Purpose.** Compose, validate, test and publish an `ApplicationManifest` — the unit of packaging and deployment. This is the hub from which every designer is entered.

* **Users/permissions.** `config.draft.*` per component group; `config.submit`; `package.build`. **Test deployment only.**
* **Spec basis.** `BUILDER §3`, §13 MVP cut; this section adds the creation wizard, readiness model and concrete states.

### 3.1 Creation wizard ("Guided, not blank")

```
 ① Choose instrument  →  ② Define or choose driver  →  ③ Procedure (template or build)  →  ④ Metrology
 →  ⑤ Operator screen  →  ⑥ Report  →  ⑦ Test in Simulation Lab  →  ⑧ Review & publish
 [Progress checklist always visible · every step skippable and revisitable · Save & exit]
```
* Each step shows **why it matters**, **what the platform ships** (e.g., "IEEE 488.2 common command library"), and **what you must supply** with `Input required` counts.
* Templates and "Clone from…" in every step; generated-from-procedure defaults for screen and report so a minimal application is usable after step ③.
* Wizard state is the draft itself (no hidden state): leaving mid-wizard leaves a valid draft with a checklist.

### 3.2 Workspace

```
┌ ‹ Applications / {Application title} · draft r{n}     ● Saved   [Validate] [Run in Simulation Lab] [Submit for review] ┐
├───────────────┬───────────────────────────────────────────────────────────────┬─────────────────────────────────────┤
│ Overview      │ Contents                                    [+ Add component ▾]│ Readiness  (live)                   │
│ Contents  ◄   │ ▸ Instrument model   {key}  v{x}   ✓ Published                 │ Errors ×{n}  Warnings ×{n}          │
│ Requirements  │ ▸ Driver             {key}  draft r{n}  ⚠ 3 unverified cmds    │ Input required ×{n} (MI-nn…)        │
│ Tests         │ ▸ Safety profile     {key}  v{x}  [SIMULATED]                   │ synthetic_demo ×{n}                 │
│ Publish       │ ▸ Procedures ({n})                                           ✓  │ pending_review functions ×{n}       │
│ Versions      │ ▸ Metrology (spec tables, limits policy)  ⚠ synthetic_demo     │ Hazard path: {n} H2+ ops, covered   │
│ Deployments   │ ▸ Screens ({n}) ▸ Report ({n}) ▸ Translations (he {x}% / en)   │ Intended modes                      │
│               │ ▸ Application tests ({n})  last run {state}                     │  ☑ Simulation ☐ Validation ☐ Production│
│               │                                                                 │  Production: blocked by {n} issues  │
└───────────────┴───────────────────────────────────────────────────────────────┴─────────────────────────────────────┘
```

| Tab | Content and rules |
|---|---|
| **Overview** | Title/description (localized), owner, labels, lineage (`derived_from`), current published versions, latest validation state |
| **Contents** | Tree of components with version state; add from Library with version-range picker; "upgrade available" with impact preview; remove with where-used check; open any component in its designer |
| **Requirements** | Computed `requires` (catalog `type_id@major.minor`, runtime min, schema versions, transports, plugins); **Compatible stations** list with reason for each incompatibility (needs plugin / needs agent update / transport missing) |
| **Tests** | `ApplicationTest` list, last result per scenario, run all (Simulation Lab), required-to-publish marker; coverage of scenario kinds (nominal/marginal/failing/interrupt/fault) |
| **Publish** | Readiness checklist → validation pipeline stages 1–11 → version bump (minimum enforced) → localized release notes → pinned dependency preview → publish (see 09 §2) |
| **Versions** | List with status, digest, change class, approvals; compare (kind-aware diff); *Restore as new draft*; deprecate/withdraw (permissioned) |
| **Deployments** | Assignments for this application (target, channel, state) with per-station status; rollback entry (SCR-12) |

* **Rules.**
  * *Intended modes* is **three-state** (F-16); selecting Production runs a live **production readiness** check listing every blocker with a link (`PR-013/014/016/023/024/025`). The Production checkbox is disabled-with-reason while blockers exist.
  * Components are referenced by pinned version at publish; draft shows floating ranges (`^1`) clearly labelled.
  * Everything is a draft until published; "Submit for review" freezes a snapshot digest and shows the required approvals computed from the change class.
  * Hazardous/safety items display a ribbon and route to the Safety Console for approval paths.
* **States.** *Read-only* (lease elsewhere) shows live view + presence and a takeover button. *Imported* applications (from `.calapp`) show origin and cannot be edited until forked into a draft.
* **API.** `GET/PATCH /config/drafts/{id}`, `POST …/validate`, `POST …/submit`, `GET /config/compat`, `GET …/impact`, `POST /builder/app-tests/run`, `POST /config/packages`.
* **RTL/a11y.** Left nav ↔ logical start; readiness panel on logical end; tab order follows reading order; readiness counts live-region polite.
* **Acceptance.** P1-AC-BLD-01…08, AC-NC-01/03/08/09, AC-GOV-01/02/03/09.

### 3.3 Property inspector and View-as-data (shared)
Inspector is generated from the kind's JSON Schema + `x-calos-editor` hints (07 §2): grouped sections, typed pickers, units, expression fields, provenance/Input-required handling, localized text, reference pickers with version ranges, hazard-aware fields. **View as data** is a read-only canonical JSON viewer (with digest) for engineers/auditors; there is no editing path from it (AGENTS rule 3: no code in configuration).

---

## SCR-04 · Visual Procedure Designer

**Purpose.** Build, understand, test, debug, compare and roll back calibration workflows visually, with the tool preventing what code review would otherwise catch (termination, definite assignment, dimensions, hazard visibility, resume behaviour).

* **Users/permissions.** `config.draft.procedure`; hazardous nodes additionally require `driver.author.hazardous`-related rules per catalog (read-only "Permissions" inspector tab). **Test only.**
* **Spec basis.** `VISUAL_PROCEDURE_DESIGNER_SPEC` entire; MVP cut §18. This section fixes layout, region behaviour and states.

```
┌ Procedure: {key} · draft r{n}     ● Saved   [Hazard overlay ☐] [Validate] [▶ Simulate ▾] ──────────────────────────┐
├──────────────┬─────────────────────────────────────────────────────────────┬───────────────────────────────────────┤
│ Palette      │ ┌ Outline ┐ ┌ Canvas  (flow view of the block tree) ────────┐│ Inspector                              │
│ ⌕ search     │ │ ▾ Setup │ │  SETUP                                        ││ [Main][Bindings][Flow][Errors][Resume] │
│ ▸ Flow       │ │ ▾ Phase │ │   (1) Confirm connections [operator.confirm] ││ [Evidence][Operator text][Permissions] │
│ ▸ Instrument │ │  As Fnd │ │  PHASE: As Found                              ││ [Notes]                                │
│ ▸ Operator   │ │   ▾ for │ │   ┌ for each {table row} (max {n}) ─────────┐ ││ Node: measure.acquire  H0 idempotent   │
│ ▸ Compute    │ │     …   │ │   │ (3) Apply source  [source.apply H2 🔒]  │ ││ Role: [uut ▾]  Op: [read ▾]             │
│ ▸ Metrology  │ │ ▾ Tear  │ │   │ (4) Configure UUT [driver.call H1]      │ ││ Count: [expr]  Aggregate: [mean ▾ ⚠pending]│
│ ▸ Phases     │ └─────────┘ │   │ (5) Acquire       [measure.acquire]     │ ││ Resume: idempotent (derived min)       │
│ ▸ Library    │             │   │ (6) Check limits  [evaluate.limits]     │ ││ “After interruption here: re-run node.” │
│              │             │   └─────────────────────────────────────────┘ ││                                         │
│ Variables ▸  │             │  TEARDOWN (always)  ·  SAFE-STATE (abort/fault)││                                         │
├──────────────┴─────────────┴───────────────────────────────────────────────┴┴───────────────────────────────────────┤
│ Analysis (n errors · n warnings) │ Hazard path │ Recovery matrix │ Wire log │ Journal │ Variables │ Expression trace  │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Regions

| Region | Behaviour |
|---|---|
| **Palette** | Catalog groups (Flow, Instrument, Operator, Compute, Metrology, Phases, Library); search by name/intent; recents/favorites; drag or `Enter` to insert at selection; deferred blocks (`switch`, `while`…) listed under "Not yet available" with explanation (F-28); plugin-provided blocks show origin badge; drop-time constraint messages ("needs a role bound to an instrument with capability X"; "Loops must be inside a phase") |
| **Outline** | Synchronised tree = **the accessible equivalent of the canvas**; selection, reorder (keyboard `Alt+↑/↓`), collapse, error markers |
| **Canvas** | Draws the stored block tree only (no free back-edges). Pan/zoom/minimap; containers collapse; node badges: hazard class, resume policy, retry, timeout, evidence; error/warning markers; execution-path highlighting in simulation; lane view deferred. Deterministic auto-layout (positions in `presentation`, excluded from the semantic digest) |
| **Inspector** | Tabs per DESIGNER §4; generated from node schema; bindings list only **definitely assigned, type- and dimension-compatible** sources; derived fields (permissions, hazard, minimum resume policy) read-only |
| **Bottom dock** | Analysis (PR-xxx findings with quick fixes), Hazard path (all H2+ ops in order with Safety Profile coverage), Recovery matrix (node → policy → behaviour), and debug tabs when simulating |
| **Variables panel** | Typed variables/parameters with scope; **Input required** defaults for parameters tied to MI items; data-flow lens |

### 4.2 Key interactions and rules
* **Structural impossibility.** The UI cannot create an unbounded loop, retry on `non_repeatable`/≥H2 nodes, an H2+ op outside lifecycle rules, or a weaker-than-derived resume policy (AC-PD-01); the reason is shown inline.
* **Measurement guided flow** (DESIGNER §8): source → configure → acquire → evaluate limits → record. The limits step shows the resulting **limit band for a sample row** and the declared inclusivity; copy says "limit check", not pass/fail. `evaluate.decision` is only offered when its prerequisites exist.
* **Extract to sub-procedure** wizard infers typed inputs/outputs; signature is part of the contract (breaking change = major).
* **Simulate** opens the Simulation Lab docked: scenario picker, breakpoints (gutter click; conditional), step over/into/out, variable inspector with what-if overrides flagged `debug`, expression trace, wire log, fault injection, journal view, **Kill & resume at node X**. Debug runs are labelled `simulated` + `debug` and use only `SimulatorTransport`.
* **Version compare.** Visual diff (added/removed/changed/moved nodes; rename-aware by stable IDs) with the suggested change class.
* **States.** *Large procedure*: virtualised canvas + outline. *Invalid draft*: save allowed with warnings, publish blocked. *Hazard overlay* toggles colour **and** icons. *Production*: route does not exist.
* **API.** `GET/PATCH /config/drafts/{id}`, `POST …/validate`, `POST /builder/expr/check|eval`, `POST /builder/simulations` + SSE events + `/control`, `GET /config/versions/{vid}/diff`.
* **RTL/a11y.** Flow stays top→bottom; horizontal lanes and connectors mirror; numeric/unit fragments LTR; screen-reader operation via the outline; findings announced politely; keyboard map in 03 §6.8.
* **Acceptance.** AC-PD-01…09, AC-NC-03/07, P1-AC-PD-01…10, P1-AC-SIM-01…08.

---

## SCR-05 · Instrument Manager

**Purpose.** Define instrument manufacturers, families, models and their declarative drivers (including SCPI command templates with typed parameters), bind Safety Profiles and Simulation Profiles, and — on the station — discover and identity-verify instruments. Three connected surfaces:

| Surface | Shell | Phase |
|---|---|---|
| **5a. Model editor** (Builder → Instruments) | Builder | P1 (S1; identification live test S3) |
| **5b. Driver Designer** with **SCPI Command Builder** (Builder → Drivers) | Builder | P1 (S3) |
| **5c. Instrument discovery** (Operator → Instruments) | Operator | P1 (S5) |
| Assets register (instrument instances, serials, due dates) | Admin | P2 |

### 5a. Model editor
Tabs (BUILDER §4): **General · Functions & ranges · Options · Capabilities · Identification · Connections · Safety & Simulation**.
* *Functions & ranges*: grid of function → measured/sourced quantity (dimension picker) → ranges (Quantity list or **Input required MI-nn**); per-row provenance chip and documentation-reference field (MI-01). No pre-filled values.
* *Capabilities*: checklist from the capability catalog (names follow the grammar in 07 §2.3). Capabilities gate which step types/ops are selectable elsewhere — the editor shows "Unlocks: …".
* *Identification*: visual rule builder — choose identify op → parser (delimited/regex) → map groups to manufacturer/model/serial/firmware/options → match rule (manufacturer list, model matcher, `exact`/`partial`) → simulation-marker field. A **test-string table** (authoring-time unit tests, stored as vectors) shows parse + match outcome live; each row shows the resulting identity state chip (Exact/Partial/Mismatch).
* *Safety & Simulation*: **Safety Profile selection** = pick from *approved, published* `SafetyProfile` versions applicable to this model (read-only summary: envelopes count, coverage of H2+ commands, `simulated` chip, approvers, AHL coverage state). The editor can *reference* a profile; it cannot create, edit or widen one (ADR-0023). If none exists: "Request a Safety Profile" opens the Safety Console request flow for LSMA. Simulation Profile selection/creation shortcut.

### 5b. Driver Designer and SCPI Command Builder

```
┌ Driver: {key} · draft r{n}  [Connections][Identification][Commands][Parsers][Errors][Lifecycle][Libraries][Simulation][Test] ┐
├───────────────────────────────┬───────────────────────────────────────────────────────────────────────────────────────┤
│ Commands ({n})  [+ New] [Import│ configure_{function}                         Hazard: [H1 ▾]   Verification: ⚠ unverified │
│ from library]                  │ Kind ◉ Write ○ Query       ☑ Idempotent (derived)    ☐ Compound (needs permission)       │
│  ● identify         H0  std    │ Template                                                                                │
│  ● configure_…      H1  ⚠      │  ┌ [CONFigure][:][VOLTage][:][DC][␠][{range}][,][{res}] ┐   ← token editor (free text   │
│  ● read             H0         │  └──────────────────────────────────────────────────────┘     only inside this item)    │
│  ● output_on        H2  🔒     │ Placeholders detected: range, res   [Add parameter]                                    │
│  ● store_…          H3  🔒🔒   │ Parameters                                                                               │
│                                │  range  quantity⟨dimension ▾⟩  bounds [Input required · MI-nn]  format [engineering ▾]  │
│                                │  res    quantity⟨dimension ▾⟩  optional                                                 │
│                                │ Response parser  (none for write)    Timeout [ ]  Retry [off: not idempotent]           │
│                                │ State effects [+]   Preconditions [+] (expression picker)                               │
│                                │ Source reference [documentation locator]  (MI-01)                                       │
│                                │ ▶ Wire-text preview  with sample values / rejected-value examples                        │
└───────────────────────────────┴───────────────────────────────────────────────────────────────────────────────────────┘
```

**Command Builder rules (implements "SCPI command builder using approved typed operations").**
1. **Operations, not strings, are what procedures see.** A command becomes a *named driver operation* with typed parameters; the Procedure Designer's `driver.call` picker lists operations and typed argument slots. There is no raw-write node (AGENTS rule 5, PR-021).
2. **Template editor.** Template text is authored only here, tokenised into mnemonic, separator and `{placeholder}` chips; the editor warns on `;`, CR/LF, or control characters (blocked unless `compound`, which is permission-controlled). Placeholders are auto-detected and must each have a parameter definition. Only `{name}` placeholders are allowed; no nested expressions.
3. **Parameter editor.** Types: `quantity<dimension>` (dimension picker), `integer`, `enum` (token map), `boolean` (format), `string` with a mandatory allow-pattern. Bounds are **required** for `quantity` parameters of H1+ and show *Input required* until supplied; format style (fixed/scientific/engineering), digits, SI prefix handling, unit suffix.
4. **Wire-text preview.** Live preview using the production formatter with sample values, plus "rejected examples" (out-of-bounds, wrong dimension, control characters) so the author sees the injection boundary working.
5. **Hazard class selector** with definitions; H2+ locks behind permissions and shows the red "Hazardous" ribbon; the selection drives retry/idempotency options and the approval path (Safety Console). H3/H4 are disabled in P1 (BUILDER §13).
6. **Verification field.** `standard` (IEEE 488.2 mandatory common commands only) · `verified` (with source reference; cannot be set by the author alone for H2+) · `unverified_against_manual` (default for new commands; listed in the readiness checklist).
7. **Import from command library** with version pinning; "override" creates a local copy with lineage.
8. **Safe-state eligibility** flag per command; only eligible commands are selectable in `safe_state` sequences.

Other tabs follow BUILDER §5.2–§5.9: *Connections* (resource-pattern builder per interface type; serial settings; terminators; timeouts; "Station requires VISA backend / adapter X" requirement notice), *Parsers* (sample-response tester with stored vectors), *Errors* (error-queue op, loop-until-clear, code→severity map), *Lifecycle* (`init/teardown/safe_state` ordered invocations), *Simulation* (identity with simulation marker, state vars, rules table, seeded noise/drift models, scenarios as `synthetic_demo`, fault injection), *Test* (simulator mode only in P1; station mode with test bundles is P4).

### 5c. Instrument discovery (Operator)
As specified in `UI_UX_SPEC §7.2` (scan limited to the approved scope; only identification queries; `[SIM]` flags; identity states Exact/Partial/Mismatch/Unreachable with explanations; simulated identities cannot be registered as assets). Phase 1 scope selector exposes **Simulator** only; VISA scope is shown disabled with "backend missing / not enabled in this deployment" (P4).

* **Permissions.** 5a/5b: `config.draft.instrument|driver`, `driver.author` (H0/H1), `driver.author.hazardous` (H2, per D-06), `driver.test`. 5c: operator authorization.
* **States.** Driver with `unverified_against_manual` commands: persistent warning chip count; publish allowed for Test/simulation, blocked for production-targeted packages until verified (readiness).
* **API.** Generic `/config/*` for kinds; pure, I/O-free preview endpoints `POST /builder/driver/format-preview` (production formatter: wire text + rejection reasons) and `POST /builder/driver/parse-preview` (production parser against a sample response); simulator-mode tests and the "run a conversation" terminal use `POST /builder/simulations` (`mode: conversation`) — all in 08 §3; station `POST /instruments/discover`, `/verify`.
* **RTL/a11y.** Template tokens, wire text and mnemonics are `dir="ltr"` inside RTL pages; parameter table mirrors but value cells are LTR; token editor has a plain-text fallback for screen-reader users.
* **Acceptance.** AC-NC-01/02, AC-VS-01…03, AC-SAF-05, P1-AC-DRV-01…10, P1-AC-INS-01…05.

# FIXTURES_SPEC.md — Demo V1 (S1) synthetic data: schema and proposed fictional entities

| | |
|---|---|
| Status | **Proposal, documentation only (WP-DV1-0). Nothing here is implemented, and no value here is approved.** The owner approves the file (DV-DEC-02, DV-DATA-01) before PR-1 may transcribe it. It authorises no code, workflow, dependency, schema, gate or governance change. |
| Parent | [`DEMO_V1_PLAN.md`](DEMO_V1_PLAN.md) sections 8, 9 and Appendix A. Owner decisions DV-DEC-01 to DV-DEC-09 accepted 2026-11-07 ([section 18.1](DEMO_V1_PLAN.md)); that record does not approve these values. |
| Companions | [`CONTENT_DECK.md`](CONTENT_DECK.md) (chrome strings) · [`TEST_PLAN.md`](TEST_PLAN.md) (fixture guards FX-G-nn are exercised there) · [`OWNER_CHECKLIST.md`](OWNER_CHECKLIST.md) (open decisions) |
| Scope | Slice **S1** (6 customers, 8 assets, 10 work orders, 3 procedure descriptors, 1 scripted scenario). S2 volumes (14 assets, 20 work orders, 3 scenarios) are outside this file. |
| Hebrew | Every Hebrew value below has status `needs_review` (H-8, MI-31, Q-15). Names are placeholders chosen to be obviously fictional; the linguist and owner review them (checkpoints FX-RC-04 and FX-RC-05). |
| Written by | The same agent family (Claude) that wrote the plan. Not an independent audit. |

## 1. What this file is, and what it deliberately does not contain

Authoritative description of the data PR-1 will place in `apps/web/src/demo/model/` as typed, frozen, readonly TypeScript, and of the guards that keep it honest. It follows AGENTS.md §2.1 (never invent metrology), §2.2 (simulation is never a calibration), §2.8 (decimals and units) and §2.9 (determinism).

It contains **no**: real customer, person, contact, address, manufacturer, model, vendor, product, standard, accreditation body, certificate wording; instrument specification, accuracy, tolerance, limit, test-point value, range, interval, uncertainty, environmental or safety value; physical unit; clock value or real date; float arithmetic. Every place where such a value would exist is a **slot** that reads `Input required` plus an `MI-nn` marker from `METROLOGY_REQUIREMENTS` section 12 (section 7 below).

The scripted `su` readings (section 6) are the only numbers that look like measurements. They are **scripted demonstration strings** with no physical dimension, no nominal, no tolerance and no relationship to any specification. They are the owner's to author or replace (DV-DEC-02 option A; checkpoint FX-RC-03).

## 2. Owner review checkpoints (nothing below is checked)

| ID | Checkpoint | Who | Evidence | Status |
|---|---|---|---|---|
| FX-RC-01 | Schema and constraints (sections 3 and 4) accepted | Owner | Owner record | Open |
| FX-RC-02 | Entity lists (section 5), ids, counts and relationships accepted | Owner | Reviewed copy or PR comment | Open |
| FX-RC-03 | Scripted `su` readings (section 6.3) authored or approved verbatim, or replaced by the owner's own values; the "no nominal, no target, no tolerance" reading confirmed | Owner (DV-DEC-02) | Owner record naming the final values | Open |
| FX-RC-04 | Names and wording checked for trademark and look-alike risk (Q-08, MI-01, DV-RISK-08) | Owner | Owner record | Open |
| FX-RC-05 | Hebrew fixture text reviewed; status remains `needs_review` until a human changes it | Human linguist (H-8) | Reviewed list | Open |
| FX-RC-06 | Guard list (section 9) accepted, including the owner's denylist of real names (section 9, FX-G-12) | Owner | Owner record | Open |
| FX-RC-07 | Proposed content-marker and sentinel names (section 10) accepted as input to the separate DV-DEC-05 gate review (R5) | Owner | Owner record; the exact gate diff is approved on its own PR | Open |

PR-1 must not start until FX-RC-01 to FX-RC-04 and FX-RC-06 are closed. Any later change to an approved value needs the owner's re-approval and a new revision of this file.

## 3. Conventions

| Convention | Rule |
|---|---|
| Ids | `^(SYN\|SIM\|DEMO)-[A-Z]+-[0-9]{3,4}$` (DV-DATA-02): customers `SYN-CUS-nnn`, assets `SYN-AST-nnn`, serials `SYN-SER-nnn`, work orders `SYN-WO-nnn`, procedures `SYN-PROC-nnn`, scenarios `SIM-SCN-nnn`, runs `SIM-RUN-nnnn`, reports `DEMO-RPT-nnnn`. (The plan's Appendix A wrote the serial as `SYN-nnn`, which does not match DV-DATA-02; this file uses `SYN-SER-nnn`.) |
| Provenance | Every record has `provenance: "synthetic_demo"` (literal). |
| Localized text | `{ en: string; he: string; heStatus: "needs_review" }`. The literal type forbids any other status in code until a human edits the catalog. Both languages are required for every record (DV-L10N-02). |
| Units | The only unit is `"su"` (synthetic unit, no physical dimension). |
| Numbers | Readings are decimal **strings** matching `^[0-9]+\.[0-9]{4}$`. Counts and indexes are integers. No float field, no computed statistic, no rounding. |
| Dates and time | None. Due labels are slot numbers rendered by a message; "simulated elapsed" is derived from the number of completed steps. |
| People | None. Contacts are `null`, rendered as `demo.common.notProvided`. The run says "scripted operator step", never a person. |
| Immutability | All exported fixture values are frozen at module load and typed `readonly`. The store holds changes (selection, statuses, run) separately. |
| Validation against schemas | None. These are TypeScript types, not a configuration kind and not under `schemas/`; no claim of schema conformance is made (plan 6.4). |

## 4. Type definitions (illustrative, not repository code)

```ts
type ProvenanceTag = "synthetic_demo";
type Localized = { readonly en: string; readonly he: string; readonly heStatus: "needs_review" };

type AssetClass = "A" | "B" | "C";
type AssetStatus = "available" | "in-job" | "attention" | "out-of-service";
type WorkOrderStatus = "received" | "ready" | "in-simulation" | "report-ready" | "on-hold";
type Priority = "low" | "normal" | "high";
type Severity = "error" | "warning" | "info";

interface Customer {
  readonly id: string;               // SYN-CUS-nnn
  readonly provenance: ProvenanceTag;
  readonly name: Localized;
  readonly site: Localized;
  readonly contact: null;            // always null: "not provided (synthetic)"
}

interface Asset {
  readonly id: string;               // SYN-AST-nnn
  readonly provenance: ProvenanceTag;
  readonly assetClass: AssetClass;
  readonly classLabel: Localized;
  readonly serial: string;           // SYN-SER-nnn
  readonly seedStatus: AssetStatus;  // the store derives the live status
  readonly seedEvent: Localized;     // "last scripted event" before any run
}

interface WorkOrder {
  readonly id: string;               // SYN-WO-nnn
  readonly provenance: ProvenanceTag;
  readonly customerId: string;
  readonly assetId: string;
  readonly priority: Priority;
  readonly seedStatus: WorkOrderStatus;
  readonly dueSlot: 1 | 2 | 3 | 4;   // rendered by a message; never a date
}

interface InputRequiredSlot {
  readonly slot: "test-point-value" | "limit-check" | "standard-requirement"
               | "standard-validity" | "conformity-rule";
  readonly marker: "MI-03" | "MI-04" | "MI-06" | "MI-07" | "MI-08";
}

type StepKind = "operator.instruct" | "operator.confirm" | "flow.foreach"
              | "driver.call" | "measure.acquire" | "evaluate.limits" | "flow.end";

interface StepNode {                 // illustrative step type names, not validated against any schema
  readonly kind: StepKind;
  readonly textKey: string;          // a key of CONTENT_DECK section 6
  readonly slots: readonly InputRequiredSlot[];
  readonly children: readonly StepNode[];
}

interface ProcedureDescriptor {
  readonly id: string;               // SYN-PROC-nnn
  readonly provenance: ProvenanceTag;
  readonly title: Localized;
  readonly version: string;          // "1.0.0" style label; not a metrological value
  readonly catalogStatus: "available" | "draft" | "retired";
  readonly outline: readonly StepNode[];
  readonly scenarioId: string | null;
}

interface CompatibilityEntry {       // scripted, never evaluated
  readonly procedureId: string;
  readonly assetClass: AssetClass;
  readonly compatible: boolean;
  readonly reasonKey: "demo.job.reason.classMismatch" | "demo.job.reason.draft"
                    | "demo.job.reason.retired" | null;
}

interface PreflightEntry {           // scripted per asset, never evaluated
  readonly assetId: string;
  readonly findings: readonly { severity: Severity; messageKey: string; marker?: "MI-07" }[];
}

type ScenarioStep =
  | { readonly kind: "note"; readonly titleKey: string; readonly bodyKey: string }
  | { readonly kind: "operator-confirm"; readonly titleKey: string; readonly promptKey: string }
  | { readonly kind: "reading"; readonly point: "A" | "B" | "C"; readonly n: 1 | 2 | 3; readonly value: string };

interface ScenarioScript {
  readonly id: string;               // SIM-SCN-nnn
  readonly provenance: ProvenanceTag;
  readonly unit: "su";
  readonly steps: readonly ScenarioStep[];   // the counted steps; the `end` marker is implicit
}
```

Forbidden property names anywhere in the fixtures (guard FX-G-06): `nominal`, `target`, `expected`, `tolerance`, `limit`, `range`, `interval`, `uncertainty`, `accuracy`, `specification`, `standardValue`, `hazard`, `safety`, `command`, `scpi`, `resource`, `transport`, `email`, `phone`, `address`, `password`, `token`, `secret`, `digest`, `hash`, `signature`, `certificate`. (Slot names such as `limit-check` are **values** of the `slot` field, not property names.)

## 5. Proposed entities

### 5.1 Customers (6)

All contacts are `null`. Sites are generic. No place, person or organisation name.

| id | name (en) | name (he, needs_review) | site (en) | site (he, needs_review) |
|---|---|---|---|---|
| SYN-CUS-001 | Synthetic customer 001 | לקוח סינתטי 001 | Synthetic site 001 | אתר סינתטי 001 |
| SYN-CUS-002 | Synthetic customer 002 | לקוח סינתטי 002 | Synthetic site 002 | אתר סינתטי 002 |
| SYN-CUS-003 | Synthetic customer 003 | לקוח סינתטי 003 | Synthetic site 003 | אתר סינתטי 003 |
| SYN-CUS-004 | Synthetic customer 004 | לקוח סינתטי 004 | Synthetic site 004 | אתר סינתטי 004 |
| SYN-CUS-005 | Synthetic customer 005 | לקוח סינתטי 005 | Synthetic site 005 | אתר סינתטי 005 |
| SYN-CUS-006 | Synthetic customer 006 | לקוח סינתטי 006 | Synthetic site 006 | אתר סינתטי 006 |

### 5.2 Assets (8)

Class labels: class A "Synthetic instrument class A" / "מכשיר סינתטי מסוג A"; class B and C likewise with the letter. No manufacturer, model or function is named.

| id | class | serial | seed status | seed last event (en) | seed last event (he, needs_review) |
|---|---|---|---|---|---|
| SYN-AST-001 | A | SYN-SER-001 | available | Marked available at the start of the demonstration (synthetic) | סומן כזמין בתחילת ההדגמה (סינתטי) |
| SYN-AST-002 | A | SYN-SER-002 | available | (same) | (same) |
| SYN-AST-003 | A | SYN-SER-003 | available | (same) | (same) |
| SYN-AST-004 | A | SYN-SER-004 | attention | Marked as needing attention at the start of the demonstration (synthetic) | סומן כדורש תשומת לב בתחילת ההדגמה (סינתטי) |
| SYN-AST-005 | B | SYN-SER-005 | available | (available text) | (same) |
| SYN-AST-006 | B | SYN-SER-006 | available | (available text) | (same) |
| SYN-AST-007 | B | SYN-SER-007 | out-of-service | Marked out of service at the start of the demonstration (synthetic) | סומן כמחוץ לשירות בתחילת ההדגמה (סינתטי) |
| SYN-AST-008 | C | SYN-SER-008 | available | (available text) | (same) |

Seed counts: available 6, in job 0, needs attention 1, out of service 1 (6 of 8 available). During and after a run the "last scripted event" is the latest `demo.event.*` message for that asset (CONTENT_DECK section 7.1).

### 5.3 Work orders (10)

Due slots are rendered as `demo.fixture.dueSlot`: "Synthetic slot {n}" / "משבצת סינתטית {n}" (needs_review).

| id | customer | asset (class) | priority | seed status | due slot | Purpose in the demo |
|---|---|---|---|---|---|---|
| SYN-WO-001 | SYN-CUS-001 | SYN-AST-003 (A) | normal | ready | 1 | **The golden path.** Compatible procedure, no blocking finding |
| SYN-WO-002 | SYN-CUS-002 | SYN-AST-004 (A) | high | ready | 1 | Ready but blocked by a scripted error finding (attention) |
| SYN-WO-003 | SYN-CUS-003 | SYN-AST-005 (B) | normal | ready | 2 | A second runnable pairing (class B) |
| SYN-WO-004 | SYN-CUS-004 | SYN-AST-002 (A) | low | received | 2 | Not Ready: start disabled with the status reason |
| SYN-WO-005 | SYN-CUS-005 | SYN-AST-006 (B) | normal | received | 3 | Not Ready |
| SYN-WO-006 | SYN-CUS-001 | SYN-AST-001 (A) | high | received | 3 | Not Ready |
| SYN-WO-007 | SYN-CUS-006 | SYN-AST-007 (B) | normal | received | 4 | Blocked: out-of-service finding |
| SYN-WO-008 | SYN-CUS-002 | SYN-AST-008 (C) | low | on-hold | 4 | No compatible procedure (class C) |
| SYN-WO-009 | SYN-CUS-003 | SYN-AST-001 (A) | low | on-hold | 4 | On hold |
| SYN-WO-010 | SYN-CUS-005 | SYN-AST-002 (A) | normal | on-hold | 4 | On hold |

Seed counts: received 4, ready 3, in simulation 0, report ready 0, on hold 3. Dashboard "open work orders" is 10 (all not at report ready); "jobs ready to simulate" is 3; "instruments available" is 6 of 8; "simulated runs" is 0.

### 5.4 Procedure descriptors (3) and compatibility

| id | version | title (en) | title (he, needs_review) | catalog status | scenario |
|---|---|---|---|---|---|
| SYN-PROC-001 | 1.0.0 | Synthetic scripted procedure | נוהל סינתטי מתוסרט | available | SIM-SCN-001 |
| SYN-PROC-002 | 0.9.0 | Synthetic draft procedure | נוהל סינתטי בטיוטה | draft | none |
| SYN-PROC-003 | 1.2.0 | Synthetic retired procedure | נוהל סינתטי שהוצא משימוש | retired | none |

Versions are opaque labels, not metrological values.

Scripted compatibility (an explicit table, not a rule engine):

| Procedure | Class A | Class B | Class C |
|---|---|---|---|
| SYN-PROC-001 | compatible | compatible | not compatible, `classMismatch` |
| SYN-PROC-002 | not compatible, `classMismatch` | not compatible, `classMismatch` | not compatible, `draft` |
| SYN-PROC-003 | not compatible, `retired` | not compatible, `retired` | not compatible, `retired` |

Outline of SYN-PROC-001 (the only outline displayed in S1; PROC-002 and -003 carry a one-node placeholder outline that S1 never shows):

| Group | Step kind | Text key (CONTENT_DECK section 6) | Slots |
|---|---|---|---|
| Setup | `operator.instruct` | `demo.job.preview.step.instruct` | none |
| Setup | `operator.confirm` | `demo.job.preview.step.confirm` | none |
| Points | `flow.foreach` | `demo.job.preview.step.foreach` | `test-point-value` (MI-03) |
| Points, inside the loop | `driver.call` | `demo.job.preview.step.call` | none |
| Points, inside the loop | `measure.acquire` | `demo.job.preview.step.acquire` | none |
| Points, inside the loop | `evaluate.limits` | `demo.job.preview.step.limits` | `limit-check` (MI-04) |
| Teardown | `flow.end` | `demo.job.preview.step.finish` | none |

### 5.5 Preflight (scripted per asset)

The standing findings apply to every asset: a warning `standardsValidity` (marker MI-07), an info `safetyNotApplicable`, and an info `scriptedOnly`. Blocking findings:

| Asset | Extra finding |
|---|---|
| SYN-AST-004 (attention) | error `attention` |
| SYN-AST-007 (out of service) | error `outOfService` |
| SYN-AST-008 (class C) | error `noProcedure` |
| all others | none |

### 5.6 Standards slot

One role, "Reference role": value "Simulated substitute (synthetic)". Slots: `standard-requirement` (MI-06) and `standard-validity` (MI-07). No standard, certificate, issuer, value or due date exists.

## 6. The scripted scenario SIM-SCN-001

### 6.1 Steps (11 counted steps, plus an implicit end marker)

The plan states "11 steps". This file defines them as the **counted** steps; the terminal `end` marker is not a counted step (it only emits the completion event). The progress display reads "Step k of 11".

| # | Kind | Content |
|---|---|---|
| 1 | note | Title `demo.run.step.note`, body `demo.run.step.noteBody` |
| 2 | operator-confirm | Title `demo.run.step.confirm`, prompt `demo.run.operator.text` |
| 3 | reading | Point A, reading 1 |
| 4 | reading | Point A, reading 2 |
| 5 | reading | Point A, reading 3 |
| 6 | reading | Point B, reading 1 |
| 7 | reading | Point B, reading 2 |
| 8 | reading | Point B, reading 3 |
| 9 | reading | Point C, reading 1 |
| 10 | reading | Point C, reading 2 |
| 11 | reading | Point C, reading 3 |
| end | (implicit) | Emits `runCompleted`; not counted |

### 6.2 Execution rules the data relies on (the reducer itself is PR-1 scope, plan section 9)

- From Ready, **Step** executes step 1 (event `note`); the run is then at step 2, state Waiting, event `operatorWaiting`.
- **Confirm** completes step 2 (event `operatorConfirmed`); state Running.
- Each further **Step** executes the next reading and records it (event `reading`); after reading 11 the end marker runs in the same transition (event `runCompleted`, state Completed).
- **Run to end** advances synchronously until the operator step or the end; from Ready it executes step 1 and stops at step 2.
- **Abort** (after confirmation) from Running or Waiting sets Aborted, event `runAborted`; the work order returns to `ready`, the asset to its prior status; results are incomplete.
- **Reset** (run console) returns the run to Ready for the same job; **Reset demo** returns the whole store to the seed.
- Simulated elapsed is `t+00:NN`, with NN the number of completed counted steps, zero-padded. It is a counter, not a clock.

### 6.3 Scripted readings (proposed; owner authors or approves, FX-RC-03)

Decimal strings in `su`. They carry **no nominal, no target, no tolerance and no relationship to any specification**; they are display data for the readings table only. Option 1 reuses the wireframe values; Option 2 is a deliberately opaque alternative if the owner prefers values that do not cluster around round numbers.

| Point | Reading | Option 1 (default) | Option 2 (opaque alternative) |
|---|---|---|---|
| A | 1 | 11.0012 | 4.0172 |
| A | 2 | 11.0009 | 4.0169 |
| A | 3 | 11.0011 | 4.0171 |
| B | 1 | 12.3398 | 7.5233 |
| B | 2 | 12.3401 | 7.5236 |
| B | 3 | 12.3399 | 7.5234 |
| C | 1 | 13.6602 | 9.1148 |
| C | 2 | 13.6600 | 9.1151 |
| C | 3 | 13.6603 | 9.1149 |

Why a guard is still needed: any three near-equal numbers can be read as "a value with a tolerance". The screens therefore always show the label "scripted demonstration reading (not measured, not computed)", the unit `su`, and the slots "test point value: input required MI-03" and "limit check: not evaluated, input required MI-04". No mean, deviation, difference or rounding is computed or shown in S1 (DV-DATA-06).

### 6.4 Golden event sequence for one uninterrupted run from SYN-WO-001 (used by TEST_PLAN TC-MODEL-nn)

| # | Event key | Arguments | Note |
|---|---|---|---|
| 1 | `demo.event.jobCreated` | id = SYN-WO-001 | At Start simulation |
| 2 | `demo.event.runStarted` | run = SIM-RUN-0001 | Same action |
| 3 | `demo.event.note` | none | Step 1 |
| 4 | `demo.event.operatorWaiting` | none | Reaching step 2 |
| 5 | `demo.event.operatorConfirmed` | none | Confirm |
| 6 to 14 | `demo.event.reading` | point and n, in order A1 to C3 | Steps 3 to 11 |
| 15 | `demo.event.runCompleted` | run = SIM-RUN-0001 | End marker |

Fifteen events. The same script and the same actions always produce this list; an aborted run adds `demo.event.runAborted` and stops.

## 7. Input-required slots (the only place a metrology value could appear)

| Slot | Marker | Meaning in METROLOGY_REQUIREMENTS section 12 | Rendered as |
|---|---|---|---|
| `test-point-value` | MI-03 | Test points, ordering, per-point settings | `Input required MI-03 (not authored)` |
| `limit-check` | MI-04 | Accuracy specifications and acceptance limits | `Not evaluated: input required MI-04` |
| `standard-requirement` | MI-06 | Required capability of reference standards | `Input required MI-06` |
| `standard-validity` | MI-07 | Reference standard certificate data and due dates | `Input required MI-07` |
| `conformity-rule` | MI-08 | Decision rules | `Not evaluated. No decision rule is defined (input required MI-08)` |

The wireframe for job set-up used a placeholder `MI-xx` for standards validity; this file fixes it to MI-07. If the owner wants the five markers extended, the entry in section 12 of `METROLOGY_REQUIREMENTS` must be extended first (AGENTS §2.1).

## 8. Derived store rules (so the dashboard, status chips and report agree)

| Action | Work order | Asset | Counters |
|---|---|---|---|
| Seed | seed status | seed status | runs 0 |
| Start simulation (valid) | `in-simulation` | `in-job` | run counter n = n + 1, id `SIM-RUN-000n` |
| Run completed | `report-ready` | `available` | completed + 1 |
| Run aborted | `ready` | prior status | aborted + 1 |
| Reset demo | seed | seed | all 0 |

A work order at `in-simulation` or `report-ready` has a run in this session; setting up another job for it is blocked with `demo.job.start.reasonRunExists`. Only one run is active at a time. The report is derived from the completed run and is never stored; its ids follow the run number (`DEMO-RPT-000n` for `SIM-RUN-000n`).

## 9. Guards (exercised by TEST_PLAN, proposed names FX-G-nn)

| ID | Guard | Failure means |
|---|---|---|
| FX-G-01 | Every id matches the section 3 pattern, is unique, and every reference resolves (customer, asset, procedure, scenario) | Broken or invented id |
| FX-G-02 | Every record has `provenance: "synthetic_demo"` | Unlabelled data |
| FX-G-03 | Every `Localized` has non-empty `en` and `he` and `heStatus === "needs_review"` | Missing language, or a Hebrew string marked reviewed |
| FX-G-04 | The set of unit strings in all fixtures is exactly `{ "su" }` | A real or other unit |
| FX-G-05 | Every reading matches `^[0-9]+\.[0-9]{4}$`, is a string, and no numeric-typed field exists outside the allow-list (`n`, `dueSlot`, counts) | Float or numeric measurement |
| FX-G-06 | No property name from the forbidden list in section 4 appears anywhere in the fixture object graph | Smuggled metrology, safety, secret or personal field |
| FX-G-07 | Every slot marker is one of the five in section 7 and exists in `METROLOGY_REQUIREMENTS` section 12 | Invented or unknown marker |
| FX-G-08 | No string matches an email, phone, URL, street-address or person-name pattern; contacts are `null` | Personal-looking data |
| FX-G-09 | No string, in either language, contains a real unit pattern (a digit followed by a unit symbol) or a number followed by `%` | Real-unit or tolerance-looking text |
| FX-G-10 | The lexicon guard (CONTENT_DECK sections 12.3 and 13) passes over every fixture string in both languages | Claim words |
| FX-G-11 | Counts equal the S1 volumes: 6 customers, 8 assets, 10 work orders, 3 procedures, 1 scenario with 11 counted steps, 3 points of 3 readings | Scope drift |
| FX-G-12 | No string contains an entry of the owner's denylist of real manufacturer, model, vendor, customer, standard and accreditation names (list kept by the owner; the test reads it from a reviewed file and the list itself is not published in this document) | Real-world name |
| FX-G-13 | Compatibility and preflight tables are complete (every procedure × class; every asset) and every referenced message key exists in the demo bundle | Missing scripted data |
| FX-G-14 | The object graph is deeply frozen and contains no function, `Date`, `RegExp` or class instance | Mutable or nondeterministic data |
| FX-G-15 | Golden vector: the scenario and the actions in section 6.2 produce exactly the event list in section 6.4 | Behaviour drift |

Each guard needs a **mutation check** in PR-1 (insert a violation, show the guard fails). That evidence is part of the PR-1 acceptance, not of this file.

## 10. Proposed isolation markers (input to the separate DV-DEC-05 review, not an approval)

| Item | Proposal |
|---|---|
| Fixture content marker | One constant string embedded in the quarantined fixtures module, for example `CALOS_DEMO_V1_FIXTURE_MARKER` (final spelling is part of the gate review) |
| Greppable id prefixes | `SYN-`, `SIM-RUN`, `DEMO-RPT` (DV-ISO-01) |
| Sentinels to forbid in the Production Rehearsal bundle | the marker, the id prefixes, the demo component names (`ReportSheet`, `Watermark`, and the route ids `demo-dashboard`, `demo-work`, `demo-job`, `demo-run`, `demo-report`), and any `messages-demo` key prefix `demo.` |
| Required in the Test bundle | the marker and at least one route id (proves the check can fire) |

The exact diff to `tools/check_frontend_bundle.mjs` is an R5 change approved on its own PR (plan section 17.2). Until then the same check is a documented grep (TEST_PLAN TC-ISO-nn).

## 11. Open questions for the owner

| ID | Question | Default if unanswered |
|---|---|---|
| FX-Q1 | Reading values: Option 1, Option 2, or the owner's own? | Option 1 (matches the wireframes), still subject to FX-RC-03 |
| FX-Q2 | Is "Synthetic instrument class A/B/C" an acceptable generic label, or should classes be named differently? | As written |
| FX-Q3 | Should the fifth status "On hold" exist (it is not in the plan's four-status wireframe)? | Yes: it gives three work orders that cannot start and keeps "open work orders" at 10 |
| FX-Q4 | Should work orders in status Received be selectable for job set-up (read-only review, start disabled)? | Yes |
| FX-Q5 | Who maintains the denylist for FX-G-12 and where is it stored? | Owner; a reviewed file outside the published docs |
| FX-Q6 | Keep the run-counter ids `SIM-RUN-0001`, `SIM-RUN-0002` after an abort and a restart, or always show `SIM-RUN-0001`? | Counter (deterministic and visible) |

## 12. Clarifications to the plan found while writing this file (all corrected in the plan, merged in PR #38 as `5c3b385`)

| # | Original plan text | Finding | Resolution (now in the plan and in this file) |
|---|---|---|---|
| 1 | Appendix A: serial `SYN-nnn` | Did not match the id pattern of DV-DATA-02 | Serial is `SYN-SER-nnn` |
| 2 | "1 scenario of 11 steps" beside "1 note, 1 operator-confirm, 3 points × 3 readings, 1 end" (sums to 12) | Ambiguous | 11 **counted** steps plus an implicit `end` marker that only emits the completion event (section 6.1) |
| 3 | Dashboard and status wording with four statuses | Ten work orders need a fifth status so that "open work orders" can be 10 at seed and nothing is "in simulation" before a run | Fifth status `on-hold` (FX-Q3). Dashboard wireframe numbers remain placeholders and this file's seed values supersede them |
| 4 | Section 6.7 "no approved rule"; wireframe 04 button "Approve — unavailable" | A banned claim word (Appendix B) and a control named "approve" (DV-SAFE-05) | "no decision rule defined (input required MI-08)" and "Record actions: unavailable"; plan and wireframe 04 corrected |
| 5 | Job set-up wireframe: standards validity `MI-xx` | Placeholder marker | `MI-07` for validity, `MI-06` for requirements (section 7); plan sample corrected |
| 6 | Wireframe 04 header: "digest not computed" | Mentions a digest, which DV-G-06 says the demo never displays | Replaced by "synthetic descriptor" in the wireframe |
| 7 | Sections 5.1 and 6.2: start rule for non-Ready work orders unspecified | Which statuses may start | Any work order can be reviewed; **Start simulation** requires status Ready, one visible reason in a fixed order (DV-FN-04, FX-Q4) |
| 8 | Wireframe 03 "Step 5 of 11" at Point B reading 2 | Under the counted-step definition that reading is step 7 | "Step 7 of 11" and `t+00:07` |
| 9 | Section 6.2 sample table: 8 of 8 shown, SYN-WO-002 Received on SYN-AST-005 | Did not match the 10 work orders of section 5.3 | Sample shows "10 of 10" and SYN-WO-002 Ready on SYN-AST-004; a due-slot column is mentioned |
| 10 | Section 4: Vitest "discovers ... only" the i18n and ui-kit globs | `vitest.config.mjs` also includes `apps/web/src/**/*.test.ts` and `*.test.tsx` | Constraint text corrected |

Not changed, by design: the dashboard wireframes (01, 02) keep their placeholder figures and four meter bars; the plan states that every number and Hebrew string in the wireframes is a placeholder. The owner may ask for them to be redrawn with the seed values (the cost is small and purely visual).

## 13. Sign-off record (intentionally empty)

| Checkpoint | Reviewer | Date | Decision | Comments |
|---|---|---|---|---|
| FX-RC-01 | | | | |
| FX-RC-02 | | | | |
| FX-RC-03 | | | | |
| FX-RC-04 | | | | |
| FX-RC-05 | | | | |
| FX-RC-06 | | | | |
| FX-RC-07 | | | | |

No row above is filled in by an agent.

# METROLOGY_REQUIREMENTS.md

| | |
|---|---|
| Status | Draft 0.2 — revised for No-Code-First: all metrology content is **versioned configuration** authored in the Application Builder and evaluated by the typed expression engine |
| Purpose | Define the **mechanisms** CalOS must provide for metrologically defensible calibration, and register every **input** that must come from a competent metrologist |
| Related | [DOMAIN_MODEL](DOMAIN_MODEL.md) · [PROCEDURE_SCHEMA](PROCEDURE_SCHEMA.md) · [PRODUCT_REQUIREMENTS](PRODUCT_REQUIREMENTS.md) |

> **No invented metrology.** This document contains no instrument specifications, tolerances, test points, environmental limits, reference-standard uncertainties, or uncertainty budgets. Where the platform needs one, it is registered in §12 as an *Unknown Input* (MI-nn). Engineers must not fill these from memory, datasheets read from secondary sources, or "reasonable" guesses (see AGENTS.md).
>
> Normative references named here (JCGM 100/101/106, ISO/IEC 17025:2017, ILAC P10/P14/G8, ISO/IEC Guide 99 VIM) are cited for orientation. **Clause and edition references must be verified against the current published texts by the quality owner.**

---

> **No-Code consequence.** Specification tables, limits, corrections, uncertainty budgets, TUR policies, guard bands, decision rules, CMC constraints, unit definitions, and rounding rules are all **Configuration Items** (see [NO_CODE_ARCHITECTURE](NO_CODE_ARCHITECTURE.md)) with the draft → review → approve → publish lifecycle. Calculations are written in the **typed, dimension-checked expression language** (§11A), never as code. **Changing any of them creates a new version; approved historical results keep pointing at the exact versions used and are never recomputed in place.**

## 1. Principles

1. **Mechanisms, not content.** The platform provides structures (budgets, rules, standards registers); metrologists provide values.
2. **Provenance on every metrological value.** Limits, test points, uncertainty components, rounding rules and standards data each carry source document, revision, location, entered-by, verified-by, status.
3. **Explicit status gates.** Content is `draft → verified → approved → superseded/withdrawn`. Production runs may only consume `approved` content. Simulation runs may consume `synthetic_demo` content, which is rejected in production mode.
4. **Refuse rather than assume.** Missing or unverified content ⇒ validation failure, never a default.
5. **Separate what we measured from what we conclude.** Raw readings → corrected values → limit check → (with uncertainty and rule) conformity statement. Each layer is stored and labelled separately.
6. **Reproducibility.** Any evaluation can be re-executed from the stored snapshot to the same result.

---

## 2. Measurement data model requirements

| ID | Requirement |
|---|---|
| MR-DATA-01 | Every measured value is a **Quantity**: decimal value (string-serialized, arbitrary precision), unit from a controlled registry, optional "as displayed" digit count/resolution. No binary floating point in persisted metrological values. |
| MR-DATA-02 | The raw instrument response string is stored verbatim alongside the parsed value. |
| MR-DATA-03 | Unit registry is SI-based with explicit, tested dimension checks; conversions are explicit steps, not implicit coercions. Unit symbols are never localized. |
| MR-DATA-04 | Each reading carries: UTC timestamp, monotonic offset, attempt number, instrument identity at time of reading, instrument configuration snapshot reference, step ID, test point ID. |
| MR-DATA-05 | Computation uses decimal arithmetic with a declared context (precision, rounding mode). Where a statistical function cannot be computed in decimal, the algorithm, numeric type, and error bound are documented and golden-tested (MI-12). |
| MR-DATA-06 | Rounding for **display/report** is separate from rounding in **evaluation**; limits evaluation uses unrounded values unless the procedure/rule states otherwise (MI-13). |

## 3. Measurand and test-point model

A **TestPoint** = (function/quantity, nominal stimulus or measured quantity, range, optional frequency/other influence quantities, settings such as integration time, number of readings, settle criteria). All numeric content is procedure-supplied (MI-02, MI-03, MI-05).

The platform supports, structurally:
- Multiple functions per instrument (e.g., DC voltage, resistance — *which exist, and which are in scope, is an input*).
- Influence quantities (frequency, temperature) as additional dimensions on a test point.
- Test-point groups and ordering constraints (e.g., zero/offset checks before gain checks — *the method is an input*).

## 4. Limits and tolerances

### 4.1 Mechanism

A **LimitsTable** is a versioned, provenance-bearing record mapping `(function, range, test point selector)` → **AccuracyExpression**.

An **AccuracyExpression** is a sum of terms, each of a declared kind:

| Term kind | Meaning |
|---|---|
| `reading_fraction` | coefficient × |reading| |
| `range_fraction` | coefficient × range |
| `absolute` | coefficient in the measurand's unit |
| `resolution_counts` | integer count × resolution |

Coefficient values are **never** defined in platform code; they are `@ref`s to a LimitsTable entry (MI-04). Combination (e.g., algebraic sum vs. RSS) is an explicit attribute of the expression, defined by the source document (MI-04).

### 4.2 Requirements

| ID | Requirement |
|---|---|
| MR-LIM-01 | A LimitsTable entry records: source document (title, issuer, revision/date, section/page), which accuracy period/condition it applies to (if any), and environmental applicability. |
| MR-LIM-02 | Limits evaluation output per test point: `deviation`, `limit_lower`, `limit_upper`, `within_limits ∈ {true,false}`, `limit_source_ref`. Evaluation is pure and deterministic. |
| MR-LIM-03 | Boundary inclusivity (≤ vs <) is an explicit field on the rule/limit, defaulting to **no default** (MI-14). |
| MR-LIM-04 | Limits whose status is not `approved` (or `synthetic_demo` in simulation) cause preflight failure. |
| MR-LIM-05 | The **limit check** result is named and presented as *"Within limits / Outside limits (limit check)"*. It must not be named "Pass/Fail conformity" unless a decision rule + uncertainty evaluation produced it (see §7). |

## 5. Uncertainty

### 5.1 Mechanism (GUM-aligned; JCGM 100, supplement JCGM 101)

An **UncertaintyBudget** is a versioned record:

```
UncertaintyBudget
  id, version, status, scope (measurand, function, range, conditions)
  measurement_model        # explicit expression Y = f(X1..Xn), in the restricted expression language
  components[]:
    id, name, symbol
    source_kind            # type_a | type_b
    distribution           # normal | rectangular | triangular | u_shaped | t | other(declared)
    value / half_width / std_dev     # Quantity, from evidence
    dof                    # degrees of freedom (finite or infinite)
    sensitivity_coeff      # c_i (symbolic derivation or explicit)
    evidence_ref           # document / data set / certificate that justifies the value
  combination_method       # gum_linear | monte_carlo (JCGM 101)
  coverage                 # probability p, factor k (and how determined)
  result                   # u_c, U = k·u_c, (computed, never hand-typed)
  approvals                # author, reviewer, approved_at, reviewer_competence_ref
```

### 5.2 Requirements

| ID | Requirement |
|---|---|
| MR-UNC-01 | The platform ships **zero** default budgets. Demo/simulation plugins carry `status = not_available`, and reports state **"Uncertainty: not evaluated"**. |
| MR-UNC-02 | Combined and expanded uncertainty are **computed** from the approved budget by the platform's evaluator; hand-entered results are rejected. |
| MR-UNC-03 | Type A components can be computed from the run's own readings (mean, experimental standard deviation of the mean, ν = n−1) using the declared algorithms (MI-12). |
| MR-UNC-04 | Welch–Satterthwaite effective degrees of freedom and coverage factor determination follow the budget's declared method. |
| MR-UNC-05 | Budget version + input values are stored in the result snapshot so the evaluation can be re-run. |
| MR-UNC-06 | Contribution of the **reference standard** is taken from the standard's certificate record (§6) — never typed ad hoc. |
| MR-UNC-07 | Evaluator is validated against independent reference cases supplied by the metrologist (MI-17); golden tests. |
| MR-UNC-08 | A CMC (calibration and measurement capability) / scope-of-accreditation record, if applicable, can be attached and is checked: reported uncertainty must not be smaller than the CMC (MI-18) — enforcement is lab policy. |

## 6. Traceability and reference standards

| ID | Requirement |
|---|---|
| MR-TRC-01 | A **ReferenceStandard** asset record holds: identity (manufacturer/model/serial/asset ID), the *calibration certificate(s)* (issuer, accreditation reference, number, date, due date), the values and uncertainties **as stated in that certificate** (structured, with provenance), and its own traceability statement. |
| MR-TRC-02 | A procedure declares required standard **roles** (e.g., "DC voltage source") with the **required capability** (range, uncertainty ceiling) — thresholds are inputs (MI-06). The run binds concrete standards to roles. |
| MR-TRC-03 | **Gating**: binding is refused if the standard is overdue, withdrawn, out of declared capability, or missing a certificate. Policy for "warn vs. block" is lab-configurable; default block in production mode. |
| MR-TRC-04 | The approved result snapshot freezes a copy of the standard's certificate data used (not a live reference). |
| MR-TRC-05 | The traceability chain is navigable: result → standard → certificate → issuing lab accreditation/NMI reference. CalOS records the chain; it does not validate external accreditation status. |
| MR-TRC-06 | Intermediate checks / interim checks of standards (ISO/IEC 17025 §6.4.10 — verify) can be recorded as procedures with the same machinery. |
| MR-TRC-07 | Simulated standards are marked `simulated`, carry no certificate, and can only be bound in simulation runs. |

## 7. Decision rules and conformity statements

### 7.1 Mechanism (ILAC G8, JCGM 106, ISO/IEC 17025:2017 §7.8.6 — verify)

A **DecisionRule** is a versioned entity: `{ id, version, kind, parameters, text (localized), source, status }`. Supported *kinds* (structure, not content):

| Kind | Parameters | Outcomes |
|---|---|---|
| `simple_acceptance` | none (guard band w = 0) | pass / fail |
| `guard_banded_acceptance` | guard band `w` (Quantity or expression of U) | pass / conditional pass / conditional fail / fail |
| `binary_with_pfa` | max probability of false accept, PDF assumptions | pass / fail (computed via JCGM 106) |
| `non_binary_zones` | acceptance/rejection zone definitions | pass / conditional pass / conditional fail / fail |

Which kinds a lab uses, and any parameter value, is an input (MI-08, MI-09).

### 7.2 Requirements

| ID | Requirement |
|---|---|
| MR-DEC-01 | A rule is selected per calibration job through the procedure default and/or customer agreement; selection is recorded and audited. |
| MR-DEC-02 | Outcome vocabulary: `pass`, `fail`, `conditional_pass`, `conditional_fail`, `indeterminate`, and **`not_evaluated`**. `not_evaluated` is the only possible conformity outcome when no approved uncertainty budget or no approved rule applies. |
| MR-DEC-03 | The evaluator records inputs (measured error, U, limits, rule version) and the zone/probability that led to the outcome. |
| MR-DEC-04 | Reports include the rule text that was applied, or state that no conformity statement is made. |
| MR-DEC-05 | **VS-1 behavior**: only a limit check is produced; conformity outcome is `not_evaluated` with reason `no_approved_uncertainty_budget`. |

## 8. As Found / As Left

| ID | Requirement |
|---|---|
| MR-AFL-01 | A run has ordered **phases**: `as_found` → (optional `adjustment`) → `as_left`. Each phase has its own immutable dataset; data from different phases is never merged. |
| MR-AFL-02 | `as_found` is mandatory for any run on a customer instrument unless the procedure declares otherwise with justification (MI-10). |
| MR-AFL-03 | If as-found results are **outside limits** (limit check) or **non-conforming** (decision rule), the system flags `out_of_tolerance_as_found` and triggers a configurable workflow (notification, impact assessment record) — policy is lab-defined (MI-10). |
| MR-AFL-04 | `adjustment` phase steps are `non_repeatable`, require the `instrument.adjust` capability, a technician with adjustment authorization, evidence of before/after state, and (for real instruments) reference to the manufacturer's adjustment procedure (MI-11). |
| MR-AFL-05 | If no adjustment is performed, the report states **"As Left = As Found (no adjustment)"** or a re-measurement dataset, per lab policy (MI-10). |
| MR-AFL-06 | Reports present As Found and As Left side-by-side with distinct labels and the reason for any adjustment. |
| MR-AFL-07 | Adjustment of **real** instruments is disabled in the platform until a plugin explicitly passes adjustment validation; the VS-1 simulator may demonstrate an adjustment step on simulated state only, labelled as such. |

## 9. Rounding, digits, and presentation

| ID | Requirement |
|---|---|
| MR-RND-01 | Rounding/significant-digit rules for reported values and uncertainties are versioned records (MI-13) applied only at presentation, with the rule version stored. |
| MR-RND-02 | Reports state the unit for every value and uncertainty; coverage probability and factor for any expanded uncertainty. |
| MR-RND-03 | Localization never changes numerals' value (decimal separator display follows locale; stored values use `.`); Hebrew UI uses Western digits by default (A-10, UI_UX_SPEC). |

## 10. Environmental conditions and instrument state

| ID | Requirement |
|---|---|
| MR-ENV-01 | Procedures declare environmental quantities to record (e.g., temperature, humidity), whether from a sensor instrument (via plugin) or operator entry, and acceptance windows (MI-15). |
| MR-ENV-02 | Warm-up/stabilization requirements are procedure inputs (MI-16); the engine enforces them as preconditions with timers recorded in the journal. |
| MR-ENV-03 | Instrument self-test and error-queue state at start and end of a run are captured as evidence when the driver supports it. |

## 11. Calibration validity, intervals, and records

| ID | Requirement |
|---|---|
| MR-REC-01 | The platform records calibration date, next-due date **as determined by the lab/customer** (interval is an input, MI-19) — it does not compute intervals by default. |
| MR-REC-02 | Records retained per policy (Q-04). Approved snapshots and audit trail are retained at least as long as the policy requires and are never silently purged. |
| MR-REC-03 | Report content requirements (ISO/IEC 17025:2017 §7.8 — verify) are captured as a *checklist* the quality manager configures per report template (MI-20); the platform can block issuing when mandatory fields are absent. |
| MR-REC-04 | Personnel authorization: technician authorizations per procedure/instrument family are tracked (competence matrix inputs, MI-21). |

---

## 11A. Configurable metrology engine

All items in this section are **versioned configuration kinds** with provenance (`source`, `entered_by`, `verified_by`, `status`). The platform provides editors, validators and evaluators; it provides no values.

| Kind | Purpose | Key mechanics |
|---|---|---|
| `SpecTable` | Instrument specification / acceptance tables | Rows keyed by function, range, conditions; cells hold `AccuracyExpression` terms (§4) |
| `LimitsPolicy` | Which spec table / tightening applies to a job (manufacturer, lab, customer) | Selection expression over job attributes; explicit boundary inclusivity |
| `CorrectionSet` | Correction factors / calibration corrections of reference standards or systematic effects | Typed values with uncertainty, applicability range, source certificate ref |
| `UncertaintyBudget` | GUM budget (§5) | Components, distributions, sensitivity coefficients; evaluator computes u_c, U |
| `TURPolicy` | Test uncertainty ratio calculation and thresholds | Declares TUR formula (as typed expression), which uncertainty enters numerator/denominator, minimum acceptable TUR and action when below (all values inputs, MI-27) |
| `DecisionRule` | Conformity rule (§7) incl. guard banding | Kind + parameters; guard band `w` as Quantity or expression of U |
| `CMCTable` | Scope-of-accreditation CMC constraints | Range/function → minimum reportable uncertainty (inputs, MI-18) |
| `UnitDefinition` | Custom derived units/conversions (SI base and dimensions are locked) | Dimension vector + exact decimal factor/offset; requires review |
| `RoundingRule` | Presentation rounding (§9) | Applies only to presentation |
| `Calculation` | Named, reusable, typed formula (inputs/outputs with dimensions) | Pure, acyclic, no recursion; versioned like any item |

| ID | Requirement |
|---|---|
| MR-CFG-01 | Every formula is an expression compiled to canonical AST; the AST digest is part of the published version identity. |
| MR-CFG-02 | A result snapshot stores, for each evaluated quantity, the exact `(kind, key, version, digest)` of every spec table, correction set, budget, TUR policy, decision rule, and calculation used. |
| MR-CFG-03 | Re-evaluation of a historical run with a **newer** configuration is a distinct, explicitly labelled *what-if* analysis; it never overwrites or relabels the approved result. |
| MR-CFG-04 | Dimensional validation is performed at design time (type-check) and again at run time (defense in depth); unit mismatch is a hard error. |
| MR-CFG-05 | **TUR**: computed by the `TURPolicy` expression from the approved uncertainty of the standard and the tolerance of the UUT; result stored with inputs; action below threshold (warn/block/escalate) is policy. No threshold or formula is built in (MI-27). |
| MR-CFG-06 | **Guard banding** is a `DecisionRule` parameterization; the guard band's derivation is stored. |
| MR-CFG-07 | **CMC constraints** are checked by the evaluator at report time per lab policy (block/warn). |
| MR-CFG-08 | Published metrological configuration requires approval by a user holding the `metrology.approve` permission, who is not the author. |
| MR-CFG-09 | Every metrological configuration includes at least one **test vector** (inputs → expected outputs) supplied by the author and re-run on every dependent publish (regression guard). |

## 12. Unknown metrology inputs register

Every item is **unknown to engineering** and must be supplied (with provenance) before the stated gate. `Gate` = latest point at which absence blocks progress.

| ID | Unknown input | Needed for | Owner | Gate | Interim handling |
|---|---|---|---|---|---|
| MI-01 | Authoritative **Keysight 34401A documentation set** (user guide, service guide incl. calibration procedure, programming reference) at the lab's firmware level; legal right to reference/redistribute extracts | Driver, procedure, limits | Metrologist + Legal | Before any *real-instrument* work (P4) | VS-1 uses simulator; SCPI subset in driver marked `unverified_against_manual` |
| MI-02 | Which **functions/ranges** of the 34401A are in calibration scope | Procedure scope | Metrologist | P4 | VS-1 demo scope = one function (DC voltage) as a *structural demonstration*, not a scope statement |
| MI-03 | **Test points** (nominals, ranges, frequencies), ordering, and per-point settings (integration time, readings count, settle time/criteria) | Procedure content | Metrologist | P4 | VS-1 uses `synthetic_demo` values authored in the Application Builder (flagged, watermarked, rejected in production mode) |
| MI-04 | **Accuracy specifications / acceptance limits** per function/range/accuracy-period and how terms are combined | LimitsTable | Metrologist | P4 | VS-1 uses `synthetic_demo` limits that are *not derived from any specification* and are rejected in production mode |
| MI-05 | Whether limits are the manufacturer's spec, a lab-tightened tolerance, or customer-specific | Limits selection | Quality | P2 | Structure supports all |
| MI-06 | Required capability of reference standards (range, uncertainty/ratio vs. UUT) and acceptable standards list | Role requirements | Metrologist | P4 | Simulated reference source with `simulated` flag |
| MI-07 | Reference standard **certificate data** (values, uncertainties, due dates, issuers) | Traceability | Lab | P4 | None in VS-1 (simulated) |
| MI-08 | Applicable **decision rule(s)** and guard-band parameters per customer segment | Conformity | Quality + Customers | P2 | VS-1: limit check only |
| MI-09 | Acceptable PFA / risk level if probability-based rules are used | Decision rules | Quality | P2 | n/a |
| MI-10 | Lab policy for As Found/As Left: when adjustment is allowed, whether as-found is mandatory, OOT notification workflow, "as left = as found" wording | Phases & reports | Quality | P2 | Structure only |
| MI-11 | Instrument **adjustment procedure** and any security/authorization codes handling, and who may adjust | Adjustment step | Metrologist + Security | P4 | Disabled for real instruments; simulated only |
| MI-12 | Statistical algorithms/numeric precision policy (mean, standard deviation, outlier handling, t-values source) | Evaluator | Metrologist | P2 | Decimal-based reference implementation + golden tests proposed for review |
| MI-13 | Rounding and significant-digit rules for reports | Presentation | Quality | P2 | Raw decimals in drafts, labelled "unrounded" |
| MI-14 | Boundary inclusivity convention (≤ vs <) | Limits evaluation | Metrologist | P1 *(structural: field required, no default)* | Demo fixture declares explicitly, labeled synthetic |
| MI-15 | Environmental conditions required, sensor sources, acceptance windows | Preconditions | Metrologist | P4 | Operator-entered placeholder fields in demo, no limits |
| MI-16 | Warm-up / stabilization durations | Preconditions | Metrologist | P4 | Demo uses zero-length stub step marked synthetic |
| MI-17 | **Independent reference calculations** for uncertainty evaluator validation (inputs + expected outputs) | Evaluator validation | Metrologist | P2 | Textbook GUM example cases may be used after metrologist selection |
| MI-18 | Lab's CMC / scope of accreditation (if accredited) | Uncertainty floor check | Quality | P2 | Feature off |
| MI-19 | Calibration interval policy | Due dates | Lab/Customer | P2 | Field optional, no default |
| MI-20 | Required certificate/report content & layout (accreditation body rules, customer rules), signatory blocks, languages | Report templates | Quality | P2 | Draft template with explicit "not a certificate" |
| MI-21 | Personnel competence/authorization matrix | Authorization checks | Quality | P2 | Roles only |
| MI-22 | Required measurement time/throughput constraints (SCPI timing, trigger, NPLC) for NFR-09 | Performance budget | Metrologist/Eng | P1 measurements | Simulated timing parameters |
| MI-23 | Policy on measurement of `OVLD`/overload, instrument error codes, and how they enter results | Error handling | Metrologist | P4 | Driver surfaces as step failure with evidence |
| MI-24 | Policy for repeated/invalidated runs and acceptance of repeated measurements (e.g., "no cherry-picking" rule) | Run policy | Quality | P2 | Engine retains all attempts; selection rule must be declared in procedure |
| MI-25 | Jurisdictional regulatory requirements (data retention, e-signature, language) | Compliance | Legal/Quality | P2 | n/a |
| MI-26 | **Absolute Hardware Limits** per instrument model and per reference standard/source (e.g., maximum stimulus magnitudes, overload protection, forbidden command/parameter combinations) — content of the signed Hardware Limits Pack (ADR-0023) | Hardware Limits Pack | Safety Officer / Technical Authority | Before any real-instrument H2+ operation exists (P4) | Simulator-scope pack only; H2+ on real transports blocked without AHL coverage |
| MI-27 | TUR formula convention, minimum TUR thresholds, and required action below threshold | TURPolicy | Metrologist + Quality | P2 | Feature off by default |
| MI-28 | Correction factors / drift corrections for reference standards and when they apply | CorrectionSet | Metrologist | P2 | None |
| MI-29 | Approved list of units/dimensions and conversions beyond SI base set needed by lab | UnitDefinition | Metrologist | P2 | SI core only |
| MI-30 | Which configuration kinds require metrologist approval vs. quality approval vs. safety approval (approval matrix) | Governance | Quality | P1 | Defaults per ADR-0023: Safety Profile = LSMA authors + Safety Officer approves (+ Quality Manager when compliance-affecting); metrological kinds need `metrology.approve`; strictest-wins elsewhere |
| MI-31 | Translation/terminology for metrology terms in Hebrew and English used in forms and reports (reviewed glossary) | Localization | Quality + Linguist | P1 | Proposed glossary in UI_UX_SPEC marked *unreviewed* |
| MI-32 | Regression/acceptance test vectors per application supplied by the application author's metrologist | MR-CFG-09 | Metrologist | Each application publish | Demo vectors labelled `synthetic_demo` |
| MI-33 | Hardware-limits signing custody: who holds the `hardware-limits` signing keys (Safety Officer, deputies, Quality Manager), key storage (hardware tokens), threshold policy and ceremony procedure | Hardware Limits Pack signing | Safety Officer + Quality Manager | Before first real pack (P4) | Simulator-scope pack signed with a clearly marked non-production key in Test only |
| MI-34 | Named holders and deputies for Lab Safety/Metrology Administrator, Safety Officer / Technical Authority, Quality Manager, Releaser; availability rules for dual control | Approval workflows | Lab management | P0 | Roles defined; assignments pending |
| MI-35 | Rules defining when a Safety Profile change is **metrological/compliance-affecting** (which fields/tags, which referenced procedures/standards) | Quality Manager co-approval trigger | Quality + Safety Officer | P1 | Default derivation per ADR-0023 §2 (computed, raise-only) |
| MI-36 | Validation-mode policy: which instruments qualify as **test instruments** in a Test deployment and who maintains the allow-list | `validation` runs | Metrologist + Safety Officer | P4 | Simulator only |

---

## 13. Metrology acceptance criteria

| ID | Criterion |
|---|---|
| AC-MET-01 | Attempting a production-mode run with any `synthetic_demo` or `unverified` content fails preflight with a specific error naming the content item. |
| AC-MET-02 | For a fixed set of golden vectors (inputs → deviations, limits, outcomes), engine output is bit-identical on Windows and Linux CI. |
| AC-MET-03 | Property tests demonstrate: unit mismatch is rejected; addition across dimensions fails; decimal round-trips are lossless; limit evaluation is monotonic w.r.t. deviation. |
| AC-MET-04 | A report generated for VS-1 contains: "Uncertainty: not evaluated", "Conformity: not evaluated (no approved uncertainty budget)", and the simulation watermark; automated test asserts presence in he and en. |
| AC-MET-05 | As Found/As Left datasets for a simulated adjustment run are stored separately; no query path merges them; the report shows both. |
| AC-MET-06 | Metrologist review (recorded) of every `Unknown Input` closure before its gate. |
| AC-MET-07 | Editing a formula, spec table, or decision rule and publishing creates a new version; an already-approved result's snapshot, report, and re-render are byte-identical before and after. |
| AC-MET-08 | Expression type-checker rejects (at design time, with a located message) dimensionally inconsistent formulas, unbounded constructs, and references to unpublished/unapproved items in a publish. |
| AC-MET-09 | Dependency impact analysis lists every application, procedure, station assignment and approved result that references a configuration version proposed for deprecation. |

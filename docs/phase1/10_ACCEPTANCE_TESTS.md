# 10 — Phase 1 acceptance criteria and test plan

| | |
|---|---|
| Status | Proposal. **Adds** `P1-AC-*` criteria; does **not** renumber or replace any existing `AC-*` (F-26). Existing criteria (AC-VS, AC-NC, AC-ENV, AC-SAF, AC-GOV, AC-PD, AC-UX, AC-API, AC-SEC, AC-MET, AC-ARCH) remain normative and are referenced, not restated. |
| Convention | Each test carries `@req` tags for the FR/NFR/AC IDs it covers (AGENTS §5). A criterion is *done* only when automated in CI (or explicitly marked **[M]** manual with a recorded session). No criterion is satisfied by a mock that bypasses the property under test. |
| Metrology | Expected values in tests that encode metrology are supplied by the metrologist (MI-17/32) or are `synthetic_demo`-labelled fixtures; engineering does not generate "expected" metrological numbers. |

> Phase 1A has its own criteria (`P1A-AC-01…52`) in [13 §5](13_PHASE1A_PLAN.md#5-phase-1a-acceptance-criteria); they are a subset-in-spirit of the P1-AC rows below and are re-run unchanged against the real host in Phase 1B.

## 1. Status tracking

Implementers keep this table current (only this table and §2 "Status" columns may be edited by implementers; everything else is design-lane owned).

| Slice | Criteria | Passing in CI | Manual sessions | Blocked by |
|---|---|---|---|---|
| S0 | | | | |
| S1 | | | | |
| S2 | | | | |
| S3 | | | | |
| S4 | | | | |
| S5 | | | | |
| S6 | | | | |
| S7 | | | | |
| S8 | | | | |

## 2. Criteria by area

Types: **U** unit · **P** property · **G** golden/conformance · **F** fuzz · **I** integration · **E** Playwright E2E · **S** security/negative · **A** a11y · **V** visual-regression · **M** manual.

### 2.1 Identity and access (S0)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-IAM-01 | Local login issues short-lived access token and rotating refresh token; reuse of a rotated refresh token revokes the family; tokens carry `deployment_id`; a token from the other deployment is rejected with `DEPLOYMENT_MISMATCH`. | FR-SEC-03, AC-ENV-02 | I, S |
| P1-AC-IAM-02 | Role matrix test enumerates every default role × permission in GOVERNANCE §2.2 (+ approved additions) and asserts allowed/forbidden. | AC-SAF-01 | U, I |
| P1-AC-IAM-03 | Every prohibited role combination is rejected via UI, API and import, with `ROLE_CONFLICT` and an audit entry. | AC-SAF-03 | E, S |
| P1-AC-IAM-04 | A privileged grant is ineffective until approved by a user who is neither grantor nor grantee; approval requires a valid step-up token. | AC-SAF-04, P1-AC-API-04 | E, S |
| P1-AC-IAM-05 | Step-up tokens are single-use, bound to `{action, digest, user}`, and expire. | P1-AC-API-04 | S |
| P1-AC-IAM-06 | RLS coverage test: every table with `tenant_id` has RLS enabled and a passing cross-tenant probe (generated). | AGENTS rule 11, AC-SEC-02 | I, S |
| P1-AC-IAM-07 | Simulator-station enrolment issues a per-station keypair-bound credential; revocation takes effect at next sync; enrolling a Test station into Production fails (`DEPLOYMENT_MISMATCH`). | AC-ENV-03 | I, S |
| P1-AC-IAM-08 | Central audit chain verifies; tampering with any row fails verification; every state change and authorization denial on sensitive resources is audited with actor, reason, correlation ID. | FR-AUD-01/02 | I, S |
| P1-AC-IAM-09 | Password handling: Argon2id parameters set by policy; lockout/rate-limit on login; no secrets in logs (canary). | AC-SEC-08 | S |

### 2.2 Frame, design system, localization infrastructure (S0, extended by every slice)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-FRM-01 | `FrameBadges` render deployment kind and mode on **every route** in all three shells, both locales, both themes; hiding via CSS/theme/config is impossible (DOM + computed-style assertions). | AC-UX-05/09 | E, V |
| P1-AC-FRM-02 | Production shows no Builder navigation or authoring entry points; direct URL to a Builder route renders the "authoring disabled — use a Release" state and the API returns `PRODUCTION_CHANGE_CONTROL`. | AC-ENV-04 | E, S |
| P1-AC-FRM-03 | Contrast validator recomputes every token pair for light and dark; CI fails below WCAG AA (4.5:1 text, 3:1 non-text). | AC-UX-06 | U |
| P1-AC-FRM-04 | A `UiTheme` that references `sim`, `deployment-*`, `hazard` or `focus` is rejected by schema and ignored/rejected by the renderer. | F-24 | S |
| P1-AC-FRM-05 | No hard-coded user-visible strings (lint); pseudo-locales `en-XA`/`he-XB` show no clipped or overflowing text from `sm` to `xl`. | AC-UX-03, NFR-11 | U, V |
| P1-AC-FRM-06 | Measurement values, units, IDs, hashes, versions, expressions and wire text are `dir="ltr"` / `bdi` in RTL on all tagged elements (automated DOM check). | AC-UX-02 | E |
| P1-AC-FRM-07 | axe-core reports no critical/serious violations on every route × {en,he} × {light,dark}. | AC-UX-04 | A |
| P1-AC-FRM-08 | Keyboard-only walkthrough: skip links, region cycling (`F6`), command palette, dialog focus return. | AC-UX-04 | M, E |
| P1-AC-FRM-09 | Protected components (`FrameBadges`, `ModeChip`, `HazardRibbon`, `LimitCheckChip`) cannot be restyled through props or CSS variables (unit test). | 06 §3 | U |

### 2.3 Dashboard (S1/S5/S7)
| ID | Criterion | Type |
|---|---|---|
| P1-AC-DSH-01 | Builder Home loads with a single aggregate request and shows only cards the user is permitted to see; items authored by the user in the review queue are marked non-approvable. | E, I |
| P1-AC-DSH-02 | Readiness blockers card counts match the validation results for a seeded set (Input required, `synthetic_demo`, `pending_review`, unverified commands). | I |
| P1-AC-DSH-03 | Station Home shows the interrupted-run card first and it cannot be dismissed; "Start calibration" is disabled with reason when no compatible active application exists. | E |

### 2.4 Builder core, metadata engine, governance (S1, S7)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-BLD-01 | Create → edit → validate → submit → approve (second user) → publish for `Manufacturer`, `InstrumentFamily`, `InstrumentModel` entirely via GUI; resulting version is immutable with digest. | AC-NC-01, AC-GOV-01/02 | E |
| P1-AC-BLD-02 | Property inspector is generated from the schema: for every kind in scope, a golden test asserts the `InspectorModel`; an unknown `widget` yields a visible placeholder. | NO_CODE §12 | U, G |
| P1-AC-BLD-03 | Command stack: for generated command sequences, `undo ∘ apply = identity`; patch round-trips; autosave batches carry `base_revision`. | FR-META-06 | P |
| P1-AC-BLD-04 | Concurrent editing: second editor sees read-only live view with presence; stale save returns `409` and the UI offers keep-mine/theirs/merge; no edit is lost. | AC-GOV-09, ADR-0019 | E, I |
| P1-AC-BLD-05 | Lease expiry with unsaved local commands: user is warned, batches are preserved and re-applied or exported as a patch file. | F-25 | E |
| P1-AC-BLD-06 | Missing metrological values render as *Input required · MI-nn* with link to the register; publish for `simulation` is allowed, for production is blocked (`PR-013`). | MR-CFG, FR-MET-05 | E, I |
| P1-AC-BLD-07 | *View as data* shows canonical JSON + digest and offers no edit path (assert no editable element; API write attempt from that view does not exist). | BUILDER §12 | E |
| P1-AC-BLD-08 | Editing stored published bytes (direct DB tamper in test harness) causes load refusal in server and station. | NFR-18, AC-VS-04 | S |

### 2.5 Review and publish (S1/S7)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-GOV-01 | Approval on digest X cannot publish digest Y; stale approval returns `APPROVAL_DIGEST_MISMATCH`. | AC-GOV-02, AC-API-04 | I, S |
| P1-AC-GOV-02 | Author, contributors and (for safety) LSMA cannot approve their own snapshot (`SEPARATION_OF_DUTIES`); UI shows the reason. | AC-GOV-03 | E |
| P1-AC-GOV-03 | Change class is suggested by structural diff and can be raised, never lowered; required approvals follow the class. | GOV §4 | I, P |
| P1-AC-GOV-04 | Publish with the same Idempotency-Key creates exactly one version; a different key on the same snapshot → conflict. | AC-API-03 | I |
| P1-AC-GOV-05 | Publish re-runs the full pipeline against pinned dependencies; a dependency withdrawn after approval blocks publish. | GOV §6 | I |
| P1-AC-GOV-06 | Impact analysis lists dependents, packages, assignments, stations, in-flight runs and approved results on a seeded graph. | AC-GOV-05 | I |

### 2.6 Metrology workspace and expressions (S2)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-MET-01 | Expression conformance vectors pass bit-identically in Python (authoritative) and in the TS presentation subset; divergence fails CI. | NFR-17, AC-MET-08 | G |
| P1-AC-MET-02 | Dimension errors are reported in the editor with the expected/actual dimension; cross-dimension binding is impossible in pickers. | AC-MET-03, PR-006 | E, U |
| P1-AC-MET-03 | `IntervalInput` has no pre-selected inclusivity; saving a limit without both flags yields `PR-015`; evaluation honours the declared flags at the boundary (golden vectors for each of 4 combinations). | MI-14, AC-VS-06 | E, G |
| P1-AC-MET-04 | Functions with `metrology_status = pending_review` are usable in simulation and blocked (`PR-016`) in production-targeted packages. | NO_CODE §7.4(6) | I |
| P1-AC-MET-05 | Spec table: paste/CSV import shows a mapping preview and an error report; no value is guessed; unit columns parsed to `Decimal` strings (no float round-trip; property test over generated decimals). | BUILDER §6 | E, P |
| P1-AC-MET-06 | Every spec row/calculation requires at least one test vector; the runner shows within/outside for a sample; missing vectors warn (`PR-022`/`MET-001/002`) and block metrological publish. | MR-CFG-09 | E |
| P1-AC-MET-07 | Evaluate-with-sample shows the explain tree identical to the evaluator trace stored in a run snapshot. | NO_CODE §7.4(7) | I |
| P1-AC-MET-08 | Budget, decision-rule, correction, TUR, CMC, unit viewers are read-only and display "editor available in a later phase" without hiding existing content. | 02 §1.1 (editors P2) | E |
| P1-AC-MET-09 | Mutation score threshold (set after baseline) on `calos_expr` limits/evaluation modules. | R-04 | G |

### 2.7 Driver Designer and instrument model (S3)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-DRV-01 | Template token editor round-trips to the template string; placeholders without parameter definitions raise `DRV-001`; control characters/`;`/CR/LF raise `DRV-003` unless `compound` with permission. | PROCEDURE_SCHEMA D.2 | U, P |
| P1-AC-DRV-02 | Wire-text preview equals the Python formatter output on shared vectors; rejected-value examples show injection, bounds and dimension failures. | AC-SEC-04 | G, F |
| P1-AC-DRV-03 | Parser tester returns typed Decimal + unit for `number_with_unit` and errors for malformed samples; sample responses are stored as vectors in the draft. | AC-NC-02 | E, G |
| P1-AC-DRV-04 | Identification test-string table shows Exact / Partial / Mismatch consistent with the engine's matcher (shared vectors). | AC-VS-01/02 | G |
| P1-AC-DRV-05 | H2+ authoring requires the configured permission (D-06); H3/H4 controls are disabled with explanation in P1. | FR-DRV-04 | E, S |
| P1-AC-DRV-06 | New commands default to `unverified_against_manual`; `verified` for H2+ requires a second person; unverified count appears in readiness. | BUILDER §5.4 | E |
| P1-AC-DRV-07 | No raw-write construct exists in any step palette, driver, or API (static scan + negative API test). | PR-021, AGENTS rule 5 | S |
| P1-AC-DRV-08 | Simulation tab: rules, models and scenarios validate; seeded noise is reproducible; scenario values carry `synthetic_demo`. | FR-DRV-05 | I |
| P1-AC-DRV-09 | "Run a conversation" works against the simulator only; handler cannot import transport adapters (architecture test). | NFR-20 | I, S |
| P1-AC-DRV-10 | Fuzz corpus for formatters/parsers/template tokenizer runs nightly with no crashes/hangs. | roadmap §6 | F |

### 2.8 Instrument manager, station-side discovery (S3/S5)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-INS-01 | Discovery scan sends only the identification query within the approved scope and flags simulated instruments `[SIM]`. | AC-VS-01 | I |
| P1-AC-INS-02 | Wrong model/serial yields `mismatch`; run creation is blocked. | AC-VS-02 | I, E |
| P1-AC-INS-03 | Simulated identity cannot be registered as an Asset (`422`). | AC-VS-03 | I |
| P1-AC-INS-04 | VISA scope is visible but disabled with an explanation in P1; no VISA path is reachable from central (import-linter). | F-18 | E, S |
| P1-AC-INS-05 | Model editor Safety tab lists only approved, published Safety Profiles applicable to the model, read-only; no create/edit path exists there. | ADR-0023 | E, S |

### 2.9 Safety Console and enforcement (S3, S4/S5 for in-run enforcement)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-SAF-01 | AHL band is read-only visually and programmatically (`aria-readonly`, no input); out-of-band envelope cannot be saved/submitted; reason announced to assistive tech. | AC-UX-10, AC-SAF-05 | E, A |
| P1-AC-SAF-02 | Approval-path indicator matches classification (Safety Officer always; Quality Manager if flagged; raise-only); author/contributors cannot approve. | AC-SAF-02 | E, I |
| P1-AC-SAF-03 | Coverage view marks every H2+ command covered/uncovered; uncovered blocks real-transport publish and Production release. | BUILDER §5.8 | I |
| P1-AC-SAF-04 | Effective-limit viewer shows AHL ∩ profile ∩ procedure bounds and the narrowest source for a selected parameter; values match broker enforcement on shared vectors. | FR-SAF-07 | G |
| P1-AC-SAF-05 | Broker refuses and journals `safety.violation` for any argument beyond AHL, profile or procedure bounds; no bytes reach the transport; safe-state runs. | AC-SAF-06, AC-VS-09 | I, S |
| P1-AC-SAF-06 | Hardware Limits Pack with missing/expired/rolled-back/unsigned/insufficient-threshold signature is rejected; H2+ on real transports fails closed while H0/H1 continue (simulated transport). | AC-SAF-07 | S |
| P1-AC-SAF-07 | No UI, API, kind, procedure or DB-role path can create/alter/delete an AHL entry (negative tests + ACL test). | AC-SAF-08 | S |
| P1-AC-SAF-08 | Runs pin profile versions and pack digest; withdrawing a pinned profile halts at next node boundary into safe-state; resume under it is refused. | AC-SAF-09/10 | I |
| P1-AC-SAF-09 | No "override/bypass/disable" control or flag exists in any safety UI or API (UI snapshot + OpenAPI scan for forbidden terms). | AGENTS rule 4 | S |
| P1-AC-SAF-10 | Full Safety Profile lifecycle (AC-NC-12) is GUI-only by three roles. | AC-NC-12 | E |

### 2.10 Procedure Designer and Simulation Lab (S4)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-PD-01 | Every `PR-xxx` rule has a fixture that triggers it; the designer shows it at the right location with the defined quick fix. | AC-PD-02 | U, E |
| P1-AC-PD-02 | Structural impossibilities are blocked at edit time with explanation (unbounded loop, retry on non-repeatable/H2+, weaker resume policy, H2+ outside lifecycle). | AC-PD-01 | E |
| P1-AC-PD-03 | Canvas↔JSON round-trip identity over generated procedures. | AC-PD-03 | P |
| P1-AC-PD-04 | Extract-to-sub-procedure preserves behaviour on a corpus (journal equivalence modulo node IDs/call frames). | AC-PD-04 | I |
| P1-AC-PD-05 | Outline view provides complete keyboard operation equivalent to canvas; AC-NC-03 completed keyboard-only; axe passes on canvas+outline. | AC-PD-08 | M, A |
| P1-AC-PD-06 | Visual diff of two versions equals an independent structural diff oracle on generated mutations; rename-aware. | AC-PD-07 | P |
| P1-AC-PD-07 | Hazard overlay uses icon+text+colour; hazard path lists every H2+ op in order with coverage. | DESIGNER §12 | E |
| P1-AC-PD-08 | Deferred blocks (`switch`, `while`) are listed as "Not yet available" with explanation; cannot be inserted. | F-28 | E |
| P1-AC-PD-09 | Inspector bindings list only definitely-assigned, type- and dimension-compatible sources. | DESIGNER §5 | U |
| P1-AC-PD-10 | Large procedure (size from baseline) remains interactive: virtualised canvas and outline within the budget set in S4. | NFR-09 | V, perf |
| P1-AC-SIM-01 | Breakpoint, step, inspector, expression trace and fault injection work against the production engine and cannot reach a non-simulator transport. | AC-PD-06, NFR-20 | I, S |
| P1-AC-SIM-02 | Kill-and-resume at every node boundary of the demo procedure yields a final dataset identical to the uninterrupted run (excluding attempt metadata). | AC-PD-05, AC-VS-10 | I |
| P1-AC-SIM-03 | Debug what-if overrides are flagged `debug`, non-approvable and never appear in non-debug runs. | DESIGNER §13 | I |
| P1-AC-SIM-04 | Application tests: save run config + assertions; all must pass to publish (`APP-003`); a failing assertion blocks with a clear message. | NO_CODE §14 | E, I |
| P1-AC-SIM-05 | Simulation artefacts carry `simulated:true`; `POST /reports kind=issued` for them returns `SIMULATION_NOT_APPROVABLE`. | AC-API-07 | I |
| P1-AC-SIM-06 | Time budget: simulation jobs queue/cancel correctly; cancellation leaves no worker running. | — | I |
| P1-AC-SIM-07 | Fault injection matrix (timeout, disconnect, garbled, error-queue) triggers the declared handler; superseded attempts retained. | AC-VS-11 | I |
| P1-AC-SIM-08 | Draft report preview from a Lab run carries the watermark and "Uncertainty/Conformity: not evaluated". | AC-VS-14 | E |

### 2.11 Equipment & stations (S5/S7)
| ID | Criterion | Type |
|---|---|---|
| P1-AC-EQP-01 | `StandardRole` fields never suggest values; required capability fields stay `Input required` until the author supplies them with provenance. | E |
| P1-AC-EQP-02 | `simulated_substitute` is selectable only for simulation-intended applications; production-targeted packages containing it raise `PR-024`. | I |
| P1-AC-EQP-03 | `StationRequirement` computed catalog requirements are read-only; manual additions can only tighten. | U |
| P1-AC-EQP-04 | Procedure role picker lists only existing `StandardRole`s; binding happens at run start. | E |
| P1-AC-STN-01 | Enrolment token is one-time, shown once, expires; revoke needs reason + step-up. | E, S |
| P1-AC-STN-02 | Capability report lists runtime, catalog majors+minors, plugins, schema versions, transports. | I |
| P1-AC-STN-03 | Compatibility list shows reason per incompatible station. | E |
| P1-AC-STN-04 | A Test station appears only with simulator + allow-listed test instruments; cross-deployment enrolment rejected. | S |
| P1-AC-STN-05 | No UI control or API sends an instrument command from central to a station (static scan + network policy test). | S |

### 2.12 Calibration Runner, results (S5)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-RUN-01 | Wizard blocks on any preflight `block` gate with reason and source ref; `warn` requires acknowledgement with reason (journaled). | API §4 | E |
| P1-AC-RUN-02 | SIMULATION banner is present on every route during a simulation run, header and report; cannot be hidden. | AC-UX-05 | E, S |
| P1-AC-RUN-03 | Run pins procedure version + digest; tampered stored bytes refuse to load. | AC-VS-04 | S |
| P1-AC-RUN-04 | Readings flow engine → driver interpreter → broker → simulator; each reading has raw text, parsed Decimal, unit, UTC + monotonic times, attempt, `simulated`. | AC-VS-05 | I |
| P1-AC-RUN-05 | Every event journaled; chain verifies; replay into empty projection reproduces identical state. | AC-VS-07 | I |
| P1-AC-RUN-06 | Kill at every journal boundary; restart shows interrupted run; resume completes; dataset equals uninterrupted. | AC-VS-10 | I |
| P1-AC-RUN-07 | Resume modal content equals the engine-computed plan (contract test via `GET /runs/{id}/resume-plan`). | AC-UX-07 | I |
| P1-AC-RUN-08 | Non-repeatable node interrupted requires operator decision; resume refuses without it; decision journaled and attributed. | AC-VS-12 | E, I |
| P1-AC-RUN-09 | Resume with a different instrument serial is blocked. | AC-VS-13 | I |
| P1-AC-RUN-10 | Complete run + draft report with network blocked at OS level. | AC-VS-17 | I |
| P1-AC-RUN-11 | Local UI rejects wrong Host/Origin/token (DNS-rebinding probes). | AC-VS-19 | S |
| P1-AC-RUN-12 | Prompts never auto-dismiss; hazard/safety alerts use assertive live regions and a persistent banner; screen-reader pass on the operator flow. | UI_UX §10 | M, A |
| P1-AC-RES-01 | Results use "Within limits / Outside limits / Not evaluated" (limit-check labels); no PASS/FAIL/Calibrated string exists in the bundle (static scan of message catalogs). | UI_UX §11 | U |
| P1-AC-RES-02 | Conformity and uncertainty statements read "not evaluated" when no approved rule/budget exists. | AC-MET-04, AC-VS-14 | E |
| P1-AC-RES-03 | Limit band shows boundaries with declared inclusivity from the pinned configuration. | AC-VS-06 | E |
| P1-AC-RES-04 | Values labelled "unrounded" until rounding rules exist; no display rounding is applied silently. | MI-13 | E |
| P1-AC-RES-05 | Superseded attempts are visible and never deleted. | FR-EXEC | E, I |
| P1-AC-RES-06 | Draft report generated from complete and partial runs; non-removable watermark/banner; he and en; config footer. | AC-VS-14 | E |
| P1-AC-RES-07 | Report records template + dataset + renderer digests; re-render gives identical content hash. | AC-VS-15 | I |
| P1-AC-RES-08 | Phase-2 hooks (submit/approve/issue) are disabled with explanation and return `FEATURE_NOT_AVAILABLE`/`SIMULATION_NOT_APPROVABLE`. | AC-API-07 | E, S |

### 2.13 Screens, reports, localization (S6)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-UIB-01 | Generate-from-procedure yields a usable operator screen; customisations survive regeneration (overlay IDs stable). | AC-NC-05 | E, P |
| P1-AC-UIB-02 | Widget without accessible name or visibility expression using a metrological function is rejected (`UIB-001/002`). | AC-UX-04 | U |
| P1-AC-UIB-03 | Preview renders he/en, LTR/RTL, breakpoints sm–xl with correct mirroring; preview runs in a sandboxed iframe without `unsafe-eval`. | AC-UX-01 | E, S |
| P1-AC-UIB-04 | Unknown widget renders a visible error placeholder, never a silent skip. | NO_CODE §10 | U |
| P1-AC-UIB-05 | Action catalog only; no script/HTML/URL action can be authored. | FR-UIB-04 | S |
| P1-AC-UIB-06 | Layer resolver "Why is this shown?" lists the resolution chain consistently with the rendered result. | BUILDER §7 | I |
| P1-AC-RPT-01 | Bindings validated against `calibration-result@1`; unmapped/mistyped bindings flagged (`RPT-001/002`). | FR-RPD-02 | U |
| P1-AC-RPT-02 | Template cannot define or remove watermark/legend/footer/integrity code (schema rejects; designer shows locked overlays). | AC-VS-16, FR-RPD-04 | S, E |
| P1-AC-RPT-03 | PDF preview in he and en includes embedded fonts with Hebrew coverage and correct bidi for mixed strings (golden PDF text/hash). | R-06 | G |
| P1-AC-RPT-04 | Conditional As Left section renders only when present. | AC-NC-06 | E |
| P1-AC-RPT-05 | Snapshot approvals stored by digest per sample/locale; changing the template invalidates them. | BUILDER §8 | I |
| P1-AC-RPT-06 | Certificate-kind templates can be authored but cannot render `issued` in P1. | 02 §1.1 (issued reports P2) | S |
| P1-AC-RPT-07 | Restricted rich text sanitised; no raw HTML/JS pass-through (XSS corpus). | NO_CODE §10 | S, F |
| P1-AC-RPT-08 | Accessible PDF tagging check runs where the renderer supports it; unsupported is reported, not hidden. | UI_UX §10 | A |
| P1-AC-I18N-01 | Key table filters missing/unreviewed; completeness per locale feeds PR-017 per Policy `required_locales`. | FR-UIB-03 | E |
| P1-AC-I18N-02 | ICU placeholder mismatch across locales is detected (`I18N-003`); Hebrew plural categories per CLDR. | ADR-0015 | U |
| P1-AC-I18N-03 | Fallback `he→en` is visibly flagged. | UI_UX §5 | E |

### 2.14 Admin, packaging, library, release (S0/S7)
| ID | Criterion | Covers | Type |
|---|---|---|---|
| P1-AC-ADM-01 | Role matrix view equals the server catalog; rejected combinations show the specific rule. | AC-SAF-01/03 | E |
| P1-AC-ADM-02 | Grant request UI shows pending state to all parties; approval requires step-up. | AC-SAF-04 | E |
| P1-AC-ADM-03 | Deployment identity view is read-only and never offers a switcher. | AC-UX-09 | E |
| P1-AC-ADM-04 | Trusted Issuer add/rotate/remove requires admin proposal + Quality Manager + Safety Officer approvals; no single role completes it. | AC-ENV-08 | E, S |
| P1-AC-ADM-05 | Production policy/threshold edits occur only via Change Requests (versioned, rollback-able); direct edit attempts via UI/API/DB role fail. | AC-ENV-09 | E, S |
| P1-AC-ADM-06 | Audit list filters and chain verify work; break-glass events are flagged. | AC-GOV-08 | E |
| P1-AC-ADM-07 | Placeholders for P2/P3 areas are visible, disabled and explain the phase (no dead links). | scope honesty | E |
| P1-AC-ADM-08 | Telemetry setting reflects D-17 default; when off, `POST /telemetry/ux` is not called (network assertion). | NFR/privacy | E |
| P1-AC-ADM-09 | Platform Administrator holds no approval permission anywhere (matrix + attempted actions). | AC-SAF-01 | S |
| P1-AC-ADM-10 | Locale defaults and required locales are Policy-driven and audited. | FR-UIB-03 | I |
| P1-AC-PKG-01 | `.calapp` builds deterministically (same inputs → identical bytes/digest). | NFR-18 | G |
| P1-AC-PKG-02 | Import rejects tampered files, wrong signature, path traversal, archive bombs, unknown files. | AC-SEC-03 | S, F |
| P1-AC-PKG-03 | Same digest dedupes; same `(kind,key,version)` with different digest → `VERSION_IMMUTABLE`. | GOV §14 | I |
| P1-AC-PKG-04 | Package contains no secrets, personal data or run data (scan). | GOV §14 | S |
| P1-AC-PKG-05 | Inspect-before-import reports without writing (DB diff empty). | 09 §3 | I |
| P1-AC-PKG-06 | Computed `requires` equals the independent oracle on generated closures. | NO_CODE §15 | P |
| P1-AC-PKG-07 | Publish wizard blocks on any pipeline error; pre-release labels only in Test. | GOV §7 | E |
| P1-AC-PKG-08 | Compatibility list shows the specific reason per station. | AC-NC-08 | E |
| P1-AC-LIB-01 | Library shows only items in the caller's deployment/tenant with correct trust tier. | F-05 | E |
| P1-AC-LIB-02 | Clone creates drafts with `derived_from`; approvals and `verified/approved` provenance reset to `draft`. | 09 | I |
| P1-AC-LIB-03 | `synthetic_demo` items are chipped and absent from Production Library. | PR-014 | E, S |
| P1-AC-LIB-04 | No external download, rating or comment functionality exists. | D-03 | S |
| P1-AC-LIB-05 | Insert-as-reference shows "upgrade available" with impact preview; copy preserves lineage. | DESIGNER §15 | E |
| P1-AC-REL-01…10 | Release stages and findings per AC-ENV-05/06/07/08/12 and AC-NC-11: happy path; each rejection (`synthetic_demo`, simulated profile, unresolved `$input`, `intended_modes` lacks production, untrusted issuer, tampered signature/digest, incompatible versions) produces its specific finding; importer ≠ approver; Test approvals do not carry over; digests identical; emergency withdrawal/rollback only (break-glass flagged). | AC-ENV-05…12 | E, S |

### 2.15 Architecture, performance, supply chain
| ID | Criterion | Type |
|---|---|---|
| P1-AC-ARCH-01 | import-linter contracts for all new Python packages; VISA transport package unreachable from `apps/api` and central workers. | S |
| P1-AC-ARCH-02 | eslint-boundaries: designers don't import `api-client`; no cross-designer imports; no `any` in `ui-runtime`/`editor-core`; no `dangerouslySetInnerHTML`. | S |
| P1-AC-ARCH-03 | Lint test greps runtime packages for model/vendor strings and fails on any match (including the demo model name). | S |
| P1-AC-ARCH-04 | Codegen drift check fails if generated Python/TS types differ from schemas; hand edits detected. | U |
| P1-AC-ARCH-05 | Capability Matrix updated for every new operation (CI check against a manifest of builder operations). | U |
| P1-AC-PERF-01 | Perf harness records initial render, interaction latency, validation latency, and node/row scaling for Builder, Procedure Designer, Spec grid, Operator console in S1–S4; **numeric budgets are then written into this file** and enforced from S5. | perf |
| P1-AC-SUP-01 | SBOM generated for web and Python artefacts; dependency licences checked against the approved list; no network calls to third-party hosts at runtime (CSP + test). | S |

## 3. Test layers (additions to `ROADMAP §6.2`)

| Layer | Phase 1 emphasis |
|---|---|
| Unit/Component | `ui-kit` states × locale × theme × density; schema → inspector goldens; command stack |
| Property | command/inverse identity; canvas↔JSON; decimal-string round-trip; structural diff oracle; computed `requires` |
| Golden/Conformance | expression vectors (Py+TS); limit evaluation incl. inclusivity combinations; formatter/parser vectors; digest vectors; golden PDFs |
| Fuzz | template tokenizer, parsers, package loader, YAML/CSV importers, rich-text sanitiser |
| Integration | API + Postgres (Testcontainers) incl. RLS; engine + driver + simulator; station agent + SQLite; central simulation workers |
| Contract | OpenAPI (oasdiff), Schemathesis stateful flows (draft→publish, grant, release) |
| Fault injection | kill at every journal boundary; disconnect/timeout/garbled; disk full; clock jump |
| Security | authz matrix; RLS probes; injection; DNS rebinding; tamper; cross-deployment probes (AC-SEC-13) |
| E2E | Playwright GUI-only (§4) in he/en and RTL; viewport sm–xl for review/dashboard screens |
| Visual | Screens × {en,he} × {light,dark} × density; PDF text/hash compare |
| A11y | axe on every route; manual keyboard and NVDA/JAWS passes per slice |
| Usability | §8 |

## 4. GUI-only E2E harness (AC-NC-01…12)

**Rules.** Tests drive the product *only through the UI* (role-based locators: `getByRole`, accessible names; `data-testid` allowed only for canvas nodes). The harness **fails** if the browser issues requests to administrative/authoring endpoints that the UI did not initiate (route allow-list derived from the OpenAPI + UI request log), if any `page.request`/API seeding is used after the baseline fixture, or if content other than the platform's shipped catalog exists in the sandbox. Prerequisites performed once by IT (station enrolment, VISA backend) are listed and excluded (matrix 1.17, 6.11). Each scenario runs in en and he/RTL; screenshots at defined checkpoints; axe at each page.

| Scenario | Setup | Core assertions beyond the AC text |
|---|---|---|
| AC-NC-01 | Clean sandbox, engineer user | Draft validates with only *Input required* warnings; model appears in selectors after publish; audit entries present |
| AC-NC-02 | Model from NC-01 | Identification shows Exact for pasted sample; read returns typed Decimal + unit; unverified warnings visible; stored vectors exist in draft |
| AC-NC-03 | Driver from NC-02 | Lint clean; extracted sub-procedure reused in two places; keyboard-only variant passes |
| AC-NC-04 | Procedure | Spec table rows are `synthetic_demo` with explicit inclusivity; evaluate-with-sample both within and outside; test vector passes; role bound |
| AC-NC-05 | Procedure | Generated screen customised; conditional field works in a sim run; he/RTL mirrored; axe clean |
| AC-NC-06 | Procedure + screen | PDF in he and en shows watermark; bindings valid; attempt to remove watermark impossible |
| AC-NC-07 | Application | Breakpoint hit, inspector values, fault injected, kill-and-resume parity; app test saved and required |
| AC-NC-08 | Published app, enrolled sim station | Station active manifest digest == published digest; run completes using it |
| AC-NC-09 | Published v1.0.0 | New draft → change → submit → second user approves → v1.1.0; distinct digest; both exist; station runs v1.1.0; SoD enforced |
| AC-NC-10 | Two versions deployed | Rollback to v1.0.0; in-flight run unaffected; audit shows rollback; withdrawn target refused |
| AC-NC-11 | Test + Production rehearsal | Digests identical; independent approvals; `synthetic_demo` package rejected with specific finding; every step GUI-only |
| AC-NC-12 | Three role fixtures | Approval path matches classification; AHL band enforced; author/admin cannot approve; profile enforced in simulated run |

## 5. Negative and security test list (must exist before the slice closes)

| Area | Cases |
|---|---|
| AuthN/Z | Missing/expired/forged token; wrong deployment; wrong tenant/lab; every mutating endpoint with an unprivileged principal; role conflict combinations; self-approval; stale digest; step-up replay |
| Config integrity | Direct DB update of published version; trigger bypass attempt as app role; duplicate version number; floating ref in published item |
| Safety | Envelope outside AHL; missing AHL for H2+ on real transport; expired/rolled-back pack; override-like flags in payloads rejected; withdrawal mid-run |
| Injection | Control characters/`;`/newline in template and string params; regex DoS in parser patterns; oversized inputs; Unicode bidi spoofing in identifiers (display isolates + lint) |
| UI | XSS corpus in localized text and rich text; theme attempts to hide badges; unknown widget; iframe sandbox escape attempts; CSP violation test |
| Package/release | Tampered file, path traversal, archive bomb, unknown file, wrong issuer, expired signature, cross-deployment package |
| Simulation boundary | Any attempt to select a non-simulator transport in Lab; central import of VISA package |
| Privacy | Telemetry payload content scan; no personal data in URLs; secrets canary absent from logs, diagnostics, errors |

## 6. Accessibility, RTL and visual regression matrix

| Dimension | Values |
|---|---|
| Routes | Every route in Operator, Admin (P1 subset), Builder |
| Locales | `en`, `he`, pseudo `en-XA`, `he-XB` |
| Themes | light, dark |
| Density | compact (Builder/Admin), comfortable (Operator) |
| Viewports | `sm` 360 (dashboard, review, run monitoring read-only), `md` 768, `lg` 1200, `xl` 1600 (designers ≥1024) |
| Checks | axe critical/serious = 0; visual diff against approved baselines; DOM check for LTR isolation; focus order; reflow at 200 % zoom; reduced-motion |
| Manual | NVDA/JAWS on operator run flow and review/approval; Hebrew native-speaker review of strings (Q-15/MI-31) |

## 7. Traceability

`just docs-trace` (once built) must show: every `FR-NC-*`, `FR-META-*`, `FR-GOV-*`, `FR-DRV-*`, `FR-SAF-*`, `FR-ENV-*`, `FR-UIB-*`, `FR-RPD-*`, `FR-PD-*` in scope for Phase 1 mapped to ≥1 passing test; every `P1-AC-*` mapped to its slice. Until then, `tools/` adds a minimal script that extracts `@req` tags and compares against the tables above.

## 8. Usability study protocol

Closes F-21 *structurally*; numeric thresholds are decision **D-10** before S4.

| Element | Specification |
|---|---|
| Objective | Show that non-programmer calibration experts complete AC-NC-01…12 unaided (NFR-19) and that operators/approvers complete their journeys (J-01…J-11). |
| Participants | Per persona P1, P2, P5, P10, P11 (and release manager): a number per persona set by UX research (UI_UX_SPEC §12 suggests 5–8 per persona); sessions in **he and en**; recruitment of real laboratory staff; no engineering staff as participants. |
| Rounds | Round 0 (paper/prototype, Phase 0 research); Round 1 after S4 (Builder core + Procedure Designer); Round 2 after S7 (end-to-end incl. release and safety roles); confirmation in S8. |
| Tasks | The AC-NC scenarios as written in BUILDER §14 click paths, without the click paths shown; think-aloud permitted. |
| Environment | Clean sandbox with only shipped catalog; facilitator may not help except for pre-agreed prerequisites; screen + audio recorded with consent. |
| Metrics | Task success (unaided / with hint / failed), time on task, error classes (using validation codes), SUS, free-text pain points, assistive-technology participants included. |
| Thresholds | **Not set here.** Form: "≥ X % unaided success for each AC-NC task per persona, median time ≤ Y, SUS ≥ Z", with X/Y/Z fixed by product + UX research after Round 0 and recorded in 11 (D-10). |
| Output | Findings triaged into: catalog/hint gaps (matrix update), copy changes, designer changes; each traced to an issue; severity by task failure. |
| Ethics/privacy | Consent forms; recordings stored per policy; no real customer data; participant IDs pseudonymised. |

## 9. Performance measurement protocol (to set budgets, not invent them)

For S1–S4, record on a reference machine class (documented) the p50/p95 of: Builder initial load; inspector edit-to-feedback; local validation latency; server validation latency; Procedure Designer interaction at increasing node counts; DataGrid scroll/filter at increasing row counts; simulation start-to-first-event; station UI action latency. Publish numbers in this file as budgets with a documented margin; thereafter CI performance tests fail on regression beyond the margin.

## 10. Slice exit checklist (all slices)

1. All slice P1-AC and listed existing AC green in CI (Linux + Windows where relevant).
2. Capability Matrix rows added/updated; ADR/decision log updated; docs-trace green.
3. he/en strings present (marked `needs_review` where applicable); RTL + axe + visual baselines approved.
4. Negative/security cases from §5 for the slice implemented.
5. Demo recorded against the slice exit demo in [02](02_PHASE1_PLAN.md).
6. No new `TODO` without an issue; no commented-out code; no weakened contract.

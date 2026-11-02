# 11 — Decisions and human inputs required

| | |
|---|---|
| Status | Open. Nothing in this package assumes an answer; each row states a **recommendation** so work can be planned, but the recommendation does not take effect until the named owner records a decision here (outcome column, date, name). |
| Rule | AGENTS §8: anything that widens permissions, touches governance, adds dependencies/infrastructure, uses vendor material, or supplies metrological/safety values needs a human. This list is the register for Phase 1. |

## 1. Decisions

| ID | Decision | Options | Recommendation | Owner | Needed by | Source | Outcome |
|---|---|---|---|---|---|---|---|
| **D-01** | Shape of Phase 1: roadmap monolith vs incremental slices | (a) roadmap §3 as written; (b) Codex's narrow proposal only; (c) slices S0–S8 reconciling both | **(c)** — S1 is Codex's proposal; roadmap milestones preserved | Product owner | Before S0 | F-01, 02 | |
| **D-02** | Pull identity/RBAC/RLS/simulator-enrolment into Phase 1 (local accounts only; OIDC stays P2) | (a) yes as M1.0/S0; (b) keep P2 and weaken P1 acceptance (not recommended) | **(a)** — AC-SAF/AC-NC-09/AC-ENV-03 cannot pass otherwise | Product + security | Before S0 | F-02 | |
| **D-03** | Library scope | (a) deployment-local Library in P1, marketplace P6; (b) design-only; (c) build external marketplace now | **(a)** | Product + legal | Before S7 | F-05, 09 §6 | |
| **D-04** | Plugin packaging scope in P1 | (a) read-only visibility only; (b) include `.calplug` authoring/review UI | **(a)** — Class B is DEV and Phase 3 | Product | Before S7 | F-06 | |
| **D-05** | Theme editor timing | (a) P2 (P1 ships read-only system theme + validator); (b) P1 | **(a)** | Product + UX | Before S6 | F-04 | |
| **D-06** | Who may author H2 commands | (a) new "Hazardous Driver Author" bundle (no approval rights; toxic with Safety Officer on same change); (b) add `driver.author.hazardous` to Calibration Engineer with mandatory Safety Officer review | **(a)** (clearer SoD) | Safety Officer + Quality | Before S3 | F-11 | |
| **D-07** | Kind → permission group / approval / change-class table (MI-30) incl. `config.approve.ui` holder and new `application` group | Accept 07 §3 as is / amend | Accept with amendments by MI-30 owner | Quality | Before S1 (instrument kinds) and per slice | F-10, F-32 | |
| **D-08** | Adopt proposed bodies for undefined kinds (07 §4) as the starting schemas | Accept / amend per kind | Accept for implementation start; metrology reviewer must approve `LimitsPolicy`, `ApplicationTest` assertion semantics | Architecture + metrologist | Per slice | F-09 | |
| **D-09** | Provenance lifecycle rules (07 §5) | Accept / amend | Accept | Metrologist + Quality | Before S1 | F-13 | |
| **D-10** | Usability thresholds (success %, time, SUS) and participant counts per persona | Set after Round 0 | Define after research Round 0; record numbers here | Product + UX research | Before S4 | F-21, 10 §8 | |
| **D-11** | Locale handling: remove hard-coded `en`+`he` requirement from `Manufacturer` schema; correct v1 vs ship v2+migrator; legal-name vs display-name split | (a) correct v1 (nothing published); (b) v2 + migrator | **(a)** if no version was ever published, else (b) | Architecture | Before S1 | F-14 | |
| **D-12** | Frontend dependencies (06 §9) | Approve each class or alternative | Approve S0 set after licence + CSP review; each addition via ADR-0022 addendum | Architecture | Before S0 | 06 §9 | |
| **D-13** | Brand palette, fonts, licences | (a) adopt 03 §4 proposal; (b) supply brand tokens | Provisional adoption of 03 §4; fonts SIL OFL pending licence confirmation | Product + design | Before S0 | 03 | |
| **D-14** | `package.verify` permission | (a) add least-privilege read-only permission; (b) reuse `package.import` | **(a)** | Security | Phase 0B review | F-12 | |
| **D-15** | Transport package split to keep VISA unreachable from central | (a) split `port+simulator` / `visa`; (b) keep one package with lint | **(a)** | Architecture + security | Before S3 | F-18 | |
| **D-16** | Demo naming and vendor material (Q-08, MI-01) | (a) neutral names in UI/docs; vendor model string only in `content/` after legal OK; (b) use vendor name freely | **(a)** | Legal + product | Before S3 | F-29 | |
| **D-17** | UX telemetry: default on/off, storage, opt-out, event catalogue | Off in Production; opt-out in Test | Off by default, opt-in per tenant; catalogue schema-validated, no content values | Product + privacy | Before S1 telemetry work | BUILDER §15 | |
| **D-18** | Naming: `media` instead of `assets` for blobs; Release Package extension `.calrel` | Accept / alternative | Accept both | Architecture | Before S1 | F-15, F-31 | |
| **D-19** | Canvas library (spike result) | Node-graph library vs custom SVG | Decide from spike report against 06 §6.1 criteria | Architecture | Before S4 | F-08 | |
| **D-20** | Error code housekeeping: deprecate `ENVIRONMENT_MISMATCH`; add `VERIFIER_UNAVAILABLE` and new codes (08 §4) | Accept | Accept | Backend lead | Before S0 | F-20 | |
| **D-21** | Lease/heartbeat/offline-buffer defaults (06 §5.4) | Accept / change | Accept as configuration defaults | Architecture | Before S1 | F-25 | |
| **D-22** | Phase 1 duration baseline | Team re-baselines from slice sizes | Do after G0; do not use roadmap totals | Engineering lead | After G0 | F-07 | |

## 2. Human inputs this package could not and did not supply

These remain open in the existing registers; the Phase 1 plan proceeds around them using `Input required` markers and `synthetic_demo`/`simulated` content.

| Item | What is missing | Effect if still open |
|---|---|---|
| **MI-34** | Named LSMA, Safety Officer, Quality Manager, Release Manager and deputies | Acceptance tests use role **fixtures**; no real approvals possible; availability rules for dual control undefined |
| **Q-15** | Who translates and reviews Hebrew/English authored content | Hebrew strings stay `needs_review`; no claim of reviewed terminology (MI-31) |
| **MI-30** | Lab approval matrix | Governance defaults ("strictest wins") apply |
| **MI-35** | Rules for "metrological/compliance-affecting" Safety Profile changes | Default derivation (computed, raise-only) |
| **MI-26 / MI-33** | AHL contents; signing custody | Simulator-scope pack only; no H2+ on real hardware |
| **MI-01…04, 14** | Instrument documentation, scope, test points, accuracy specs, inclusivity convention | Everything metrological is `Input required` or user-authored `synthetic_demo` |
| **MI-12 / MI-17 / MI-32** | Statistical function policy; independent reference calculations; per-application test vectors | Statistical/numerical functions stay `pending_review` and non-production |
| **MI-13** | Rounding/significant-digit rules | Unrounded values labelled as such |
| **MI-31** | Reviewed Hebrew glossary | UI_UX_SPEC §5.1 glossary remains "unreviewed" |
| **MI-36** | Which instruments qualify as Test-deployment "test instruments" | `validation` mode limited to the simulator |
| **ADR ratification** | ADR-0001, 0004, 0006, 0007, 0008, 0010, 0011, 0012, 0013, 0014, 0015, 0016, 0017, 0018, 0019, 0020, 0021 are Proposed (Accepted: 0003, 0022, 0023, 0024; 0002/0005/0009 not needed for P1 start) | Each slice starts only after its ADRs are ratified (02 §3) |
| **Q-10** | Hosted vs on-prem launch scope | No effect on P1 build; affects Phase 5 packaging |

## 3. Things deliberately *not* done by this package (so no one assumes they were)

* No existing specification, ADR, schema, catalog, or code file was edited. Recommended edits are listed in 01 §4 only.
* No ADR was ratified or drafted as Accepted; no dependency was adopted; no permission or role was created in code.
* No instrument, vendor, trademark or documentation material was used; no metrological value or safety limit appears.
* Nothing was committed to `main` or pushed; the files are uncommitted in the working tree of branch `feature/phase-1-design` pending the owner's go-ahead.
* The visual design reference is static and non-functional; it is not a prototype of any trusted behaviour.

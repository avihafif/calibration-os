# 03 — Gate A0 approval matrix (consolidated)

| | |
|---|---|
| Status | **Partially approved (product-owner only) on 2026-11-02**: see [delegated decision record](../gate-a0/06_PRODUCT_OWNER_DECISIONS_2026-11-02.md). Architecture, dependencies, legal/font approvals, R-4 and full Gate A0 remain open. Recommendations elsewhere are not approvals. |
| Sources | [phase1/11](../phase1/11_DECISIONS_REQUIRED.md) (D-01…D-26), [phase1a/05](../phase1a/05_GATE_A0_APPROVAL_PACKAGE.md) (D-27…D-32), [procedure-designer/10](../procedure-designer/10_DECISIONS_AND_DEPENDENCIES.md) (PD-DEC-001…012), Codex's `docs/PHASE1A_GATE_A0.md` (on PR #4). Identifiers are unique (CI: `design/tools/check_decision_ids.py`). |
| Legend | **A0** = needed to sign Gate A0 · **WP-1A-1** = needed before WP-1A-1 starts (see [04](04_WP-1A-1_START_RECOMMENDATION.md)) · **later** = gates a later slice/phase |

Gate conditions (phase1/13 §3): A0-1 PR #1 disposition · A0-2 R-4 and R-7 merged · A0-3 D-23, D-11, D-12, D-13, D-18, D-21 · A0-4 ADR-0001, ADR-0015 · A0-5 string-ownership acknowledgement. Codex's readiness note also asks the owner to **classify WP-1A-0 (R-4 implementation) as an A0 prerequisite or amend the gate** — a sequencing decision listed in §B.

## A. Product-owner decisions
| ID | Decision | Recommended (not approved) | Needed | Status |
|---|---|---|---|---|
| A0-1 | Disposition of PR #1 (merge as verification-only vs cut 1A from its head) | PR #1 is merged (`940ab8b`); owner records it as the disposition (form GA0-01). Merge order was the owner's | A0 | Product owner accepted merge of #1 on 2026-11-02; see delegated record. Other gates open |
| A0-5 | Acknowledge he/en string ownership; strings stay `needs_review` while Q-15/MI-31 open | Acknowledge; name a content owner | A0 | Avi Hafif acknowledged product-side coordination 2026-11-02; specialist language review remains open |
| D-01 | Shape of Phase 1 | (c) incremental slices S0–S8 | later | Approved by product owner, 2026-11-02 |
| D-23 | UI-first on a labelled in-memory Synthetic Host | **Approve** (a) | A0 · WP-1A-1 | Product-owner approved option (a), 2026-11-02 |
| D-27 | Persistence in 1A | Memory-only for 1A.1; namespaced local drafts later | A0 | Product-owner approved memory-only first, 2026-11-02 |
| D-28 | Synthetic review/approve/publish simulation in 1A | Approve, clearly labelled synthetic | A0 | Product-owner approved clearly labelled simulation only, 2026-11-02 |
| D-29 | Kind scope for 1A (Tier 1: Manufacturer, Family, Model; Tier 2 stretch) | Approve tiers as written | A0 | Product-owner approved Tier 1 required / Tier 2 optional, 2026-11-02 |
| D-32 | Adopt prototypes + design system v1.0 as the visual/interaction baseline (not code to ship) | Approve after a design review of both prototypes (this package) | A0 | Product owner approved reference baseline, 2026-11-02; UX authority still needs any formal review |
| D-03 / D-04 / D-05 | Library scope; plugin packaging; theme editor timing | (a) local Library; (a) read-only plugin visibility; (a) theme editor in P2 | later | Open |
| D-10 | Usability thresholds and participants | Define after research Round 0; **no usability claim exists today** | before S4 | Open |
| D-17 | UX telemetry | Off by default, opt-in per tenant, no content values | later | Open |
| D-22 | Phase 1 duration baseline | Re-baseline after G0 from slice sizes | later | Open |
| PD-DEC-010 | Remappable keyboard shortcuts (Alt+Arrow collisions) | Yes; shortcut map in settings | Designer | Open |
| PD-DEC-011 | Device classes for authoring vs review | Authoring ≥ tablet; review/read-only on phones | Designer | Open |
| PD-DEC-012 | Schedule of Procedure Designer + Simulation Lab | Design-only until WP-1A-6 proof is done **and** ADR-0006 is ratified; then plan as its own slice | before any Designer code | Open |

## B. Architecture and security decisions
| ID | Decision | Recommended (not approved) | Needed | Status |
|---|---|---|---|---|
| ADR-0001 | Module boundaries | Ratify (or revise) | A0 · WP-1A-1 | Open (Proposed) |
| ADR-0015 | i18n / RTL | Ratify (or revise) | A0 · WP-1A-1 | Open (Proposed) |
| D-12 | Frontend dependencies for S0/1A | Approve the S0 set after licence + CSP review; each addition via ADR-0022 addendum | A0 · WP-1A-1 | Open |
| D-11 | Locale handling in `Manufacturer` schema | (a) correct v1 if nothing was ever published | A0 (WP-1A-2) | Open |
| D-18 | `media` not `assets`; `.calrel` | Accept both | A0 (WP-1A-2) | Open |
| D-21 | Lease/heartbeat/offline defaults | Accept as configuration defaults | A0 (WP-1A-4) | Open |
| A0-2 | R-7 merged (PR #4); R-4 is PR #6 (review: not ready, see docs/gate-a0/01); owner decides the gate split (GA0-02) | Yes; anchored `re.search` pattern semantics (reviewer's recommendation) | A0 (not needed for WP-1A-1 itself) | Open |
| D-02 | Pull identity/RBAC/RLS into Phase 1 (S0) | (a) yes | 1B | Open |
| D-07 / D-08 | Kind→permission table; accept 07 §4 bodies for undefined kinds | Accept with amendments | before S1 | Open |
| D-14 / D-15 / D-19 / D-20 / D-24 / D-25 / D-26 / D-30 | `package.verify` permission; transport split; canvas library spike; error-code housekeeping; trust-metadata owner (ADR-0004); `environment_kind`; ADR-0022 addendum (PyJWT, cryptography); admin visibility of content | per register (least privilege for D-30) | 1B / S3 | Open |
| PD-DEC-003 | Adopt the structured block tree as the Workflow IR (ADR-0006) | Ratify; canvas stays a view | before Designer | Open |
| PD-DEC-004 | Where simulation runs (central vs station) | Station/engine side; central runs simulator transport only, never real transports | before Simulation slice | Open |
| PD-DEC-006 | PR-003 meaning; register DRV-001…014 | Extend PR-003 to all bounds; register DRV- namespace | before validation service | Open |
| PD-DEC-007 | Resume: re-assert via Broker vs snapshot restore | Re-assert via Broker (prototype's snapshot restore is a simplification) | before engine slice | Open |
| PD-DEC-002 | Driver library lineage/versioning | Immutable platform libs; local copy with lineage | before driver kind | Open |

## C. Metrology and safety decisions
| ID | Decision | Recommended (not approved) | Needed | Status |
|---|---|---|---|---|
| D-06 | Who may author H2 commands | (a) separate Hazardous Driver Author bundle | before driver kind | Open |
| D-09 | Provenance lifecycle rules | Accept | before S1 | Open |
| D-31 | Governance of capability vocabulary | Metrologist approves new names | S1/S3 | Open |
| PD-DEC-001 | Must an op be `verified_by_reviewer` before non-simulation use? | Yes | before driver kind | Open |
| PD-DEC-005 | Numeric function policy and **rounding/display rules** (MI-12, MI-13) | Statistical functions `pending_review`; no rounding claims until a metrologist sets rules | before expression catalogue | Open |
| PD-DEC-008 | How a procedure pins a Safety Profile | Explicit pin to an approved profile version | before safety UI | Open |
| PD-DEC-009 | Approval matrix for profiles and safety-affecting changes; whether simulation evidence gates review | Safety Officer approves; Quality Manager co-approves widening/compliance-affecting; evidence informational | before review UI | Open |
| MI-30 / MI-34 / MI-35 / MI-36 | Lab approval matrix; named role holders; "compliance-affecting" rules; test-instrument list | Named humans must supply; fixtures until then | later | Open |
| MI-26 / MI-33 | AHL contents; signing custody | Simulator-scope pack only until supplied | real hardware | Open |
| MI-01…04, 06, 08, 14, 17, 27 | Documentation set, scope, test points, specs, decision rules, inclusivity, uncertainty references, TUR | Stay `Input required` / `synthetic_demo` | real content | Open |
| Q-15 / MI-31 | Hebrew translation/review and glossary | Name a Hebrew-speaking metrologist | before Hebrew strings are called reviewed | Open |

## D. Legal and supplier-dependent decisions
| ID | Decision | Recommended (not approved) | Needed | Status |
|---|---|---|---|---|
| D-16 (Q-08, MI-01) | Vendor documentation, names, trademarks, logos | Neutral names in UI/docs; vendor strings only in `content/` after legal OK | before S3 / real drivers | Open |
| D-13 (part) | Font licences (Inter, Heebo, JetBrains Mono — SIL OFL) | Confirm licence text and bundling terms | A0 · WP-1A-1 | Palette approved by product owner; font/legal approval OPEN |
| D-12 / D-26 (part) | Licence and CVE review for each dependency | Permissive licences only; SBOM + audit in CI | A0 · WP-1A-1 | Open |
| D-03 (part) | Library/marketplace legal scope | Deployment-local only in P1 | later | Open |
| Q-10 | Hosted vs on-prem launch scope | No effect on P1 build | Phase 5 | Open |

## Approvals record (to be completed by humans — intentionally blank)
| Item | Approved (Y/N) | Name and role | Date | Notes |
|---|---|---|---|---|
| (copy the rows needed from phase1a/05 §5) | | | | |

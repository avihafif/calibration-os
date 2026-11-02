# 05 — Gate A0 decision and approval package

| | |
|---|---|
| Purpose | Let the right humans approve, in one sitting, what must be true before Codex starts **Phase 1A implementation** (the schema-driven Builder on synthetic data). Concise by design: each decision is a card with options, recommendation, justification, risks and implementation impact. |
| Sources | [phase1/11 decision register](../phase1/11_DECISIONS_REQUIRED.md) (D-01…D-26), [phase1/13 §3 gate A0](../phase1/13_PHASE1A_PLAN.md#3-entry-conditions-gate-a0), [phase1/14 review](../phase1/14_PHASE0B_SECURITY_REVIEW.md), Codex's conditional plan [`docs/PHASE1A_IMPLEMENTATION_PLAN.md`](https://github.com/avihafif/calibration-os/blob/feature/phase0b-secure-metadata/docs/PHASE1A_IMPLEMENTATION_PLAN.md) on PR #1's branch, and the approved prototype work in this PR. |
| Rules honoured | No approval, role holder, signatory, metrology value, safety limit or supplier permission is invented. Every sign-off field below is **blank**. Recommendations are not decisions. |
| Date / state | 2026-11-02 (as written). **Status update (2026-11-02, later):** PRs #1–#5 are merged into `main` (merge commits `940ab8b`, `86910c1`, `61aa618`, `1be2233`, `9e2bd0e`); R-4 is open as PR #6 and **not ready to merge** ([review](../gate-a0/01_PR6_INDEPENDENT_REVIEW.md)). Merging recorded **no** decision: A0-3, A0-4 and A0-5 and every card below remain open. Approval-ready forms: [docs/gate-a0](../gate-a0/README.md). |

## 1. What gate A0 requires today

| # | Condition (phase1/13 §3) | State | Who closes it |
|---|---|---|---|
| A0-1 | Phase 0B merged, or 1A cut from PR #1 head with the owner's written agreement | **Open, evidence now available** — PR #1 is merged (`940ab8b`, by the owner's account, 0 reviews on GitHub); the owner still has to record it as the disposition ([form GA0-01](../gate-a0/02_GATE_A0_APPROVAL_FORMS.md)) | Product owner (merge is theirs) |
| A0-2 | Review corrections **R-4** (validator subset incl. `x-calos-editor`, `$defs/$ref`, `oneOf`, `const`, bounds, `uniqueItems`, `pattern` semantics) and **R-7** (lifecycle ports redesigned) merged | **Partly open** — R-7 merged (PR #4); R-4 is PR #6, review verdict *not ready to merge* (2 High, 7 Medium); sequencing question in [form GA0-02](../gate-a0/02_GATE_A0_APPROVAL_FORMS.md) | Codex, reviewed by architecture |
| A0-3 | Decisions **D-23, D-11, D-12, D-13, D-18, D-21** recorded | **Open** — cards below | Product owner / architecture |
| A0-4 | ADR-0001 and ADR-0015 ratified | **Open** — both Proposed | Architecture owner |
| A0-5 | Q-15 acknowledged (strings may be `needs_review`) | **Open** | Content owner (name TBD) |
| **New** | Decisions **D-27 … D-29, D-32** (this package) recorded | **Open** | See cards |

## 2. Who can approve what

### 2.1 Product owner can approve (A0-blocking)
| ID | Decision | Recommended | Why | Main risk | Impact on implementation |
|---|---|---|---|---|---|
| **D-23** | Build Phase 1A UI-first on a labelled in-memory Synthetic Host (before server identity/persistence) | **Approve** | UX and the schema-driven approach are the biggest risks; they need none of the Proposed ADRs; nothing is throw-away (all but the host carries into 1B) | Sandbox mistaken for a real system; client-side SoD mistaken for security | Defines work packages WP-1A-0…7 and guardrails ([phase1/13 §4–§6](../phase1/13_PHASE1A_PLAN.md)) |
| **D-27** *(new)* | **Persistence in 1A.** Codex's plan allows disposable, namespaced browser-local drafts; phase1/13 forbids all browser storage | **Memory-only for milestone 1A.1; add namespaced local drafts as increment 1A.2 after approval** | Keeps the first visible milestone free of data-lifecycle questions (schema-version drift, stale data, privacy). Local drafts are still valuable for usability sessions, so they follow | Users lose work on reload during 1A.1 (acceptable for a labelled demo); two increments to coordinate | Removes storage from WP-1A-4 initially; Codex's `localDraftStore` becomes WP-1A-4b with version stamp, size bound, explicit *Reset*, Test-namespace key |
| **D-28** *(new)* | **Synthetic review/approve/publish simulation in 1A.** Mission §4C requires "draft and approval states" and a "synthetic publishing demonstration"; Codex's conditional plan says the workspace "cannot publish, approve…" | **Include, as a clearly labelled simulation** (no signing/export/release; non-dismissible sandbox banner; governed-confirmation text states where real enforcement lives) | The approval UX (SoD, digest-bound approval, versions, compare) is the highest-value thing to validate with real users, and cannot be validated without being shown | A simulation may be read as a security control or leak into Production | Adds WP-1A-4 SoD demonstrator + publish wizard (already in phase1/13); Codex plan amended: "no *operational* publish/approve" |
| **D-29** *(new)* | **Kind scope for 1A implementation.** Tier 1: `Manufacturer`, `InstrumentFamily`, `InstrumentModel`. Tier 2: `StandardRole`, `StationRequirement`, `ApplicationManifest` + creation wizard. Codex plan: Manufacturer + InstrumentModel only | **Tier 1 required; Tier 2 as a stretch increment, same generic renderer** | Tier 1 satisfies AC-NC-01 and Codex's narrow outcome; Tier 2 costs only schemas + strings (the prototype proves it) and delivers the "application creation workflow" the mission asks for | Scope creep; more schemas to review (metrology reviewer for Standard roles) | Tier 2 schemas need kind-owner review (07 §4); no new UI code |
| **D-32** *(new)* | **Adopt the interactive prototype and design system v1.0 as the visual/interaction baseline** (not as code to ship) | **Approve with a design review**; changes via PR to `docs/phase1a/` | Gives Codex and testers one reference; removes re-litigation of layout/tokens | Baseline freezes weaknesses not yet found by real users (see [04](04_DESIGN_VALIDATION.md) caveats) | Codex implements to [01](01_DESIGN_SYSTEM.md)/[02](02_BUILDER_UX_SPEC.md); deviations need design-lane sign-off |
| **D-13** | Palette, fonts, licences (Inter, Heebo, JetBrains Mono — SIL OFL — bundled) | **Provisionally approve [01 §2](01_DESIGN_SYSTEM.md#2-tokens); confirm font licences before bundling** | Contrast-verified tokens; air-gap-safe | Brand may later require a different accent (token swap is safe) | Fonts added as static assets, no CDN |
| **D-18** | Naming: `media` (not `assets`) for blobs; `.calrel` for Release Packages | **Approve** | Removes the `/assets` equipment collision | Low | Naming only; applies from S1 |
| **D-21** | Lease/heartbeat/offline-buffer defaults (30 s / 120 s / 5 min) | **Approve as configuration defaults** | Needed to simulate lease UX; not metrological | Low | Constants in config; simulated only in 1A |

### 2.2 Security / architecture approval needed
| ID | Decision | Recommended | Why | Main risk | Impact |
|---|---|---|---|---|---|
| **D-11** | Remove hard-coded `en`+`he` requirement from `Manufacturer` schema; locale completeness becomes *policy* | **Correct v1 in place** (nothing was ever published); v2+migrator only if a version exists | Aligns schema with `LocalizedString`/PR-017; brand names are not translations | Anyone relying on current fixture | WP-1A-2; fixtures updated |
| **D-12** | Frontend dependencies for S0/1A (router, query cache, ICU, test tooling, component catalogue, optional grid virtualisation) | **Approve a minimal set after licence + CSP review; each via ADR-0022 addendum; none auto-adopted** ([phase1/06 §9](../phase1/06_COMPONENT_ARCHITECTURE.md#9-dependencies-requiring-approval)) | AGENTS §8 requires it | Supply chain | Blocks WP-1A-1 until recorded; the prototype itself uses **zero** dependencies |
| **ADR-0001, ADR-0015** | Module boundaries; i18n/RTL | **Ratify** (or revise) | Needed for `i18n`/`ui-kit` structure | Delay | A0-4 |
| **D-25 / D-26 / D-14 / D-24** | Environment-kind naming; ADR-0022 addendum for PyJWT/`cryptography`; `package.verify`; trust metadata design | Not A0-blocking for UI-first work; **required before the verifier is enabled** | See phase1/14 | — | Gates 1B/S1/S7 |
| **D-30** *(new)* | May Platform Administrators view authored configuration content? | **Least privilege: no content access by default; read access granted by role/Auditor bundle** | Admins hold no approval authority; viewing drafts isn't needed for user/role/infrastructure duties | Support friction | Affects nav/role matrix (S0); prototype shows admin content visibility as an *open* point |

### 2.3 Needs a qualified metrology, quality or safety authority (not A0-blocking, but they gate later slices)
| ID / item | Question | Authority | Needed by | Note |
|---|---|---|---|---|
| **D-06** | Who may author H2 commands (new Hazardous Driver Author bundle vs extra approval for Calibration Engineer) | Safety Officer + Quality Manager | S3 | Role holders are **unnamed (MI-34)** |
| **D-07 / MI-30** | Kind → group/approval/change-class table; `config.approve.ui`, `application` group | Quality (+ metrologist for metrological kinds) | per slice (S1 first) | 1A prototype uses *proposed* defaults, labelled |
| **D-09** | Provenance rules (`verified_by ≠ entered_by`, `approved` computed) | Metrologist + Quality | S1 | Prototype shows chips; rules not enforced server-side |
| **D-31** *(new)* | Governance of the **capability vocabulary** (who approves new names; "request a capability" flow) | Metrologist | S1/S3 | Prototype vocabulary is synthetic grammar-conformant examples, not a real list |
| **Q-15 / MI-31** | Who translates/reviews Hebrew; glossary | Quality + linguist | before Hebrew strings are claimed reviewed | All Hebrew in the prototype is an unreviewed placeholder |
| **MI-34, MI-35, MI-36, MI-26, MI-33** | Role holders; "compliance-affecting" rules; test-instrument list; AHL content; signing custody | Lab management / Safety Officer / Quality | S0/S3/P4 | Nothing in 1A depends on them; fixtures use *Input required* and role fixtures |

### 2.4 Legal / supplier
| Item | Question | Note |
|---|---|---|
| Q-08 / D-16 | Vendor model names, logos, documentation | Prototype uses invented names ("Demo Maker", "DMM-A") only; **no supplier permission is assumed or needed for 1A** |
| Fonts (D-13) | Licence confirmation for bundled fonts | Owner confirms OFL terms |

## 3. Decision cards for the A0-blocking items

### D-23 — UI-first on a Synthetic Host
| Option | Pros | Cons |
|---|---|---|
| **A. Approve (recommended)** | Fast, de-risks UX and schema-driven editor; same code reused in 1B; no dependence on Proposed ADRs | Needs strict labelling and bundle exclusion |
| B. Backend-first (S0/S1 server before any UI) | No simulated governance | Slower first visible result; ADR-0004/0008/0014/0016 gates stall everything |
| C. Throw-away prototype only | Zero production risk | Builds nothing reusable; UX and architecture diverge |
*Residual risk if A:* mistaken for operational → mitigated by [phase1/13 §6](../phase1/13_PHASE1A_PLAN.md#6-guardrails-synthetic-mode-must-not-be-mistakable-or-shippable) (non-dismissible banner, persona chip, production-bundle exclusion test, offline/no-storage test).

### D-27 — Persistence
| Option | Pros | Cons |
|---|---|---|
| **A. Memory-only for 1A.1, namespaced local drafts in 1A.2 (recommended)** | Clean first milestone; usability sessions get local drafts later | Two increments |
| B. Local drafts from the start (Codex plan) | Survives reload | Needs storage lifecycle (versioning, size, reset, privacy) before the first demo; blurs the "synthetic, ephemeral" message |
| C. Memory-only forever | Simplest | Users lose work; weak for multi-session usability studies |

### D-28 — Synthetic workflow simulation
| Option | Pros | Cons |
|---|---|---|
| **A. Include with labelling (recommended)** | Validates the most important UX with users; meets mission §4C | Risk of false assurance; mitigated by wording + guardrails |
| B. Exclude (Codex plan) | No simulated governance at all | Approval/version UX untested until 1B; mission §4C unmet |

### D-29 — Kind scope
Tier 1 (3 kinds) required; Tier 2 (3 kinds + wizard) optional increment. Because the renderer is generic, Tier 2 cost is schemas/strings/fixtures + review; **no UI code**. Risk: reviewers' time for extra schemas.

### D-32 — Visual baseline
Approve = prototype + [01](01_DESIGN_SYSTEM.md) + [02](02_BUILDER_UX_SPEC.md) are the reference; implementation deviations go through the design lane. Not an approval of code, of Hebrew wording, or of any metrology.

## 4. Reconciliation with Codex's conditional Phase 1A plan

| Topic | Codex plan (`PHASE1A_IMPLEMENTATION_PLAN.md`) | This package | Resolution |
|---|---|---|---|
| Outcome | Test-only browser-local workspace for synthetic Manufacturer + InstrumentModel; draft revision preview; compare two local snapshots | Same, plus Family, application wizard (Tier 2), review/approve/publish simulation | D-28, D-29 |
| Storage | Disposable browser-local drafts in a Test namespace | Memory-only first | D-27 |
| Publish/approve | Never | Labelled simulation | D-28 |
| Schema-driven forms | Registry/schema hints; reject unsupported keywords | Same; hint vocabulary finalised ([03](03_METADATA_UI_BINDING.md)) | Aligned |
| Production | No Builder entry in Production rehearsal | Same (bundle-exclusion test) | Aligned |
| Dependencies | Tooling licence review before install | Same; prototype uses none | Aligned |
| Preconditions | PR #1 merged; design approved and integrated; fresh branch from main | Same; plus R-4/R-7 | Aligned |
| Directory plan | `apps/web/src/builder/…`, `packages/ts/editor-core`, `ui-runtime` | `designers/inspector`, `ui-kit`, host ports, `SyntheticHost` (phase1/06) | **Open:** pick final package names in the first PR; Codex plan uses `ui-runtime` for the field registry whereas phase1/06 places it in `designers/inspector` (runtime renders *operator* screens). Recommendation: inspector in `designers/inspector` |
| i18n location | `apps/web/src/i18n/` | `packages/ts/i18n` | Recommendation: package (shared by operator shell) |

## 5. Gate A0 sign-off sheet (blank — to be completed by named humans)

| Decision / condition | Approved (Y/N) | Name and role | Date | Notes |
|---|---|---|---|---|
| A0-1 PR #1 disposition | | | | |
| A0-2 R-4, R-7 merged | | | | |
| D-23 | | | | |
| D-27 | | | | |
| D-28 | | | | |
| D-29 | | | | |
| D-32 | | | | |
| D-13 | | | | |
| D-18 | | | | |
| D-21 | | | | |
| D-11 | | | | |
| D-12 | | | | |
| ADR-0001 | | | | |
| ADR-0015 | | | | |
| A0-5 / Q-15 acknowledged | | | | |

## 6. What this package does not do
It does not ratify any ADR, name any role holder, approve any dependency, select any metrological content, claim Hebrew review, or authorise any change to PR #1. It adds new decision IDs D-27…D-32 here; the phase1/11 register in PR #2 is **not edited** — the owner may fold these cards into it after merging both PRs.

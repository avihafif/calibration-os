# 02 — Gate A0 approval forms

> **Update 2026-11-02 (later):** the architecture, dependency, MPL-2.0 and ADR items in this document were recorded **by delegation** in [13](13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md) (ADR-0001 with A1–A4 only; A5 not accepted). That is not independent review. Nothing else in this document changed.

| | |
|---|---|
| Status | **Product-owner portions recorded 2026-11-02** under the user's explicit authorization; see [delegated product-owner record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md). All architecture, security, legal, metrology and jointly-owned incomplete sign-offs remain open. A delegated record is not a personal signature. |
| Sources | `docs/phase1/11_DECISIONS_REQUIRED.md`, `docs/phase1a/05_GATE_A0_APPROVAL_PACKAGE.md`, `docs/phase1/13_PHASE1A_PLAN.md §3`, [01](01_PR6_INDEPENDENT_REVIEW.md), [03](03_ADR_REVIEWS.md), [04](04_DEPENDENCY_AND_FONT_EVIDENCE.md) |
| Entry ids | `GA0-nn` identify these forms only; decision ids (`D-nn`, `PD-DEC-nnn`) and ADR numbers keep their meaning and status. |
| Accountable roles | Named holders do not exist in the repository (MI-34). Roles are the ones in the registers (product owner, architecture owner, security, legal, quality). |
| How to record | Tick one outcome, add name/role/date, and link the evidence (an approving PR review on the PR that carries the change, a signed commit, or a dated minute). Then mirror the outcome in the register column "Outcome". Never edit an Accepted ADR; supersede it. |

**Order of use.** [05](05_CHECKLIST_SEQUENCING_AND_BLOCKERS.md) lists which forms block which work package.

---

### GA0-01 · A0-1 · Disposition of Phase 0B PR #1

| Register | phase1/13 §3 A0-1; docs/PHASE1A_GATE_A0.md |
|---|---|
| Accountable role | Product owner |
| Needed before | Gate A0 (any WP-1A-n) |

**Decision requested.** Record that Phase 0B (PR #1) is accepted as the base for Phase 1A.

**Options**

| Option | Effect |
|---|---|
| (a) Accept the merge | PR #1 is already on `main` (merge commit `940ab8b`); record it as the owner's disposition. |
| (b) Require a post-merge review record | Add a review of PR #1 for the audit trail; no code change implied. |

**Recommendation (not an approval).** **(a)**, attaching the review-item evidence (R-1…R-3 closed in Codex commit `9093c7f`; independent review in `docs/phase1/14_PHASE0B_SECURITY_REVIEW.md`).

**Evidence.**
* `git log origin/main`: `940ab8b Merge PR #1` (2026-11-02T18:04:51Z), merged by the owner's GitHub account (`avihafif`).
* PR #1 has 0 reviews and 0 comments on GitHub, so the merge itself is the only owner act on record.
* Phase 0B is verification-only: no publish path, no Production activation (`docs/PHASE0A_STATUS.md`).

**Risks.** If not recorded, A0-1 stays open even though the code is merged.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☑ Approved as recommended by product owner |
|---|---|
| Changes / conditions | Non-operational / Test-only constraints and other gates remain binding. Delegated record, not a personal signature. |
| Name · role | Avi Hafif — Product Owner (GitHub @avihafif) |
| Date | 2026-11-02 |
| Evidence reference (PR review link, signed commit, or minute) | [Delegated product-owner record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) (committed via user's connected GitHub account) |

---

### GA0-02 · A0-2 · R-4 and R-7 prerequisites and their sequencing

| Register | phase1/13 §3 A0-2 and §4; docs/PHASE1A_GATE_A0.md ("Sequencing correction") |
|---|---|
| Accountable role | Product owner + architecture owner |
| Needed before | Gate A0 |

**Decision requested.** State when R-4 (schema engine, PR #6) must be merged, and record R-7 as done.

**Options**

| Option | Effect |
|---|---|
| (a) Gate on R-4 for all 1A work | R-4 corrected and merged before any WP-1A-n starts (phase1/13 §3 as written). |
| (b) Split the gate (recommended) | R-7 merged (PR #4). R-4 corrections + merge are a prerequisite for **WP-1A-0, WP-1A-2 and WP-1A-3** but **not** for WP-1A-1, which touches no schema. |
| (c) Merge PR #6 as it is and track findings | Not recommended: High finding H-1 (regex semantics) is a fail-open risk for the authoritative validator. |

**Recommendation (not an approval).** **(b)**. It removes an artificial dependency without weakening any control; the full Gate A0 still stays closed until R-4 is merged.

**Evidence.**
* R-7: PR #4 merged (`61aa618`).
* R-4: PR #6 open, head `d0c174f`; independent review verdict *not ready to merge* — [01](01_PR6_INDEPENDENT_REVIEW.md) (2 High, 7 Medium).
* WP-1A-1 deliverables (phase1/13 §4) are `i18n`, `ui-kit`, `apps/web` shells, CI harness — no schema or kind code.

**Risks.** Option (b) is a process change to a documented gate and needs the owner's explicit wording; (a) delays the frontend foundation for no technical reason.

**Partial product-owner record:** Product owner **endorses option (b)** (scoped frontend gate split), but **joint architecture approval is still pending**. Do not treat A0-2 as fully closed. See [delegated decision record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md).

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-02b · Verifiable owner approval of ADR-0025 (pattern semantics)

| Register | docs/adr/0025-json-schema-pattern-semantics.md (PR #6) |
|---|---|
| Accountable role | Product owner (decider named in the ADR) |
| Needed before | Merge of PR #6 |

**Decision requested.** Record the product owner's approval of ADR-0025 in a form that can be verified from the repository, or downgrade the ADR to Proposed.

**Options**

| Option | Effect |
|---|---|
| (a) Owner approves on PR #6 (recommended) | An approving review or comment from the owner's account on PR #6 naming ADR-0025, after the grammar corrections of findings H-1/M-1. |
| (b) Signed record | A line in this form (name, role, date) committed by the owner. |
| (c) Downgrade | Set ADR-0025 to `Proposed — pending owner confirmation` and reword `docs/PHASE1A_GATE_A0.md`. |

**Recommendation (not an approval).** **(a)** after the corrections, because the ADR's decision text should describe the restricted grammar that is actually enforced; an Accepted ADR is immutable, so correct first, then accept.

**Evidence.**
* ADR-0025 line 3: "Accepted (product owner decision in the CalOS R-4 task thread, 2026-11-02)" — evidence outside the repository.
* Commit author `Codex <codex@localhost>`; PR #6 has 0 reviews and 0 comments.
* ADR-0023/0024 use the same wording (precedent), but neither names an in-repo record either.

**Risks.** Accepting on unverifiable evidence weakens the audit trail the project requires for safety-adjacent contracts; delaying is cheap.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-03 · D-23 · Build Phase 1A UI-first on a labelled in-memory Synthetic Host

| Register | phase1/11 D-23; phase1a/05 §2.1 |
|---|---|
| Accountable role | Product owner |
| Needed before | WP-1A-1 |

**Decision requested.** Approve building Phase 1A against a labelled, in-memory Synthetic Host before server-side identity and persistence.

**Options**

| Option | Effect |
|---|---|
| (a) Approve phase1/13 | UI-first; nothing in 1A is throw-away; guardrails in phase1/13 §6. |
| (b) Backend first | S0/S1 before any visible UI; slower first milestone. |
| (c) Throw-away server | Build 1A against a disposable server. |

**Recommendation (not an approval).** **(a)**.

**Evidence.**
* phase1/13 §2.2 lists what 1A must not build (accounts, DB writes, import/export, signing, drivers, metrology, Production).
* Both prototypes already demonstrate the labelled synthetic mode (banner, TEST and SIMULATION badges).

**Risks.** Users may mistake synthetic workflow for governance — mitigated by non-removable labelling (P1A-AC-05).

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☑ Approved as recommended by product owner |
|---|---|
| Changes / conditions | Non-operational / Test-only constraints and other gates remain binding. Delegated record, not a personal signature. |
| Name · role | Avi Hafif — Product Owner (GitHub @avihafif) |
| Date | 2026-11-02 |
| Evidence reference (PR review link, signed commit, or minute) | [Delegated product-owner record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) (committed via user's connected GitHub account) |

---

### GA0-04 · D-11 · Locale handling in the Manufacturer schema

| Register | phase1/11 D-11; phase1a/05 §2.2 |
|---|---|
| Accountable role | Architecture owner |
| Needed before | WP-1A-2 (not WP-1A-1) |

**Decision requested.** Remove the hard-coded `en`+`he` requirement from `Manufacturer`; correct v1 or ship v2 plus migrator; legal-name vs display-name split.

**Options**

| Option | Effect |
|---|---|
| (a) Correct v1 | Allowed only if no version was ever published. |
| (b) v2 + migrator | Needed if any published version exists. |

**Recommendation (not an approval).** **(a)**, because nothing has been published.

**Evidence.**
* `schemas/manufacturer/v1.schema.json` requires `name.en` and `name.he` (checked on `main`).
* Only fixtures exist (`fixtures/manufacturer/*`); `apps/api` has no publish path; Phase 0B is verification-only.
* ADR-0015 makes locale completeness a lab policy, not a schema constant.

**Risks.** If (a) is chosen but a version had been published elsewhere, digests of published content would change.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-05 · D-12 · Frontend dependencies for S0 / Phase 1A

| Register | phase1/11 D-12; phase1/06 §9; AGENTS §8 |
|---|---|
| Accountable role | Architecture owner (with security review) |
| Needed before | WP-1A-1 |

**Decision requested.** Approve, reject or change each dependency in the minimal set, with the exact pinned version, after reviewing the licence, vulnerability, CSP and SBOM evidence in [04](04_DEPENDENCY_AND_FONT_EVIDENCE.md).

**Options**

| Option | Effect |
|---|---|
| (a) Approve the minimal set for WP-1A-1 | The ten rows of 04 §2.1, each pinned and recorded by an ADR-0022 addendum; React, Vite and TypeScript are the existing baseline. |
| (b) Approve a smaller set | In-house router and/or no i18n library — more code to maintain. |
| (c) Defer | The foundation cannot meet P1A-AC-08…14. |

**Recommendation (not an approval).** **(a)** with the pins in 04, the MPL-2.0 licence of `axe-core` and `@axe-core/playwright` (dev-only, not shipped) explicitly accepted or an alternative named, and `@tanstack/react-query` and `fast-check` deferred.

**Evidence.**
* Isolated resolution of the candidate set: 134 packages, **0** OSV advisories, **0** `npm audit` findings, every package with an integrity hash; the only install script is optional macOS `fsevents` (via Vite).
* Licences in the tree: MIT 101, MPL-2.0 14, Apache-2.0 7, BSD-3-Clause 4, BSD-2-Clause 2, ISC 2, MIT-0 2, CC0-1.0 1, BlueOak-1.0.0 1. The 14 MPL-2.0 packages are `axe-core`, `@axe-core/playwright` and `lightningcss*` (the latter already present through Vite in `pnpm-lock.yaml`).
* Releases younger than 14 days were avoided (cool-down policy proposed in 04 §1).

**Risks.** Supply-chain exposure grows with each package; `react-router` 8.5.0 requires Node ≥ 22.22.0; Playwright downloads browser binaries in CI (network, size).

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-06 · D-13 · Brand palette and fonts

| Register | phase1/11 D-13; phase1a/05 §2.1 |
|---|---|
| Accountable role | Product owner (palette) and legal (font licences) |
| Needed before | WP-1A-1 (palette) · before bundling (fonts) |

**Decision requested.** Adopt the design-system tokens (palette) and decide the fonts. **Split into two sign-offs**: 06a palette/tokens, 06b fonts.

**Options**

| Option | Effect |
|---|---|
| (a) Adopt phase1 03 §4 / phase1a 01 tokens | Provisional until a brand owner supplies tokens. |
| (b) Supply brand tokens | Replaces the proposal; the contrast validator must pass. |

**Recommendation (not an approval).** **06a: (a)**. **06b:** approve Inter 4.1, Heebo (Version 3.100) and JetBrains Mono 2.304 for *self-hosted* bundling **after** this review (all SIL OFL 1.1, no Reserved Font Name declared; see 04 §3); do not bundle until signed. If 06b is not ready, WP-1A-1 starts with the system font stack.

**Evidence.**
* Authoritative sources, versions, SHA-256 of the upstream artefacts, licence texts and glyph coverage: [04 §3](04_DEPENDENCY_AND_FONT_EVIDENCE.md).
* Heebo has 27/27 Hebrew letters but lacks `Ω`, `≤`, `≥`; Inter has no Hebrew — the stack order (Inter, then Heebo) is required for correct unit and Hebrew rendering. Status icons (`✔ ✖ ⚠`) are in none of the fonts and need in-house SVG icons.

**Risks.** Licence obligations (ship licence text and copyright, no standalone sale, Modified Version rules when converting formats). The verdict is evidence-based but **not legal advice**; legal sign-off belongs to the legal role.

**Partial product-owner record:** Product owner **approves 06a (palette and tokens) only**. 06b font licence/bundling remains pending legal confirmation; use system font stack. See [delegated decision record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md).

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-07 · D-18 · Naming: `media` for blobs; `.calrel` for Release Packages

| Register | phase1/11 D-18 |
|---|---|
| Accountable role | Architecture owner |
| Needed before | WP-1A-2 (not WP-1A-1) |

**Decision requested.** Accept the names `media` (instead of `assets`) and `.calrel`.

**Options**

| Option | Effect |
|---|---|
| (a) Accept both | Spec edits only (3 spec files use `assets`). |
| (b) Alternative names | Owner supplies them. |

**Recommendation (not an approval).** **(a)**.

**Evidence.**
* `.calrel` appears only in design documents (phase1/09, 11, 13); no code or schema uses it yet.
* `assets` appears in `docs/ARCHITECTURE.md` (3), `NO_CODE_ARCHITECTURE.md` (2), `API_CONTRACT.md` (1).

**Risks.** Cheap now, expensive after the first schema ships.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-08 · D-21 · Lease / heartbeat / offline-buffer defaults

| Register | phase1/11 D-21; phase1/06 §5.4 |
|---|---|
| Accountable role | Architecture owner |
| Needed before | WP-1A-4 (not WP-1A-1) |

**Decision requested.** Accept 30 s heartbeat, 2 min lease expiry and 5 min offline buffer as configuration defaults.

**Options**

| Option | Effect |
|---|---|
| (a) Accept as defaults | Configurable per deployment policy. |
| (b) Change values | Owner supplies them. |

**Recommendation (not an approval).** **(a)**.

**Evidence.**
* phase1/06 §5.4: lease expires after 2 min without heartbeat, renewable, configurable per deployment policy.

**Risks.** Wrong defaults cause lost edits or stale leases; they are configuration, not code.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-09 · ADR-0001 · Modular monorepo with enforced boundaries

| Register | docs/adr/0001-modular-monorepo-boundaries.md (Proposed) |
|---|---|
| Accountable role | Architecture owner |
| Needed before | WP-1A-1 |

**Decision requested.** Accept, accept with amendments, or revise ADR-0001. Detailed review and exact amendment text: [03](03_ADR_REVIEWS.md).

**Options**

| Option | Effect |
|---|---|
| (a) Accept as written | Leaves the TypeScript layering undefined for the new packages. |
| (b) Accept with amendments A1–A5 (recommended) | Adds the TS dependency table, resolves inspector/designers package placement, covers `design/` and CI separation. |
| (c) Revise and re-review | If the owner disagrees with the package split. |

**Recommendation (not an approval).** **(b)**.

**Evidence.**
* ARCHITECTURE §6.1 enforces only "no `api-client` import" for TypeScript (`eslint.config.mjs`, `tools/check_ts_boundary.mjs`); no rules exist for `ui-kit`, `i18n`, `editor-core`, `designers`.
* The Phase 1A handoff places the inspector in `designers/inspector`; ARCHITECTURE §6 places it in `editor-core` (conflict).

**Risks.** Accepting without A1 means WP-1A-1 invents the layering.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-10 · ADR-0015 · Internationalization and RTL

| Register | docs/adr/0015-i18n-and-rtl.md (Proposed) |
|---|---|
| Accountable role | Architecture owner (+ content owner for the glossary) |
| Needed before | WP-1A-1 |

**Decision requested.** Accept, accept with amendments, or revise ADR-0015. Detailed review: [03](03_ADR_REVIEWS.md).

**Options**

| Option | Effect |
|---|---|
| (a) Accept as written | Omits pseudo-locales, string lint, message-key namespace and the system-bundle vs `TranslationBundle` scope in 1A. |
| (b) Accept with amendments B1–B6 (recommended) | Adds those and the font/glyph fallback requirement. |
| (c) Revise | If `TranslationBundle` config items must be part of 1A. |

**Recommendation (not an approval).** **(b)**.

**Evidence.**
* `react-intl` 12.1.5 (BSD-3-Clause) matches the ADR's "FormatJS / react-intl-class".
* The ADR has no Date/Deciders line (the ADR template requires one).
* The Hebrew glossary is still *unreviewed* (MI-31/Q-15) while the ADR calls it a reviewed `Glossary` item.

**Risks.** Without B1 (system bundles vs config items) WP-1A-1 may build a runtime loader that the 1A scope forbids.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-11 · A0-5 · Ownership of Hebrew/English strings

| Register | phase1/13 §3 A0-5; Q-15; MI-31 |
|---|---|
| Accountable role | Product owner + content owner |
| Needed before | WP-1A-1 |

**Decision requested.** Acknowledge who owns he/en strings and that all strings stay `needs_review` until a Hebrew-speaking metrologist reviews them.

**Options**

| Option | Effect |
|---|---|
| (a) Name an owner and acknowledge | Strings ship marked `needs_review`. |
| (b) Defer | Hebrew UI blocked. |

**Recommendation (not an approval).** **(a)**.

**Evidence.**
* The prototypes' Hebrew strings are design-author drafts; no review has occurred.

**Risks.** A named owner is required; none exists in the repository (MI-34).

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☑ Product owner acknowledged coordination; specialist translation review OPEN |
|---|---|
| Changes / conditions | Non-operational / Test-only constraints and other gates remain binding. Delegated record, not a personal signature. |
| Name · role | Avi Hafif — Product Owner (product-side strings coordinator; qualified language review pending) |
| Date | 2026-11-02 |
| Evidence reference (PR review link, signed commit, or minute) | [Delegated product-owner record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) (committed via user's connected GitHub account) |

---

### GA0-12 · D-27 · Persistence in 1A

| Register | phase1a/05 §D-27 |
|---|---|
| Accountable role | Product owner |
| Needed before | WP-1A-4 (not WP-1A-1) |

**Decision requested.** Choose how drafts persist in Phase 1A.

**Options**

| Option | Effect |
|---|---|
| A. Memory-only in 1A.1, namespaced local drafts in 1A.2 | Clean first milestone. |
| B. Local drafts from the start | Needs a storage lifecycle first. |
| C. Memory-only forever | Weak for usability studies. |

**Recommendation (not an approval).** **A**.

**Evidence.**
* `react-router`'s `ScrollRestoration` uses `sessionStorage`; under option A it must be forbidden by lint (04 §2).
* Both prototypes use no browser storage (checked by `design/tools/check_prototype_consistency.js`).

**Risks.** Browser storage touches privacy and reset semantics.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☑ Approved as recommended by product owner |
|---|---|
| Changes / conditions | Non-operational / Test-only constraints and other gates remain binding. Delegated record, not a personal signature. |
| Name · role | Avi Hafif — Product Owner (GitHub @avihafif) |
| Date | 2026-11-02 |
| Evidence reference (PR review link, signed commit, or minute) | [Delegated product-owner record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) (committed via user's connected GitHub account) |

---

### GA0-13 · D-28 · Synthetic review / approve / publish simulation in 1A

| Register | phase1a/05 §D-28 |
|---|---|
| Accountable role | Product owner |
| Needed before | WP-1A-5 (not WP-1A-1) |

**Decision requested.** Include a clearly labelled synthetic governance demonstration in 1A.

**Options**

| Option | Effect |
|---|---|
| A. Include with labelling | Tests the key UX; risk of false assurance. |
| B. Exclude | Approval/version UX untested until 1B. |

**Recommendation (not an approval).** **A**.

**Evidence.**
* The Designer prototype implements it with step-up marked simulated and Production release blocked.

**Risks.** False assurance — mitigated by wording and by no real approval being recorded.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☑ Approved as recommended by product owner |
|---|---|
| Changes / conditions | Non-operational / Test-only constraints and other gates remain binding. Delegated record, not a personal signature. |
| Name · role | Avi Hafif — Product Owner (GitHub @avihafif) |
| Date | 2026-11-02 |
| Evidence reference (PR review link, signed commit, or minute) | [Delegated product-owner record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) (committed via user's connected GitHub account) |

---

### GA0-14 · D-29 · Kind scope for 1A

| Register | phase1a/05 §D-29 |
|---|---|
| Accountable role | Product owner |
| Needed before | WP-1A-2 (not WP-1A-1) |

**Decision requested.** Tier 1 (`Manufacturer`, `InstrumentFamily`, `InstrumentModel`) required; Tier 2 (`StandardRole`, `StationRequirement`, `ApplicationManifest` + wizard) optional increment.

**Options**

| Option | Effect |
|---|---|
| A. Tier 1 required, Tier 2 stretch | No UI code difference (generic renderer). |
| B. Tier 1 only | Smaller review. |
| C. Both required | More review time. |

**Recommendation (not an approval).** **A**.

**Evidence.**
* Tier 2 adds schemas, strings and fixtures only.

**Risks.** Reviewer time.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☑ Approved as recommended by product owner |
|---|---|
| Changes / conditions | Non-operational / Test-only constraints and other gates remain binding. Delegated record, not a personal signature. |
| Name · role | Avi Hafif — Product Owner (GitHub @avihafif) |
| Date | 2026-11-02 |
| Evidence reference (PR review link, signed commit, or minute) | [Delegated product-owner record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md) (committed via user's connected GitHub account) |

---

### GA0-15 · D-32 · Adopt the prototypes and design system as the visual/interaction baseline

| Register | phase1a/05 §D-32; docs/integration/02 |
|---|---|
| Accountable role | Product owner + UX |
| Needed before | WP-1A-1 (strongly recommended) |

**Decision requested.** Approve the Phase 1A and Procedure Designer prototypes plus the design system as the **reference** (not as code to ship).

**Options**

| Option | Effect |
|---|---|
| A. Approve after a design review (recommended) | Deviations go through the design lane. |
| B. Reject / revise | Specify the changes. |

**Recommendation (not an approval).** **A**. Review input: [docs/integration/02](../integration/02_UX_DESIGN_REVIEW_SUMMARY.md) (both prototypes consistent; 28 + 36 audited states with 0 findings). Not an approval of Hebrew wording, metrology or code.

**Evidence.**
* Automated checks and limits: docs/procedure-designer/07 and docs/integration/02; no user research and no screen-reader testing.

**Risks.** Treating a prototype as validated usability evidence — it is not.

**Partial product-owner record:** Product owner **approves D-32 as a visual reference only**; independent UX/accessibility validation and production readiness are not claimed. See [delegated decision record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md).

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

---

### GA0-16 · Authoritative `x-calos-editor` hint vocabulary

| Register | Finding H-2 in [01](01_PR6_INDEPENDENT_REVIEW.md); phase1a/03 §3; PR #6 `schema.py` |
|---|---|
| Accountable role | Architecture owner + design |
| Needed before | WP-1A-2 |

**Decision requested.** Decide which vocabulary (and `label` shape, message-key namespace) is authoritative before WP-1A-2.

**Options**

| Option | Effect |
|---|---|
| (a) Phase 1A vocabulary is the base; PR #6 is extended | More registry work now; the Builder renders real kinds without translation. |
| (b) PR #6 vocabulary is the base; the Builder adapts | Fewer hints, but the prototype needs rework. |
| (c) Merge both through one reviewed table | A single vocabulary document generates registry checks and editor bindings. |

**Recommendation (not an approval).** **(c)**, decided before WP-1A-2.

**Evidence.**
* Differences enumerated in 01 §2 H-2 (label shape, 17+ missing hints, 7 missing widgets, 11 extra widgets).

**Risks.** Two vocabularies mean per-kind translation code, contradicting the No-Code boundary.

**Sign-off (to be completed by the accountable human — intentionally blank; no approval is recorded by this document)**

| Outcome | ☐ Approved as recommended · ☐ Approved with changes · ☐ Rejected · ☐ Deferred |
|---|---|
| Changes / conditions | |
| Name · role | |
| Date | |
| Evidence reference (PR review link, signed commit, or minute) | |

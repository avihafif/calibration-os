# CalOS — Product-owner decisions recorded by delegation

**Decision date:** 2026-11-02 (Asia/Jerusalem)  
**Accountable product owner:** Avi Hafif (GitHub [@avihafif](https://github.com/avihafif))  
**Record type:** User-authorized, assistant-entered governance record via the connected GitHub account. The product owner explicitly instructed the assistant in the active conversation to approve the needed decisions on their behalf. This is **not** a handwritten or cryptographic signature and is **not** evidence of independent architecture, security, quality or legal review.

**Scope:** Product-owner decisions only. No approval here enables operational verification, package signing, production publishing, real instruments, account provisioning or real metrology. The full Gate A0 remains **CLOSED** until every required authority records their decision.

## Recorded product-owner outcomes

| Entry | Product-owner decision | Outcome and conditions |
| --- | --- | --- |
| GA0-01 / A0-1 | Accept Phase 0B as the development baseline. | **APPROVED.** PR #1 was merged as a verification-only foundation in commit `940ab8b`. This does not waive the open SR-H1/H2/H3 pre-activation gates. |
| GA0-02 / A0-2 | Path B: split the gate so frontend-only WP-1A-1 may be authorized independently of R-4. | **PRODUCT-OWNER ENDORSEMENT ONLY; joint architecture decision still required.** R-7 is merged. R-4 (PR #6) and its High findings still block schema-related WP-1A-0/2/3 and the full Gate A0. Nothing here overrides architecture gate ownership. |
| GA0-03 / D-23 | Phase 1A UI-first on a Test-only, in-memory Synthetic Host. | **APPROVED — option (a).** No persistence, production shipment, real accounts, operational approval/signing/publishing, metrology data, hardware, or instrument transport. Permanent non-operational marking and separation are mandatory. |
| GA0-06a / D-13 (palette only) | Adopt the reviewed Phase 1A design tokens and color/contrast system provisionally. | **APPROVED — palette only**, as the design reference. Subject to contrast/accessibility checks and any later brand-owner change. **No font bundling or font-licence sign-off** (GA0-06b) is granted. Use system fonts meanwhile. |
| GA0-11 / A0-5 (product ownership) | Assign product-side accountability for English/Hebrew UI string coordination. | **ACKNOWLEDGED:** Avi Hafif is the product-side string owner/coordinator. All unreviewed English/Hebrew authored or specialist terminology remains `needs_review`; this does not designate a qualified metrologist/linguist or certify any translation. Review and acceptance are separate. |
| GA0-12 / D-27 | Draft storage for Phase 1A. | **APPROVED — option A:** in-memory only for 1A.1; a later namespaced local-draft increment requires its own explicit privacy/storage approval. |
| GA0-13 / D-28 | Synthetic review/approve/publish user journey. | **APPROVED — option A, UX SIMULATION ONLY.** It confers no real permission, signature, audit authority, release or Production publication. |
| GA0-14 / D-29 | First metadata kinds. | **APPROVED — option A:** Tier 1 = Manufacturer, InstrumentFamily, InstrumentModel; Tier 2 kinds and wizard optional later, subject to their own schema/authority reviews. No metrology values are authorized. |
| GA0-15 / D-32 (product side) | Use both Claude prototypes and the Phase 1A design system as the visual/interaction baseline. | **PRODUCT-OWNER APPROVED AS REFERENCE ONLY.** Prototypes are not production code or validated user studies; changes remain subject to UX/accessibility review and existing architecture. |
| D-01 | Deliver Phase 1 through incremental, reviewable slices S0–S8. | **APPROVED — option (c).** All security, architecture, metrology and quality gates remain independent. |

## Approvals explicitly NOT granted

- **PR #6 / ADR-0025:** no approval to merge PR #6 or ratify its existing `Accepted` statement. Independent review found H-1 (cross-language regex) and H-2 (editor hints), as well as M-1/M-3/M-5; fixes and architectural disposition are still required.
- **GA0-02 architecture half, GA0-09 / ADR-0001, GA0-10 / ADR-0015:** named Architecture Owner must review and ratify or revise.
- **GA0-05 / D-12 and D-26:** exact dependencies, licences (including MPL-2.0), vulnerability/security/CSP evidence, SBOM process and ADR-0022 addendum require architecture/security review. This product record does not approve or install any dependency.
- **GA0-06b:** font sources, bundling obligations and redistribution need the designated legal approval; no font bundling.
- **GA0-04 / D-11, GA0-07 / D-18, GA0-08 / D-21, GA0-16:** architecture and contract owners have not approved these items.
- **Any metrology/safety/quality/operational approvals:** no authorities or compliance evidence are invented or waived.

## Evidence and follow-through

- [Phase 1 decision register](../phase1/11_DECISIONS_REQUIRED.md)
- [Gate A0 approval forms](02_GATE_A0_APPROVAL_FORMS.md)
- [Consolidated Gate A0 approval matrix](../integration/03_GATE_A0_APPROVAL_MATRIX.md)
- [Independent PR #6 review](01_PR6_INDEPENDENT_REVIEW.md)
- [Scoped WP-1A-1 start checklist](05_CHECKLIST_SEQUENCING_AND_BLOCKERS.md)

An assistant recorded the above decisions under the account owner's express instruction. The linked Git commit and Pull Request provide a repository audit trail. They do **not** substitute for a qualified human's independent review or a formal signature where one is required.

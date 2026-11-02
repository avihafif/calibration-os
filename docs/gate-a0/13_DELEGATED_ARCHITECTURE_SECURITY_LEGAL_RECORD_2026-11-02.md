# 13 — Delegated architecture / security / legal decisions recorded for the product owner

| | |
|---|---|
| Decision date | 2026-11-02 |
| Accountable holder | **Avi Hafif** ([@avihafif](https://github.com/avihafif)) — product owner, designated Architecture owner, Security reviewer and Legal approver ([11](11_ROLE_DESIGNATION_RECORD.md)) |
| Record type | **User-authorized, assistant-entered.** In the active conversation the owner instructed the assistant, in Hebrew, *"תחתום בשמי"* ("sign in my name") after reading the signature-ready packets in [12](12_SIGNATURE_READY_PACKETS.md). This repository record and its Git/PR history are the audit trail. It is **not** a handwritten or cryptographic signature, **not** an independent security or legal review, and **not** a qualified legal opinion. |
| Scope | Frontend-foundation decisions only (WP-1A-1, scoped Path B). The scoped architecture/product decisions are recorded, subject to follow-up specifications and per-dependency checks; full Gate A0 stays **CLOSED**. No operational, safety or metrology gate is opened. |

## Recorded outcomes
| Packet | Item | Outcome | Conditions and notes |
|---|---|---|---|
| P-1 | GA0-02 architecture half — scoped Path B | **APPROVED as recommended** | Scope contract of [08 §1](08_ARCHITECTURE_DECISION_PROPOSALS.md) applies exactly (allowed/forbidden paths). Full Gate A0 remains closed; R-4 merge, GA0-16, D-11/D-18/D-21 still gate WP-1A-0/2/3/4. |
| P-2 | PR #6 — H-2 deferral | **ACCEPTED** | The `x-calos-editor` v1 subset is provisional; deferral to GA0-16 is accepted **for the R-4-only merge**. ADR-0025 is addressed under P-8. This record does **not** merge PR #6. |
| P-3 | GA0-05 / D-12 dependencies and policy | **APPROVED as recommended** | Rows R1 `react-intl@12.1.5`; R2 `react-router@8.5.0` (library mode only, lint-forbidden APIs per 09 §2.1); D1 `vitest@5.0.5`; D2 `jsdom@30.1.3`; D3 `@testing-library/react@16.3.3`; D4 `@testing-library/dom@10.4.2`; D5 `@testing-library/user-event@14.6.8`; D6 `@playwright/test@1.64.1` (CI-only pinned browser download); the supply-chain policy of 09 §1; Vite floor `^8.3.5`. **Not approved:** `@tanstack/react-query`, `fast-check`, fonts, anything not listed. Evidence must be re-run when the packages are actually added (09 §1); any other version needs a new decision. |
| P-4 | MPL-2.0 for `axe-core@4.14.0` and `@axe-core/playwright@4.14.0` | **ACCEPTED under the stated conditions** | Unmodified, development-time only, excluded from release artefacts, listed in the dev SBOM. Technical reading by a non-lawyer; does not extend to font licences (GA0-06b) or vendor/trademark questions. |
| P-5 | ADR-0026 frontend dependency addendum | **ACCEPTED** | Status line updated in this PR; ADR index row added to `docs/adr/README.md` after PR #6 merged. No dependency installed by this documentation change. |
| P-6 | ADR-0001 module boundaries | **ACCEPTED WITH CHANGES: amendments A1–A4 accepted; A5 NOT accepted** | A5 needs a CI time budget number that was not supplied, and no number was invented. A5 remains a pending proposal (below). Follow-up spec edits (ARCHITECTURE §6/§6.1, `phase1a/07 §2.3(5)`, `integration/01 §3`, `procedure-designer/03`) are **not** made by this record and must be a separate reviewed PR before WP-1A-1 sub-PR 1a encodes the table (A1). |
| P-7 | ADR-0015 internationalization and RTL | **ACCEPTED WITH AMENDMENTS B1–B6** | B3's finding-key namespace stays subject to GA0-16. Hebrew remains `needs_review`; the content owner for the glossary is still unnamed. |
| P-8 | ADR-0025 pattern semantics (product owner) | **CONFIRMED** | PR #6 has since merged into `main`, and ADR-0025 is **Accepted**, with its owner decision linked. This is not an independent security review. |

**Pending proposal A5 (not accepted):** *state a CI time budget so the "CI time > agreed budget" revisit trigger is testable, and make `tools/codegen.py` enumerate `catalog/kinds.json` when the first Phase 1A kind lands.* Needs the owner's budget figure.

## What this record does **not** do
* It does not merge any pull request, install a dependency, bundle a font, or change `package.json`, a lockfile or any code.
* It grants nothing outside WP-1A-1 and does not touch metrology, safety, quality, trust/identity provisioning, signing, Production, fonts, or Hebrew terminology review (all still without a named authority).
* It does not replace an independent review where one is required; the concentration of roles in one person is noted in [11](11_ROLE_DESIGNATION_RECORD.md).

## Resulting state of the scoped WP-1A-1 checklist
Architecture, dependency, MPL-2.0 and ADR items are now recorded (by delegation). Remaining process items before sub-PR 1a: (a) the separate reviewed spec follow-up for accepted ADR-0001 A1–A4 (and ADR-0015 terminology where required); (b) re-run dependency and SBOM checks when `package.json` changes. PR #6 is **already merged**. See [10](10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md).

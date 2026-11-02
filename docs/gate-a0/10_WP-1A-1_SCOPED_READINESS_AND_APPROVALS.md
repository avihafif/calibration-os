# 10 — WP-1A-1 scoped readiness checklist and approvals still required

Status: **readiness assessment; not an approval.** State as of 2026-11-02, after PR #8 (product-owner record) and the PR #6 correction round. Supersedes the checklist state in [05](05_CHECKLIST_SEQUENCING_AND_BLOCKERS.md) where they differ. Evidence: [07](07_PR6_FINAL_REVIEW_VERDICT.md), [08](08_ARCHITECTURE_DECISION_PROPOSALS.md), [09](09_D12_DEPENDENCY_APPROVAL_MATRIX.md).

**Bottom line.** Product-side decisions for WP-1A-1 are recorded (by delegation — *not* independent review). What blocks Codex from starting is **four architecture/security/legal decisions that no one has recorded**: the architecture half of the scoped gate (GA0-02), D-12 dependencies (GA0-05, with Legal for MPL-2.0), ADR-0001 (GA0-09) and ADR-0015 (GA0-10). Fonts do not block.

## 1. Scoped checklist (Path B)
| ☐/☑ | Item | Source | State | Owner of the next step |
|---|---|---|---|---|
| ☑ | A0-1 Phase 0B disposition | PR #8 | Recorded (product owner) | — |
| ☑ | D-23 UI-first on Test-only in-memory Synthetic Host | PR #8 | Recorded | — |
| ☑ | D-13 palette/tokens (palette only) | PR #8 | Recorded; **no fonts** | — |
| ☑ | A0-5 product-side string coordination (Avi Hafif); everything stays `needs_review` | PR #8 | Recorded; no qualified linguist designated | — |
| ☑ | D-27 (memory-only 1A.1), D-28, D-29, D-32 (reference), D-01 | PR #8 | Recorded (not WP-1A-1 blockers) | — |
| ☐ | **GA0-02 architecture half** — scoped gate contract ([08 §1](08_ARCHITECTURE_DECISION_PROPOSALS.md)) | PR #8 says "joint architecture decision still required" | **Open** | Architecture owner |
| ☐ | **GA0-05 / D-12** — dependencies and policy ([09](09_D12_DEPENDENCY_APPROVAL_MATRIX.md)); MPL-2.0 acceptance | PR #8: not approved | **Open** | Architecture owner; Security; Legal (D7–D8) |
| ☐ | **GA0-09 / ADR-0001** | Proposed; amendments A1–A5 proposed | **Open** | Architecture owner |
| ☐ | **GA0-10 / ADR-0015** | Proposed; amendments B1–B6 proposed | **Open** | Architecture owner (+ content owner for B5) |
| ☐ | ADR-0026 (dependency addendum) accepted | Proposed in this PR | **Open** (follows GA0-05) | Architecture owner |
| – | GA0-06b fonts / legal sign-off | PR #8: not granted | Not required: WP-1A-1 uses the system font stack | Legal (later) |
| – | PR #6 merge, ADR-0025 confirmation, GA0-16, GA0-04/07/08 | — | Not required for WP-1A-1 (07 §1; 08 §1) | Owner / architecture |

## 2. Staged start (so work can begin as soon as the first approvals land)
WP-1A-1 is five reviewable sub-PRs (phase1/13 §4 deliverables). Each needs only the approvals shown; nothing is started before them.

| Sub-PR | Content | Acceptance (P1A-AC) | Approvals needed before it starts |
|---|---|---|---|
| 1a | `packages/ts/i18n` (ICU, locale/dir, bidi helpers, `en-XA`/`he-XB`), hard-coded-string lint, ESLint boundary elements + probes for the new packages, Phase 0A strings → keys | 08, 09 (partial) | GA0-02 arch; GA0-09 (A1–A3); GA0-10 (B1, B2); D-12 rows R1, D1, D2 |
| 1b | `packages/ts/ui-kit` tokens, contrast validator, protected set, `FrameBadges`, `AppFrame`, chips, banners, dialogs, SVG icons | 05, 06, 07 | + none (tokens approved: palette only) |
| 1c | Inputs and data components: `QuantityInput`, `IntervalInput`, `InputRequiredBadge`, `LocalizedTextField`, `DataGrid`, `TreeView`, `DiffViewer`, `ValidationDrawer` (generic `Finding`) | 09, 13, 14 | D-12 rows D3–D5 (or in-house) |
| 1d | `apps/web` routing, shells, `CommandPalette`, skip links, region cycling | 12 | D-12 row R2 (or in-house router) |
| 1e | CI harness: Vitest, Playwright + axe, RTL/LTR × light/dark visual baselines, `pnpm audit`/SBOM jobs | 10, 11 | D-12 rows D6–D8 (**Legal for D7–D8**), policy |

Fonts: system stack throughout; no font file enters the repository.

## 3. First real React milestone (definition of done for WP-1A-1)
A bilingual (en/he, RTL), light/dark, keyboard-operable web shell in the Test deployment whose every route shows the non-removable `TEST` and synthetic-sandbox frame, built from approved `ui-kit` components, with axe (zero critical/serious), keyboard-only and visual-baseline tests in CI; **no** schema, kind, persistence, network, authentication, font bundling or operational capability.

## 4. Approvals still required from authorized humans (none recorded)
> Update: the product owner has since designated himself for the architecture, security and legal roles ([11](11_ROLE_DESIGNATION_RECORD.md)); signature-ready packets are in [12](12_SIGNATURE_READY_PACKETS.md). Designation is not approval, and it does not provide independent review.

| # | Authority | Needs to record | Evidence expected |
|---|---|---|---|
| 1 | **Architecture owner** (to be named) | GA0-02 scoped gate; GA0-09 ADR-0001 (with/without A1–A5); GA0-10 ADR-0015 (with/without B1–B6); GA0-05 rows and policy; acceptance of ADR-0026; H-2 deferral disposition on PR #6 (C1 in 07) | status change in the ADR files / approving review in a reviewed PR |
| 2 | **Security reviewer** (to be named) | supply-chain policy; R1, R2, D6 (browser download in CI) | review comment or signed record |
| 3 | **Legal approver** (to be named) | MPL-2.0 for `axe-core` / `@axe-core/playwright` (dev-only, unmodified); later GA0-06b font licences | written approval |
| 4 | **Product owner** (Avi Hafif) | designate the three roles above (or record holding them); ADR-0025 confirmation (separate, `GA0-02b`); decision to merge PR #6 | named record |
| 5 | **Content owner / qualified linguist** (later) | Hebrew review (MI-31, Q-15) | review record |

The repository's governance record (06) states that product-owner decisions entered by an assistant under the owner's instruction are **not** evidence of independent architecture, security, quality or legal review; items 1–3 therefore cannot be satisfied by that mechanism.

## 5. Remaining blockers to starting WP-1A-1 (exact)
1. No recorded architecture decision on the scoped gate (GA0-02 architecture half).
2. D-12 rows not approved; MPL-2.0 not accepted by Legal (blocks sub-PR 1e only); ADR-0026 not accepted.
3. ADR-0001 not accepted — the TS dependency table (A1) that sub-PR 1a must encode does not exist yet.
4. ADR-0015 not accepted — system-bundle scope (B1) and pseudo-locale/lint requirement (B2) are not yet normative.
5. (Process) PR #6 not yet merged — recommended before cutting WP-1A-1 to avoid conflicts; the owner's merge decision and C1/C2 of 07.
Nothing else blocks: product decisions are recorded, fonts are deferred, and the full Gate A0 is intentionally **not** required for this scoped start.

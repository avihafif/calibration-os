# 08 — Architecture decision proposals for WP-1A-1 (GA0-02 architecture half, GA0-05, GA0-09, GA0-10)

> **Update 2026-11-02 (later):** the architecture, dependency, MPL-2.0 and ADR items in this document were recorded **by delegation** in [13](13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md) (ADR-0001 with A1–A4 only; A5 not accepted). That is not independent review. Nothing else in this document changed.

| | |
|---|---|
| Status | Historical architecture proposals. Subsequent delegated outcomes are recorded in [13](13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md): scoped Path B, D-12, ADR-0001 A1–A4 (A5 pending), ADR-0015 B1–B6 and ADR-0026. **The approvals are not independent security or qualified legal reviews.** PR #6 is now merged; full Gate A0 remains closed. |
| Builds on | [02 forms](02_GATE_A0_APPROVAL_FORMS.md), [03 ADR reviews](03_ADR_REVIEWS.md), [04 evidence](04_DEPENDENCY_AND_FONT_EVIDENCE.md), [07 PR #6 verdict](07_PR6_FINAL_REVIEW_VERDICT.md), [09 D-12 matrix](09_D12_DEPENDENCY_APPROVAL_MATRIX.md) |
| What changed since 02/03 | PR #8 recorded product-owner outcomes (D-23, palette-only D-13, string coordination, D-27–D-29, D-32 as reference, D-01); PR #6 was corrected (7); `pnpm`-based dependency verification and SBOM generation were confirmed (09). Recommendations below are reconciled with these. |
| Roles | Avi Hafif designated for the scoped frontend roles in [11](11_ROLE_DESIGNATION_RECORD.md); this concentrates roles and does not imply independent security or legal verification. Other safety/metrology/quality roles remain unassigned. |

## 1. GA0-02 (architecture half) — scoped Path B
**Decision requested.** The architecture owner jointly records, with the product owner's endorsement (PR #8), that **WP-1A-1 only** may be authorized independently of R-4, without opening the full Gate A0.

**Options.** (a) full Gate A0 first; **(b) scoped authorization of WP-1A-1 (recommended)**; (c) merge R-4 as-is and open everything (not recommended — H-2 and the ADR-0025 owner confirmation remain).

**Recommended outcome: (b), with this scope contract**

| Allowed in WP-1A-1 | Forbidden in WP-1A-1 |
|---|---|
| `packages/ts/i18n/**`, `packages/ts/ui-kit/**`, `apps/web/**`; `eslint.config.mjs` and `tools/check_ts_boundary.mjs` (extending boundaries, never weakening); root `package.json`/`pnpm-lock.yaml` for **approved** dependencies only; frontend jobs in `.github/workflows/phase0a.yml`; tests, capability-matrix and handoff docs for the above | `schemas/**`, `catalog/**`, `packages/py/**`, `apps/api/**`, any kind, inspector, `editor-core`, `designers`, Synthetic Host, persistence or browser storage (D-27 A), network calls, authentication, fonts/font files (GA0-06b), any metrology or safety content, any operational, approval, signing or publishing path |

**Why the split is safe.** WP-1A-1 deliverables (phase1/13 §4) contain no schema or kind code; R-7 (Findings/lifecycle types) is merged; the R-4 findings H-1/M-1/M-3/M-5 are fixed and H-2 does not touch frontend primitives (07 §4). **Guardrails that keep it safe:** `ValidationDrawer` and friends accept the generic `Finding` shape (`code`, `severity`, `pointer`, `message{key,params}`, `stage`) and assume **no key namespace** (H-2 is undecided); `FrameBadges` and the non-operational banner are non-removable (P1A-AC-05/07); protected tokens are not themeable; no component names a kind, manufacturer or model.

**Sequencing recommendation.** Merge PR #6 *before* cutting WP-1A-1 (both edit root `package.json`, `phase0a.yml` and TS config); this is a convenience, not a gate. The full Gate A0 stays **closed**; later packages need their own entries (R-4 merged and GA0-16 before WP-1A-2/3; D-11/D-18 before WP-1A-2; D-21 before WP-1A-4).

**Risks.** A UI kit shaped before the hint vocabulary is fixed (mitigated by the generic `Finding`/model contracts); parallel branches editing shared config (mitigated by the sequencing above).

**Sign-off (blank).** ☐ Approved · ☐ Approved with changes · ☐ Rejected · ☐ Deferred — Architecture owner: name ____ role ____ date ____ evidence ____.

## 2. GA0-05 — D-12 exact dependencies
Full matrix, evidence and the draft addendum: [09](09_D12_DEPENDENCY_APPROVAL_MATRIX.md) and [`docs/adr/0026-frontend-dependencies-addendum.md`](../adr/0026-frontend-dependencies-addendum.md) (*Proposed*).
**Recommended outcome:** approve R1 `react-intl@12.1.5`, D1–D6 (`vitest@5.0.5`, `jsdom@30.1.3`, `@testing-library/{react@16.3.3,dom@10.4.2,user-event@14.6.8}`, `@playwright/test@1.64.1`), and `react-router@8.5.0` **in library mode only** (or an in-house router instead); approve D7–D8 (`axe-core`, `@axe-core/playwright` 4.14.0, **MPL-2.0**) only if Legal accepts MPL-2.0 for unmodified, dev-only use; defer `@tanstack/react-query`, `fast-check`; adopt the supply-chain policy; raise Vite's floor to `^8.3.5`.
**Approvers:** Architecture owner (all rows), Security (R1, R2, D6, policy), Legal (D7–D8). **Not recorded.**

## 3. GA0-09 — ADR-0001 module boundaries
**Recommended outcome: ACCEPT WITH AMENDMENTS A1–A5** (text proposed in-place in [`docs/adr/0001-modular-monorepo-boundaries.md`](../adr/0001-modular-monorepo-boundaries.md), still *Proposed*).

| Conflict (existing architecture vs handoff) | Resolution proposed by the amendment | Follow-up edit **after** acceptance (not made now) |
|---|---|---|
| TS layering undefined; `eslint.config.mjs` declares only `web` and `domain-types` and the only forbidden edge is `api-client` | A1 dependency table + element per package + one negative probe per forbidden edge | ARCHITECTURE §6.1 TS rows; `eslint.config.mjs`; `tools/check_ts_boundary.mjs` (in WP-1A-1 sub-PR 1a) |
| Inspector in `editor-core` (ARCHITECTURE §6) vs `designers/inspector` (`phase1a/07 §2.3(5)`, `integration/01 §3`) | A2 model in `editor-core`, React rendering in `designers` | `phase1a/07 §2.3(5)`, `integration/01 §3`, `procedure-designer/03` |
| One `designers/` package vs sub-packages | A3 one package with folders | same docs |
| `design/` and a second workflow not in the layout | A4 non-shipping, never imported by production | ARCHITECTURE §6 layout note |
| No CI budget; fixed codegen list | A5 | `tools/codegen.py` in WP-1A-2 |

**Reconciliation with PR #8:** D-32 (prototypes as reference) is consistent with A4 — prototype code remains non-shipping. **If revised instead:** the owner may choose another split, in which case the three handoff documents above change together before WP-1A-1 starts.
**Approver:** Architecture owner. **Not recorded.**

## 4. GA0-10 — ADR-0015 internationalization and RTL
**Recommended outcome: ACCEPT WITH AMENDMENTS B1–B6** (proposed in-place in [`docs/adr/0015-i18n-and-rtl.md`](../adr/0015-i18n-and-rtl.md), still *Proposed*).

| Gap | Amendment | Reconciliation with PR #8 and evidence |
|---|---|---|
| System bundles vs `TranslationBundle` config items in 1A | **B1** system bundles only in 1A | D-29 Tier 1 contains no `TranslationBundle`; D-27 A forbids storage anyway |
| Pseudo-locales and string lint only in the plan | **B2** | P1A-AC-08 |
| Three message-key conventions (`schema.*`, `f.<CODE>`, `pd.*`) | **B3** (namespace subject to GA0-16) | H-2 open; avoids pre-empting it |
| Fonts/glyph coverage (Inter no Hebrew; Heebo lacks `Ω ≤ ≥`; icons in no font) | **B4** stack order, SVG icons, self-hosting, **no bundling before legal sign-off** | PR #8: palette only, system fonts meanwhile; evidence 04 §3 |
| Glossary unreviewed; plurals | **B5** | PR #8 GA0-11: Avi Hafif coordinates strings, all stay `needs_review`; no qualified linguist designated |
| Logical-CSS lint, `lang`/`dir`, bidi islands | **B6** | both prototypes already pass these checks (`design/tools/check_prototype_consistency.js`) |

**If revised instead:** if `TranslationBundle` must exist in 1A, add it to the D-29 scope, define a loader port and analyse CSP/storage before WP-1A-1.
**Approver:** Architecture owner (+ the content owner for B5). **Not recorded.**

## 5. Non-silent-change statement
Only two existing ADR files were touched, and only by **adding** a clearly labelled "Proposed amendments" section and updating the Status line to say the amendments are not accepted (both ADRs remain *Proposed*; no Accepted ADR was edited). `docs/ARCHITECTURE.md`, `docs/phase1a/07`, `docs/integration/01` and all Codex-owned files are unchanged. The ADR index (`docs/adr/README.md`) is not edited here to avoid a conflict with PR #6, which edits the same lines; add the ADR-0026 row when PR #6 lands.

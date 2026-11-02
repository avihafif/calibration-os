# 05 — Approval checklist, sequencing and remaining blockers to WP-1A-1

> **Update 2026-11-02 (later):** the architecture, dependency, MPL-2.0 and ADR items in this document were recorded **by delegation** in [13](13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md) (ADR-0001 with A1–A4 only; A5 not accepted). That is not independent review. Nothing else in this document changed.

Status: **partial product-owner approvals recorded** on 2026-11-02; all independent architecture/security/legal/metrology gates remain open. See [delegated decision record](06_PRODUCT_OWNER_DECISIONS_2026-11-02.md). Forms: [02](02_GATE_A0_APPROVAL_FORMS.md). Review of PR #6: [01](01_PR6_INDEPENDENT_REVIEW.md). Evidence: [03](03_ADR_REVIEWS.md), [04](04_DEPENDENCY_AND_FONT_EVIDENCE.md).

## 1. Two ways to open the gate
| | Path A — full Gate A0 (phase1/13 §3 as written) | Path B — scoped authorization of WP-1A-1 only |
|---|---|---|
| What it authorizes | All Phase 1A work packages | **WP-1A-1 (frontend foundation) only**; later packages need their own entries |
| Needs R-4 merged first | Yes | No — WP-1A-1 touches no schema (`GA0-02` option (b) must be recorded) |
| Weakens a control? | No | No: no decision is waived, only sequenced; the full Gate A0 stays closed |
| Recommended | When all decisions can be signed together | **Yes** — the frontend foundation is blocked today by items it does not use |

## 2. Exact approval checklist (partially recorded)
`●` required · `○` recommended · `–` not required for that path. "Evidence" is what must exist for the box to be ticked.

| ☐ | Form | Item | Path A | Path B | Evidence the approver attaches |
|---|---|---|---|---|---|
| ☑ | GA0-01 | A0-1 Phase 0B disposition | ● | ● | Owner's statement on the form (merge `940ab8b` already on `main`) |
| ☐ | GA0-02 | A0-2 R-4 / R-7 sequencing (R-7 done) | ● | ● (records the split) | Owner wording of the gate split; PR #6 link |
| ☐ | GA0-02b | ADR-0025 verifiable approval | ● | – (needed before PR #6 merge) | Approving review/comment on PR #6 or signed line |
| ☑ | GA0-03 | D-23 UI-first on Synthetic Host | ● | ● | Form |
| ☐ | GA0-04 | D-11 locale handling in `Manufacturer` | ● | – (WP-1A-2) | Form (fact: nothing published) |
| ☐ | GA0-05 | D-12 frontend dependencies (rows 1–10 of 04 §2.1, each pinned) | ● | ● | Per-row decision incl. MPL-2.0 acceptance; ADR-0022 addendum PR |
| ☑ | GA0-06a | D-13 palette / tokens | ● | ● | Form |
| ☐ | GA0-06b | D-13 fonts + legal licence sign-off | ● | ○ (needed only before bundling; WP-1A-1 may start on the system font stack) | Form; legal sign-off |
| ☐ | GA0-07 | D-18 `media` / `.calrel` | ● | – | Form |
| ☐ | GA0-08 | D-21 lease defaults | ● | – | Form |
| ☐ | GA0-09 | ADR-0001 Accept / amendments A1–A5 | ● | ● (at least A1, A2, A3) | ADR status change by the owner (Proposed → Accepted) |
| ☐ | GA0-10 | ADR-0015 Accept / amendments B1–B6 | ● | ● (at least B1, B2) | ADR status change by the owner |
| ☑ | GA0-11 | A0-5 string ownership | ● | ● | Named owner on the form |
| ☑ | GA0-12 | D-27 persistence | ● | – | Form |
| ☑ | GA0-13 | D-28 synthetic workflow | ● | – | Form |
| ☑ | GA0-14 | D-29 kind scope | ● | – | Form |
| ☐ | GA0-15 | D-32 visual baseline | ● | ○ | Form |
| ☐ | GA0-16 | Hint vocabulary (before WP-1A-2) | ○ | – | Form |

## 3. Updated implementation sequencing
```
Administrative track (humans)          Codex track
-----------------------------          -----------
Record GA0-01,03,05,06a,09,10,11 ───►  WP-1A-1  frontend foundation (Path B)
(+02 to record the gate split)           1a tokens + i18n package + string lint + boundaries (A1)
                                         1b ui-kit primitives, FrameBadges/AppFrame, protected tokens
                                         1c inputs and data components (Quantity/Interval inputs, DataGrid, TreeView, DiffViewer)
                                         1d apps/web shells + routing + CommandPalette
                                         1e CI harness: Vitest, Playwright + axe, visual baselines
                                       (fonts bundled only after GA0-06b)
Corrections to PR #6 (H-1, M-1, M-3, M-5) ─► GA0-02b ─► merge PR #6 ─► WP-1A-0 (TS canonicalizer + shared vectors)
Record GA0-04, 07, 16 + R-4 merged ───►  WP-1A-2 kinds, schemas, fixtures
                                         WP-1A-3 editor-core + inspector model   (needs 1A-1, 1A-2, ADR-0001 A2)
Record GA0-08, 12 ───►                   WP-1A-4 Synthetic Host
Record GA0-13, 14 ───►                   WP-1A-5 shells/workspaces, publish simulation
                                         WP-1A-6 No-Code proof, WP-1A-7 quality/demo
Procedure Designer + Simulation Lab: design-only until PD-DEC-003 and PD-DEC-012 are decided.
```
Rules that do not change: WP-1A-1 stores nothing in the browser, makes no network call, adds only approved dependencies at the approved exact versions, does not weaken import-linter or eslint boundaries, and cannot hide `FrameBadges` or the non-operational banner.

## 4. Precise remaining blockers to WP-1A-1 (Path B)
| # | Blocker | Type | Closed by |
|---|---|---|---|
| B1 | Closed: product owner accepted PR #1 on 2026-11-02 | recorded | GA0-01 |
| B2 | Product owner endorsed Path B; architecture co-approval not yet recorded | pending joint approval | GA0-02 (option b) |
| B3 | Closed: product owner approved D-23 on 2026-11-02 | recorded | GA0-03 |
| B4 | Dependencies not approved (10 packages pinned in 04 §2.1; MPL-2.0 of axe not accepted; Node ≥ 22.22.2 not recorded) | approval + ADR-0022 addendum | GA0-05 |
| B5 | Closed: product owner adopted palette/tokens provisionally on 2026-11-02 | recorded | GA0-06a |
| B6 | ADR-0001 still Proposed; TS layering (A1), inspector placement (A2), designers granularity (A3) undecided | architecture | GA0-09 |
| B7 | ADR-0015 still Proposed; system-bundle scope (B1) and pseudo-locale/lint requirement (B2) not in the ADR | architecture | GA0-10 |
| B8 | Product-side coordination assigned to Avi Hafif (2026-11-02); specialist language review remains pending | recorded with later quality review | GA0-11 |
| B9 | Font licences not signed by legal (blocks **bundling only**) | legal | GA0-06b |
| B10 | Product owner approved D-32 reference baseline; UX-side validation not recorded | partial/recommended | GA0-15 |

**Not blockers for WP-1A-1:** D-11, D-18, D-21, D-27, D-28, D-29, R-4 corrections and merge of PR #6, ADR-0025 verification, the hint-vocabulary decision, MI-34 role holders, Q-15 translator review (strings stay `needs_review`).

**Blockers to the full Gate A0 (Path A) in addition:** GA0-02 (R-4 merged), GA0-02b, GA0-04, GA0-07, GA0-08, GA0-12, GA0-13, GA0-14, and corrections H-1, M-1, M-3, M-5 in PR #6.

## 5. When Codex may start
Codex may begin WP-1A-1 **only when** the boxes marked ● in the Path B column are ticked, with a name, role, date and evidence reference in each form, and the corresponding ADR/addendum PRs are merged by the owner. Until then Codex may prepare corrections to PR #6 and draft the ADR-0022 addendum text, but must not add a dependency, bundle a font, or create the new TS packages.

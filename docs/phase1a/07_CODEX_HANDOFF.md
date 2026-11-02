# 07 — Codex implementation handoff: Phase 1A (schema-driven No-Code Builder on synthetic data)

| | |
|---|---|
| Status | Final proposal. **Do not start before gate A0 is signed** ([05](05_GATE_A0_APPROVAL_PACKAGE.md)). Supersedes nothing: it *amends* [phase1/13](../phase1/13_PHASE1A_PLAN.md) and [phase1/12 §7](../phase1/12_CODEX_IMPLEMENTATION_PROMPT.md) as listed in §2.3, and aligns with Codex's conditional plan on PR #1's branch (`docs/PHASE1A_IMPLEMENTATION_PLAN.md`). |
| Reading order | [05](05_GATE_A0_APPROVAL_PACKAGE.md) (what is approved) → [02](02_BUILDER_UX_SPEC.md) (screens) → [01](01_DESIGN_SYSTEM.md) (tokens/components) → [03](03_METADATA_UI_BINDING.md) (generic editor) → [06](06_TEST_AND_USABILITY_CHECKLIST.md) (tests) → this file. |
| Precedence | `AGENTS.md` and NO_CODE_ARCHITECTURE override everything here. Where this handoff and an approved ADR disagree, **stop and ask** (12 §6). |

## 1. Outcome (what "done" looks like)
A professional, bilingual (en/he, RTL-correct), light/dark, keyboard- and screen-reader-operable **No-Code Application Builder** inside the Test shell, in which a non-programmer creates, edits, validates, reviews (simulated separation of duties), "publishes" (synthetic), compares and inspects versions of `Manufacturer`, `InstrumentFamily`, `InstrumentModel` (Tier 1) — and, if D-29 approves, `StandardRole`, `StationRequirement` and `ApplicationManifest` via the creation wizard (Tier 2) — **driven entirely by schema + hint metadata through one generic renderer**. No instruments, no real authentication, no persistence beyond what D-27 allows, no signing/export/release, no production publication.

## 2. Scope, gating and amendments

### 2.1 Tiers (D-29)
| Tier | Kinds | Screens |
|---|---|---|
| **1 — required** | `Manufacturer`, `InstrumentFamily`, `InstrumentModel` | Dashboard, Instruments (3 lists), item editor (Edit/Versions/Compare/History/Where used/Data), Review queue, publish simulation, Design-system gallery (as `apps/web` dev route) |
| **2 — stretch (same renderer)** | `StandardRole`, `StationRequirement`, `ApplicationManifest` | Equipment lists, Applications list, **creation wizard**, derived requirements panel |
| Not in 1A | everything in phase1/13 §2.2 | — |

### 2.2 Gates (do not skip)
A0 signed (05 §5) · R-4 and R-7 from phase1/14 merged · ADR-0001/0015 ratified · D-12 dependency list recorded · fonts licence confirmed (D-13).

### 2.3 Amendments to phase1/13 (apply when the owner approves 05)
1. Persistence per **D-27**: WP-1A-4 is memory-only; `localDraftStore` is WP-1A-4b (namespaced, version-stamped, size-bounded, explicit *Reset*).
2. Add acceptance **P1A-AC-53…64** ([06 §4](06_TEST_AND_USABILITY_CHECKLIST.md#4-additional-acceptance-criteria-extend-phase113-5)).
3. WP-1A-5 gains: inline **+ New** in reference pickers, **Review summary**, 3-step publish, *Initial version* class, disabled-with-reason everywhere, `DigestText`.
4. WP-1A-2/3 hint vocabulary gains the **bold** hints in [03 §3](03_METADATA_UI_BINDING.md#3-hint-vocabulary-final-closed-and-versioned) (incl. `wizard_step`, `initial`, registry `wizard` flag, `title`, `item_title`, `unique_by`, …).
5. Package naming: inspector in `packages/ts/designers/inspector`; i18n in `packages/ts/i18n`; app code under `apps/web/src/builder/` (reconcile Codex plan's `ui-runtime` mention in the first PR; `ui-runtime` remains the operator-screen renderer).

## 3. Screens to implement (final)

| Screen | Route (suggested) | Spec | Tier | Prototype reference | Primary packages |
|---|---|---|---|---|---|
| Dashboard | `/builder` , `/builder/dashboard/:tab` | [02 §3](02_BUILDER_UX_SPEC.md#3-flow-a--dashboard-dashboard) | 1 | `#/dashboard` | `apps/web`, `ui-kit` |
| Kind lists (+ create dialog) | `/builder/instruments/:kindTab`, `/builder/equipment/:tab`, `/builder/apps` | [02 §4.1](02_BUILDER_UX_SPEC.md#41-lists-manufacturers-families-models) | 1/2 | `#/instruments/*` | `designers/inspector` list helpers, `ui-kit` `DataGrid` |
| Item editor workspace | `/builder/item/:kind/:key/:tab?` | [02 §4.3–§4.4, §5.6](02_BUILDER_UX_SPEC.md#43-editor-workspace-itemkindkey--applies-to-every-kind) | 1 | `#/item/*` | `editor-core`, `designers/inspector`, `ui-kit` |
| Publish simulation dialog | (dialog) | [02 §5.6](02_BUILDER_UX_SPEC.md#56-draft--review--approval--synthetic-publish) | 1 | publish wizard | `apps/web`, `SyntheticHost` |
| Review queue | `/builder/review` | phase1/04B SCR-14 and 02 §4.3 | 1 | `#/review` | `ui-kit` |
| Creation wizard | `/builder/apps/new` | [02 §5.1](02_BUILDER_UX_SPEC.md#51-create-application-wizard-appsnew--four-steps) | 2 | `#/apps/new` | `designers/inspector` (`only` by hint) |
| Settings (policy, role matrix view) | `/builder/settings` | phase1/04B SCR-10 (sandbox subset) | 1 (policy) | `#/settings` | `apps/web` |
| Design-system gallery | `/dev/design-system` (dev entry only) | [01](01_DESIGN_SYSTEM.md) | 1 | `#/design` | `ui-kit` catalogue |

## 4. Tokens and components
* **Tokens:** exactly [01 §2](01_DESIGN_SYSTEM.md#2-tokens) (CSS custom properties generated from the system `UiTheme`; contrast test in CI).
* **Components:** inventory in [01 §3](01_DESIGN_SYSTEM.md#3-components-final-inventory-used-by-phase-1a) with names aligned to phase1/06 §3. Contract sketches (documentation, not source):

```ts
type Decimal = string;                       // matches /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/ — never number
interface Quantity { value: Decimal; unit: string }
type InputMarker = { $input: `MI-${number}` | `Q-${number}` };
interface QuantityInputProps { dimension?: string /* restricts units */; value?: Quantity; onChange(v: Quantity): void; readOnly?: boolean; invalid?: boolean; describedBy?: string }
interface IntervalValue { lower: Quantity; upper: Quantity; lower_inclusive?: boolean; upper_inclusive?: boolean } // inclusivity REQUIRED at publish, no default in UI
interface DataGridProps<T> { id: string; label: string; columns: Column<T>[]; rows: T[]; onOpen?(r: T): void; density?: "compact"|"comfortable" }
interface Finding { code: string; sev: "error"|"warning"|"info"; ptr: string; stage: Stage; params?: Record<string,string|number>; fix?: { id: string } }
interface GovernedConfirmationProps { title: string; effect: string; digest?: string; reasonRequired?: boolean; stepUp: "simulated"|"required"; confirmLabel: string; danger?: boolean; onConfirm(reason: string): void }
interface ReferencePickerProps { kind: string; value?: { $ref: { kind: string; key: string } }; optional?: boolean; filterBy?: { field: string; value: string }; onChange(v?: ...): void; onCreate?(): void }
```
* **Protected set** (non-overridable): `FrameBadges`, simulation banner, `HazardRibbon`, `LimitCheckChip`, focus ring — unit-tested.

## 5. Behaviours the implementation must match

### 5.1 User journeys covered
J-01 (model portion), J-04 (steps 1–3 as simulation), J-09 (role-matrix view only), J-10 (history/chain view), J-11 (locale policy) — see [phase1/05](../phase1/05_USER_JOURNEYS.md) — plus the new journeys in [06 §2 S-01…S-18](06_TEST_AND_USABILITY_CHECKLIST.md#2-product-acceptance-scenarios-playwright-gui-only-run-in-en-and-hertl-light-and-dark).

### 5.2 Interaction states (all required)
Loading · empty · filtered-empty · error (stable code + retry) · read-only (frozen / permission / second session / offline, each with banner + reason) · forbidden · withdrawn · "has draft" · saved/saving/offline-buffered · lease takeover. Catalogue in [01 §4](01_DESIGN_SYSTEM.md#4-state-patterns-all-designed-and-demonstrated).

### 5.3 Responsive rules
| Width | Behaviour |
|---|---|
| ≥ 1100 | Editor: form column (≤ 820 px) + readiness column (300 px); dashboard: queue + 320 px side column |
| 900–1099 | Single-column editor/dashboard; side-nav persistent |
| 700–899 | Nav becomes an inline-start drawer opened by a labelled button (`aria-expanded`, focus return); tables unchanged |
| < 700 | Tables render as labelled cards (`data-label`); steppers show only the current step label; dialogs use full width minus 24 px |
| 360 px | No horizontal page scroll for Dashboard, lists, Review, Compare, Settings; editing is supported but optimised ≥ 1024 px |

### 5.4 Localization requirements
All text through ICU keys with en + he, `needs_review` flag on Hebrew until Q-15; `lang`/`dir` on `<html>` **and** on each localized input; natural-language data via `dir=auto`, identifiers/hashes/paths/codes LTR + monospace; no string concatenation (use ICU placeholders with isolates); pseudo-locales `en-XA`/`he-XB` in CI; locale-aware collation; Western digits; dates via `Intl` with UTC shown; locale fallback chip when text falls back; required locales are **policy** (warning `I18N-001`), never schema.

### 5.5 Error and validation behaviour
| Situation | Behaviour |
|---|---|
| Field-level schema violation | Inline message (what/why/fix) with `[PR-001]` code in LTR; `aria-invalid`; also listed in drawer |
| Required field, untouched | Not painted inline; counted in readiness and listed in the drawer (E-1) |
| Input required (`PR-013`) | Warning, shown as badge row with MI id; blocks *production* readiness only |
| Missing locale per policy (`I18N-001`) | Warning on that field |
| Unresolved/unpublished reference (`PR-002`/`APP-001`) | Error / warning; unpublished blocks publish with "dependency not published" |
| Inclusivity missing (`PR-015`) | Error on the exact radio group; no default ever |
| Submit with errors | Button disabled **with reason** ("Fix n errors first"); attempting Validate paints all |
| Offline | Banner; save/submit/approve disabled with reason; buffered count |
| Governed action | Confirmation panel (effect, digest, reason, step-up note); failure leaves state unchanged and explains |
| Unknown widget/hint/keyword | Visible error placeholder / registration failure — never silently skipped |
| API errors (1B) | Problem+json → localized title/detail + stable code; no stack traces |

## 6. What not to copy from the prototype
* **Not production code:** `engine.js` (sync SHA, in-memory store, hand-rolled validator/diff), `ui.js`, `views.js`, global state, the hash router, inline persona logic, text-glyph icons, system-font stack.
* **Never ship:** persona switcher, "Prototype controls", Guided demo, the audit chain simulation presented as real, "simulated step-up" wording in a real deployment, the seed data, the synthetic capability list.
* **Re-implement properly:** canonical JSON/digests (use `calos_metadata` vectors and the TS twin), JSON Schema validation (the approved subset in `calos_metadata` + TS), accessibility (axe + manual), icons (approved set), fonts (bundled).
* **Keep (as behaviour, not code):** every rule in [02](02_BUILDER_UX_SPEC.md) and [03](03_METADATA_UI_BINDING.md); the token values; the protected-indicator rules; disabled-with-reason; the findings contract.

## 7. Test scenarios and acceptance
Scenarios S-01…S-18 and negative cases: [06 §2](06_TEST_AND_USABILITY_CHECKLIST.md). Acceptance: phase1/13 P1A-AC-01…52 + **P1A-AC-53…64**. CI additions: contrast test, no-kind-names lint on the renderer, widget-exhaustiveness test, i18n completeness test (en+he, placeholder parity), production-bundle exclusion test, no-network/no-storage Playwright guard. These already exist as dependency-free checks in [`design/phase1a-prototype/tests/prototype.test.js`](../../design/phase1a-prototype/tests/prototype.test.js) — port the *rules*, not the file.

## 8. Implementation dependencies
| Need | Status |
|---|---|
| Prototype runtime dependencies | **None** (vanilla JS) — nothing here approves any library |
| Product frontend libraries (router, query cache, ICU, Vitest, Playwright, axe, grid virtualisation, catalogue tool) | Candidate classes in phase1/06 §9; **each needs D-12 approval + ADR-0022 addendum**; none adopted |
| Backend | R-4 validator subset; R-7 lifecycle ports; codegen emitting definitions/unions to TS; RFC 8785 Python↔TS vectors (WP-1A-0) |
| ADRs | 0001, 0015 ratified; **not** 0004/0008/0014/0016 for 1A |
| Fonts | Inter, Heebo, JetBrains Mono (SIL OFL) bundled after licence confirmation |

## 9. Residual risks and assumptions
| ID | Item | Owner | Slice |
|---|---|---|---|
| R-1 | Wizard must create its draft at step 1 (prototype keeps state in memory) | Codex / UX | 1A |
| R-2 | `DigestText` everywhere | Codex | 1A |
| R-3 | "Request a capability" action and vocabulary governance (D-31) | Metrologist / product | S1–S3 |
| R-4 | Waiting-since/aging column in review/work queue | Codex | 1A/S7 |
| R-5 | Admin visibility of authored content (D-30) | Security | S0 |
| R-6 | Remappable shortcuts; browser-reserved key conflicts | UX | P2 |
| R-7 | Performance budgets from baseline (no virtualisation in prototype) | Codex | S1–S4 |
| R-8 | Screen-reader (NVDA/JAWS) and real-device testing not yet done | QA/UX | before 1A exit |
| R-9 | Operator shell/technician validation not covered | UX | S5 |
| A-1 | **Assumption:** `Intl`/`Intl.DateTimeFormat` and `dir=auto` behave consistently across supported browsers; verify in CI matrix | Codex | 1A |
| A-2 | **Assumption:** the capability vocabulary in the prototype is synthetic and grammar-conformant only | Metrologist | — |
| A-3 | **Assumption:** Hebrew strings are unreviewed placeholders; no terminology is claimed correct | Quality + linguist | Q-15/MI-31 |
| A-4 | **Assumption:** change-class rules in kind metadata are proposals (MI-30/35); the server computes the authoritative class | Quality | S1 |
| Risk | Prototype looks "finished" and a stakeholder assumes operational capability | Product | Mitigation: banner, persona chip, README; do not demo without them |

## 10. Traceability
| Requirement / criterion | Where satisfied (design) |
|---|---|
| FR-NC-01, FR-NC-02, FR-NC-03, FR-NC-05 | 02 §4–§5; 03; prototype editor/wizard/where-used |
| FR-META-01/02/03/05/06 | 02 §4.3, §5.6; 03 §7; lease/undo UX |
| FR-GOV-01/02/03 (UX parts) | 02 §5.6; disabled-with-reason; history; validation blocks publish |
| FR-UIB-03, FR-UI-02, FR-UI-05, FR-UI-06 | 01 §8; 02 §6; 04 §4 |
| AC-NC-01, AC-NC-09 (model path) | 06 S-02…S-10 |
| AC-UX-01…06, 09 | 01 §2.2, §10; 06 §3; 04 §1 |
| P1A-AC-01…52 (phase1/13) | unchanged; plus 53…64 |
| NO_CODE_ARCHITECTURE B-1…B-7, §12 | 03 §1, §9–§11; prototype test "no kind names in renderer" |
| AGENTS §2.1 (no invented metrology) | all values *Input required* or user-entered; no real numbers in seed/fixtures |
| AGENTS §2.2 (simulation ≠ calibration) | banner/badges non-themeable (01 §2.2) |
| AGENTS §2.13/§13 (Test/Production separation) | Production-bundle exclusion (S-17) |

## 11. Implementation prompt for Codex (Phase 1A, after gate A0)
> Implement **Phase 1A** per `docs/phase1/13_PHASE1A_PLAN.md` **as amended by** `docs/phase1a/07_CODEX_HANDOFF.md §2.3`, one work package per PR, cut from `main` after PR #1 and the Gate A0 conditions are merged/recorded. The visual and interaction baseline is `docs/phase1a/01…03` and the prototype in `design/phase1a-prototype/` (reference only — do not import or copy its code). Obey every rule in `AGENTS.md` and `docs/phase1/12 §3`. Build the generic renderer first; add kinds by schema + hints + strings + fixtures only; fail the build if the renderer names a kind. Keep all synthetic-mode guardrails (banner, persona chip, no network, storage per D-27, production-bundle exclusion). Stop and ask on: any metrological value, role/permission change, new dependency, ADR gap, weakened contract, or any request to authenticate, persist beyond D-27, sign, import, export or publish operationally. Report per `docs/phase1/12 §8`, listing P1A-AC rows with test names, CI links, and what is not verified.

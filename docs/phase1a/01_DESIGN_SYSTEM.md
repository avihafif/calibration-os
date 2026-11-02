# 01 — CalOS enterprise design system (Phase 1A, v1.0)

| | |
|---|---|
| Status | **Final proposal for approval (D-13)**. Supersedes the *values* in [phase1/03 §4](../phase1/03_UX_ARCHITECTURE.md#4-design-tokens-proposal) where they differ (§9 lists every difference); principles, shells, IA, chip vocabulary and RTL rules in phase1/03 remain in force and are **not repeated** here. |
| Reference implementation | [`design/phase1a-prototype/css/app.css`](../../design/phase1a-prototype/css/app.css) (tokens and components) and the live **Design system** screen in the prototype. The CSS is a *visual reference*, not production code. |
| Verified | Every text/background pair below is checked by `design/phase1a-prototype/tests/prototype.test.js` (WCAG 2.x ratios ≥ 4.5:1 text, ≥ 3:1 control borders and focus ring) in light and dark. |
| Brand | No brand colour or logo is mandated; the accent is a single replaceable token (§3.3). Fonts are SIL OFL and **must be bundled** (air-gapped stations); licence confirmation is part of D-13. |

## 1. Character

Restrained, technical, dense where experts work, calm where technicians work. One accent colour; semantic colours reserved for meaning; no decorative gradients; borders (not heavy shadows) carry structure so dark mode stays crisp; cards are small panels with 12–14 px padding, not oversized tiles; data lives in tables and grids; **status is always icon + text + colour**.

## 2. Tokens

### 2.1 Colour (light | dark) — final

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F5F7FA` | `#0E131A` | Page |
| `--surface` | `#FFFFFF` | `#161C25` | Panels, tables, dialogs |
| `--surface-2` | `#EDF1F6` | `#1E2632` | Table headers, inset areas, hover |
| `--line` | `#D5DBE5` | `#2B3544` | Decorative dividers (not for control boundaries) |
| `--border` | `#7A899E` | `#6B7A90` | Control boundaries (≥ 3:1) |
| `--text` | `#121821` | `#E8ECF2` | Primary text |
| `--text-muted` | `#475467` | `#A3AFC2` | Secondary text (still ≥ 4.5:1) |
| `--primary` / `--primary-contrast` | `#1B4FD1` / `#FFFFFF` | `#8AB0FF` / `#0B1220` | Single accent; primary buttons, links, focus accents |
| `--ok` · `--ok-bg` | `#14693F` · `#E7F4EC` | `#5FD39A` · `#123324` | Within limits, success, verified |
| `--warn` · `--warn-bg` | `#8F4A00` · `#FBF0DC` | `#F2B35C` · `#3A2A10` | Input required, pending_review, warnings |
| `--error` · `--error-bg` | `#B42318` · `#FBE9E7` | `#FF8A7A` · `#3C1A17` | Errors, outside limits |
| `--info` · `--info-bg` | `#0A5F8C` · `#E4F1F8` | `#6CC4EE` · `#0F2B3A` | Information, selected |
| `--sim` · `--sim-bg` | `#6D28D9` · `#F0E9FC` | `#C4A8FF` · `#2A2142` | SIMULATION / synthetic *(non-themeable)* |
| `--deployment-test` | `#0A5F8C` | `#6CC4EE` | TEST badge *(non-themeable)* |
| `--deployment-prod` | `#8A1C1C` | `#FF8F8F` | PRODUCTION badge, solid fill + text *(non-themeable)* |
| `--hazard` | `#B93815` | `#FF9A6B` | H2+ ribbons *(non-themeable)* |
| `--focus` | `#0B57D0` | `#9DBDFF` | 2 px focus ring, 2 px offset *(non-themeable)* |
| `--on-fill` | `#FFFFFF` | `#0B1220` | Text on solid `--sim`, `--deployment-*`, `--error` fills |

Computed text contrast (selected, light | dark): text on surface 17.8 | 14.4; muted on surface 7.7 | 7.7; primary on surface 6.8 | 7.9; `--on-fill` on `--deployment-prod` 9.3 | 8.5; control border on surface 3.6 | 3.9. The test suite recomputes all pairs on every run.

### 2.2 Non-themeable indicators (safety rule)

`--sim`, `--sim-bg`, `--deployment-test`, `--deployment-prod`, `--hazard`, `--focus`, `--on-fill` and the components that use them (`FrameBadges`, simulation banner, hazard ribbons, limit-check chips, focus ring) **cannot be changed by a theme, tenant setting, UI configuration or authored content**. Implementation rules:

1. The `UiTheme` schema's token allow-list excludes them (07 §4.6); a theme referencing one is rejected at publish.
2. The renderer sets them from the authenticated deployment identity and run state, not from theme data.
3. Their CSS uses `!important` in the reference and the components are in the *protected set* (06 §3): unit tests fail if a prop or CSS variable override changes their computed colour or visibility.
4. Every route renders them; absence is a test failure (AC-UX-05, AC-UX-09, P1A-AC-05/07).

### 2.3 Theme contract (what an author may change)

Accent (`--primary`, with `--primary-contrast` derived), surface/background neutrals, type scale choice, radius, density default, logo. **Validation at publish:** every text/background pair recomputed (≥ 4.5:1), borders ≥ 3:1; a failing theme is rejected with the failing pair named. The prototype's Design-system → *Theme tester* demonstrates acceptance and rejection and shows that the fixed indicators do not change. (Theme *editor* is Phase 2, D-05; Phase 1 ships read-only light/dark system themes.)

### 2.4 Typography

| Role | Value |
|---|---|
| UI font stack | `Inter, "Segoe UI", Heebo, "Arial Hebrew", system-ui, Arial, sans-serif` (Inter Latin, Heebo Hebrew — bundled, SIL OFL, D-13) |
| Monospace | `"JetBrains Mono", Consolas, "Courier New", monospace` — wire text, keys, hashes, identifiers, expressions; always `dir="ltr"` |
| Numerals | `font-variant-numeric: tabular-nums` globally; Western digits in both locales |
| Scale (rem; root 16 px) | `xs .75` · `sm .8125` · `base .875` · `lg 1` · `xl 1.125` · `2xl 1.375` · `3xl 1.75`; comfortable density (station) uses `base 1` |
| Line height | 1.5 body, 1.25 headings, **1.6 for Hebrew** (`:lang(he)`) |
| Weights | 400 body, 550 controls, 650 headings and section labels, 700 badges |
| Section labels | `xs`, uppercase (Latin only; Hebrew has no case), 0.5 px tracking, muted |

### 2.5 Space, shape, elevation

| Token | Value |
|---|---|
| Spacing | 4 px base: 4 · 8 · 12 · 16 · 24 · 32 · 48 |
| Layout | Side navigation 224 px; main max 1360 px, 16–20 px gutters; editor = form column ≤ 820 px + readiness column 300 px; dashboard = work queue + 320 px side column |
| Grid | 12 columns, 8 px gutters inside panels; forms are single-column up to 820 px (one decision per row) |
| Radius | 4 px controls/chips, 8 px panels/dialogs, pill for chips/steps |
| Elevation | 0 default; panels use 1 px border + `0 1px 2px / 3px` shadow in light (none in dark); dialogs `0 12px 40px`; sticky drawer `0 -2px 8px` |
| Row height | table row 32 px (compact); touch/comfortable 44 px; control min-height 32 px (`sm` 26 px); touch targets ≥ 24 px everywhere, ≥ 44 px in comfortable |
| Z-order | content 0 · form tools 5 · drawer 10 · statusbar 15 · topbar 20 · palette/dialog 50 · toast 60 |
| Breakpoints | `sm` < 700 (cards instead of tables) · nav becomes drawer < 900 · single-column editor < 1100 · designers ≥ 1024 |

### 2.6 Motion
≤ 200 ms for functional transitions (nav drawer, toast fade); skeleton shimmer 1.4 s; all disabled under `prefers-reduced-motion`; no information carried by motion alone.

## 3. Components (final inventory used by Phase 1A)

Each has default / hover / focus / active / disabled-with-reason / read-only / loading / error states and works in LTR/RTL × light/dark. Implementation names align with phase1/06 §3. "Proto" = demonstrated in the prototype.

### 3.1 Frame and navigation
| Component | Specification | Proto |
|---|---|---|
| `ProtoBanner` / simulation banner | Full-width, non-dismissible, `--sim` fill; text "SYNTHETIC DESIGN PROTOTYPE / SIMULATED DATA — NOT A CALIBRATION" (localized). In the product the banner appears whenever the data or run is simulated | ✔ |
| `FrameBadges` | `◆ TEST` / `PRODUCTION` and `◈ SIMULATION ONLY`; fixed, from deployment identity | ✔ |
| `TopBar` | Brand, badges, search (Ctrl K), persona switcher *(prototype only)*, guide, language, theme, overflow menu; wraps on small screens | ✔ |
| `SideNav` | Role-filtered list, current page marked by `aria-current` + 3 px logical-start bar (mirrors in RTL); drawer < 900 px with focus return; footer explains "Production has no Builder" | ✔ |
| `StatusBar` | Prototype/environment text, findings counts, online/offline chip, version | ✔ |
| `Breadcrumb` | Kind list › item; version/status chips adjacent to the title | ✔ |
| `Tabs` | Link-based tablist (`role=tab`, `aria-selected`), horizontally scrollable on `sm`, 2 px accent underline | ✔ |
| `CommandPalette` | Ctrl/Cmd K; combobox + listbox, arrow/Enter/Esc; searches screens, items, personas, language/theme; focus returns on close | ✔ |
| `SkipLink` | First focusable element; moves focus to `main` | ✔ |

### 3.2 Data display
| Component | Specification | Proto |
|---|---|---|
| `DataGrid` | Sortable columns (`aria-sort`), filter box + row count live region, roving `tabindex` rows with ↑ ↓ Enter, 32 px rows, cell `data-label` so the table becomes a card list on `sm`; empty / filtered-empty / loading states; virtualisation required in product above the documented row count (budget from baseline) | ✔ |
| `StatTile` strip | Inline count + label, not a card wall; error/warn colouring with icon in the label | ✔ |
| `Panel` | Titled region (`h2`), 12–14 px padding, optional tabs in the header | ✔ |
| `KeyValue` (`dl`) | Two-column description list; wraps long values (`overflow-wrap:anywhere`) | ✔ |
| `DiffTable` | Field path (›-separated, LTR), change chip (+ / − / ≠), before/after; id-aware so moves are not delete+add; start-edge bar colour per change type (mirrors in RTL) | ✔ |
| `JsonViewer` | Read-only canonical JSON + digest header; keyboard-focusable; the only place raw JSON appears | ✔ |
| `Timeline/History` | Table of audit events with short chain hash; "Verify chain" action | ✔ |
| `Chart` | SVG bar (findings by stage) with `role=img`, text alternative listing every value, colour + position (not colour alone); no chart is the only carrier of data | ✔ |

### 3.3 Forms and technical measurement fields
| Component | Specification | Proto |
|---|---|---|
| `Field` | Label above control; required marked by text (`*` + title "required"), optional marked "(optional)"; help text linked by `aria-describedby`; messages region (`data-msgs`) per field; `aria-invalid` on errors | ✔ |
| `LocalizedTextField` | One row per locale (EN/HE tag, `lang`, `dir` set per row), "required by policy" chip, optional rows show "optional"; never concatenates strings | ✔ |
| `EnumSelect` | Native select with an explicit "— choose —" first option (**no pre-selection** for required choices); labels localized | ✔ |
| `ChipMultiSelect` | Checkbox chips in a `role=group`; disabled options explain why (title + `aria-describedby`), never hidden | ✔ |
| `ReferencePicker` | Select listing candidates with status chip; "Open" link; **"+ New" inline create** that returns to the same field; filters by sibling field (family by manufacturer) | ✔ |
| `StringList`, `RecordList` | Add/remove/move up/down, `details` per record with title summary, duplicate-id detection, "removed — use Undo" toast | ✔ |
| **`QuantityInput`** | Decimal text (`inputmode=decimal`, `dir=ltr`, mono) + unit select **restricted to the chosen quantity**; stored as `{value:"<decimal string>", unit}`; invalid text shows the decimal rule; disabled until the quantity is chosen with an explanatory hint | ✔ |
| **`IntervalInput`** | Lower/upper `QuantityInput` + **inclusivity radios with no default**; missing choice is finding `PR-015`; helper text states there is no default | ✔ |
| **`InputRequiredBadge` + marker row** | Dashed warn-tinted row: `⚠ Input required · MI-nn`, register title, actions *Enter values* / *Mark as input required*; replaced by values only through explicit user action | ✔ |
| `ProvenanceChip` | `synthetic demo · draft · verified · approved` with tooltip definitions; approved/verified are never user-settable in forms | ✔ |
| `DerivedField` | Read-only computed panel with a "derived" chip (e.g., computed requirements) | ✔ |
| `Stepper` (wizard) | Ordered list with `aria-current="step"`, done ✔ state, compact variant in dialogs; labels collapse to the current step on `sm` | ✔ |

### 3.4 Feedback and overlays
| Component | Specification | Proto |
|---|---|---|
| `ValidationDrawer` | Sticky bottom region, collapsible (`aria-expanded`, Ctrl J), counts in the header, findings grouped by pipeline stage, each row: severity chip + code + message (what/why/fix) + **Go to field**; live region polite | ✔ |
| `InlineFinding` | Under the field: icon + message + `[CODE]` (LTR); required-field errors appear after the user visits the field or attempts Validate/Submit (counts and drawer always show the truth) | ✔ |
| `Dialog` | `role=dialog`, `aria-modal`, labelled title, focus trap, Esc closes, backdrop click closes, focus returns, background `inert`; wide variant 760 px | ✔ |
| **`GovernedConfirmation`** | Used for submit, approve, request changes, discard, withdraw, publish: effect statement, **digest** (short + copy), reason (required where policy says), simulated step-up notice (in product: real step-up). Confirm button states the action ("Approve", not "OK") | ✔ |
| `Toast` | Polite live region, 4 s, errors use `role=alert`; never the only channel for safety information | ✔ |
| `ReasonButton` (disabled-with-reason) | `aria-disabled` + visible tooltip on hover/focus + `sr-only` reason; used wherever permissions or governance block an action | ✔ |
| `Banner/Note` | Info / warn / error / ok / simulation variants with border + tint + text; frozen, offline, read-only, approved, review-summary notes | ✔ |

### 3.5 Status vocabulary
Defined in phase1/03 §5; unchanged. Prototype adds: **Review summary** note (changes count · class · "Review changes"), **Initial version** change class, **fallback** chip for locale fallback text, **has draft** chip on a published item that has a newer draft.

## 4. State patterns (all designed and demonstrated)

| State | Pattern | Where |
|---|---|---|
| Loading | `Skeleton` rows with `aria-busy`, no layout shift | Design system → States |
| Empty | Title + one-sentence explanation + the single next action | Lists, versions, compare, history |
| Filtered-empty | "No matches" + *Clear filter* | `DataGrid` |
| Error | Plain-language title, stable **code** (LTR), *Retry* | Design system, not-found route |
| Read-only (frozen/lease/permission) | Banner stating the reason + 🔒 Read-only chip; fields disabled (not hidden) | In review, approved, second session, role without draft permission |
| Offline | Banner "edits are buffered…", save/submit/approve disabled **with reason**, buffered count in the saved indicator | Prototype controls → *Simulate offline* |
| Forbidden | Settings/role pages explain which role can use them | Settings, technician landing |
| Withdrawn/deprecated | Status chip + guidance; excluded from reference pickers | Reference pickers |
| Production | Builder routes absent; nav footer explains Release-only content | Navigation |

## 5. Charts and data visualisation rules
Use only where a table cannot show the pattern at a glance (e.g., findings by stage, activity timeline, later: reading-vs-limit). Rules: text alternative with all values; colour paired with position/label; series colours from the semantic tokens only (error/warn/ok/info); no 3-D, no gradients, no dual axes; time axes stay left-to-right in RTL; empty chart shows text, not an empty frame; tooltips never hold information not reachable by keyboard. A validated chart palette for later multi-series charts follows the `dataviz` guidance and is a Phase 2 deliverable.

## 6. Iconography
Outline glyph set from an approved list (the prototype uses text glyphs as placeholders). Directional glyphs (›, ↑ ↓ in lists are *not* mirrored; chevrons, back/forward, stepper arrows are) — rule in phase1/03 §4.4. Every glyph has a text equivalent; glyph-only buttons carry `aria-label` and `title`.

## 7. Content design
As phase1/03 §9 plus: buttons name the action and its object ("Submit for review…" with ellipsis when a confirmation follows); disabled controls always have a reason; error text states what/why/what-to-do; never "pass/fail" for limit checks; Hebrew strings use the unreviewed glossary only as a starting point (MI-31).

## 8. Localization and RTL implementation notes (additions found during prototyping)
* `lang` and `dir` are set on `<html>` **and** per localized input row (`lang`, `dir`), so Hebrew input is RTL while an English row on the same page stays LTR.
* Natural-language text in data cells (e.g., before/after in a diff) uses `<bdi dir="auto">`; identifiers, keys, hashes, versions, paths, codes and wire text use `<bdi dir="ltr">` + monospace.
* The nav "current page" bar, diff change bars, record-list disclosure triangles and stepper order are explicit RTL cases (`[dir=rtl]` rules) because they are not expressible with logical properties alone.
* Mobile nav drawer slides from the inline-start edge (right in Hebrew).
* Tab title, `lang`, and the live-region announcement on route change follow the active locale.

## 9. Differences from phase1/03 §4 (values)
| Item | phase1/03 | This document |
|---|---|---|
| Tint backgrounds `--ok-bg` … `--sim-bg` | not defined | defined, contrast-tested |
| `--line` (decorative) vs `--border` (control) | one `--border` | split (decorative dividers no longer need 3:1) |
| Type scale | named steps, base .875/1 | explicit rem values; Hebrew line-height 1.6; weights defined |
| `--on-fill` | implicit | explicit token (text on solid indicator fills) |
| Z-order, breakpoints for nav/editor collapse | not specified | specified (§2.5) |
| Row height | "compact 32 / comfortable 44" | unchanged |

## 10. Acceptance for the design system (implementation)
DS-01 token contrast test runs in CI for both themes (fails < AA) · DS-02 protected components reject overrides · DS-03 every component has stories/tests in LTR/RTL × light/dark × compact/comfortable · DS-04 axe clean on the component catalogue · DS-05 `QuantityInput` property test (no float round-trip) · DS-06 no component imports a kind name · DS-07 pseudo-locale (`en-XA`, `he-XB`) shows no clipping on `sm`…`xl` (maps to P1A-AC-05…09, P1A-AC-13/14).

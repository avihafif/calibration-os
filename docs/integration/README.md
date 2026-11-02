# Design integration and release readiness

Status: design documentation. Nothing here is approved or implemented.

| File | Purpose |
|---|---|
| [01_UNIFIED_DESIGN_HANDOFF.md](01_UNIFIED_DESIGN_HANDOFF.md) | How the two prototypes map to the React/TypeScript architecture (design system, ownership, bindings, ports, i18n/a11y, acceptance, open decisions) |
| [02_UX_DESIGN_REVIEW_SUMMARY.md](02_UX_DESIGN_REVIEW_SUMMARY.md) | Final UX/design review: consistency findings and fixes, actual check results, limits |
| [03_GATE_A0_APPROVAL_MATRIX.md](03_GATE_A0_APPROVAL_MATRIX.md) | Every pending decision by category with a recommendation (all **Open**) |
| [04_WP-1A-1_START_RECOMMENDATION.md](04_WP-1A-1_START_RECOMMENDATION.md) | Minimum approved scope to start WP-1A-1 |

Automation (design-only, non-product): `.github/workflows/design-prototype.yml` runs `design/phase1a-prototype/tests`, `design/procedure-designer-prototype/tests`, `design/tools/check_prototype_consistency.js` and `design/tools/check_decision_ids.py`.

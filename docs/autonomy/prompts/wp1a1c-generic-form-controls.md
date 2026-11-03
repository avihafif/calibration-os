# Codex task — CalOS scoped WP-1A-1c generic form controls

Start from the current checked-out and approved staging baseline. Read AGENTS.md; accepted ADR-0001 A1–A4, ADR-0015 B1–B6 and ADR-0026; docs/phase1a/01_DESIGN_SYSTEM.md; docs/phase1/13_PHASE1A_PLAN.md; docs/autonomy/README.md. Preserve the existing non-operational status, existing @calos/ui-kit and en/he RTL support.

Implement a **small, reusable, accessible set of form-control primitives** inside packages/ts/ui-kit: Field label/help/error association, bounded TextField, NumberTextField that keeps exact decimal strings without number-coercion, localized select/control semantics, empty/disabled/read-only/required/invalid states, and accessible focus behavior. Extend the frontend demo only as necessary to show these primitives on synthetic UI-only data, not to implement metadata editing or persistence.

Provide cross-locale en/he and light/dark tests; cover keyboard use and aria-describedby error feedback, 320/768/desktop reflow, and invalid/unit technical-text handling. Never invent calibration measurements, specification numbers, safety limits, standards, instrument models or procedures. All data is illustrative non-metrological UI placeholder text.

**Strict limitations:** No generic No-Code Builder, schema-driven widget vocabulary, authored object changes or publish/review capabilities (H-2/GA0-16 remains unresolved). No network/API calls, browser storage, credentials, real instruments, metrology computation, releases, Electron, station service, OS packaging or Production operations. No new third-party direct dependencies, no font files, no copying/importing prototype code. Keep already-approved design tokens and protected TEST/SIMULATION badges visibly enforced. Do not alter workflows, scripts, governance files, ADRs or any path outside the trusted task allowlist. Code locally, test thoroughly, and emit a change patch; do not push, merge or approve PRs yourself.

If a required operation needs an unapproved dependency, alters root configuration or safety controls, STOP and identify the exact blocker without expanding scope.

# ADR-0001: Modular monorepo with enforced boundaries

Status: Proposed · Deciders: Architecture (named owner required) · Amendments A1–A5 proposed 2026-11-02 for decision GA0-09 — **not accepted**

## Context
Many deployables (API, agent, web), shared domain logic (expressions, metadata, engine), generated contracts (JSON Schema → Python/TS), and a no-code mandate that makes schemas and the runtime the product core. Drift between packages, or the runtime depending on app concerns, would break determinism and testability.

## Decision
Single monorepo, `uv` workspace (Python) + `pnpm` workspace (TS). Layout and dependency rules in ARCHITECTURE §6. Boundaries are **machine-enforced** (import-linter, eslint-plugin-boundaries), not conventions. `schemas/` is the single source of truth for config kinds and generates Pydantic models and TS types. Apps are composition roots and never import each other. Runtime packages contain no instrument- or customer-specific strings.

## Options considered
1. Polyrepo — independent versioning is natural, but cross-cutting schema/runtime changes become multi-repo choreography. Rejected for v1.
2. Monorepo without enforcement — fast, but erodes. Rejected.
3. **Monorepo with enforcement** — chosen.

## Consequences
+ Atomic cross-package changes; one CI; shared codegen.
+ Plugins/SDK versioned independently by *artifact* version although they live in one repo.
− CI cost grows; needs affected-only builds (Nx/Turborepo-style or `uv`/`pnpm` filters).
− Third-party Class B authors need the SDK published separately (SDK is released as its own package from the monorepo).

## Revisit triggers
CI time > agreed budget; external teams need independent release cadence for core packages.

## Proposed amendments (2026-11-02, decision GA0-09 — pending the architecture owner)
The original Decision above is unchanged. If the owner accepts this ADR **with** amendments, the text below becomes part of the Decision; if the owner accepts it as originally written, it is discarded. Review and evidence: `docs/gate-a0/03_ADR_REVIEWS.md`, `docs/gate-a0/08_ARCHITECTURE_DECISION_PROPOSALS.md`. Accepting the amendments also requires the follow-up edits listed there (ARCHITECTURE §6/§6.1, `docs/phase1a/07 §2.3(5)`, `docs/integration/01 §3`) — they are **not** made by this proposal.

- **A1 — TypeScript dependency table (enforced).** Allowed imports: `i18n` and `domain-types` import no repository package; `expr-presentation` → `domain-types`; `ui-kit` → `i18n`; `editor-core` → `domain-types`, `expr-presentation` (framework-neutral: **no React, no `ui-kit`**); `designers` → `editor-core`, `ui-kit`, `i18n`, `domain-types`, `expr-presentation`; `ui-runtime` → `ui-kit`, `i18n`, `domain-types`, `expr-presentation`; `apps/web` → any package. No package imports `apps/web`; only `apps/web` composition code (and the generated client's own tests) may import `api-client`; runtime/editor/designer packages use injected host ports. Each element is declared in `eslint-plugin-boundaries` and each forbidden edge has a negative probe in `tools/check_ts_boundary.mjs`; adding a package without declaring its element fails CI. This extends, and does not weaken, the existing rules.
- **A2 — Schema-driven inspector placement.** The framework-neutral inspector **model** (hint interpretation, validation binding, field tree) lives in `editor-core`; the **React rendering** of that model lives in `designers` (primitives in `ui-kit`). This keeps `editor-core` free of React and `ui-kit`.
- **A3 — `designers` granularity.** `designers` is one workspace package with internal folders (`inspector`, `procedure`, `driver`, `metrology`, `safety`, `sim-lab`, …) until a second consumer justifies splitting; boundary rules use path patterns inside it.
- **A4 — Non-shipping design assets.** `design/` (prototypes and design-only checks) is outside the production layout: **nothing under `design/` may be imported by production packages**; its CI (`.github/workflows/design-prototype.yml`) is separate from application CI and its checks are not product tests.
- **A5 — CI budget and registry-driven generation.** The owner states a CI time budget so the "CI time > agreed budget" revisit trigger is testable; `tools/codegen.py` enumerates `catalog/kinds.json` instead of a fixed list when the first Phase 1A kind lands (WP-1A-2).


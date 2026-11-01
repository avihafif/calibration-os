# ADR-0001: Modular monorepo with enforced boundaries

Status: Proposed · Deciders: Architecture

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

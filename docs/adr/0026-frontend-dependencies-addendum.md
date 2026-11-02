# ADR-0026: Frontend dependency addendum to ADR-0022 (Phase 1A foundation)

Status: **Accepted** · Date: 2026-11-02 · Deciders: Avi Hafif (Architecture owner and Security reviewer; Legal approver for MPL-2.0 — designated 2026-11-02; recorded by delegation, see `docs/gate-a0/13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md`) · Amends (additively): ADR-0022

> The MPL-2.0 acceptance is a technical reading by a non-lawyer. A dependency is added only by a reviewed PR at the exact version below, with the evidence re-run at that time; fonts are not covered. Any other package or version needs a new decision.

## Context
`AGENTS.md §12` accepts the baseline stack and ADR-0022 extensions E1–E6 but forbids other infrastructure or dependencies without a new ADR; `AGENTS.md §8` requires human approval for new dependencies and for non-permissive licences. Phase 1A WP-1A-1 (frontend foundation) needs an ICU message library, routing and a test/accessibility toolchain to meet P1A-AC-05…14. Evidence (exact versions, licences, vulnerability results, CSP analysis, SBOM) is in `docs/gate-a0/04_DEPENDENCY_AND_FONT_EVIDENCE.md` and `docs/gate-a0/09_D12_DEPENDENCY_APPROVAL_MATRIX.md`, verified 2026-11-02 with the repository's pinned package manager (`pnpm@11.25.0`).

## Decision
1. **Approved set** (exact versions, no ranges):

   | Class | Package | Version | Licence |
   |---|---|---|---|
   | Runtime | `react-intl` | 12.1.5 | BSD-3-Clause |
   | Runtime | `react-router` | 8.5.0 | MIT |
   | Dev/test | `vitest` | 5.0.5 | MIT |
   | Dev/test | `jsdom` | 30.1.3 | MIT |
   | Dev/test | `@testing-library/react` | 16.3.3 | MIT |
   | Dev/test | `@testing-library/dom` | 10.4.2 | MIT |
   | Dev/test | `@testing-library/user-event` | 14.6.8 | MIT |
   | Dev/test | `@playwright/test` | 1.64.1 | Apache-2.0 |
   | Dev/test | `axe-core` | 4.14.0 | **MPL-2.0** |
   | Dev/test | `@axe-core/playwright` | 4.14.0 | **MPL-2.0** |

   Transitive dependencies are those in the committed lockfile (109 components at proposal time; 0 OSV advisories; `pnpm audit` clean).
2. **Deferred, not approved:** `@tanstack/react-query`, `fast-check`. **Not proposed:** Storybook-class tools, `@vitejs/plugin-react`, `eslint-plugin-jsx-a11y`, Stylelint, UI/form/virtualisation/canvas libraries, and all fonts (font bundling needs separate legal sign-off, GA0-06b).
3. **MPL-2.0 acceptance:** `axe-core` and `@axe-core/playwright` are used **unmodified, as development-time tools only**, are excluded from release artefacts, and are listed in the dev SBOM. MPL-2.0 is already present transitively (`lightningcss` via Vite).
4. **Usage constraints:** `react-router` is used in library mode only; `ScrollRestoration`, data routers with loaders/actions, `<Form>`, `useFetcher` and any API that uses browser storage or network are forbidden by lint (consistent with D-27 option A and the CSP). No dependency may add runtime network calls, `eval`/`new Function`, browser storage or telemetry.
5. **Supply-chain policy:** exact pins; releases at least 14 days old when proposed; committed `pnpm-lock.yaml` with integrity hashes; lifecycle scripts disabled except an explicitly allow-listed, pinned Playwright browser download in CI; `engines.node >= 22.22.2` (`.nvmrc`); CI gates for `pnpm audit` and an OSV check; CycloneDX SBOM produced with `pnpm sbom --sbom-format cyclonedx`; upgrades only by pull request with the same evidence; every addition appended to this ADR's table (or a successor ADR).
6. **Vite floor:** raise the declared range from `^8.3.0` to `^8.3.5` (versions 8.3.0–8.3.2 carry six published advisories; the lockfile already pins 8.3.5).

## Options considered
- **Approve nothing; in-house router/i18n/test tooling.** Rejected for i18n (CLDR plural rules for Hebrew are non-trivial) and for accessibility testing (no credible in-house substitute for P1A-AC-10); acceptable for routing — see the deferral option below.
- **Smaller set.** (Not chosen.) Defer `react-router` (in-house hash router) and `@testing-library/*` to later PRs. Viable; the approvers may approve rows individually.
- **Broader set** (Storybook, query cache, property-testing, UI kits). Rejected for WP-1A-1: weight, review cost, not needed for the first milestone.

## Consequences (positive / negative / risks)
+ A reviewed, minimal toolchain with evidence; the first React milestone can proceed without ad hoc additions.
− New third-party code in CI and in the web bundle (`react-intl` and `react-router` closures); two MPL-2.0 dev tools; Playwright downloads browser binaries in CI.
Risks: new vulnerabilities after the evidence date (mitigated by the CI gates); `react-router` features that touch storage/network (mitigated by lint and CSP); Node floor raises CI image requirements.

## Revisit triggers
Any new dependency, version bump of a runtime package, a new advisory affecting a listed package, a licence change, a request to bundle fonts, user-authored content rendering, or a change of the package manager.

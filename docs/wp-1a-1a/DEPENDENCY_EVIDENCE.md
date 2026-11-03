# WP-1A-1a transitive dependency remediation

This record applies only to [PR #11](https://github.com/avihafif/calibration-os/pull/11)
and the Test/simulation frontend toolchain. It does not amend Accepted
ADR-0026 or authorize other dependencies, versions, operational trust or
Production deployment.

## Decision and scope

On 2026-11-03, the Product Owner approved a narrow override of the
development-only transitive `minimatch@10.2.6` to `11.0.1` for
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249).
They separately approved one-time exceptions to ADR-0026's 14-day publication
age rule for **only** `minimatch@11.0.1` (published 2026-10-27) and its newly
required `@isaacs/nonrecursive-glob-match@1.0.3` (published 2026-10-28).
The approvals are in the implementation conversation; PR #11 requires
independent review before merge. No accepted ADR text was changed.

The override is pinned in `pnpm-workspace.yaml`; `pnpm-lock.yaml` records both
integrity hashes. The CycloneDX SBOM marks both packages `excluded` from the
web runtime and lists their BlueOak-1.0.0 licences. The supply-chain gate
checks both exact versions and development-only scope. The major-version jump
can affect ESLint consumers; the complete lint and boundary probes exercise
those integrations, but do not prove every upstream API use.

## Executed evidence (2026-11-03, Windows worktree)

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | Pass |
| `pnpm why minimatch -r` | One installed version: `11.0.1` |
| `pnpm audit` | No known vulnerabilities |
| `pnpm sbom --sbom-format cyclonedx > frontend-sbom.json` | CycloneDX 1.7, 228 components |
| `node tools/check_frontend_supply_chain.mjs frontend-sbom.json` | Licences reviewed; zero OSV advisories; exact exception versions and development-only scope verified |
| `pnpm lint:ts`; `pnpm test:ts-boundary` | Pass; 60 negative boundary and UI-string probes |
| `pnpm test:frontend`; `pnpm test:e2e` | 17 unit tests and one bilingual browser test pass |

The generated SBOM is an ignored development artifact and is uploaded by CI.
The GitHub Actions run linked from PR #11 provides the independent Linux
installation, audit, OSV, browser and Compose evidence after this change is
pushed.

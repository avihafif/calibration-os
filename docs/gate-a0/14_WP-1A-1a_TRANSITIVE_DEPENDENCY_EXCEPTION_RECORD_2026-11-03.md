# 14 — WP-1A-1a transitive dependency exception: decision record

| | |
|---|---|
| Decision date | 2026-11-03 |
| Accountable holder | **Avi Hafif** ([@avihafif](https://github.com/avihafif)) — product owner, designated Architecture owner and Security reviewer ([11](11_ROLE_DESIGNATION_RECORD.md)) |
| Record type | **User-authorized, assistant-entered.** After the independent agent review of [PR #11](https://github.com/avihafif/calibration-os/pull/11) (finding F-01, with a draft of this record: [review comment](https://github.com/avihafif/calibration-os/pull/11#issuecomment-6596854437)), the owner wrote in the active conversation, in Hebrew, *"מאשר לך לרשום את ההחלטה"* ("I authorize you to record the decision"). This file and its Git/PR history are the audit trail. It is **not** a handwritten or cryptographic signature and **not** an independent review; the concentration of roles in one person is noted in [11](11_ROLE_DESIGNATION_RECORD.md). |
| Relation to PR #11 | `docs/wp-1a-1a/DEPENDENCY_EVIDENCE.md` in PR #11 says the approvals are "in the implementation conversation". The assistant could not verify that earlier approval. This record stands on its own authority (the instruction above) and gives the exception an in-repository, attributable source. It does not edit PR #11 or any Codex-owned file. |

## Decision
1. **Override** the development-only transitive `minimatch@10.2.6` to `minimatch@11.0.1` for [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). The advisory is fixed only from 11.0.1 (no 10.x backport); the override crosses the dependents' declared `^10` ranges.
2. **One-time waiver** of ADR-0026 §5 (releases at least 14 days old) for exactly `minimatch@11.0.1` (published 2026-10-27, 7 days old on this date) and `@isaacs/nonrecursive-glob-match@1.0.3` (published 2026-10-28, 6 days old).
3. **Scope:** only those two packages at those versions. `tools/check_frontend_supply_chain.mjs` enforces the exact versions and development-only (`excluded`) scope in the CycloneDX SBOM; it must keep doing so.
4. **Removal trigger:** remove the override when the dependents (ESLint and its plugins) accept `minimatch ^11`, re-running lint, the boundary probes, `pnpm audit` and the supply-chain check.
5. **No other effect:** no other dependency, version, ADR text (ADR-0026 stays as accepted), runtime bundle content or deployment is changed. Any other age waiver or version needs a new decision.

## Evidence the decision rests on
Independent review of PR #11 at head `5975aacb796e986e2467d753d4b192286aef9262`: locked install, `pnpm audit` clean, 228-component CycloneDX SBOM with 0 OSV advisories and both exception components `excluded`, and lint plus 60 boundary probes passing with the override (OSV also clean for 11.0.1–11.0.4). Residual risk, accepted: dev-tool incompatibility from the major-version jump that lint and the probes do not fully exercise.

## What this record does **not** do
It does not approve or merge PR #11, change `package.json` or any lockfile, replace the required human GitHub approval of PR #11, or open any gate. The other review findings (F-02…F-16) remain open as listed in the review comment.

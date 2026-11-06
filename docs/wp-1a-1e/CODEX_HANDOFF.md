# WP-1A-1e — handoff prompt for Codex

Use only after the owner has assigned the package (H-1 in [`HUMAN_APPROVALS.md`](HUMAN_APPROVALS.md)). Paste the block below. Replace `<A|B>` with the PR being built. Autonomous scheduling stays disabled; this prompt is a manual assignment.

```text
You are implementing WP-1A-1e-<A|B> for the CalOS repository (avihafif/calibration-os), manually assigned by the product owner.

Read first, in order: AGENTS.md; docs/NO_CODE_ARCHITECTURE.md; ADR-0001 (A1-A4), ADR-0015, ADR-0024, ADR-0026; docs/review/lead-architect-2026-11-03/02_FRONTEND_ACCEPTANCE_CRITERIA.md sections 5-7 (RU, RT, OF); docs/wp-1a-1e/SPECIFICATION.md, TASKS_AND_TESTS.md and HUMAN_APPROVALS.md (all of it); docs/wp-1a-1d/READ_ONLY_VIEWS.md; docs/wp-1a-1b/UI_KIT.md.

Preconditions (stop and report if any is false): WP-1A-1d (PR #25) is merged to main; you branch from current main; the owner's answers to the decisions in HUMAN_APPROVALS.md section 2 are in the assignment (otherwise use the recommended defaults and say so in the PR); the independent reviewer is named.

Build exactly the tasks for your PR from TASKS_AND_TESTS.md section 1 (A: T0-T6a, T9a; B: T6b, T7-T10), meeting every Must criterion (RO, KB, HS, CS, WE, FS, PS, SR, AB) in SPECIFICATION.md section 4 that those tasks cover. Start with T0 and record the baseline measurements before changing code.

Allowed paths: packages/ts/ui-kit/src/**, packages/ts/i18n/src/**, apps/web/src/**, apps/web/index.html (only the stylesheet href), apps/web/vite.config.mjs (only base), tests/frontend/**, playwright.edge.config.ts, root package.json (scripts only), eslint.config.mjs and tools/check_ts_boundary.mjs (additive probes only), tools/check_frontend_bundle.mjs (only after H-4), docs/wp-1a-1e/**, docs/wp-1a-1b/UI_KIT.md, docs/NO_CODE_CAPABILITY_MATRIX.md.

Forbidden: schemas/**, catalog/**, packages/py/**, apps/api/**, apps/station-agent/**, deploy/**, docs/adr/**, governance and Gate A0 documents, docs/autonomy/**, pnpm-lock.yaml and dependency fields in package.json (unless decision D-E1 chose react-router and the owner approved it), fonts, any @calos/domain-types export, any Finding or HostStatus schema or codegen, ProtectedFrame.tsx, the protected-marking CSS rules and their !important declarations, apps/web/public/status.css, and the <aside id="static-markings"> block. Do NOT edit .github/workflows/** until the owner approves the exact diff in HUMAN_APPROVALS.md section 3 in the PR thread (H-3, H-5); only then add that one job and nothing else.

Hard rules: no fetch, XMLHttpRequest, WebSocket, navigator.onLine, history.pushState, Date.now, zero-argument new Date(), timers or polling for status; no browser storage; no service worker; no URL state other than #/<route-id>; HostStatus carries exactly the OF-05 fields plus wall_utc and time_zone_label; unknown is shown as unknown, never OK; a host environment_kind that differs from the build is an error and never changes a protected marking; Hebrew strings stay needs_review; no new TODO without an issue; @req tags on code and tests; do not weaken any lint rule, boundary contract, bundle gate or test, and do not skip or retry a failing test.

Stop and report instead of proceeding if any stop condition in SPECIFICATION.md section 7 occurs, including: a dependency or lockfile change seems necessary; F6 reaches the browser instead of the page; a marking or status.css change seems necessary; Edge cannot be used without downloading a browser; a baseline figure no longer matches.

Evidence required in the PR (CI green is not enough): docs/wp-1a-1e/EVIDENCE.md with the criterion-to-test table, baseline and final numbers, commands with counts, Chrome and Edge versions, screenshots (each route en/he x light/dark x 320/768/1440; each host-status state en/he; forced colors; scaling matrix), the CSP run showing 0 violations and the negative controls firing, and an honest list of what is NOT verified (real screen readers, real High Contrast themes, real display scaling, browser F6 precedence, Station Agent CSP header). Run the full gate list in TASKS_AND_TESTS.md T10 and state counts. Do not merge, approve, or mark Hebrew reviewed. Open the PR, state which decisions you assumed, and stop; an independent reviewer and a human GitHub approval follow.
```

## Notes for the owner

The prompt deliberately repeats the forbidden paths and stop conditions. If you choose the single-PR option (D-E2) replace "<A|B>" with "A+B" and keep H-3, H-4 and H-5 as gates on the corresponding commits rather than on the whole PR.

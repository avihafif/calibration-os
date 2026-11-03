# WP-1A-1b frontend hardening review

This PR is limited to the simulation frontend. It adds no local API, station
agent, synchronization, persistence, operational calibration, approval or
publishing. The static React bundle can be hosted locally; future desktop
services must be reached through approved injected host ports.

| PR #11 finding | Resolution in this PR | Evidence |
|---|---|---|
| F-02 | Reject bidi controls, C0/C1 controls and lone surrogates; bound technical text and decimal input. | `packages/ts/i18n/src/index.test.ts` negative cases |
| F-03 | Content error boundary is inside a protected frame. Static HTML fallback returns if the React frame is absent. | React failure unit test; no-JS browser test |
| F-04 | Test/Production Rehearsal and Simulation labels are non-dismissible, sticky, in the build-time HTML title and static fallback. Unknown build environment fails. | Browser scroll, title and disabled-JavaScript checks; dual artifact build checks |
| F-05 | **Open before any external deployment.** No enforced CSP headers exist. Vite preview and Compose rehearsal are non-operational. | No CSP claim is made by the bundle check |
| F-06 | Demo fixture import and Docker copy removed; bundle gate rejects fixture markers. | Test and Production Rehearsal artifact checks |
| F-07 | Closed direct dependency versions, per-package external import allow-list, source-root restrictions, dynamic import/asset/DOM/storage restrictions and stronger UI-string lint. | 76 negative probes; CycloneDX, licence and OSV gate |
| F-08 | Pseudo-locales expand platform prose at least 40%; Test-only browser selector exercises both directions at 320/768/1440 px. | Unit and Playwright tests |
| F-09 | System fonts remain; the stacked UI Kit/AppFrame PR migrates the real shell to approved semantic tokens and checks both themes. | Token contrast gate, computed browser colors, no font assets in the bundle |

The [merged PR #12 record](../gate-a0/14_WP-1A-1a_TRANSITIVE_DEPENDENCY_EXCEPTION_RECORD_2026-11-03.md)
is the authority for the exact transitive dependency exception. No new
dependency outside accepted ADR-0026 pins was introduced. Adding TypeScript
to the workspace root at its already accepted exact version makes the root
browser-type command reproducible on a fresh install.

Limitations: static HTML fallback is English-only when JavaScript is disabled;
the desktop host and offline distribution are future approved work. The
non-operational Production Rehearsal build is not an operational Production
deployment. Any external deployment requires CSP response headers and a
browser enforcement test, plus the still-closed architecture and security
gates.

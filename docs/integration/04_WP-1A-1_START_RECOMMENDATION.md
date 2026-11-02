# 04 — Recommendation: starting WP-1A-1 (Frontend foundation)

Status: **recommendation to the product owner; not an approval.** Nothing here authorises implementation.

## What WP-1A-1 is (phase1/13 §4)
`packages/ts/i18n`, `packages/ts/ui-kit` (tokens, `FrameBadges`, `AppFrame`, primitives, inputs, `DataGrid`, `TreeView`, `DiffViewer`, `ValidationDrawer`, dialogs, `CommandPalette`), `apps/web` routing + query cache + shells, hard-coded-string lint, axe + Playwright + visual harness in CI; Phase 0A strings moved to i18n keys. Acceptance P1A-AC-05…14.

## Minimum approved scope to start (all must be recorded by named owners)
| # | Item | Why it is needed for WP-1A-1 |
|---|---|---|
| 1 | **A0-1** PR #1 disposition (merged, or written agreement to branch from its head) | the base the work is cut from |
| 2 | **D-23** UI-first on a labelled Synthetic Host | defines what the foundation is for |
| 3 | **ADR-0001** and **ADR-0015** ratified (or revised) | package boundaries; i18n/RTL structure |
| 4 | **D-12** dependency list for the S0/1A frontend (router, query cache, ICU, test tooling; component catalogue only if approved) with licence/CVE review | new dependencies need approval (AGENTS §8, ADR-0022) |
| 5 | **D-13** palette and fonts, with font licence confirmation | tokens and bundled fonts |
| 6 | **A0-5** acknowledgement of he/en string ownership (`needs_review` stays) | strings move to i18n keys |

## Not required to start WP-1A-1
D-11, D-18, D-21 (schema/lease details — WP-1A-2/4); D-27–D-29 (persistence, publish simulation, kind scope — WP-1A-3…5; WP-1A-1 stores nothing); D-32 (adopt the visual baseline) is **strongly recommended first** because it decides what `ui-kit` reproduces; R-4/R-7 (backend contracts; WP-1A-0/2/3); every PD-DEC and the Procedure Designer/Simulation Lab (not in Phase 1A scope).

## Recommended sequencing
1. Owner records items 1–6 (plus D-32). Codex's note on PR #4 already asks the owner to classify WP-1A-0 as an A0 prerequisite or amend the gate; decide that too.
2. WP-1A-1 and WP-1A-2 may run in parallel (phase1/13 §4); WP-1A-1 touches only frontend packages and `apps/web`.
3. Slice WP-1A-1 into reviewable PRs: tokens + i18n + lint → primitives + `FrameBadges`/`AppFrame` → inputs/data components → shells + routing → CI harness (axe, Playwright, visual).

## Guardrails for the implementer
No prototype code copied; every component has en/he, RTL, light/dark, keyboard and axe tests; protected tokens (safety/hazard/simulation/deployment/focus) not themeable; no storage, network or secrets; no `innerHTML`/`eval`; no weakening of import-linter or eslint boundaries; `FrameBadges` and the non-operational banner cannot be removed or restyled; include Designer-needed primitives (`TreeView`, `ValidationDrawer`, `DiffViewer`, `CommandPalette`) because the Builder already needs them — **do not** build workflow canvas, envelope diagram, Simulation Lab or driver editors in this package.

## Risks if started too early
Boundary rework (ADR-0001), unlicensed fonts/dependencies in the repo, hard-coded strings that later need rewriting, and a foundation shaped by Proposed ADRs.

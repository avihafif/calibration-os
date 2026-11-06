# Release sequencing, PR #28 re-review protocol and WP-1A-1e-A2

| | |
|---|---|
| Status | **Proposal, documentation only.** It is not an ADR, grants no approval, authorises no code, workflow, dependency or governance change, and starts nothing. Each package below is assigned only by the owner (H-1 style, manually). |
| Date | 2026-11-06, on `main` at `cb9e8fa` (PR #27 and PR #29 merged). PR #28 is open at `f018993`; its review lists corrections C-1 to C-4 that are not yet applied. |
| Written by | The same agent family that wrote the specification and reviewed PRs #26 to #29; a human or different reviewer should weigh it (H-7). |

## 1. Sequence

Code branches are strictly **one at a time**: each is cut from the `main` that already contains the previous one, so no two open code branches ever touch the same file. Docs-only pull requests may run beside a code branch only if they touch none of its files.

| Step | Package | Starts when | Needs from the owner | Done when |
|---|---|---|---|---|
| 0 | This documentation PR | now | merge | on `main` |
| 1 | **PR #28** corrected (C-1 to C-4, `EVIDENCE.md` edits section) | Codex is told to update the existing branch | the assignment is already in force; decide P28-05 (see §5) | fresh independent review of the exact final commit says GO; owner approves and merges |
| 2 | **`WP-1A-1d-N1`** (Unicode remediation) | step 1 merged | N-D1 to N-D7 recorded; N-D4 assignment and a named reviewer who is not the authoring agent | independent review GO; owner merges |
| 3 | **`WP-1A-1e-A2`** (§6) | step 2 merged | H-4a only if the gate sentinel is wanted in this package; decisions D-A2-1 to D-A2-3 (§5) | independent review GO; owner merges |
| 4 | **`WP-1A-1e-B`** (CSP harness, Windows/Edge, forced colors, scaling) | step 3 merged | H-3 exact diff (with the Errata 1 hardening and D-E9), H-5, D-E8, H-6, and the favicon decision (P28-13) | independent review GO; owner merges |

Why this order. Step 2 before step 3 because A2 displays host identifiers through the technical-text policy that N1 introduces, and N1 is small, ui-kit and i18n only, and needs no human gate beyond N-D4. Step 3 before step 4 because B adds a workflow job and tests that sit on top of the final shell. Step 1 first because it is built and carries the three must-fix items.

Not parallelisable (shared files, see §3): any two of steps 1 to 4. Safe to do at the same time: owner decisions; the manual checks listed in `TASKS_AND_TESTS.md` §5; this kind of docs-only PR.

## 2. What is still outside every step

Real host adapter, `fetch`, storage, schemas, a HostStatus contract, `react-router`, Builder, authentication, instruments, Production, signing. Any of them needs its own specification, review and approval. Confusables and NFC/NFD handling are a separate item (N-1 proposal, out of scope).

## 3. File-ownership matrix (why the branches do not overlap)

| File or area | PR #28 | N1 | A2 | B |
|---|---|---|---|---|
| `ui-kit/src/AppFrame.tsx`, `frame.css`, `PageHeader.tsx` | owns | — | `frame.css` only for host layout (after #28) | — |
| `ui-kit/src/data-views.tsx`, `.css`, `data-views.test.tsx` | — | owns | — | — |
| `i18n/src/format.ts`, new `technical-text.ts` | — | owns | reads only | — |
| `i18n/src/messages.ts` | owns (existing keys) | **no new strings** | adds keys | maybe |
| `i18n/src/index.ts` (exports) | one line (search) | one line (classifier) | — | — |
| `ui-kit/src/HostStatusView.tsx`, `host-status.ts`, new `ActionWithReason` | owns | — | owns | — |
| `apps/web/src/App.tsx`, `host/**`, `SyntheticHostStatusDemo.tsx` | owns | — | owns | — |
| `apps/web/src/SyntheticDataViewsDemo.tsx` | — | synthetic rows only | — | — |
| `tests/frontend/**` | routing, host | `data-views.e2e` (additive) | host, routing (additive) | CSP, edge, forced-colors |
| `tools/check_ts_boundary.mjs` (additive probes) | yes | yes | yes | — |
| `tools/check_frontend_bundle.mjs` | no (H-4) | no | only after H-4a | maybe |
| `package.json` (`check:browser-types` list) | yes | — | yes | `test:e2e:edge` |
| `.github/workflows/**` | no | no | no | only after H-3, H-5 |
| `docs/NO_CODE_CAPABILITY_MATRIX.md` | yes | yes | yes | yes |

The last four rows of shared files are textual, one-line, additive edits; serial branches make them conflict-free. Matrix rows are never rewritten, only appended to.

## 4. Re-review protocol for the corrected PR #28 (exact final commit)

I perform this when Codex updates the branch, on a clean checkout of the exact head SHA, in a worktree outside the repository, and report the SHA I reviewed. Nothing is edited on Codex's branch.

1. **Scope.** `git diff --name-only f018993..<head>`: only allowed paths; no `.github`, `package.json` dependency field, lockfile, `index.html`, `status.css`, `ProtectedFrame.tsx`, schema, ADR. CI for the exact SHA.
2. **C-1.** `AppFrame.tsx` accepts `event.key.toLowerCase() === "k"` **or** `event.code === "KeyK"`; the final assertion of "Hebrew physical KeyK shortcut" is `toBeVisible()` again; unit tests for `key:"k", code:"KeyV"` and `key:"ל", code:"KeyK"`; I run the original-strength test myself.
3. **C-2.** The host sentinel is a runtime string literal; I build Test and Rehearsal and grep: present in Test, absent in Rehearsal; the demo code (`createFakeHostStatusPort`, `SYNTHETIC-UI`) absent in Rehearsal; the `EVIDENCE.md` row is corrected.
4. **C-3.** `EVIDENCE.md` has an "Edits to existing tests" section; I diff every existing test file against `main` and check that each hunk is listed; the 5-second poll is gone or bounded (≤ 1 s) with the measured flake rate; I run the focus-versus-marking test 10 times on the corrected head and report the pass count.
5. **C-4 (if applied).** Edit the hash to `#/`, `#`, empty after load: URL becomes `#/overview`; Ctrl+K then Back: focus is on the `h1`; drawer case unchanged.
6. **Pseudo-locale responsiveness.** Top-bar height at 320×568 in `en`, `he`, `en-XA`, `he-XB` against SR-02 (140 / 180) or the owner's recorded deviation; no horizontal scroll; `he-XB` with every warning and error state shows no clipping.
7. **Isolation.** Re-run the Test and Rehearsal probes: Rehearsal has two nav items, three Test routes are NotFound, English and Hebrew only, status unknown, markings intact, no simulator code, scroll height 0 at three viewports; 0 non-local requests; storage and cookies empty.
8. **Regression probes.** The routing, F6, target-size, overlap, axe and Rehearsal scripts from the PR #28 review, plus all gates with counts (`check:ts`, `check:browser-types`, `lint:ts`, `lint:logical-css`, `test:ts-boundary`, `test:design-tokens`, `test:schema-vectors`, `test:frontend`, `build:web` and bundle gate for both builds, `test:e2e`).
9. **Report.** Findings with IDs and severity; what changed since the first review; what is not verified (browser-chrome F6, real screen readers, Edge, High Contrast, CSP, sub-path). It approves nothing.

## 5. Decisions for the owner

| ID | Decision | Recommendation |
|---|---|---|
| N-D1 to N-D7 | Record the N-1 decisions (the proposal merged as a proposal only) | Yes to all, with N-D3 = no |
| D-A2-1 | `SR-02` in `en-XA` (measured 237 px against 180): fix the layout in A2, or relax the pseudo-locale figure by errata | Fix in A2 if the compaction is small; otherwise relax `en-XA` to a measured bound and keep `he-XB` at 180 |
| D-A2-2 | Include the bundle-gate sentinel in A2 (needs H-4a) or leave it to B | Include in A2 (additive gate, only stronger) |
| D-A2-3 | Cap the tall scroll container so its focus indicator is not hidden by the sticky status bar (P28-11), or accept and document | Cap it (`max-block-size`) |
| D-E8, D-E9, H-3, H-4a/b, H-5, H-6 | As in `HUMAN_APPROVALS.md` | Defaults |
| Favicon (P28-13) | `data:` icon link in `index.html` (an edit beyond the stylesheet `href`) or filter the request in the CSP test | Decide before step 4 |

## 6. WP-1A-1e-A2: acceptance criteria

Scope: the T4 items that PR #28 left open, plus the review findings P28-05 to P28-11. Frontend only, Test simulation only. Must unless marked Should.

| ID | Requirement | Verification |
|---|---|---|
| A2-01 | `normalizeHostStatus(input: unknown)` in `apps/web/src/host/` exactly as HS-02 with rule R7: allow-list, enum fallback to `unknown`, `pending.count` safe integer ≥ 1 (0 is `idle`), caps 64 / 128 / 64, the R7 regex for `agentVersion`, `deploymentId` and `timeZoneLabel` (reject, not clean), strict `wallUtc` pattern, ignored `__proto__`, `constructor`, extra keys and getters, frozen result. Hostile corpus plus a seeded fuzz of at least 5 000 cases: never throws, always valid or `undefined`. | unit |
| A2-02 | The fake port normalises inside `set` and its snapshot is referentially stable between changes; `clear()` returns the unavailable snapshot; a test asserts `Object.is` across reads. | unit |
| A2-03 | `ActionWithReason` in `ui-kit`: `aria-disabled="true"`, focusable, `aria-describedby` to visible reason text (existing `host.reason.*`), click does nothing. One demo action requires online, no error-severity field and an environment match. Already rendered data stays readable in every state. | unit, e2e |
| A2-04 | In Test the default status is unavailable (unknown); while the fake drives the shell a persistent localised "simulated host status" label shows in the chip and the status bar (new he/en key, Hebrew `needs_review`). | unit, e2e |
| A2-05 | Live region: text carries each non-ok field **and its state**; it changes when the overall severity or the set of (field, state) pairs changes, not on a pending-count change; mismatch and error banners state a cause; banner text is not mirrored. | unit, e2e reading the region across a preset sequence |
| A2-06 | The "different environment" message appears only when `environmentKind` is present and different; an error without it shows the generic error text. | unit |
| A2-07 | `agentVersion`, `deploymentId` and `timeZoneLabel` are displayed (detail view and mobile disclosure) through `DisplayText` with the technical policy from N1 and as LTR isolates; `wallUtc` stays verbatim in `<time dateTime>`. No raw host string reaches the DOM. | unit with hostile values |
| A2-08 | `SR-02` for `en-XA` per D-A2-1; `SR-05`: `he-XB` and `en-XA` at 320 px with every warning and error state: no clipping, no horizontal scroll. | e2e |
| A2-09 | Overlap sweep (focus not under the marking or the sticky status bar) at 1280×560, 768×600 and 800×400 on every route, including the data route's scroll region (D-A2-3). | e2e |
| A2-10 | Gate sentinel for the host demo with presence in Test, absence in Rehearsal and a negative probe, **only if H-4a is given**; otherwise no gate edit and the gap is recorded. | gate |
| A2-11 | Rehearsal verification per D-E8: `buildRoutes` unit tests and a documented local measurement (route table, status bar, scroll height at three viewports). | unit, docs |
| A2-12 | No existing assertion is weakened, replaced or turned into polling; every edit to an existing test is listed in `EVIDENCE_A2.md` with its reason. | review |
| A2-13 | Out of scope: any adapter, `fetch`, storage, timers, new dependency, workflow edit, forced colors, CSP harness, Edge, favicon, N1 work, protected markings, `status.css`, `index.html`. | diff review |
| A2-14 | `docs/wp-1a-1e/EVIDENCE_A2.md`: criterion-to-test table, commands with counts, versions, screenshots for the new states (en/he, light/dark, 320/768/1440), the honest list of what is not verified. Additive lint probes with negative probes (counts reported). | review |

Allowed paths: `packages/ts/ui-kit/src/**` (host and frame files only), `packages/ts/i18n/src/messages.ts` and its tests, `apps/web/src/**`, `tests/frontend/**`, `tools/check_ts_boundary.mjs` (additive), `tools/check_frontend_bundle.mjs` (only after H-4a), `package.json` (`scripts` only), `docs/wp-1a-1e/EVIDENCE_A2.md`, `docs/NO_CODE_CAPABILITY_MATRIX.md`. Everything else is forbidden, as in `CODEX_HANDOFF.md`.

## 7. Handoff prompt for WP-1A-1e-A2 (use only after steps 1 and 2 are merged and the owner assigns it)

```text
You are implementing WP-1A-1e-A2 for the CalOS repository (avihafif/calibration-os), manually assigned by the product owner. Branch from current main (it already contains the corrected PR #28 and WP-1A-1d-N1). Do not touch any other branch.

Read first: AGENTS.md; docs/wp-1a-1e/SPECIFICATION.md, TASKS_AND_TESTS.md, HUMAN_APPROVALS.md, ERRATA.md and SEQUENCE_AND_A2.md (section 6 is your acceptance list); docs/wp-1a-1d/N1_INVISIBLE_UNICODE_REMEDIATION_PROPOSAL.md; docs/wp-1a-1e/EVIDENCE.md from PR #28.

Build exactly A2-01 to A2-14. Hard rules: no fetch, XMLHttpRequest, WebSocket, navigator.onLine, history.pushState, Date.now, zero-argument new Date(), timers or polling; no browser storage; no URL state other than #/<route-id>; no new dependency; Hebrew strings stay needs_review; unknown is never OK; a host environment_kind that differs from the build is an error and never changes a protected marking; identity fields are rejected unless they match the R7 pattern; a bundle sentinel is a runtime string literal, never a comment; do not edit, replace or convert to polling any existing assertion and list every edit to an existing test in EVIDENCE_A2.md; do not weaken any lint rule, boundary contract, bundle gate or test; do not skip or retry a failing test. Edit tools/check_frontend_bundle.mjs only if the owner has approved H-4a in the PR thread. Do not edit .github/**, ProtectedFrame.tsx, status.css, index.html, schemas, ADRs or governance documents.

Stop and report if a dependency, workflow, schema or protected-marking change seems necessary, if a baseline figure no longer matches, or if an existing test must change to pass.

Evidence: EVIDENCE_A2.md as in A2-14. Open the PR, state which decisions you assumed (D-A2-1 to D-A2-3), and stop. An independent reviewer (not the authoring agent) and a human GitHub approval follow. Do not merge or approve.
```

The handoff prompt for `WP-1A-1d-N1` is in [`../wp-1a-1d/N1_ACCEPTANCE_CRITERIA.md`](../wp-1a-1d/N1_ACCEPTANCE_CRITERIA.md) §5.

A GO on this sequence is a planning recommendation. It is not a safety, security, metrology or operational approval and does not replace independent review and human GitHub approval of each pull request.

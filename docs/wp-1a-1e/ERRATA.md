# WP-1A-1e — Errata 1

| | |
|---|---|
| Status | **Documentation only.** Corrects the merged specification package. It is not an ADR, approves no gate, changes no ADR status, no workflow, no dependency and no governance record, and does not edit the active implementation branch. |
| Date | 2026-11-06 |
| Sources | The independent review of PR #26 (finding IDs `P26-nn`) and the independent review of PR #28, WP-1A-1e-A (finding IDs `P28-nn`). Both reviews were written by the same agent family that wrote the specification, so a human or different reviewer should weigh them (H-7). |
| Effect | Clause IDs (RO, KB, HS, CS, WE, FS, PS, SR, AB) are unchanged. Where an erratum tightens a clause, the implementing PR is measured against the corrected text. PR #28 is not required to be re-opened because of a correction that postdates its assignment; its own review lists what is needed before merge. |

## 1. Corrections from the PR #26 review

| ID | Source | Where | Change |
|---|---|---|---|
| E-01 | P26-01 (R-1), P28-09 | `SPECIFICATION.md` HS-01 | In Test the shell starts with the **unavailable** snapshot (all fields unknown). The fake drives the shell only after a preset is chosen on `#/host`, and while it does a persistent localised "simulated host status" label is shown. A test is required. |
| E-02 | P26-02 (R-2) | `TASKS_AND_TESTS.md` §1, `HUMAN_APPROVALS.md` §2 | New decision **D-E8**. Default: Production Rehearsal is verified by unit tests, the bundle gate and a documented local measurement; a third Playwright config and a Rehearsal build step belong in the approved workflow diff only if the owner chooses them. |
| E-03 | P26-03 (R-3) | `SPECIFICATION.md` HS-01 | `getSnapshot()` is referentially stable between changes (`Object.is` test); normalise and freeze inside `set`. |
| E-04 | P26-04 (R-4) | `SPECIFICATION.md` HS-02 | The wording "stripped with `safeDisplayText`" is removed: that function never strips. `agentVersion`, `deploymentId` and `timeZoneLabel` are **rejected** unless they match `^[\x21-\x7E]+(?: [\x21-\x7E]+)*$` (N-1 proposal rule R7, PR #27). The rule needs no classifier, so HS-02 does not wait for N-1; displaying non-ASCII technical text still does. |
| E-05 | P26-05 | `HUMAN_APPROVALS.md` §3 | The proposed (still unapplied) Windows job gains `timeout-minutes: 20`, `persist-credentials: false`, an Edge search over `ProgramFiles(x86)`, `ProgramFiles` and `LOCALAPPDATA`, and a log of the runner image version. New decision **D-E9** on the trigger (the file's `push` and `pull_request` triggers would run the job twice per commit). |
| E-06 | P26-06 (R-5) | `SPECIFICATION.md` RO-09 | The marking-block comparison uses a recorded SHA-256 after CRLF to LF normalisation, in the Linux gate layer only, never under `@edge`. |
| E-07 | P26-07 (R-6) | `TASKS_AND_TESTS.md` T2 | New e2e specs are added to the explicit file list of the `check:browser-types` script (scripts-only edit). |
| E-08 | P26-08 (R-7) | `TASKS_AND_TESTS.md` T1 | The property bound is 18 times the input length (`U+FDFA` has an 18-code-point NFKD), not 3. |
| E-09 | P26-12 (R-8) | all files | PR #25 is merged (`24548d8`): "not merged" statements and the **[needs PR #25]** markers are replaced by **(PR #25, merged)**; the README GO row is updated. T0 still re-checks the facts. |
| E-10 | P26-09 | `SPECIFICATION.md` HS-01 | One sentence: on channel loss a future adapter publishes `undefined` (all unknown); `clear()` covers it. |
| E-11 | P26-10 | `SPECIFICATION.md` HS-06 | The alert banner text is not mirrored in the polite live region. |
| E-12 | P26-11 | `SPECIFICATION.md` C-8, RO-03 | New C-8 records that the types allow `unknown` for sync, journal and storage; RO-03 leaves modified clicks to the browser. |

## 2. Corrections from the PR #28 review

| ID | Source | Where | Change |
|---|---|---|---|
| E-13 | P28-01 | `SPECIFICATION.md` KB-05, `CODEX_HANDOFF.md` | KB-05 said Ctrl/Cmd+K is matched by `event.code === "KeyK"`. On `main` the handler accepts `event.key.toLowerCase() === "k"` **or** `event.code === "KeyK"`, and the Hebrew-layout test has a vector (`key: "k"`, `code: "KeyV"`) that must open the palette (Dvorak puts K at `KeyV`). The text now says so and that narrowing the handler is a regression. |
| E-14 | P28-01, P28-02 | `SPECIFICATION.md` §5 and §7, `TASKS_AND_TESTS.md` §6, `CODEX_HANDOFF.md` | No existing assertion may be weakened, replaced or converted to polling; the permitted edits to existing tests are the two tab-order tests and mechanical navigation helpers; every such edit is listed in `EVIDENCE.md` with its reason. Needing one is a stop condition. |
| E-15 | P28-03 | `SPECIFICATION.md` HS-10, `TASKS_AND_TESTS.md` T4 | The host sentinel is a string literal used at runtime, never a comment: a minifier deletes comments, so a comment sentinel is absent from the Test bundle as well and its absence from Rehearsal proves nothing. |
| E-16 | P28-12 | `TASKS_AND_TESTS.md` §4.3 | The search-vector `CalOS (בדיקה) v1.2` with query `בדיקה v1` contradicts PS-02 (literal substring; the parenthesis separates the words). The vector becomes `בדיקה) v1` (match) plus `בדיקה v1` (documented **no**). Token-based matching would be a separate product decision. The implementation in PR #28 is correct and idempotent over all 1 112 064 scalar values. |
| E-17 | P28-06 | `SPECIFICATION.md` RO-01 | Canonicalisation of `#` and `#/` applies on every later `hashchange` as well as on load; the URL and the displayed route must agree. |
| E-18 | P28-07 | `SPECIFICATION.md` RO-07 | With the palette open, Back and Forward still leave focus on the `h1` (the dialog's focus restoration must not move it to `body`). |
| E-19 | P28-08 | `SPECIFICATION.md` HS-06 | The live-region text names each non-ok field **and its state**, and changes on a change of the set of (field, state) pairs, so "unknown" becoming "degraded" is announced. |
| E-20 | P28-04 | `TASKS_AND_TESTS.md` T4 | T4 is split by dependency: HS-02 (with the ASCII rule), HS-09 and the default-unknown behaviour need neither N-1 nor H-4; only the bundle-gate edit needs H-4, and displaying non-ASCII technical text needs N-1. A delivery in two PRs must not leave HS-02, HS-09 or HS-10 unrecorded. |
| E-21 | P28-04 | `HUMAN_APPROVALS.md` H-4 | H-4 may be split: **H-4a** additive checks (third sentinel, inline-script and inline-style scan), which only strengthen the gate; **H-4b** replacing the literal `href="/status.css"` check. |

## 3. Not changed here

* No requirement was relaxed. `SR-02` (top bar height at 320 px, 180 px for the pseudo-locales) is left as written; PR #28 measures 237 px in `en-XA`, which the PR #28 review reports as a finding. Whether to relax the figure or fix the layout is a design decision for the owner.
* No ADR, workflow, gate, schema, dependency, Gate A0 or governance file is touched, and no approval (H-1 to H-9) is given or implied.
* `docs/wp-1a-1e/EVIDENCE.md` belongs to the implementation PR and is not edited here.
* The N-1 proposal (PR #27) was merged as a proposal; decisions N-D1 to N-D7 are still the owner's to record. E-04 states the R7 rule inside HS-02 itself, so HS-02 does not depend on that record; recording N-D2 confirms it.

## 4. Errata 2 (post-merge review of Errata 1 and PR #27)

| ID | Where | Change |
|---|---|---|
| E-22 | `HUMAN_APPROVALS.md` §3 | D-E9's default (`pull_request` only) was not expressed in the proposed job. The job text now has `if: github.event_name == 'pull_request'`; the workflow's `on:` is shared by all jobs, so only an `if` can restrict one job. |
| E-23 | `SPECIFICATION.md` AB-06, §6 | Both still said "byte for byte" after E-06 changed RO-09 to CRLF-normalised SHA-256 digests; wording now matches. |
| E-24 | `wp-1a-1d/N1_ACCEPTANCE_CRITERIA.md` §3, §4 | Stale statements corrected (the HS-02 sentence was fixed by E-04, PR #28 exists, the recommended order is superseded by [`SEQUENCE_AND_A2.md`](SEQUENCE_AND_A2.md)). Criteria N1-01 to N1-16 are unchanged. |
| E-25 | `wp-1a-1d/N1_INVISIBLE_UNICODE_REMEDIATION_PROPOSAL.md` N-D2 | The row omitted `timeZoneLabel`, which rule R7 and HS-02 include. |
| E-26 | `SEQUENCE_AND_A2.md` (new) | Release sequencing, a file-ownership matrix that keeps branches from overlapping, the re-review protocol for PR #28, and acceptance criteria and a handoff prompt for WP-1A-1e-A2. |

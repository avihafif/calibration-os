# WP-1A-1d-N1 — acceptance criteria, WP-1A-1e T4 dependency and Codex handoff

| | |
|---|---|
| Status | **Proposed, documentation only.** Not an ADR, not an approval. It authorises no code change by itself; the owner assigns the package (decision N-D4 in [`N1_INVISIBLE_UNICODE_REMEDIATION_PROPOSAL.md`](N1_INVISIBLE_UNICODE_REMEDIATION_PROPOSAL.md)). |
| Package | `WP-1A-1d-N1`: size S–M, one pull request, no dependency, workflow, schema, ADR or governance change. |
| Evidence base | Measurements and prototype runs of the independent review of the proposal, on `main` at `df479b0`. |

## 1. Allowed and forbidden paths

Allowed: `packages/ts/i18n/src/**` (new `technical-text.ts` and test, `format.ts`, `index.ts` export), `packages/ts/ui-kit/src/data-views.tsx`, `data-views.css`, `data-views.test.tsx`, `apps/web/src/SyntheticDataViewsDemo.tsx` (synthetic rows only), `tests/frontend/data-views.e2e.spec.ts` (additive), `tools/check_ts_boundary.mjs` (additive probes only), `docs/wp-1a-1d/**`, `docs/NO_CODE_CAPABILITY_MATRIX.md`.

Forbidden: `.github/**`, `package.json` dependency fields, `pnpm-lock.yaml`, `schemas/**`, `catalog/**`, `packages/py/**`, `apps/api/**`, `apps/station-agent/**`, `deploy/**`, `docs/adr/**`, governance and Gate A0 documents, `ProtectedFrame.tsx`, protected-marking CSS, `apps/web/public/status.css`, any `@calos/domain-types` export, any HostStatus or Finding contract, fonts.

## 2. Acceptance criteria

Priority: **Must** blocks merge; **Should** is expected unless the PR records why not. `@req` tags go on code and tests (DV-05, FR-UI-02, NFR-11).

| ID | Pri | Criterion | Verification |
|---|---|---|---|
| N1-01 | Must | **One classifier in the lowest layer.** The pinned table (28 contiguous ranges, 4 224 code points on Unicode 17.0, covering Cf, `Default_Ignorable_Code_Point`, the variation selectors, the tag block, Zs other than U+0020, Zl, Zp) and a pure `findNonDisplayableCodePoints(value)` live in `@calos/i18n`. `ui-kit` and `apps/web` import from it; no import cycle; boundary contracts unchanged. | unit, `pnpm test:ts-boundary` |
| N1-02 | Must | **No second copy.** `forbiddenTechnicalControls` in `format.ts` is replaced by the classifier. `assertTechnicalText`, `formatQuantity` (unit) and `isolateLtr` keep their error codes (`INVALID_UNIT_TEXT`, `INVALID_TECHNICAL_TEXT`) and every currently accepted input (`Ω`, `µ`, `°C`, `kΩ`, `%`); they now also reject ZWSP, ZWNJ/ZWJ, BOM, soft hyphen, tag characters, variation selectors, non-ASCII spaces and U+2028/2029. The decimal path is unchanged. | unit: existing `formatQuantity` tests unchanged and green; new negative vectors |
| N1-03 | Must | **Two named policies.** `safeDisplayText(value, policy = "prose")` (backward compatible) with `technical` and `prose`. Technical = R1 + R2 of the proposal. Prose = today's set plus the tag block, and does **not** escape `⟦ ⟧`. `DisplayText technical`, `finding.code` and `finding.pointer` use `technical`; message, stage, severity, navigate label and non-technical `DisplayText` use `prose`. | unit; the two FindingsList pseudo-locale tests (en-XA, he-XB) stay green **unchanged** (they fail if R2 is applied to prose) |
| N1-04 | Must | **Exact classification.** An exhaustive sweep of U+0000–U+10FFFF (lone surrogates by explicit cases) compares the technical policy with the pinned table; counts come from the table, not from the engine. After escaping, nothing matching `Cc, Cf, Cs, Co, Cn, Zl, Zp, Default_Ignorable_Code_Point` or a Zs other than U+0020 remains outside the notation. | unit |
| N1-05 | Must | **Lossless and injective.** A test-only decoder (not shipped) satisfies `decode(technical(x)) === x` for at least 100 000 seeded strings from a hostile pool (brackets, `U+`, hex digits, format characters, surrogates, combining marks, emoji). `technical(a) === technical(b)` implies `a === b`. Reference result of the review prototype: 0 failures in 300 000, and 0 visual collisions (current code: 66 829). | unit |
| N1-06 | Must | **Raw values untouched.** Sorting (`sortValue`), `rowId`, and `onNavigate(pointer)` receive the exact raw string. A test passes values containing U+200B, U+FEFF and a tag character and asserts the callbacks and the sort key equal the original code points while the DOM shows the notation. | unit |
| N1-07 | Must | **Metrology display unchanged.** Must-not-change vectors for both policies and for `formatQuantity`: `µ Ω` (U+03A9) U+2126 `° ± × −` `kΩ` `10.00 mV`, Hebrew with niqqud and cantillation, ASCII punctuation, digits, NFC and NFD forms (not normalised). Existing i18n tests (`formatQuantity("1.5","Ω")`, the RLO rejection, decimal rejection, 64-character cap) unchanged. | unit |
| N1-08 | Must | **Space fidelity (R9).** Technical text uses `white-space: pre-wrap` with `overflow-wrap: anywhere`. e2e on Chromium and, if available, Edge: `A B`, `A  B` and ` A B` render with different widths; long identifiers still wrap at 320 px with no horizontal page scroll in en and he. | e2e |
| N1-09 | Must | **Single application and no new silent sink.** `safeDisplayText` is never applied to its own output; a test documents that the technical policy is not idempotent by design. Review lists any `aria-label`/`title` sink that receives untrusted text and records it as residual (hidden characters in accessible names cannot be shown). | unit, review |
| N1-10 | Must | **Tripwire, one direction.** A test fails with an explicit message when the running engine classifies a code point as Cf, `Default_Ignorable_Code_Point` or Z that the pinned table lacks; it passes on an older engine (CI runs Node 22.22.2). The PR records `process.versions.unicode` and the Chrome and Edge Unicode counts it observed. | unit; EVIDENCE |
| N1-11 | Must | **Mutation check.** Remove or alter at least three table ranges (for example U+200B–200D, U+FEFF, U+E0020–E007F) and show the sweep or vector tests fail; record the three mutations. | EVIDENCE |
| N1-12 | Must | **Demo and e2e.** `SyntheticDataViewsDemo` gains clearly synthetic rows containing hidden characters (no real identifiers, no metrology values). e2e: the notation is visible, selectable, wraps; en and he, light and dark, 320/768/1440; axe clean; forced colors unchanged. The existing PR #25 matrix, focus-versus-marking and state-panel tests stay unchanged and green. | e2e |
| N1-13 | Must | **Additive probes only.** `tools/check_ts_boundary.mjs` gains probes if needed (for example `i18n` must not import `ui-kit`); never loosen an existing one; report the probe count (80 before). No lint, gate or CI change. | `pnpm test:ts-boundary` |
| N1-14 | Must | **Docs.** Capability Matrix row (trusted DEV primitive); `READ_ONLY_VIEWS.md` updated; `docs/wp-1a-1d/N1_EVIDENCE.md` with commands, counts, versions and an honest **not verified** list (screen-reader output of `⟦U+200B⟧`, Node 22.22.2 Unicode level if not run, Firefox/WebKit, confusables). | doc |
| N1-15 | Must | **Not in this PR:** confusable or NFC/NFD handling, the "hidden characters shown" note (N-D3), any HostStatus or WP-1A-1e work, any new string, any dependency. | review |
| N1-16 | Should | Technical-policy output for identity-field values that WP-1A-1e rejects is unchanged: ASCII-only values render as themselves. | unit |

## 3. Dependency between N-1 and WP-1A-1e task T4 (HostStatus)

| Question | Answer |
|---|---|
| Is N-1 a hard blocker for T4? | **No**, provided T4 follows proposal rule R7: `agentVersion`, `deploymentId` and `timeZoneLabel` are accepted only as printable ASCII without leading, trailing or repeated spaces (`^[\x21-\x7E]+(?: [\x21-\x7E]+)*$`) and otherwise become `unknown`. ASCII excludes every hidden character, so no classifier is needed. |
| What does the merged specification say? | HS-02 says strings are "stripped with `safeDisplayText`". That is wrong twice: the function never strips, and it passes 158 of 170 format characters. T4 must follow R7, not that sentence. The correction needs an errata PR on `docs/wp-1a-1e/` (review items P26-04). |
| Where does N-1 still matter for T4? | The status bar must render those strings through `DisplayText technical` (not as raw text), so a future non-ASCII value shown elsewhere cannot hide characters, and the spaces rule (R9) applies. Any later adapter that admits non-ASCII technical text needs N-1 merged first. |
| Real technical identifiers anywhere (data tables, findings, a real adapter) | **Blocked until N-1 is merged.** |
| File and merge conflicts | N-1 touches `data-views.tsx`, `i18n/src/format.ts`, `i18n/src/index.ts` (one export) and a new `technical-text.ts`. WP-1A-1e T1 edits `i18n/src/messages.ts` and `index.ts`; T4 adds `host-status` files. Expect a trivial `index.ts` export conflict only. |
| Recommended order | (0) errata PR for the merged WP-1A-1e specification, and merge of the N-1 proposal. (1) `WP-1A-1d-N1` code PR. (2) WP-1A-1e-A. If the owner wants parallel work, T0–T3, T5 and T6a can start before N-1 merges; T4 waits for N-1 or uses the ASCII rule. |
| Palette search | `normalizeSearchText` (PS-01) folds `\p{Cf}` for matching only. It must never share the classifier or be used for identifiers (PS-03). |

## 4. Review protocol for the future WP-1A-1e-A pull request

No such pull request is open at the time of writing, so nothing has been reviewed. When Codex opens one: verify the preconditions in `CODEX_HANDOFF.md`; confirm the errata for review items P26-01 to P26-12 were applied or the deviations are stated; diff only the allowed paths; no `.github/**` change without the owner's approval of the exact diff; no dependency or lockfile change; protected markings byte-identical; re-run every gate and the baseline measurements independently; probe the router with the hostile corpus, keyboard F6 behaviour, history deltas, host-status states in en/he/en-XA/he-XB, Rehearsal exclusion of the three sentinels, and the CRLF-sensitive tests on Windows; report CI results for the exact SHA; list what is not verified.

## 5. Handoff prompt for Codex (use only after N-D4 and with the independent reviewer named)

```text
You are implementing WP-1A-1d-N1 for the CalOS repository (avihafif/calibration-os), manually assigned by the product owner. Branch from current main. Do not touch any other branch.

Read first: AGENTS.md; docs/wp-1a-1d/N1_INVISIBLE_UNICODE_REMEDIATION_PROPOSAL.md and docs/wp-1a-1d/N1_ACCEPTANCE_CRITERIA.md (all of both); docs/wp-1a-1d/READ_ONLY_VIEWS.md; packages/ts/ui-kit/src/data-views.tsx; packages/ts/i18n/src/format.ts and index.ts.

Goal: close finding N-1 so that technical text can never hide characters, with exact raw values preserved and all existing metrology display behaviour unchanged. Meet every Must criterion N1-01 to N1-15.

Allowed paths and forbidden paths are listed in section 1 of N1_ACCEPTANCE_CRITERIA.md. Do not edit .github/**, dependency fields, pnpm-lock.yaml, schemas, ADRs, governance documents, protected markings or status.css. Do not add a dependency, a string, a HostStatus type or any WP-1A-1e work.

Hard rules: display never alters a value; escape by default for the technical policy; apply the strict bracket escape to technical text only (the pseudo-locales use the same brackets in prose); one classifier in @calos/i18n; counts come from the pinned table, never the engine; never loosen a test, lint rule or gate; never skip or retry a failing test.

Stop and report if: a dependency, workflow or schema change seems necessary; an existing test must change to pass (other than additions); the two FindingsList pseudo-locale tests fail; CI's Node 22.22.2 disagrees with the pinned table; anything touches a protected marking.

Evidence: docs/wp-1a-1d/N1_EVIDENCE.md with commands, counts, Node, Chrome and Edge versions and Unicode levels, the three mutations, screenshots, and an honest list of what is NOT verified. Open the PR, state assumptions, and stop. An independent reviewer (not the authoring agent) and a human GitHub approval follow. Do not merge or approve.
```

A GO on this package is a planning recommendation, not a security, safety or metrology approval.

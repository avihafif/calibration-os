# 07 — PR #6 final independent review verdict (R-4 correction round)

> **Post-review update (2026-11-02):** PR #6 was subsequently merged into `main` at commit `19e81df` after the restricted grammar, CI and owner decision records were updated. ADR-0025 is Accepted in the merged repository. This report preserves the pre-merge review scope and evidence as a historical assessment; open H-2, M-4 and M-6 issues remain gated before later Builder work.


| | |
|---|---|
| PR | [#6](https://github.com/avihafif/calibration-os/pull/6) · head `de6e934` (`feature/phase1a-r4-schema-engine`) · base `main` |
| Reviewed | 2026-11-02 (after the corrections announced in the PR body), read-only; the PR was **not** merged and no Codex-owned file was modified |
| Supersedes | The *verdict* of [01](01_PR6_INDEPENDENT_REVIEW.md) (kept as the historical first-round record) |
| Integration with current `main` | The branch contains `main` up to PR #5 (`9e2bd0e`); PRs #7/#8 (`docs/` only) landed afterwards. `git merge-tree` against current `main` (`ec46874`) is **conflict-free**; the regression runs below were executed on that simulated merge result. |

## 1. Verdict

> **Technically ready to merge as an R-4-only change — recommended, with two human conditions. The merge itself and the conditions are the owner's acts; nothing here approves ADR-0025.**

**Why merge is safe now**
1. All four findings the owner asked to re-check (H-1, M-1, M-3, M-5) are fixed **and** independently re-verified below by new probes, not only by the PR's own tests.
2. The simulated merge with current `main` passes everything that can run locally: 35 unit tests (2 skipped), the 14 security tests (with the exact locked `PyJWT 2.15.1`, `cryptography 50.0.2`, `fastapi 0.156.8`, `httpx 0.28.1`), `codegen --check`, the Python/Node vectors, the decision-ID check and the design checks (12 + 69 + 13). GitHub Actions on the PR head are green (Python Ubuntu/Windows, TypeScript, Compose, plus the two design jobs).
3. No safety, authorization, Production, hardware, signing or identity surface was added; the manifest verification boundary is unchanged for every input class tested (36,000-string differential, 0 differences).
4. The remaining open items (H-2, M-4, M-6) are scoped to WP-1A-0/2/3 and cannot affect WP-1A-1 or any operational path (§4).

**Conditions (human, recorded in the PR or on the forms)**
* **C1 — Architecture disposition of H-2.** The product-owner record (PR #8) explicitly withheld approval of PR #6 pending "fixes and architectural disposition". The fixes now exist; the architecture owner should record, in one sentence on PR #6, that the `x-calos-editor` v1 subset is **provisional** and that deferring H-2 to `GA0-16` is accepted for the R-4-only merge (rationale §4).
* **C2 — ADR-0025 stays *Proposed*.** The PR already corrects it to "Proposed — pending verifiable owner confirmation". Merging must not be read as ratification; the named owner confirms (or revises) it separately (`GA0-02b`). The merged code is behaviour-preserving for the signed-manifest boundary, so it does not depend on that confirmation to be safe.

**Not conditions (may follow the merge):** refresh of Codex's `docs/PHASE1A_GATE_A0.md` rows A0-3/A0-5 (written before PR #8 recorded D-23, palette, string coordination); M-4, M-6; Low items below.

## 2. Regression evidence for the four re-checked findings

| Finding | What was verified | Result |
|---|---|---|
| **H-1** cross-language regex semantics | (a) the named constructs from the first review; (b) a **60,000-sample random grammar fuzz** (atoms include `\d`, `.`, `[^a]`, `é`, hyphen-in-class, groups, all quantifiers) filtered through `_check_pattern`; (c) every accepted pattern run in Python `re.search` and Node `RegExp.test` on 29 samples (Arabic-Indic digits, `é`, `ד`, `\r`, `\n`, U+2028, U+FEFF, U+001C, astral 🧪, long separators) | `\d \w \s . [^a] \b [\d] é \x41 é` and alternation/captures **rejected**. Fuzz accepted **804 unique patterns → 0 Python/Node divergences** ([fuzz_grammar.py](evidence/pr6-final-verification/fuzz_grammar.py)) |
| **M-1** backtracking | Same 804 accepted patterns run against 8 adversarial inputs up to 3,000 characters; the previously accepted `[a-z]+[a-z]+[a-z]+[a-z]+` and `[a-z]*[a-z]*` and `(?:-[a-z]+)*(?:-[a-z]+)*` and `[a-z-]+-[a-z]+` and `[a-z]+a[a-z]+` | All five **rejected**; **0 of 804** accepted patterns exceeded 0.25 s on any input (whole run 0.2 s). The PR adds `test_registered_patterns_have_adversarial_time_bound` |
| **M-3** lone surrogates | Duplicate `["\ud800","\ud800"]` under `uniqueItems`; surrogate in content strings and keys; schema text | Now `SCHEMA_INVALID_UNICODE` (previously valid); `uniqueItems` no longer skips an un-canonicalizable item; schema registration canonicalizes the schema and rejects invalid Unicode. Test: `test_lone_surrogates_fail_before_uniqueness_or_pattern` |
| **M-5** hint/widget claims | `expression`, `table`, `ref_kind`, `provenance`, `quick_fixes`, `derived`, `unit_dimension`, `enum-multi`, `input_marker`, `mono`, plain-string `label` | All rejected; remaining widgets (`text`, `localized`, `enum`, `bool`, `record`) are **type-checked against the schema node** (following `$ref`; fail-closed for union targets); docs name the exact subset. Test: `test_restricted_editor_hints_reject_unbound_widgets_and_type_mismatch` |
| Signed-manifest compatibility | Old `re.fullmatch` (Phase 0B patterns) vs new wrapped patterns, 36,000 mutated strings ([probe](evidence/pr6-probes/probe_manifest_pattern_differential.py), re-run on the new head) | **0 differences** |
| Registration fail-closed matrix | nested `$defs`, remote `$ref`, `format`, `allOf`, `null`/`number`/type lists, `oneOf` + sibling `type`, unknown hints, version ≠ 1, unsafe ids | all rejected with stable codes (unchanged from the first review) |

Residual grammar notes (no action required to merge): a class range such as `[0-z]` is accepted (identical in both engines, broader than "alphanumeric"; the grammar's own comment says alphanumeric classes — tighten when convenient); the safety argument is for **platform-authored** schemas only (ADR-0025 and the PR both say so).

## 3. Findings status after the correction round

| ID | First-round severity | Now | Notes |
|---|---|---|---|
| H-1 | High | **Closed** | §2 |
| H-2 | High | **Open — deferred to GA0-16 (safe for this merge, §4)** | Decision request [`docs/PHASE1A_EDITOR_HINT_DECISION.md`](https://github.com/avihafif/calibration-os/blob/feature/phase1a-r4-schema-engine/docs/PHASE1A_EDITOR_HINT_DECISION.md) lists label shape, widget IDs, hint keys, finding-key namespace, reference validation — adequate and honest; names no vocabulary as approved |
| M-1 | Medium | **Closed** | §2 |
| M-2 | Medium | **Corrected, owner action pending** | ADR-0025 and the ADR index now read *Proposed*; Gate A0 no longer calls it Accepted |
| M-3 | Medium | **Closed** | §2 |
| M-4 | Medium | **Open, scoped (WP-1A-0/2)** | Node vectors now include safe-grammar and invalid-Unicode groups, but there is still no shipped TypeScript structural validator and the structural corpus runs in Python only. **New observation:** `maxLength` counts Unicode code points in Python (`"🧪🧪🧪"` passes `maxLength: 3`); a TS validator must count code points, not UTF-16 units — record this rule and add a vector when the TS validator is written |
| M-5 | Medium | **Closed** | §2 |
| M-6 | Medium | **Open, scoped (WP-1A-3)** | Union findings still lack field-level pointers; the PR states this plainly |
| M-7 | Medium | **Partly closed** | PRs #1–#5 reflected; PR #8 (D-23, palette, string coordination, D-27–D-29, D-32 reference) postdates it → refresh after merge |
| L-1…L-6 | Low | Open / unchanged | message-key namespace (see H-2), test-only artefacts in production packages, fixed codegen list, README sentence, rebase, schema-version marker |

## 4. Is deferring H-2 safe for an R-4-only merge?
**Yes**, because:
1. **Nothing consumes the vocabulary.** The only registered kind (`Manufacturer`) carries no hints; the only schema with hints is the test-only proof schema, which is outside `catalog/kinds.json`. No Builder code exists.
2. **Fail-closed.** Hints are inert data; any Phase 1A hint outside the subset makes *registration fail* — it cannot be silently accepted or executed.
3. **Cheap to replace.** The vocabulary is `version: 1` and unused by any production artefact; replacing it before WP-1A-2 needs no migration. The PR documents it as provisional.
4. **WP-1A-1 does not depend on it** (no schema, no inspector).

It would become unsafe only if (a) a kind with hints were registered before `GA0-16`, or (b) WP-1A-2 started first. **Recommended guard** (follow-up, not blocking): a test that fails if any schema referenced from `catalog/kinds.json` contains `x-calos-editor` until the vocabulary decision is recorded.

## 5. Other observations (non-blocking)
* **ADR-0025 decision text** now describes the restricted grammar actually enforced — good. Its consequence paragraph is accurate about not proving freedom from backtracking for an arbitrary regex language.
* **Build/process:** WP-1A-1 will edit root `package.json`, `eslint.config.mjs`, `tools/check_ts_boundary.mjs` and `.github/workflows/phase0a.yml`, which PR #6 also edits (`package.json` scripts, `phase0a.yml` mypy/vectors lines, `packages/ts/domain-types/tsconfig.json`). **Merge PR #6 before cutting WP-1A-1** to avoid avoidable conflicts.
* **Boundary of this review:** local Python was 3.11 (project targets ≥ 3.12); the CI result on 3.12 is the authoritative one. Docker/Compose startup was not run locally (CI only).

## 6. What remains gated regardless of this merge
Gate A0 stays closed (architecture, security, legal and metrology authorities outstanding — [10](10_WP-1A-1_SCOPED_READINESS_AND_APPROVALS.md)); `GA0-16` (hint vocabulary) before WP-1A-2; D-12/D-26 for any external reference validator or safe regex engine; no Production or operational activation is implied by R-4.

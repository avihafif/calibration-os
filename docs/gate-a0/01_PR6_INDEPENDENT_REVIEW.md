# 01 — PR #6 independent review (R-4: bounded schema engine and cross-language conformance)

| | |
|---|---|
| PR | [#6](https://github.com/avihafif/calibration-os/pull/6) · base `main` · head `d0c174f` (`feature/phase1a-r4-schema-engine`) · author commit `Codex <codex@localhost>` · 25 files, +1,573 / −214 |
| Reviewed | 2026-11-02, read-only. Head unchanged since the first review (0 reviews, 0 comments on the PR). Nothing in the PR or in Codex-owned files was modified; PR #6 was **not** merged. |
| Method | Read all 25 files; ran the PR's unit tests (11) and conformance vectors; simulated the merge into current `main` (clean) and ran the schema vectors, `codegen --check` and all design checks on the result; wrote 7 differential/fail-closed probes ([evidence/pr6-probes](evidence/pr6-probes/README.md)) and ran them against the PR head. |
| Verdict | **Not ready to merge.** 0 Critical · **2 High** · 7 Medium · 6 Low. Nothing found introduces a safety, authorization or Production bypass. Gate A0 stays closed after merge. |

## 1. What was verified and holds
* CI on `d0c174f`: Python (Ubuntu, Windows), TypeScript, isolated Compose rehearsal — all pass. The CI ran **before** PRs #1–#5 merged; the simulated merge with current `main` is conflict-free and `check_schema_vectors.mjs`, `codegen --check`, and the design checks (12 + 69 + 13, decision IDs) pass on it. Re-run CI on a main-based merge before merging.
* **Signed-manifest compatibility:** the nine migrated manifest patterns keep their inner expression byte-for-byte and are wrapped in `^(?:…)(?![\s\S])`. Differential test: old `re.fullmatch` vs new `re.search` over **36,000** mutated strings (newline, `\r`, fullwidth/Cyrillic/Arabic-Indic/Hebrew lookalikes, astral characters, U+2028, NUL, BOM) → **0 differences** ([probe_manifest_pattern_differential.py](evidence/pr6-probes/probe_manifest_pattern_differential.py)). The PR also adds trailing-newline and prefix rejection cases to `tests/security/test_package_verification.py`.
* **Fail-closed registration** (probe_fail_closed_and_hints.py): nested `$defs`, remote `$ref`, `format`, `allOf`, `null`/`number`/type-lists, `oneOf` with sibling `type`, unknown hint keys (`input_marker`, `script`, `raw_html`), hint version ≠ 1, unsafe `ref_kind`/`$t` values, cycles (including unused `$defs`), path escape and duplicate JSON keys are all rejected with stable codes. Content: floats, booleans-as-integers, `null`, unsafe integers and unknown properties are rejected; JSON Pointer escaping is correct.
* `validate_document` keeps the Phase 0B fail-first error strings; the registry only loads from `schemas/` and returns defensive copies.
* Canonicalization (`canonical.py`, unchanged by the PR) sorts keys by UTF-16 code units as RFC 8785 requires and fails closed on lone surrogates.
* **No new safety/authorization/Production surface:** no endpoints, roles, permissions, signing, hazard/limit configuration, instrument or Production authoring path; hints are inert data; the proof schema is outside `catalog/kinds.json`.

## 2. Findings

### High
**H-1 · Registration accepts regex constructs whose meaning differs between Python and ECMAScript** — breaks the ADR-0025 cross-language guarantee.
*File:* `packages/py/calos_metadata/calos_metadata/schema.py` `_check_pattern` (lines 202–232).
*Evidence* ([probe_registration_accepts.py](evidence/pr6-probes/probe_registration_accepts.py), [probe_python_vs_js_regex.py](evidence/pr6-probes/probe_python_vs_js_regex.py)): registration accepts `\d`, `\w`, `\s`, `.`, `\b`, `[\d]`, `[^a]`. Python (authoritative validator) vs Node `RegExp`: `\d` matches Arabic-Indic digits in Python only; `\w` matches `é`/`ד` in Python only; `\s` matches U+001C in Python, U+FEFF in JS; `.` matches `\r`, U+2028 and an astral character in Python but not in JS. The ADR cites Unicode look-alikes as the reason for the migration; an author writing `\d` silently re-opens that gap.
*Correction:* restrict the pattern grammar to an allow-list — literals, explicit ASCII classes (`[a-z0-9]`), bounded repetition, and `-`/`.`-separated segments; reject `\d \w \s \b \p{} .`, negated classes with no ASCII range, and any other escape except the escaped literals already used. *Tests to add:* each rejected construct in `tests/unit/test_schema_engine_r4.py`; Python **and** Node vectors for every accepted construct including non-ASCII and `\r`/U+2028 inputs in `cross-language-vectors.json`.

**H-2 · The `x-calos-editor` v1 vocabulary does not match the Phase 1A generic Builder** (blocks WP-1A-2/3, not the merge).
*Files:* `schema.py` lines 47–86 (`_WIDGETS`, `_HINT_KEYS`) and 156–199; vs `docs/phase1a/03_METADATA_UI_BINDING.md §3` and `design/phase1a-prototype`.
*Evidence* (probe_fail_closed_and_hints.py): a plain message-key `label` (`"f.name"`) is rejected (`SCHEMA_HINT_INVALID`) because PR #6 requires `{"$t": key}`; `mono` is rejected (`SCHEMA_HINT_UNSUPPORTED`); widget `enum-multi` is rejected. Phase 1A needs 20+ hints and 7 widgets that PR #6 lacks (`title`, `mono`, `multiline`, `item_title`, `enum_prefix`, `disabled_options`, `vocabulary`, `unit_dimension_from`, `default_input`, `filter_by`, `optional`, `localized_required`, `unique_by`, `pattern_help`, `derive/show_fields`, `wizard_step`, `initial`; widgets `enum-multi`, `reference-list`, `string-list`, `record-list`, `quantity-or-input`, `interval-or-input`, `derived`). Conversely PR #6 admits widgets Phase 1A never specified (`expression`, `table`, `hazard`, `media`, `code-readonly`, `union`, `provenance`, `list`, `quantity`, `interval`, `integer`).
*Correction:* an owner decision on one authoritative, versioned vocabulary (reviewed catalog change per Phase 1A rule R-19), then a vocabulary table in `docs/` as the single reference, with registry checks generated from it. Settle the `label` shape (`{"$t":…}` vs key string) and the message-key namespace (PR #6 emits `schema.schema_*` — doubled prefix — Phase 1A uses `f.<CODE>`).

### Medium
**M-1 · Backtracking is not bounded** (`schema.py` 213–225). The "nested quantifier" check exempts any group whose body starts with `-` or `\.` and does not detect adjacent overlapping quantifiers. `^(?:[a-z]+[a-z]+[a-z]+[a-z]+)(?![\s\S])` registers fine; matching `"a"*300+"!"` takes **10.65 s** and 150 chars 0.40 s (≈ n⁴; [probe_backtracking_time.py](evidence/pr6-probes/probe_backtracking_time.py)); 600 chars did not finish in 100 s, against a 4,096-character cap. Platform-only registration limits exposure today, and ADR-0025 states the limit, but there is no guard. *Correction:* the same restricted grammar as H-1 (a single quantified atom per segment; no adjacent quantified atoms over overlapping classes) and a timing-budget test over every registered pattern with adversarial inputs; a linear-time engine needs D-12/D-26.

**M-2 · ADR-0025's owner approval cannot be verified from the repository.** `docs/adr/0025-json-schema-pattern-semantics.md` line 3 records `Accepted (product owner decision in the CalOS R-4 task thread, 2026-11-02)`. The only evidence is a thread outside the repo; the commit is by `Codex <codex@localhost>`; the PR has no review, comment or trailer from the owner; no named decider; and `docs/PHASE1A_GATE_A0.md` (same PR) cites it as "accepted". ADR-0023/0024 use the same wording (precedent) but an Accepted ADR is immutable. *Correction before merge:* the owner records the approval verifiably (approving PR review/comment on #6 or a signed line with name, role and date — see [02](02_GATE_A0_APPROVAL_FORMS.md) form `GA0-02b`), or the ADR is set to `Proposed — pending owner confirmation` and the Gate A0 sentence reworded.

**M-3 · `uniqueItems` and validity bypass with a lone surrogate** (`schema.py` 491–500; the `except (ValueError, UnicodeError): continue` at 496). `["\ud800","\ud800"]` validates with no finding; the content is also reported valid although it cannot be canonicalized (digesting later fails closed). *Correction:* reject lone surrogates at the input boundary (or return a finding) and treat un-canonicalizable items as a finding, not a skip.

**M-4 · The "cross-language" proof is narrower than stated.** `tools/check_schema_vectors.mjs` (lines 22–45) tests a **test-local** JavaScript canonicalizer, not a shipped TypeScript module; the structural corpus (`fixtures/schema-engine/v1-cases.json`) is executed by Python only; vectors cover 3 digests and 3 manifest pattern groups. Not covered: UTF-16 ordering with astral keys, `maxLength` (Python counts code points, JS `.length` counts UTF-16 units — `"🧪🧪🧪"` passes `maxLength:3` in Python and would be 6 in JS), Unicode digits/whitespace, NUL, U+2028. *Correction:* add those vectors; implement the TS canonicalizer and structural validator in `packages/ts` (WP-1A-0) and run the same corpus in both languages.

**M-5 · The widget vocabulary contradicts the PR description.** The PR says expression/table/permission/input-marker hints are rejected, but `_WIDGETS` (47–68) includes `expression`, `table`, `hazard`, `media`, `code-readonly`; `ref_kind` is never checked against the registry; widget/type compatibility is unchecked (`provenance`, `quick_fixes` ids unresolved). *Correction:* align description and code (remove until approved); add registry-level cross-reference and widget/type checks, or document that the editor must treat unknown ids as no-ops.

**M-6 · `oneOf` failures lose field-level pointers** (`schema.py` 454–464). An unknown property inside a union member yields only `SCHEMA_ONEOF_NONE` at the union node (fixture `unknown-nested-property`). The Phase 1A inspector paints findings at the field pointer. *Correction:* report the nearest branch's findings (e.g. select the branch by a discriminating `const`) in addition to the union finding.

**M-7 · Gate A0 documents are stale after merging #1–#5.** `docs/PHASE1A_GATE_A0.md` (A0-1 "PR #1 open", R-7 "pending review/merge", "PR #2 open"), `docs/PHASE1A_R7_LIFECYCLE_CONTRACTS.md` (lines 3, 64) are Codex-owned and need their owner's edit; `docs/phase1a/05`, `docs/integration/03`, `docs/integration/04` were mine and are updated in this PR. Merging does not record any decision: A0-3, A0-4, A0-5 remain open.

### Low
`schema.schema_*` message keys (L-1) · test-only artefacts generated into production packages: `calos_metadata/generated/schema_proof.py`, `domain-types/src/schema_proof.ts`, `tsconfig.json` including a file outside the package (L-2) · `tools/codegen.py` `SCHEMAS` is a fixed list, not registry-driven (L-3) · `docs/adr/README.md` drops the sentence "ADRs are Proposed until ratified" (L-4) · PR description still says "stacked on #4"; branch is not rebased on `main` (merge-base `8efccd5`) (L-5) · manifest schema patterns changed without a schema-version or digest marker — acceptable because behaviour is identical (verified), but record it (L-6).

## 3. Compatibility with the Phase 1A generic No-Code Builder
| Need | PR #6 | Result |
|---|---|---|
| Closed, versioned hint vocabulary | present (v1) | **mismatch** with Phase 1A (H-2) |
| Structured findings (code, severity, pointer, message key, stage) | present | compatible; key namespace to agree |
| Field-level findings for unions | `ONEOF_*` at union node only | gap (M-6) |
| Generic registry-driven kinds | registry loads `Manufacturer`; codegen list fixed | gap (L-3) |
| No schema/UI code per kind | holds | ✔ |
| Existing `Manufacturer` v1 schema | loads and validates; carries no hints | not yet renderable by the generic inspector |

## 4. What must be corrected before merge / what stays gated
**Before merge:** H-1, M-1 (grammar + tests); M-2 (verifiable approval or downgrade the ADR); M-3; M-5 (description/code alignment); re-run CI on a main-based merge.
**May follow in WP-1A-0/2 (tracked, not blocking merge if the owner accepts):** H-2 reconciliation decision, M-4 TS validator, M-6, L-1…L-6.
**Remains gated regardless:** Gate A0 (D-23, D-11, D-12, D-13, D-18, D-21, ADR-0001, ADR-0015, A0-5 — see [02](02_GATE_A0_APPROVAL_FORMS.md)); D-12/D-26 for any reference validator or safe regex engine; no Production or operational activation is implied by R-4.

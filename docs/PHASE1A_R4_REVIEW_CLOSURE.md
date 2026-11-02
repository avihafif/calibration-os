# PR #6 independent-review closure matrix

Source: Claude's [PR #7 review](https://github.com/avihafif/calibration-os/blob/feature/gate-a0-closure/docs/gate-a0/01_PR6_INDEPENDENT_REVIEW.md).
Status: proposed corrections on PR #6. No operational security claim or Gate A0 approval.

| Finding | Correction | Evidence / remaining gate |
| --- | --- | --- |
| H-1 cross-language regex mismatch | Registration now accepts only explicit ASCII positive classes, ASCII literals, bounded class repetition and separator-prefixed repeat groups. Unicode shorthands, dot wildcard, negated classes, backreferences, alternation and unsupported escapes fail closed. | Python negative registration tests and shared Python/Node vectors include non-ASCII, CR, U+2028 and astral inputs. |
| M-1 catastrophic backtracking | Adjacent variable-width classes and repeated groups without a literal separator fail registration. Existing manifest patterns remain accepted. | Adversarial rejected-pattern tests and time-budget checks over every registered manifest pattern with a 4,000-character mismatch. The grammar is bounded; no claim is made for an arbitrary future regex language. |
| M-2 unverifiable ADR status | ADR-0025 and the ADR index are corrected to **Proposed — pending verifiable owner confirmation**. Gate A0 no longer calls it Accepted. | A named product owner can later approve the corrected text on PR #6 or in a signed record; no approval is inferred from the task thread. |
| M-3 lone surrogates | Content strings and keys with unpaired surrogates yield `SCHEMA_INVALID_UNICODE` before validation; `uniqueItems` never skips an uncanonicalizable item. Schema registration rejects noncanonical Unicode. | Python negative tests for duplicate invalid strings and schema text; Python/Node canonical rejection vectors. |
| M-5 editor hint claims | Removed unimplemented widget IDs and unresolved `ref_kind`, `provenance`, `quick_fixes`, `derived` and `unit_dimension` hints from the provisional subset. Accepted widget IDs are type-checked. Documentation now names the exact subset. | Negative registration tests cover removed IDs and type mismatch. No editor binding is claimed. |
| H-2 vocabulary conflict | No vocabulary selected. A single [decision request and follow-up plan](PHASE1A_EDITOR_HINT_DECISION.md) identifies label shape, widget IDs, hint keys, message namespace and reference validation. | Architecture and design owners must decide before WP-1A-2/3. |
| M-4 TypeScript validator scope | Shared Python/Node pattern and digest vectors expanded. | A shipped TS structural validator and shared structural corpus remain WP-1A-0/2 work; this PR does not claim them. |
| M-6 union finding pointers | Unchanged. | Field-level branch findings need a discriminant policy and targeted tests before the generic inspector uses union findings. |
| M-7 stale Gate A0 status | Updated Codex-owned Gate A0 and R-7 report: PRs #1–#5 merged, PR #6 open, decisions unapproved. | Recheck after PR #6 disposition. |

Local checks: `tools/check.py` 35 unit + 14 security pass; Ruff lint/format,
strict mypy (18 files), four import boundaries, TypeScript type/lint/format,
TS boundary and web build pass. Python/Node vectors pass (3 digests, 3
manifest groups, 2 safe-grammar groups, invalid Unicode). Merged prototype
checks pass (12 Builder, 69 Procedure Designer, 13 consistency and i18n).
GitHub Actions results for the correction head must be attached to PR #6
after the pushed commit completes; no remote pass is claimed here.

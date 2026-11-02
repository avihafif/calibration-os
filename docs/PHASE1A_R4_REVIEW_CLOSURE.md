# PR #6 independent-review closure matrix

Source: Claude's [PR #7 review](https://github.com/avihafif/calibration-os/blob/feature/gate-a0-closure/docs/gate-a0/01_PR6_INDEPENDENT_REVIEW.md).
Status: corrections on PR #6 integrated with `origin/main` at `ec46874`
(PRs #7 and #8 included), awaiting independent review and ADR-0025 approval.
No operational security claim or Gate A0 approval.

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
| M-7 stale Gate A0 status | Updated Codex-owned Gate A0 for PRs #1–#5, #7 and #8 and the delegated product-owner record. | D-23 and provisional D-13 palette/tokens are product outcomes; architecture, ADR-0025, font/legal, H-2 and other gates remain open. Recheck after PR #6 disposition. |

Local checks: `tools/check.py` 35 unit + 14 security pass; Ruff lint/format,
strict mypy (18 files), four import boundaries, TypeScript type/lint/format,
TS boundary and web build pass. Python/Node vectors pass (3 digests, 3
manifest groups, 2 safe-grammar groups, invalid Unicode). Merged prototype
checks pass (12 Builder, 69 Procedure Designer, 13 consistency and i18n).
Post-integration local regression on 2026-11-02: `tools/check.py` passed all
35 unit and 14 security tests; Ruff lint/format, strict mypy (18 files), four
import boundaries, TypeScript type/lint/format/boundary/vector checks and web
build passed. The merged prototype checks passed (12 Builder, 69 Procedure
Designer, 13 consistency), as did the i18n audit and decision-ID checks.
The earlier pre-integration head `de6e934` passed all four product jobs in
[Actions run #55](https://github.com/avihafif/calibration-os/actions/runs/41506154854)
and both design jobs in
[run #24](https://github.com/avihafif/calibration-os/actions/runs/41506154780).
CI for the final integrated head will be linked in PR #6 after it runs.

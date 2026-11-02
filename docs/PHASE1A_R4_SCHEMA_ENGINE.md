# R-4 schema engine foundation

Status: PR #6 based on merged Phase 0B/R-7 and current main. This is a generic metadata validator and codegen milestone. It does
not register a new CalOS configuration kind or activate the Builder.

## Implemented contract

| Area | R-4 behavior |
| --- | --- |
| Registration | Rejects unsupported keywords, open objects, invalid `required`, duplicate JSON keys, invalid bounds, malformed patterns, unknown/remote references, cycles (including unused `$defs`), malformed hints, path escapes and oversized schema files before use |
| Values | Validates nested closed objects/arrays, local root `$defs` references, exactly-one `oneOf`, `const`, `enum`, integer minimum/maximum, `uniqueItems`, lengths and anchored `pattern` |
| Findings | `validate_findings` and `SchemaRegistry.findings` return shared R-7 `Finding` values with stable codes, JSON Pointers, severity, localized message keys and stage; the Phase 0B fail-first error strings remain compatible |
| Hints | Closed provisional `x-calos-editor` version 1 subset: `group`, `order`, localized `label`/`help`/`placeholder`/`explain`, `no_default`, and type-checked `widget` (`text`, `localized`, `enum`, `bool`, `record`); other IDs fail registration. These are inert annotations, not the approved Builder vocabulary |
| Codegen | Python `TypedDict`/`Literal`/`NotRequired`/union aliases and TypeScript interfaces/literal unions/optional fields from the same schemas; `--check` fails on drift |
| Cross-language | Test-only proof schema and permanent positive/negative corpus; Python and Node verify identical canonical digests and manifest pattern acceptance vectors |

The proof schema at `schemas/schema-proof/v1.schema.json` is not in
`catalog/kinds.json`. The supported `$ref` form is `#/$defs/Name` within one
schema; remote or nested-definition references fail registration. `oneOf`
branches are standalone alternatives, not combined with sibling type
constraints. Unknown keywords and unsupported union forms continue to fail
closed. Generated static types express structure and literals; integer bounds,
uniqueness, lengths and regex remain runtime validation obligations.

## Pattern decision and limits

[ADR-0025](adr/0025-json-schema-pattern-semantics.md) is Proposed pending a
verifiable named owner confirmation. The implementation uses Draft 2020-12 search semantics. Existing manifest regexes are
wrapped with cross-language absolute anchors so signed package IDs, versions,
digests and times retain their prior exact-match rejection behavior. The
validator accepts only explicit ASCII classes/literals and separator-prefixed
repeated groups; ambiguous repetition and cross-language shorthands fail
registration. Only platform-controlled schemas may be registered. A future
untrusted schema authoring channel needs separate review.

Resource ceilings are implementation guards, not metrology values: schema
file 1 MiB, 4,096 schema nodes, depth 64, 16 `oneOf` branches, content
10,000 nodes/depth 64, string length 4,096, 100,000 validation steps and
pattern length 256. Exceeding them yields a stable resource-limit finding.

## Verification

Local Windows worktree checks after merging main: `python tools/check.py` passed 35 unit and 14
security tests, including the R-7 suite and the Phase 0B signed-manifest
regressions. Strict mypy passed 18 source/type-proof files; Ruff lint and
format passed; four import contracts held. TypeScript type/lint/boundary/build
and cross-language vector checks passed. The TypeScript formatter passed after
normalizing checkout-only CRLF in unchanged source files; those files have no
committed content diff. Docker startup and migrations were not run on this
Windows worktree; their GitHub Actions results must be reviewed separately.
The merged-main correction head `e4540f8` passed all four product jobs in
[Actions run #53](https://github.com/avihafif/calibration-os/actions/runs/41505707623)
and both non-product design jobs in
[run #22](https://github.com/avihafif/calibration-os/actions/runs/41505707664).

No external reference-validator differential result is claimed. Adding that
tool is held for the D-12/D-26 dependency and licence review. The TypeScript
proof checks generated types and Node digest/pattern vectors; it is not a
full browser-side JSON Schema validator.

## Gate A0 and integration

R-4 is prepared for review, but Gate A0 remains closed until this PR is
reviewed/merged and the remaining decisions in
`PHASE1A_GATE_A0.md` are resolved. The broader Claude `x-calos-editor`
proposal includes expression, table, filter, permission and input-marker
hints; this PR rejects those until their semantics, safe editor bindings and
design ownership are approved. The future generic inspector needs the
[H-2 vocabulary decision](PHASE1A_EDITOR_HINT_DECISION.md) before binding
these provisional hints; it can then use versioned inert hints and localized
findings without a kind-specific screen.
No draft persistence, approval, publication, real hardware or Production
authoring path is introduced.

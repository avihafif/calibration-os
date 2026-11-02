# ADR-0025: JSON Schema pattern semantics for the metadata engine

Status: **Proposed — pending verifiable owner confirmation.** A task-thread
reply selected standard semantics, but this repository has no named owner,
role, date and review record establishing architectural ratification. This
corrects a premature status claim before PR #6 merges.

## Context

The Phase 0B validator used Python `re.fullmatch` for JSON Schema `pattern`.
Draft 2020-12 uses search semantics, so a future TypeScript validator or other
standards consumer would interpret the unanchored manifest patterns more
broadly. The manifest is a signed verification input. The migration must keep
its existing rejection boundary, including Unicode lookalikes and trailing
newlines.

## Decision

The metadata validator uses Python `re.search`; a TypeScript consumer uses
ECMAScript `RegExp.test`. Platform-authored schemas in this bounded subset
must write exact-match patterns as `^(?:...)(?![\s\S])`. The final negative
lookahead is an absolute end assertion in both runtimes; a bare `$` could
match before a final newline. Registration rejects unanchored patterns,
invalid regular expressions, non-ASCII and shorthand character classes,
captures, alternation, backreferences, and ambiguous adjacent repetitions.
Only explicit ASCII classes, ASCII literals, bounded class repetition and
separator-prefixed repeated groups are accepted. All existing manifest patterns are wrapped
without changing their inner expression. Python and Node run the same
positive/negative vectors before accepting the change.

Only platform-controlled schemas are registerable. This decision does not
authorize user-authored regex or arbitrary schema registration through an API.

## Options considered

- Keep `fullmatch` as a CalOS dialect and require every future consumer to
  emulate it. Rejected because the schema advertises Draft 2020-12.
- Use search semantics without anchoring existing patterns. Rejected because
  it broadens signed manifest acceptance.
- Use search semantics and explicit cross-language absolute anchors. Proposed.

## Consequences (positive / negative / risks)

Python and TypeScript agree on the checked manifest vectors. Existing exact
matching is preserved for those patterns. Regex execution still uses the
standard runtime engine; bounded pattern and input lengths limit exposure but
do not prove freedom from catastrophic backtracking. A regex safety engine or
further restricted grammar needs a separate reviewed dependency/decision
before any untrusted schema authors are admitted.

## Revisit triggers

Revisit before user-authored schema registration, a new regex engine or flags,
or a new schema dialect. New patterns require conformance vectors and review.

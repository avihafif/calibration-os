# H-2: authoritative editor-hint vocabulary decision request

Status: **Open proposal; no vocabulary approved here.** PR #6 keeps a narrow,
inert R-4 registration subset. It is not the Phase 1A Builder contract.

## Decision required before WP-1A-2/3

Architecture and the Builder design owner must approve one versioned
`x-calos-editor` vocabulary. The decision must resolve these source conflicts:

| Question | R-4 subset | Phase 1A proposal |
| --- | --- | --- |
| Localized labels | `{"$t":"key"}` | plain message-key string |
| Widget IDs | `text`, `localized`, `enum`, `bool`, `record` only after R-4 hardening | `03_METADATA_UI_BINDING.md §2` proposes additional widget IDs |
| Hint keys | `version`, `group`, `order`, `label`, `help`, `placeholder`, `explain`, `widget`, `no_default` | `03_METADATA_UI_BINDING.md §3` proposes additional hints and condition/derivation semantics |
| Finding message keys | `schema.<lowercase-code>` | `f.<CODE>[.<detail>]` |

The owner must record the final shapes, versioning/migration policy,
implemented widget catalog and type compatibility, cross-reference rules for
`ref_kind`, `quick_fixes`, derivations and message keys, and how unknown IDs
fail visibly. No executable hint content or implicit permission behavior is
allowed. The decision must identify the governing document and named
decider/date; merged proposals alone do not establish approval.

## Follow-up implementation plan after the decision

1. Publish one closed machine-readable vocabulary table in `catalog/` with a
   schema/version and a matching normative document; remove duplicate lists.
2. Generate registration checks and TypeScript hint types from that table.
   Enforce widget-to-schema compatibility and registry/message-key references.
3. Add valid/invalid fixtures for every hint and widget, including unknown
   IDs, malformed conditions, wrong types and unsupported schema versions.
4. Add generic inspector bindings and golden tests in WP-1A-2/3; no kind-specific
   UI branches. Keep unknown IDs fail-closed at registration and visible in the
   editor if an older artifact is encountered.
5. Reconcile Finding localization keys in Python and TypeScript, then run the
   same conformance vectors in both languages before enabling the Builder.

This plan does not authorize persistence, authentication, approval processing,
operational publication, Production authoring or new dependencies.

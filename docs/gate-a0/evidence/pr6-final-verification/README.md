# PR #6 final verification evidence

`fuzz_grammar.py <checkout-root>` — run from the root of a checkout of PR #6 head (`de6e934`, or its merge with `main`); it imports `calos_metadata.schema`, requires Node on `PATH`, writes `fuzz_in.json` to the current directory (safe to delete) and prints: named-construct acceptance, a 60,000-sample grammar fuzz, Python-vs-Node divergences over 29 Unicode/newline samples, and adversarial timing. Its recorded output (2026-11-02) is `fuzz_grammar.output.txt`: 804 accepted patterns, 0 divergences, 0 slow patterns.

The first-round probes in `../pr6-probes/` were re-run against the new head (manifest differential: 36,000 strings, 0 differences). Dependency verification with `pnpm@11.25.0` is in `../dependency-evaluation/pnpm-verification.json`.

# PR #6 review probes

Reproducible scripts behind the findings in [../../01_PR6_INDEPENDENT_REVIEW.md](../../01_PR6_INDEPENDENT_REVIEW.md). They are review aids, not product tests, and they do not modify anything.

Run each from the **root of a checkout of PR #6 head** (`d0c174f408bb0942fdc2083952e9e09ada649d56`, e.g. `git archive origin/feature/phase1a-r4-schema-engine | tar -x -C <dir>`), with Python ≥ 3.11 and Node ≥ 22:

| Script | Shows |
|---|---|
| `probe_registration_accepts.py` | which regex constructs `_check_pattern` accepts or rejects (H-1, M-1) |
| `probe_python_vs_js_regex.py` | Python vs ECMAScript results for the accepted constructs (H-1); writes `in.json`/`accepted.json` next to itself |
| `probe_backtracking_time.py` | time growth for an accepted adjacent-quantifier pattern (M-1); can take ~15 s |
| `probe_fail_closed_and_hints.py` | registration/validation fail-closed matrix, hint and widget acceptance (H-2, M-3, M-5) |
| `probe_manifest_pattern_differential.py` | old `fullmatch` vs new wrapped patterns, 36,000 mutated strings (compatibility) |

Point-in-time results (2026-11-02) are quoted in the review; re-run after any correction.

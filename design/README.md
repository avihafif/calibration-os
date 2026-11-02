# `design/` — design prototypes (non-operational)

Everything under `design/` is **documentation-grade, throw-away-safe prototype code**. It is isolated from the product:

* not part of any workspace (`pnpm-workspace.yaml`, `pyproject.toml` do not list it) and not imported by any package;
* not covered by product lint/format/typing gates, build, Docker images or CI deployments;
* uses **synthetic data only** and never touches the network, `localStorage`, `sessionStorage`, IndexedDB, signing keys, tokens or instruments;
* must never be copied into `apps/`, `packages/`, `schemas/`, `catalog/` or `content/` as-is (see the "what not to copy" list in [`docs/phase1a/07_CODEX_HANDOFF.md`](../docs/phase1a/07_CODEX_HANDOFF.md#6-what-not-to-copy-from-the-prototype)).

| Path | What it is |
|---|---|
| [`phase1a-prototype/`](phase1a-prototype/index.html) | Interactive Phase 1A No-Code Application Builder prototype (vanilla HTML/CSS/JS, no dependencies, no build step) |
| `phase1a-prototype/tests/prototype.test.js` | Dependency-free design-rule checks (`node design/phase1a-prototype/tests/prototype.test.js`) |
| [`procedure-designer-prototype/`](procedure-designer-prototype/index.html) | Visual Procedure Designer + Simulation Lab prototype (synthetic, non-operational; spec in `docs/procedure-designer/`; checks: `node design/procedure-designer-prototype/tests/pd.test.js`) |
| `tools/` | Design-only checks: `check_prototype_consistency.js` (Builder ↔ Designer drift), `check_decision_ids.py` (decision identifier uniqueness). Run in CI by `.github/workflows/design-prototype.yml` — **prototype QA, not product tests** |

## Running the Phase 1A prototype

Serve the folder with any static file server bound to loopback, then open the printed address. Example:

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory design/phase1a-prototype
```

Then browse to `http://127.0.0.1:8765/index.html`. (The page ships a strict Content-Security-Policy — `connect-src 'none'` — so it cannot make requests even if modified.) State lives only in the open tab; **Reset prototype** in the `⋯` menu or a page reload restores the synthetic seed.

## What is real and what is simulated

| Aspect | Status in the prototype |
|---|---|
| Schema-driven form generation, validation findings, structural diff, change-class suggestion, version numbering rules, SHA-256 digests of canonical JSON | **Real behaviour** (specification-faithful, tested) |
| Persona switcher, permissions, separation of duties, "step-up" confirmation, audit chain, lease/takeover, offline mode | **Simulated for UX only.** Not security controls; real enforcement is server-side (Phase 1B) |
| Publishing | **Synthetic version in tab memory.** No export, signing, release or Production path exists |
| Instruments, SCPI, procedures, metrology values, uncertainty, limits, reference standards | **Absent.** Fields that would hold metrology are *Input required* markers |
| Hebrew strings | **Unreviewed placeholders** (Q-15, MI-31) |
| Fonts | System font stack (the proposed bundled fonts are specified in the design system doc) |

Documentation for the prototype and the Phase 1A design lives in [`docs/phase1a/`](../docs/phase1a/README.md).

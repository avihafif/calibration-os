# 04 — Dependency and font evidence matrix (proposal for D-12 and D-13)

| | |
|---|---|
| Status | **Proposal with evidence. Nothing is adopted, installed in the repository, or bundled.** No `package.json`, lockfile or font file of the product was changed. Approval forms: [02](02_GATE_A0_APPROVAL_FORMS.md) `GA0-05`, `GA0-06`. |
| Evidence date | 2026-11-02 (point in time; vulnerability data changes daily — re-run at approval time and in CI). |
| Reproduce | [evidence/dependency-evaluation](evidence/dependency-evaluation/) (`package.json` with the exact pins, resolved `evaluation-lock.json`, `packages.csv`, `results.json`) and [evidence/font-verification](evidence/font-verification/). |
| Not legal advice | Licence observations are technical readings of the licence texts; legal sign-off belongs to the legal role (`GA0-06`). |

## 1. Method and proposed selection policy
**Method.** (1) For each candidate, `npm view` for version, licence, publish date, engines, peers, repository. (2) Resolve the whole set in an **isolated temp project** with `npm install --ignore-scripts` using exact pins (Vite pinned to the repository's locked 8.3.5). (3) `npm audit --json` against the registry. (4) OSV.dev batch query for **every** `name@version` in the resolved tree (134 packages). (5) Static search of the *runtime* packages' published JavaScript for `eval`, `new Function`, `document.write`, `innerHTML =`, `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, browser storage and `importScripts` (CSP evidence). (6) Licence and install-script fields from the lock file.

**Proposed selection rules** (extend phase1/06 §9): permissive licence (copyleft or weak-copyleft only by explicit owner acceptance); no runtime `eval`/`new Function`; CSP-compatible with `default-src 'none'; script-src 'self'; style-src 'self'; connect-src` limited to the API origin; **exact versions, no ranges**; **release at least 14 days old** at review time (all pins below are); committed lockfile with integrity hashes; `--ignore-scripts` for installs in CI except an allow-listed Playwright browser download; each addition recorded as an ADR-0022 addendum; vulnerability + licence re-check in CI and at each upgrade (D-26); a CycloneDX SBOM generated from the lockfile in CI (tool choice belongs to D-26 — not verified here).

**Runtime floor.** `react-router` 8.5.0 needs Node ≥ 22.22.0 and `jsdom` 30.1.3 needs Node ^22.22.2; `@axe-core/playwright` ≥ 22.12. CI uses `node-version: "22"` (latest 22.x) — record **Node ≥ 22.22.2** in `engines`/`.nvmrc`.

**Result for the whole candidate set:** 134 packages resolved; **0 OSV advisories; 0 `npm audit` findings**; all have integrity hashes; one install script (`fsevents`, optional, macOS, brought by Vite). Licences: MIT 101 · **MPL-2.0 14** · Apache-2.0 7 · BSD-3-Clause 4 · BSD-2-Clause 2 · ISC 2 · MIT-0 2 · CC0-1.0 1 · BlueOak-1.0.0 1. The 14 MPL-2.0 packages are `axe-core`, `@axe-core/playwright` and `lightningcss` + 11 platform binaries (the latter already in the repository's `pnpm-lock.yaml` through Vite 8).

## 2. Dependency matrix
"SBOM" = included in the CycloneDX SBOM from the lockfile; *runtime* means it ships in the web bundle, *dev* means it is not shipped.

### 2.1 Proposed for WP-1A-1 (minimal set)
| # | Package @ exact version (published) | Purpose | Licence | Vulnerability review (2026-11-02) | CSP impact | SBOM | Alternatives · can it be deferred? |
|---|---|---|---|---|---|---|---|
| 1 | `react-intl@12.1.5` (2026-10-19) | ICU MessageFormat, plural rules (Hebrew), `<FormattedMessage>`, provider; satisfies ADR-0015 "FormatJS/react-intl-class" | BSD-3-Clause | OSV 0 · audit 0; closure 8 packages (`@formatjs/*`, `intl-messageformat`) | Runtime package scan: **no** eval/new Function/network/storage; uses native `Intl` | runtime | `intl-messageformat@12.1.4` + in-house provider (smaller closure, more code); native `Intl.MessageFormat` not available broadly. **Not deferrable** (P1A-AC-08/09) |
| 2 | `react-router@8.5.0` (2026-10-19) | Routing for the Builder shells | MIT | OSV 0 · audit 0; closure 7 | **No eval.** Contains `fetch`/`sessionStorage` in data-router, framework-mode and `ScrollRestoration` paths (`lib/dom/ssr/fog-of-war.js`, `lib/components.js`, `lib/dom/lib.js`). Use library mode (`BrowserRouter`/`HashRouter`, `Routes`) only; lint-forbid `ScrollRestoration`, `createBrowserRouter` loaders/actions, `<Form>`, `useFetcher` (conflicts with D-27 option A and with `connect-src`) | runtime | In-house hash router (small: ~10 routes; loses typed params). **Deferrable** if the owner prefers zero routing dependency in the first PR |
| 3 | `vitest@5.0.5` (2026-10-15) | Unit/component/property tests; Vite-native | MIT | OSV 0 · audit 0; closure 35 | none (dev) | dev, excluded from artefacts | `node --test` + `esbuild` (less ergonomic). Needed for P1A-AC-06/07/13 |
| 4 | `jsdom@30.1.3` (2026-10-15) | DOM for component tests | MIT | OSV 0 · audit 0; closure 34 (incl. BSD, MIT-0, BlueOak) | none (dev) | dev | `happy-dom@21.0.4` (MIT, 7 deps, a single npm maintainer — not preferred; fidelity of `jsdom` is higher). Only with #3 |
| 5 | `@testing-library/react@16.3.3` (2026-08-27) | Accessible-query component tests | MIT | OSV 0 · audit 0; closure 7 | none (dev) | dev | React `act` + DOM queries by hand. **Deferrable** to the first component PR |
| 6 | `@testing-library/dom@10.4.2` (2026-09-13) | Peer of #5 (queries) | MIT (ISC/Apache transitive) | OSV 0 · audit 0; closure 15 | none (dev) | dev | with #5 |
| 7 | `@testing-library/user-event@14.6.8` (2026-10-13) | Keyboard and pointer simulation (P1A-AC-12) | MIT | OSV 0 · audit 0; closure 2 | none (dev) | dev | Playwright keyboard tests cover E2E; keep for unit-level focus tests |
| 8 | `@playwright/test@1.64.1` (2026-10-14) | E2E, keyboard-only flows, RTL/LTR × light/dark visual baselines (P1A-AC-05, 09, 11, 12) | Apache-2.0 | OSV 0 · audit 0; closure 3 (`playwright`, `playwright-core`, `fsevents` optional) | none in bundle; CI downloads browser binaries from Playwright's CDN (network + size; pin browser build via the package version) | dev | Other E2E tools were not evaluated in this review. **Not deferrable** for P1A-AC-10/11 |
| 9 | `axe-core@4.14.0` (2026-10-05) | WCAG rule engine (P1A-AC-10: zero critical/serious) | **MPL-2.0** | OSV 0 · audit 0; closure 1 | none (dev) | dev, excluded from artefacts | No alternative engine was evaluated in this review and a permissive engine of comparable rule coverage is not known; a hand-written checker would not meet P1A-AC-10. **Licence acceptance needed** (weak copyleft, file-level; unmodified dev-only use does not ship axe-core) |
| 10 | `@axe-core/playwright@4.14.0` (2026-10-15) | Runs axe-core inside Playwright pages | **MPL-2.0** | OSV 0 · audit 0; closure 3 | none (dev) | dev | with #9 |

### 2.2 Proposed but deferrable (not needed to start WP-1A-1)
| Package @ exact version (published) | Purpose | Licence | Vulnerability review | CSP impact | SBOM | Why defer |
|---|---|---|---|---|---|---|
| `@tanstack/react-query@5.104.5` (2026-10-19) | Server-state cache | MIT | OSV 0 · audit 0; closure 5 | No eval/network/storage in runtime code (`query.fetch()` is an internal method; the query function is ours); devtools not installed | runtime | The Synthetic Host and host-port data arrive in WP-1A-4; a static shell needs no cache. Alternative: a small in-house cache behind `DraftPort` |
| `fast-check@4.10.2` (2026-09-19) | Property tests for decimal strings (P1A-AC-13) | MIT | OSV 0 · audit 0; closure 2 | none (dev) | dev | An in-house seeded generator is enough for the decimal round-trip property; adopt later if shrinking is wanted |

### 2.3 Considered and **not** proposed
| Candidate | Reason |
|---|---|
| Storybook-class tool | Heavy transitive tree and licence review; the in-repo design-system route (as in the prototype) meets the catalogue need; D-12 says "only if approved" |
| `@vitejs/plugin-react` (MIT) | Not needed: Vite 8 builds the existing `apps/web` JSX without it in CI; only dev Fast Refresh would benefit |
| `eslint-plugin-jsx-a11y@6.10.2` (MIT) | Last release 2024-10-26, 15 dependencies; axe in Playwright is stronger |
| Hard-coded-string lint, logical-CSS lint, bidi-island lint | **In-house** ESLint rules/scripts (no dependency); prototypes already contain a working logical-property and no-eval/no-network check |
| Stylelint, form libraries, UI component kits, virtualisation/resizable-pane libraries, node-graph canvas | Out of WP-1A-1 scope; in-house per phase1/06 §9; canvas needs a spike (D-19) |

### 2.4 Baseline observations (already adopted; not part of this proposal)
* `apps/web/package.json` declares `"vite": "^8.3.0"`. Vite 8.3.0–8.3.2 carry six advisories (GHSA-587h-7wmj-h5pm [high], -698v-4r3x-3vcv, -9jrq-w75r-8gcw, -r825-w8mm-5pxw, -rq7h-c2jc-7f22, -vfpm-58rq-9qcg; fixed in 8.3.3). The committed `pnpm-lock.yaml` pins **8.3.5**, so CI with `--frozen-lockfile` is unaffected; raising the declared floor to `^8.3.5` would prevent an unlocked resolution to an affected version. (Codex-owned file — recommendation only.)
* `lightningcss` (MPL-2.0) is already a transitive dev dependency through Vite — MPL-2.0 is therefore **not new** to the repository; `axe-core` adds MPL-2.0 packages that are *direct* dev dependencies.

## 3. Fonts (D-13) — evidence; **not bundled**
Authoritative sources were checked directly; files were downloaded **only into a scratch directory** for glyph and metadata inspection and are not in the repository. Licence texts are copied to [evidence/font-verification](evidence/font-verification/).

| | Inter | Heebo | JetBrains Mono |
|---|---|---|---|
| Role | Latin UI text, units, Greek (µ Ω) | Hebrew UI text | Monospace (identifiers, hashes, wire text) |
| Authoritative source | `github.com/rsms/inter` (release **v4.1**, 2024-11-16, asset `Inter-4.1.zip`) | Upstream `github.com/OdedEzer/heebo` (last push 2023-11-23); distributed file in `google/fonts` `ofl/heebo/` (METADATA records upstream commit `76c7d538…`; **Version 3.100**, updated 2023-11-24) | `github.com/JetBrains/JetBrainsMono` (release **v2.304**, 2023-01-14, asset `JetBrainsMono-2.304.zip`) |
| Licence | SIL OFL 1.1 (GitHub SPDX `OFL-1.1`, `LICENSE.txt`) | SIL OFL 1.1 (`OFL.txt`, copyright "2014 The Heebo Project Authors") | SIL OFL 1.1 (`OFL.txt`, copyright "2020 The JetBrains Mono Project Authors") |
| Reserved Font Name | none declared (only the OFL definition text) | none declared | none declared |
| Verified artefact (SHA-256) | `Inter-4.1.zip` `9883fdd4…b11e`; `InterVariable.ttf` `4989b125…ccaf` (version string "4.001;git-9221beed3"; axes opsz, wght) | `Heebo[wght].ttf` `18f930b5…ce30` (Version 3.100; axis wght; 122 KB) | `JetBrainsMono-2.304.zip` `6f6376c6…7bbf`; variable `JetBrainsMono[wght].ttf` `662a196d…c016` (axis wght) |
| Embedded licence field | OFL 1.1 text present in the font `name` table | present | present |
| Glyph coverage checked (cmap) | µ Ω ° ± × − ≤ ≥ … · → present; **Hebrew 0/27**; no ✔ ✖ | **Hebrew 27/27** incl. maqaf, geresh, gershayim, niqqud; has µ (U+00B5) ° ± × − … ·; **missing Ω U+03A9, ≤ ≥ →, U+03BC** | µ Ω ° ± × − ≤ ≥ … · → present; Hebrew 0/27; no ✔ ✖ |
| Upstream activity | pushed 2024-11-19, not archived | pushed 2023-11-23, not archived | pushed 2025-01-31, not archived |
| Delivery | self-hosted WOFF2 (upstream ships WOFF2 in the release) | WOFF2 would be produced by format conversion (upstream/Google ship TTF) | self-hosted WOFF2 (upstream ships WOFF2 in the release) |

**Conclusions.**
1. **Licence:** all three are SIL OFL 1.1 with no Reserved Font Name, so they may be used, embedded and redistributed (including in a commercial product) provided each distribution carries the copyright notice and the licence text, the fonts are not sold on their own, and Modified Versions are released under the OFL. Converting TTF→WOFF2 or subsetting counts as a *Modified Version* under OFL 1.1 (permitted; keep the notices; no RFN to avoid). Using upstream-provided WOFF2 (Inter, JetBrains Mono) avoids modification.
2. **Coverage drives the stack order.** Required order: **Inter → Heebo → system fallback**; Heebo alone cannot render `Ω ≤ ≥ →` (SI units and limit comparisons in Hebrew UI/reports). Status/safety icons (`✔ ✖ ⚠ ◈ ⛨ ⛔`) are in none of the fonts: ship them as in-house SVG components (the prototypes currently rely on system fallback glyphs).
3. **CSP/offline:** self-host under `font-src 'self'`; never load from Google Fonts or a CDN (also required for offline stations).
4. **Proposed handling (after approval only):** vendor files under a single directory with a `FONTS.md` manifest (name, version, source URL, SHA-256, licence file), include OFL texts in artefacts and the SBOM-adjacent notice file; `@fontsource/*` packages (OFL fonts, MIT packaging; v5.3.0 on npm) are an alternative delivery that adds dependencies and is **not** proposed.
5. **Not verified:** trademark/brand questions for font names; PDF embedding permission flags (OFL permits embedding) — to be re-checked with the report renderer (ADR-0015); the legal reading above.

## 4. Open items for the approver
1. Accept or replace MPL-2.0 for `axe-core` / `@axe-core/playwright` (rows 9–10).
2. Choose router approach (row 2) and whether to defer rows 5–7.
3. Confirm the 14-day cool-down and exact-pin policy; confirm Node ≥ 22.22.2.
4. Name the SBOM tool and CI audit job (D-26).
5. Confirm font set and delivery (WOFF2 upstream vs conversion) and icon strategy (SVG).

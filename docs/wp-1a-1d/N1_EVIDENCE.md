# WP-1A-1d-N1 — issue #35 implementation evidence

Status: **implementation branch; draft PR and exact-SHA CI/review pending.**
This is frontend display hardening for Test and shared presentation primitives,
not an operational calibration or host-integration release.

## Authority and scope

- Base: `origin/main` `763593d91984ec4be230c9be5b7dd498f0fadea0`,
  containing merged PR #32 (general route focus) and PR #34 (Errata 3).
- [Issue #35](https://github.com/avihafif/calibration-os/issues/35) assigned
  N1-01–16; [owner decision record N-D1–N-D7](https://github.com/avihafif/calibration-os/issues/33#issuecomment-6685559992)
  approves the scoped design and names a separate non-authoring audit plus
  final human approval. The N1 proposal and acceptance criteria remain the
  technical contract; neither document is an ADR or an operational approval.
- Changed paths are confined to `packages/ts/i18n/src/**`,
  `packages/ts/ui-kit/src/data-views.*`,
  `apps/web/src/SyntheticDataViewsDemo.tsx`,
  `tests/frontend/data-views.e2e.spec.ts`, this evidence folder and
  `docs/NO_CODE_CAPABILITY_MATRIX.md`. No workflow, dependency, lockfile,
  schema, backend, deployment or protected-marking file changes.

## Criterion-to-test matrix

| ID | Evidence | Status |
|---|---|---|
| N1-01 | `technical-text.ts` contains one Unicode 17.0 pinned table (28 disjoint ranges, 4,224 points) and pure `findNonDisplayableCodePoints`; `ui-kit` imports from `i18n` only. | Implemented; 90 boundary probes pass |
| N1-02 | `format.ts` uses the classifier, with its duplicate regular expression removed. `technical-text.test.ts` tests ten newly rejected hidden unit/isolate values and five unchanged accepted units; existing decimal, RLO, surrogate and length tests are unchanged. | Implemented |
| N1-03 | `safeDisplayText(value, "technical" | "prose")` defaults to backward-compatible `prose`; `DisplayText technical`, finding codes and pointers use strict policy. Trusted authored messages, stage/severity labels and navigation labels use prose. The unchanged en-XA/he-XB FindingsList tests pass. | Implemented, with caller-label residual below |
| N1-04 | Full U+0000–U+10FFFF sweep compares the classifier against the pinned table plus runtime Cc/Co/Cn/Cs; a second sweep compares technical output and rejects any forbidden unescaped scalar. Four lone surrogates are explicit vectors. | Implemented; both sweeps pass |
| N1-05 | Test-only decoder and a fixed-seed hostile pool prove `decode(technical(x)) === x` and no output collisions for 100,000 strings. Literal notation and a hidden U+200B render differently. | Implemented; 0 failures |
| N1-06 | `data-views.test.tsx` asserts raw U+200B/U+FEFF/tag values reach `sortValue`/comparator, `rowId`/`data-row-id` and `onNavigate`, while rendered code/pointer text uses notation. | Implemented |
| N1-07 | Unchanged-good corpus covers `µ Ω Ω ° ± × −`, `kΩ`, `10.00 mV`, Hebrew marks, ASCII, NFC/NFD and distinct ASCII-space runs in both policies. Existing `formatQuantity` tests remain unchanged and pass. | Implemented |
| N1-08 | Technical `bdi` uses `white-space: pre-wrap` and `overflow-wrap: anywhere`. Chrome and Edge e2e compare the widths of `UI A B`, `UI A  B` and ` UI A B`, and check long identifiers and 320 px page reflow in en/he. | Implemented; Chrome and Edge pass |
| N1-09 | Unit proves strict output is deliberately non-idempotent and the renderer applies it once. Sink review below records remaining caller-controlled accessible-name risks. | Implemented with recorded residual |
| N1-10 | One-direction tripwire throws `REVIEW_UNICODE_UPDATE` if the engine adds Cf/Default-Ignorable/Z points not in the table. Node, Chrome and Edge measurements below; Node 22 Unicode version was not measured locally. | Implemented; local tripwire passes |
| N1-11 | Unit removes the ranges containing U+200B, U+FEFF and U+E0020 separately; each mutation makes the tripwire fail. | Implemented; 3/3 mutants rejected |
| N1-12 | Test-only demo contains ZWSP, BOM, tag, literal-notation and spacing rows; the action renders identifiers through `DisplayText technical`. Chrome e2e checks visible/selectable notation, en/he × light/dark × 320/768/1440, axe, forced colors, raw row IDs and wrapping. Existing PR #25 tests are unchanged. | Implemented; browser matrix passes |
| N1-13 | Existing boundary matrix already rejects `i18n → ui-kit` and other forbidden imports. No probe or gate had to be weakened or added. | 90/90 negative probes pass |
| N1-14 | `READ_ONLY_VIEWS.md`, Capability Matrix and this report distinguish display-only behavior, tests and limits; four real-app screenshots linked below. | Implemented |
| N1-15 | No confusable/NFC normalization, explanatory UI string, host adapter, workflow, schema, dependency, API, storage or metrology addition. | Excluded by diff review |
| N1-16 | ASCII-only identity examples (`agent-1.0`, `test-deployment`, `Asia/Jerusalem`) render unchanged. R7 validation of future host identity inputs belongs to the separately reviewed HostStatus T4; no host adapter exists here. | Implemented display invariant; future input gate pending |

## Unicode measurements and mutations

The table was generated from the union of Unicode 17.0 Cf,
`Default_Ignorable_Code_Point`, Zs except U+0020, Zl and Zp. The runtime also
escapes Cc, Cs, Co and Cn; a newer engine's newly classified Cf/ignorable/Z
point is escaped fail-closed and makes the tripwire fail for a reviewed table
update. Counts are asserted from the pinned table rather than inferred from
the executing engine.

| Runtime observed locally | Version | Cf | Cn | Co | Default Ignorable |
|---|---:|---:|---:|---:|---:|
| Node (`process.versions.unicode=17.0`, ICU 78.3) | 26.10.0 | 170 | 814,730 | 137,468 | 4,174 |
| Google Chrome | 156.0.8078.79 | 170 | 814,730 | 137,468 | 4,174 |
| Microsoft Edge | 156.0.4314.58 | 170 | 814,730 | 137,468 | 4,174 |

Mutation evidence in `technical-text.test.ts`:

1. Remove range U+2000–U+200F (covers U+200B): tripwire throws.
2. Remove U+FEFF: tripwire throws.
3. Remove range U+E0000–U+E0FFF (covers tag U+E0020): tripwire throws.

The strict notation escapes `⟦` and `⟧` themselves, so a literal
`A⟦U+200B⟧B` becomes `A⟦U+27E6⟧U+200B⟦U+27E7⟧B`, distinct from
`A\u200BB` displayed as `A⟦U+200B⟧B`. Its test-only decoder recovers both
exact raw strings. No NFC/NFD normalization or confusable mapping occurs.

## Sink and architecture review

- `DisplayText` emits text nodes, no raw HTML, `title` or extra `aria-label`.
  The DOM text is escaped once and technical values are LTR `bdi` islands.
- `DataTable` keeps `data-row-id` raw for stable identity; it is an attribute,
  not rendered text. Sorting and finding navigation callbacks receive raw
  values. These are intentional data paths, not display transformations.
- `DataTable.scrollLabel`/`sortLabel` and `FindingsList.navigateLabel` are
  caller-supplied accessible/visible prose. The latter can interpolate raw
  code or pointer values before returning a label; `prose` is allowed only
  for trusted authored UI content. The Test demo uses fixed synthetic finding
  values. **Residual before real external findings:** the host must supply a
  trusted localization contract that isolates or strictly escapes technical
  interpolations. No such adapter or real finding path is authorized here.
- `isolateLtr` deliberately produces U+2066/U+2069 as a plain string for
  contexts without DOM `bdi`. Its output must not be passed through
  `DisplayText technical`; the unit test documents non-idempotence.
- N-D2's R7 printable-ASCII rule for future `agentVersion`, `deploymentId`
  and `timeZoneLabel` is a reject-at-input requirement, never a strip or
  normalization step. This PR changes no HostStatus contract or intake path.
- The forced-colors matrix initially exposed dark-theme text on a forced
  light surface. A scoped `ui-data-views` system-color rule fixes contrast;
  the full data-view axe assertion remained in place and now passes in Chrome
  and Edge. No protected status color or marking was changed.

## Local verification (Windows, 2026-11-06)

| Command/check | Actual result |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts --offline` | 228 locked components reused; no lockfile change |
| `pnpm check:ts`, `pnpm check:browser-types`, `pnpm lint:ts`, changed-file Prettier | Passed |
| `pnpm test:frontend` | **14 files, 150 tests passed**, including both full sweeps, 100,000 seeded strings and 3 mutant rejections |
| `pnpm test:e2e` (Chrome) | **37/37 passed**; the new N1 matrix passed all 12 en/he × theme × width combinations and forced-colors axe |
| Focused N1 matrix in Edge | **1/1 passed**, same 12 combinations and forced-colors axe |
| `pnpm test:ts-boundary`, `pnpm lint:logical-css`, `pnpm test:design-tokens`, `pnpm test:schema-vectors` | 90 negative probes, logical CSS, 24 contrast pairs and R-4 vectors passed |
| Test build + `node tools/check_frontend_bundle.mjs` | Passed; synthetic demo present only in Test |
| Production Rehearsal build + same bundle gate | Passed; all three Test-only sentinels absent |
| Python `tools/check.py` with existing Python 3.12 venv and current-source `PYTHONPATH` | **35 core + 14 security tests passed**; codegen, source-boundary, static Compose isolation and tracked-source secret checks passed |
| Ruff, strict mypy, import-linter | Passed; 39 formatted files, 18 typed source files and 4 import contracts |
| `pnpm audit` | No known vulnerabilities |
| CycloneDX + licence/OSV checker | 228 components, approved licences, **0 OSV advisories** |

The Python checks used the existing locked Python 3.12 environment from the
read-only-views worktree, with `PYTHONPATH` pointing at this checkout. Windows
asyncio needs local socket access; the security suite was run with that
permission. The local Chrome run used the committed loopback preview config.

Screenshots from the real Test React app: [English light 320](screenshots/n1-en-light-320.png),
[English light 1440](screenshots/n1-en-light-1440.png),
[Hebrew dark 320](screenshots/n1-he-dark-320.png),
[Hebrew dark 1440](screenshots/n1-he-dark-1440.png). No pixel-baseline test was
introduced.

## Not verified and review gates

- Node 22.22.2's precise Unicode version was not measured on this host; its
  actual CI result must be inspected on the final SHA. Firefox/WebKit Unicode
  versions and layout were not run.
- NVDA, JAWS and VoiceOver pronunciation of `⟦U+200B⟧`, actual Windows High
  Contrast hardware, and 200%/400% browser zoom require manual review.
- Confusable glyphs, NFC/NFD equivalence, real external findings and host
  identity intake are separate work; this PR must not be used as evidence of
  their safety.
- No operational data, instrument connection, calibration, signer, trust
  root, release or Production publishing is enabled. Independent non-authoring
  review of the exact SHA and human owner approval remain mandatory.

## Local commands

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm check:ts
pnpm check:browser-types
pnpm lint:ts
pnpm test:ts-boundary
pnpm lint:logical-css
pnpm test:design-tokens
pnpm test:schema-vectors
pnpm test:frontend
pnpm build:web
node tools/check_frontend_bundle.mjs
pnpm test:e2e
$env:VITE_ENVIRONMENT_KIND = 'production_rehearsal'
pnpm build:web
node tools/check_frontend_bundle.mjs
Remove-Item Env:VITE_ENVIRONMENT_KIND
pnpm sbom --sbom-format cyclonedx --out frontend-sbom.json
node tools/check_frontend_supply_chain.mjs frontend-sbom.json
pnpm audit
```

Python commands and the Windows venv setup remain in the repository README;
the CI workflow independently runs both Linux and Windows Python matrices.

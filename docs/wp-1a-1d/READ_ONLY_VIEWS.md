# WP-1A-1d — read-only data views

This PR adds generic display components to `@calos/ui-kit` and a **Test-only, synthetic UI** demonstration in the existing AppFrame. The components receive rows, labels, formatted messages, sorting state, and callbacks from their caller. They do not interpret schemas or connect to a host. The demonstration has no persistence, network, instrument or metrology data. Production Rehearsal excludes its compiled sentinel.

## Criterion coverage

| Criterion | Status | Evidence |
|---|---|---|
| DV-01 semantic `DataTable`, caption, headers, caller-defined columns and stable row IDs | Implemented | `data-views.test.tsx`: caption/headers, optional row header, duplicate-ID rejection; `data-views.e2e.spec.ts`: table/axe and visible caption after horizontal scroll |
| DV-02 caller-controlled sort, `aria-sort`, locale collation and exact decimal comparator | Implemented | `data-views.test.tsx`: three-state sort, en/he/pseudo collation, stable ties, 30-digit exact strings with caller comparator, explicit sort kind and numeric opt-in; browser Enter sort and source-order reset |
| DV-03 focusable, labelled horizontal-scroll region with sticky first column | Implemented with capped sticky width | `data-views.e2e.spec.ts`: 320/375/768/1440 px, en/he/pseudo locales, light/dark, no page overflow; long identifiers leave another column visible; RTL keyboard scroll and protected-marking focus tests |
| DV-04 semantic `DetailList` and all five `StatePanel` states | Implemented | `data-views.test.tsx`: `dl` and state semantics; browser selector exposes every state in en/he × light/dark with axe, plus forced-colors visibility |
| DV-05 LTR isolates and full-value access for technical text | Implemented by full-value wrapping | `data-views.test.tsx`: hostile bidi/NUL corpus, no extra tab stops or invalid `aria-label`; browser checks two long identifiers remain distinguishable. Technical values wrap visibly instead of truncating behind a hover-only title. |
| DV-06 generic findings, grouping, callback navigation, no message namespace | Display component implemented; generated-type equality deferred | `data-views.test.tsx`: severity/stage order, duplicate codes with distinct pointers, hostile text, per-row translation failure fallback, original pointer callback. The proposed generated Finding DTO and equality proof were removed from this UI PR pending a separate contract decision. |
| DV-07 native keyboard behavior and named row actions | Implemented | `data-views.e2e.spec.ts`: Enter on sort and Inspect actions, focus moved to details, findings navigation; no custom arrow-key grid behavior |
| DV-08 deferred features | Excluded | No diff, tree, editing, chooser, export, paging backend or virtualization |

`DisplayText` shows the full value and uses a `bdi dir="ltr"` for technical values. Ordinary free text uses `dir="auto"`. Bidi controls, NUL and lone surrogates are shown as `⟦U+XXXX⟧`; the caller's original row and pointer strings remain unchanged. Values do not become individual tab stops. The UI Kit has a source-scan gate against `Number`, `parseFloat` and `parseInt`; an `exact-decimal` column requires a caller comparator at compile time. `text` sorting never opts into numeric collation implicitly. The kit does not implement metrological comparison.

## N1 display hardening follow-up

The issue #35 implementation adds a pinned Unicode 17.0 classifier in
`@calos/i18n`. `DisplayText technical` uses a strict, reversible escape for
controls, default-ignorable characters, private-use and unassigned points,
non-ASCII separators, and the literal notation delimiters `⟦` and `⟧`.
Technical text retains ASCII spacing with `white-space: pre-wrap` and wraps
long identifiers without truncation. Classification is display-only: row IDs,
sorting values and pointer callbacks remain byte-for-byte/code-point-for-code-point
unchanged. `formatQuantity` unit text and `isolateLtr` reject the same hidden
characters while preserving their existing error codes and exact decimals.

The separate `prose` policy retains the existing pseudo-locale brackets and
escapes the tag block in addition to the previous controls. It is only for
trusted authored UI messages, labels and descriptions. An untrusted identifier
must use `technical`; callers must not interpolate raw technical values into
prose callback labels. The generic `FindingsList.navigateLabel` callback can
currently do that, so its caller contract remains a review item before real
external findings are displayed. The Test-only demo action now renders its
synthetic identifier through `DisplayText technical` instead of raw JSX.

The [N1 evidence report](N1_EVIDENCE.md) maps N1-01–16 to tests, records the
Unicode/version measurements and identifies unresolved accessible-name and
screen-reader limits. This follow-up does not add a host adapter or an
operational data path.

`DisplayFinding` is local to `ui-kit` and is not an API, schema or generated public type. A separate owner-reviewed contract PR would need to establish parity with `calos_metadata.findings.Finding`, message-key policy and Python/TypeScript vectors. This UI PR does not select those decisions or expose a host adapter.

## Independent-review closure plan

| Finding | Resolution in this PR |
|---|---|
| B-1 | The findings grid is constrained to a zero-minimum track; long pseudo-localized text wraps. Regression tests cover the Linux CI widths and a wider font on the findings region. |
| B-2 | Removed the unapproved Finding schema, generated Python/TypeScript types, codegen entry, public export, proof and Python vectors. The browser-type test script extension remains; the unrelated `engines` formatting was reverted. |
| H-1 | First column width is capped at 8rem on narrow screens and 12rem on wide screens. Browser tests check a second column stays visible beside 45-character identifiers at 320/375/768 px in both directions. |
| H-2 | AppFrame measures the protected marking without changing its content and publishes a scroll offset. Tab/Shift+Tab browser tests at 320×400 and 768×400 assert focused controls are not covered. |
| H-3/H-4 | `DisplayText` is no longer focusable or labelled as a generic span; full identifiers wrap and remain visibly distinguishable. |
| M-1/M-2 | Visible SVG sort state, source-order reset and one persistent polite status. Sort kind is explicit; numeric collation is opt-in and exact decimals require a comparator. |
| M-3 | Severity-ordered, stable grouping; pointer is visible and in the button name; per-row message fallback; unknown severity has error styling and its raw value is shown; stage keys do not split on NUL. |
| M-4 | Loading status is inside a busy wrapper, no-results is a status, and all five states have browser axe coverage in both themes. |
| M-5 | Control characters are rendered visibly and cannot alter text direction; callbacks receive original values. |
| M-6 | A visible heading stays outside the scroll region while the semantic table retains a caption; row-header cells are supported. |
| M-7 | Added wide-font, sticky-column, focus, full-value, RTL scroll, both-theme axe and numeric-coercion source-scan probes. |

## Local verification (Windows, 2026-11-06)

- Locked dependency set unchanged. Strict TypeScript and browser test typing, ESLint, logical CSS, **80** architecture/UI-string/numeric-coercion negative probes, **24** design-token contrast pairs, R-4 schema vectors and codegen drift: passed.
- Vitest: **62/62** tests; Playwright Chromium: **16/16** tests. The browser matrix covers four locales × two themes × 320/768/1440 px, both-theme axe at 320 px, all five state panels in en/he × light/dark with axe, 320/375/768 px long-column geometry, 320×400 and 768×400 protected-marking focus, RTL keyboard scroll, and forced colors. No page-level overflow in these measured combinations. Viewport 640/320 emulates 200%/400% reflow from 1280 CSS px; actual browser zoom was not exercised.
- Test and Production Rehearsal builds and bundle checks: passed; the latter excludes both synthetic form and data-view sentinels. `pnpm audit`: no known vulnerabilities. CycloneDX 1.7: **228** components, approved licence inventory, **0** OSV advisories.
- Python: `tools/check.py` ran **35 core + 14 security** tests; direct security suite **14/14**; Ruff, strict mypy (**18** source files), and **4** import contracts passed. No Python runtime behavior changes.
- Full-tree `pnpm format:ts:check` on Windows reports **28 untouched CRLF baseline files**. All changed TypeScript, CSS and tool files pass the pinned Prettier check. CI on Linux is the authoritative full-tree format gate; its final-head result must be checked before review completion.

Screenshots from the real app: [full English AppFrame](screenshots/data-app-en.png), [full Hebrew AppFrame](screenshots/data-app-he.png), [forced colors](screenshots/data-forced-colors.png). The component matrix is in `screenshots/data-{en,he}-{light,dark}-{320,768,1440}.png` (12 files).

## Run locally

From the repository root with Node 22.22.2+ and pnpm 11.25.0:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm build:web
node tools/check_frontend_bundle.mjs
pnpm test:frontend
pnpm test:e2e
pnpm --filter @calos/web dev --host 127.0.0.1
```

Switch language and theme using the AppFrame controls. The data-view demonstration appears only in Test; the Production Rehearsal build retains the protected markings but omits the demo.

## Review limits

Real screen-reader and Windows Edge verification, actual 200%/400% browser zoom, and externally served CSP headers have not been verified here. The separate Finding DTO contract, a future Python-to-DTO host adapter and finding-key governance remain open. Hebrew terminology remains `needs_review`. The wide-font override is applied to FindingsList; a Verdana-induced overflow of the pre-existing form-demo heading was observed independently and is outside this read-only-view PR. These components do not establish operational or production readiness.

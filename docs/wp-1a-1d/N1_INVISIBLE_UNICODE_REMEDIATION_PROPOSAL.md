# N-1 remediation proposal — invisible and format characters in technical display text

| | |
|---|---|
| Status | **Proposal, documentation only.** It is not an ADR and not an approval. It changes no code, test, schema, dependency, workflow, ADR status or governance record, and it grants no safety, security, metrology or operational approval. |
| Finding | **N-1** of the final independent review of PR #25 at `207599a` (Low for the Test-only synthetic demo; **must be closed before real technical identifiers are displayed**). |
| Measured on | `main` at `24548d8` (PR #25 merged), Node 26.10.0 / Unicode 17.0, Windows 11. Reproducible with the appendix method. |
| Intended follow-up | One small, manually assigned code PR (working name `WP-1A-1d-N1`), `packages/ts/ui-kit` and its tests only. Independent of WP-1A-1e; must land before WP-1A-1e task T4 (host-status normaliser) or together with it. |

## 1. Problem

`safeDisplayText` (`packages/ts/ui-kit/src/data-views.tsx`, used by `DisplayText`) makes control characters visible as `⟦U+XXXX⟧`. It escapes only: U+0000–U+001F, U+007F–U+009F, U+061C, U+200E–U+200F, U+202A–U+202E, U+2066–U+2069 and lone surrogates. Everything else passes through unchanged, including characters that render as nothing. Two *different* technical identifiers can therefore look identical on screen (`ABC123` versus `ABC<U+200B>123`), which is exactly what a calibration UI must not allow for asset numbers, serial numbers, deployment ids, agent versions or instrument-reported strings.

### 1.1 Exhaustive measurement (all 1 114 112 scalar values, current function)

| Unicode class | Code points | Pass through **unescaped** |
|---|---|---|
| Cc (controls) | 65 | 0 (good) |
| **Cf (format)** | 170 | **158** — soft hyphen U+00AD, Arabic number signs U+0600–0605, U+06DD, U+070F, U+0890–0891, U+08E2, U+180E, **ZWSP/ZWNJ/ZWJ U+200B–200D**, **U+2060–2064** (word joiner, invisible operators), U+206A–206F, **BOM U+FEFF**, U+FFF9–FFFB, musical and shorthand format controls, **tag characters U+E0001, U+E0020–E007F** |
| **Default_Ignorable_Code_Point** | 4 174 | **4 162** (adds Hangul fillers U+115F/1160/3164/FFA0, U+034F, U+17B4/17B5, U+180B–180F and the variation selectors) |
| **Variation selectors** (U+FE00–FE0F, U+E0100–E01EF) | 256 | **256** |
| **Tag characters** (U+E0000–E007F) | 128 | **128** (invisible ASCII smuggling) |
| **Zs other than U+0020** (NBSP, thin, ideographic space, …) | 16 | **16** |
| Zl, Zp (U+2028, U+2029) | 2 | **2** |
| Co (private use), Cn (unassigned) | 137 468 / 814 730 | all (render as blank or tofu) |

Two further properties of the current notation:

* **The notation is ambiguous.** `⟦` (U+27E6) and `⟧` (U+27E7) are not escaped, so a value that literally contains `⟦U+200E⟧` renders identically to a value containing U+200E (measured: collision `true`). The escape format is not injective.
* **Equivalent but different strings** (NFC `é` versus NFD `e`+U+0301; `Ω` U+2126 versus U+03A9) render identically. This is a different problem (§6) and is **not** solved by escaping.

Unit symbols and Hebrew points are *correct* today and must stay unchanged: `µ Ω ° ± × −` and Hebrew niqqud all pass through (measured `true`).

## 2. Principles

1. Display never changes the stored value. Values are stored, compared and hashed by code point; escaping is presentation only.
2. **Escape by default.** Technical text shows a character as itself only if it is positively a visible character; everything that is invisible, a format control, a separator other than the ordinary space, private-use or unassigned is shown as `⟦U+XXXX⟧`.
3. The notation must be **injective**: two different values never render the same.
4. One classifier, two policies: **display = escape** (data tables, free text from instruments); **identity-field input = reject** (see §4 R7). Never silently strip.
5. Deterministic and reviewable: a small pinned table for the format/ignorable/separator classes, so a browser or Node upgrade cannot silently change what is hidden.
6. `DisplayText` is for technical text only. It must not be used for localized prose, where ZWNJ/ZWJ are legitimate; the docs and the component comment say so.

## 3. Options considered

| Option | Verdict |
|---|---|
| A. Extend the deny-list (pinned classes + `\p{Co}\|\p{Cn}\|\p{Cs}` at runtime + bracket escape) | **Recommended.** Small, deterministic for the classes that matter, no dependency, unit symbols and Hebrew unchanged. |
| B. Pure runtime `\p{Cf}\|\p{Default_Ignorable_Code_Point}…` regexes | Simplest, but the hidden set then depends on the Unicode version of each browser; tests would differ between Chromium and Edge builds. Acceptable only for the Co/Cn tail. |
| C. Allow-list by script (Latin, Hebrew, digits, listed symbols) | Rejected for now: metrology text needs Greek `µ Ω`, `°`, `±`, `×`, `−`, and the list would itself become an unreviewed metrology table. |
| D. Strip hidden characters | **Rejected.** It alters the value, hides the evidence of tampering, and is forbidden by principle 1. |

## 4. Proposed rules (for the code PR; normative once assigned)

| ID | Rule |
|---|---|
| R1 | Escape every Cc, Cf, Cs, Co, Cn, Zl, Zp and every Zs other than U+0020, plus every `Default_Ignorable_Code_Point`, the variation selectors and the tag block (U+E0000–E007F). |
| R2 | Escape `⟦` U+27E6 and `⟧` U+27E7 themselves (`⟦U+27E6⟧`), so the notation is injective. Consequence: the function is **not idempotent by design**; it is applied exactly once, at the display boundary. |
| R3 | Keep the format `⟦U+XXXX⟧` (upper-case hex, at least four digits) so existing tests and screenshots remain valid. |
| R4 | Leave unchanged: ASCII printable, all other letters, digits, marks (Mn/Mc, including Hebrew niqqud and cantillation), punctuation and symbols (including `µ Ω ° ± × −`). NFC/NFD are **not** normalised. |
| R5 | Data: a small pinned range table for Cf, Default_Ignorable, variation selectors, tags, Zs/Zl/Zp (28 contiguous ranges, 4 224 code points, measured on Unicode 17.0; generated once from the Unicode version named in the file header and committed). `Co`, `Cn`, `Cs` use `\p{…}` at runtime; their drift direction is benign (a newly assigned character may appear as itself). A **tripwire unit test** compares the table with the engine's `\p{Cf}`, `\p{Default_Ignorable_Code_Point}` and `\p{Z}` classes and fails with an explicit message ("review the Unicode update") when the engine knows a code point the table lacks. |
| R6 | Export a pure `findNonDisplayableCodePoints(value): readonly number[]` from the same module (no behaviour change for existing exports). `safeDisplayText` is implemented on top of it. |
| R7 | **Identity fields use reject, not escape.** In WP-1A-1e HS-02, `agentVersion` and `deploymentId` are accepted only if `findNonDisplayableCodePoints` is empty **and** the value matches printable ASCII (`^[\x20-\x7E]{1,N}$`); otherwise the field becomes `unknown`. This amends HS-02 (which currently says "stripped with `safeDisplayText`"; that function never strips). Config keys and procedure identifiers are already ASCII slugs by AGENTS.md §7 and need no display rule beyond R1–R2. |
| R8 | Optional (Should): a small localized note "hidden characters shown" beside a value that needed escaping (icon + text, he/en, Hebrew `needs_review`). New strings need the normal review-status mechanism; omit if the owner prefers no new strings in the first PR. |

## 5. Test plan (for the code PR)

1. **Exhaustive sweep** over U+0000–U+10FFFF (lone surrogates by explicit cases): classification equals the expected counts for the pinned Unicode version (the table in §1.1 becomes the fixture); after escaping, no remaining character matches `[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}\p{Zl}\p{Zp}]`, `\p{Default_Ignorable_Code_Point}` or a Zs other than U+0020.
2. **Injectivity:** a seeded property test over at least 100 000 random strings drawn from a pool that includes `⟦`, `⟧`, `U+`, hex digits and format characters: `safe(a) === safe(b)` implies `a === b`.
3. **Hostile corpus:** `ABC123` versus `ABC<U+200B>123`; BOM prefix; tag-block encoding of ASCII; RLO/LRM; NBSP versus space; literal `⟦U+200B⟧`; variation selector after a letter; private-use and supplementary code points; lone surrogates; 10 000-character input (linear time).
4. **Must-not-change vectors:** `µ Ω Ω(U+2126) ° ± × −`, Hebrew with niqqud and cantillation, ASCII punctuation, digits.
5. Existing DV-05 tests and PR #25's geometry tests stay green and unchanged; the data-view demo gains synthetic rows with hidden characters; e2e asserts the escape text is visible, selectable and wraps without overflow at 320 px, en and he.
6. Tripwire test (R5) documented in the evidence with the Node and Edge/Chrome Unicode versions.
7. If R7 is adopted in the same window, the HS-02 corpus gains the identity-field cases.

## 6. Out of scope (recorded so it is not mistaken for closed)

* **Confusables and canonical equivalence** (Cyrillic `а` versus Latin `a`; NFC versus NFD; U+2126 versus U+03A9). Escaping cannot fix these. The structural defence is to constrain identifier fields at the source (ASCII slugs, AGENTS.md §7; JSON Schema pattern semantics, ADR-0025) and to compare identifiers by code point. A later, separate item may add a visible "non-ASCII identifier" indicator.
* The palette search folding of format characters (WP-1A-1e PS-01) is a search aid and must never be used for identifiers (PS-03).
* No change to schemas, `@calos/domain-types`, the Finding or HostStatus contracts, dependencies or workflows.

## 7. Human decisions

| ID | Decision | Recommended |
|---|---|---|
| N-D1 | Scope of R1: escape Co and Cn too (blank or tofu otherwise) | Yes |
| N-D2 | R7: reject (not escape) non-ASCII or non-displayable text in `agentVersion` and `deploymentId` | Yes |
| N-D3 | R8: add the "hidden characters shown" note in this PR | No (separate review of new strings) |
| N-D4 | Assign `WP-1A-1d-N1` to Codex and name the independent reviewer | Owner decision |

No other approval is involved: no workflow, ADR status, dependency or governance record is touched. A GO here is a planning recommendation, not a security or metrology approval.

## 8. Risks

False positives for legitimate script in `DisplayText` (ZWNJ/ZWJ in Persian or Urdu names, emoji sequences): accepted for technical text, excluded for prose by principle 6. Visual noise for values with many hidden characters: intended, because hidden characters in an identifier are a defect to be seen. Unicode updates: handled by the tripwire.

## Appendix — measurement method

Read `safeDisplayText` from `data-views.tsx`, evaluate it in Node, iterate every scalar value and count those for which `safe(ch) === ch` within each Unicode class, using `\p{Cc}`, `\p{Cf}`, `\p{Co}`, `\p{Cn}`, `\p{Zl}`, `\p{Zp}`, `\p{Zs}` and `\p{Default_Ignorable_Code_Point}`. Collision check: `safe("A‎B") === safe("A⟦U+200E⟧B")` is `true`. NFKD expansion check used by the WP-1A-1e review: `"ﷺ".normalize("NFKD").length === 18`.

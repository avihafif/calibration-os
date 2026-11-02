# ADR-0015: Internationalization and RTL

Status: **Accepted with amendments B1–B6** · Date: 2026-11-02 · Deciders: Avi Hafif (Architecture owner, designated 2026-11-02; recorded by delegation — see `docs/gate-a0/13_DELEGATED_ARCHITECTURE_SECURITY_LEGAL_RECORD_2026-11-02.md`); content owner for the glossary not yet named

## Decision
- ICU MessageFormat (FormatJS / `react-intl`-class) for UI; translation bundles are **configuration items** (`TranslationBundle`) so engineers can maintain them in the GUI. Platform strings ship as system bundles.
- Locales at launch: `en`, `he` (RTL). Direction from locale; CSS **logical properties** only; layout mirrored automatically.
- **LTR isolation**: measurement values, units, identifiers, SCPI text, hashes, file names rendered inside `<bdi>`/`dir="ltr"` spans. Units are never translated.
- Numerals: Western digits by default in both locales; decimal separator display via `Intl.NumberFormat`; stored values always use `.`.
- Dates: ISO-8601 UTC stored; displayed per locale/time zone; Gregorian calendar default.
- Pluralization via CLDR rules (Hebrew has distinct plural categories).
- Authored content (procedure instructions, report text) is localized by key with per-locale fallback policy; publish validation requires completeness for locales the lab designates.
- Reports render fonts embedded with Hebrew coverage; bidi tested with golden PDFs.
- Hebrew metrology terminology glossary is a reviewed `Glossary` item (MI-31).

## Consequences
+ Translators/engineers need no code changes. − Visual regression suite doubles (LTR/RTL).

## Amendments (accepted 2026-11-02 — B1–B6)
The original Decision above stands; the amendments below are part of the Decision. B3's finding-key namespace remains subject to decision GA0-16. Hebrew strings stay `needs_review` until the glossary is reviewed (MI-31).

- **B1 — Bundles in Phase 1A.** Platform strings are **system bundles compiled into the web app**. `TranslationBundle` configuration items and any runtime bundle loader are out of scope until that kind is approved (it is not in the D-29 tiers). The i18n package exposes a bundle-provider port so config-item bundles can be added later without an API change.
- **B2 — Pseudo-locales and string lint.** The i18n package provides pseudo-locales `en-XA` (accented, expanded) and `he-XB` (RTL, expanded) for tests; CI fails on hard-coded user-visible strings (in-house ESLint rule).
- **B3 — Message-key namespaces.** Keys are `<area>.<id>`; engine and validation findings render through `finding.<CODE>[.<detail>]` using the code and parameters carried by the finding, with no per-kind key mapping in UI code. *(The exact finding-key namespace is subject to decision GA0-16 / H-2.)*
- **B4 — Fonts and icons.** UI and report font stacks must provide Latin with Greek and unit symbols (µ Ω ≤ ≥), Hebrew, and monospace coverage, in that fallback order; status and safety icons are SVG components, not font glyphs; font files are self-hosted (CSP `font-src 'self'`) with their licence texts, and **no font is bundled before legal sign-off**.
- **B5 — Glossary status and plurals.** Hebrew terminology follows the glossary once it is reviewed (MI-31); until then all Hebrew is marked `needs_review`. Counts use ICU `plural`.
- **B6 — Bidi and logical CSS enforcement.** CSS uses logical properties only (lint-enforced); localized fields carry `lang` and `dir`; measurement values, units, identifiers, hashes and expressions render in `bdi`/LTR islands.


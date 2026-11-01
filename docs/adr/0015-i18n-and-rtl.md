# ADR-0015: Internationalization and RTL

Status: Proposed

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

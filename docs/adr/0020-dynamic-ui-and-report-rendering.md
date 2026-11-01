# ADR-0020: Metadata-driven UI and report rendering

Status: Proposed

## Decision
- **UI**: `UiForm/Page/Dashboard/Navigation/Theme` items rendered by a single React runtime using a **component registry** with schema-validated props, typed expression bindings, and an **action catalog** (no scripts). Layered resolution system→tenant→lab→application via declared extension points. Auto-generated operator screens from procedures so minimal apps work. Presentation-subset evaluator in the browser; metrological values come from the host.
- **Reports**: `ReportTemplate` block tree bound to a versioned `ReportDatasetContract`; server-side deterministic rendering (sanitized HTML → PDF with embedded fonts); **system-injected** watermark/banner/footers; renderer versions retained; records store template/dataset/renderer/output digests.
- Rich text limited to a restricted Markdown subset; assets by allow-listed MIME types and content-hash references.
- The PDF engine choice (e.g., WeasyPrint-class vs headless Chromium) is decided by a Phase-1 spike on Hebrew/bidi fidelity, determinism, and licensing; requirement: byte-stable output for identical inputs on the pinned renderer.

## Options
Raw HTML templates (XSS, non-validatable), Jinja templates (code-like, injection risk), third-party BI/report suites (lock-in, weak determinism) — rejected. **Block-tree templates** chosen.

## Consequences
+ Validatable, diffable, localizable, safe. − Layout expressiveness bounded by block set (new blocks = DEV, matrix 5.8).

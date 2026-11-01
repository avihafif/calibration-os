# ADR-0022: Baseline extensions (queue, object store, telemetry, tooling)

Status: **Accepted** (product owner, 2026-11-01: "Accept all" for E1–E6) — none replaces a baseline element. Specific library choices within each extension remain open and are finalized in Phase 0 (record them in this ADR's addendum).

| ID | Extension | Why | Alternative if declined |
|---|---|---|---|
| E1 | SQLite at station | Local-first journal (ADR-0003) | Local PostgreSQL (heavier) |
| E2 | Postgres-backed job queue (library TBD; e.g. `procrastinate`-class) | Validation, simulation lab, report rendering, exports without adding a broker | Celery+Redis/RabbitMQ (more infra) |
| E3 | S3-compatible object store (MinIO or filesystem driver for small installs) | Packages, assets, evidence, PDFs | PostgreSQL large objects / bytea (poor at scale) |
| E4 | OpenTelemetry + Prometheus exposition | Traces/metrics | Logs only |
| E5 | Tooling: `uv`, `pnpm`, Vite, import-linter, eslint-plugin-boundaries, Alembic, SQLAlchemy 2, Pydantic v2, Playwright, Hypothesis, Schemathesis, oasdiff | Enforce boundaries, test rigor | Equivalents |
| E6 | Ed25519 + TUF-style metadata | Offline-verifiable distribution (ADR-0004/0021) | Authenticode only (insufficient) |

All choices are replaceable behind ports (`JobQueuePort`, `BlobStorePort`, `TelemetryPort`). Library selections are finalized in Phase 0.

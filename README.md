# CalOS Phase 0A/0B walking skeleton

This repository holds the supplied CalOS specifications and a **non-operational,
simulation-only** implementation probe. It cannot execute a calibration, talk to
an instrument, approve a result, or issue a report. The `prod-rehearsal` stack is
**PRODUCTION REHEARSAL — NO REAL CALIBRATION**.

The 42 supplied specification files were committed unchanged as the baseline.
See [Phase 0A status](docs/PHASE0A_STATUS.md) for the acceptance checklist and
unimplemented security checks, and the [file manifest](docs/PHASE0A_MANIFEST.md)
for a file-by-file change list.

Phase 0B adds a **verification-only** metadata package path with strict schema
and digest checks, Ed25519 verification, publisher/tenant/deployment binding,
expiry, revocation-snapshot and runtime-version checks, and an authenticated
`POST /api/v1/config/packages/verify` route. It creates no drafts, approvals,
versions, releases or assignments. The route returns `503 VERIFIER_UNAVAILABLE`
in the supplied Compose projects because no operational trust or token issuer
is provisioned. In-memory test keys demonstrate the contract; they are never
trusted deployment keys. See [Phase 0B report](docs/PHASE0B_REPORT.md) and the
[ADR review matrix](docs/PHASE0B_ADR_REVIEW.md). The next trust and identity
work is scoped in the [Phase 0C proposal](docs/PHASE0C_PROPOSAL.md).
The conditional [Phase 1A plan](docs/PHASE1A_IMPLEMENTATION_PLAN.md) describes
a Test-only in-memory Synthetic Host Builder slice after [Gate A0](docs/PHASE1A_GATE_A0.md).
Claude's independent findings and open High activation gates are tracked in
the [security closure matrix](docs/PHASE0B_SECURITY_CLOSURE.md).

The package endpoint accepts at most 1 MiB of JSON and rejects excessive
nesting, unsupported number types, unsigned/tampered input and incompatible
trust or runtime versions. Denials use `application/problem+json` with a
correlation ID. Logs contain a stable rejection code and correlation ID, not
the bearer token or package body. No durable security audit or operational
issuer/revocation service is present.

## WP-1A-1a frontend foundation (Test/simulation only)

The first real frontend slice adds compiled English/Hebrew ICU system messages,
RTL/LTR switching, pseudo-locales, exact decimal-text/date formatting helpers,
bidi isolation, strict TypeScript package boundaries and a small bilingual
React demonstration. It has **no Builder, persistence, account, API request,
instrument access, approval, signing or production publication**. Hebrew
terminology is marked `needs_review`; full Gate A0 and H-2/GA0-16 remain
closed. The Product Owner's [limited PR #10 process exception](https://github.com/avihafif/calibration-os/pull/10#issuecomment-6587505382)
covered entry to this slice only. PRs #11 and #12 are merged.

WP-1A-1b adds bounded Unicode-safe technical display,
closed third-party import and source-root boundaries, static Test/Simulation
markings that survive JavaScript failure, an error-safe React content boundary,
and stronger pseudo-locale checks. The web build has no runtime API requests,
browser storage, cloud requirement or instrument connection; its future local
desktop host must connect through injected ports. The current Vite preview is
development infrastructure, not an approved offline desktop distribution.
See [hardening findings](docs/wp-1a-1b/HARDENING.md). CSP remains an external
deployment blocker until HTTP headers and browser tests prove enforcement.

The WP-1A-1b UI Kit adds the real reusable
[`packages/ts/ui-kit`](packages/ts/ui-kit) and responsive AppFrame. It uses
the approved light/dark tokens, system fonts, protected status colors,
accessible controls and in-memory theme switching. The app now demonstrates
English/Hebrew × light/dark at desktop, tablet and mobile sizes; keyboard
drawer and command palette, no-JS status fallback and local static hosting
remain within the frontend-only scope. See the [UI Kit review evidence](docs/wp-1a-1b/UI_KIT.md).

WP-1A-1c adds generic controlled TextField, TextArea, exact-decimal
NumberTextField, Select and Checkbox components. A Test-only interactive form
inside AppFrame uses synthetic, non-metrological UI data and React memory only.
It can be typed into, validated and reset; it creates no draft, approval or
record. Production Rehearsal omits the form from its compiled script. See
[form-control evidence and screenshots](docs/wp-1a-1c/FORM_CONTROLS.md).

Run from the repository root with Node `22.22.2` or newer and pnpm `11.25.0`:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @calos/web dev --host 127.0.0.1
# Open the URL printed by Vite; use the Language selector for en/he and Test-only pseudo-locales.
```

Frontend verification (build before the browser test, which previews static
assets and uses installed local Chrome; CI downloads pinned Chromium):

```powershell
pnpm check:ts
pnpm lint:ts
pnpm lint:logical-css
pnpm test:ts-boundary
pnpm test:frontend
pnpm build:web
node tools/check_frontend_bundle.mjs
pnpm test:e2e
pnpm audit
pnpm sbom --sbom-format cyclonedx > frontend-sbom.json
node tools/check_frontend_supply_chain.mjs frontend-sbom.json
```

Browser screenshots are written to `artifacts/screenshots/` and uploaded by
the frontend-browser CI job. Reviewed screenshots from the real React
application are [English](docs/wp-1a-1a/en.png) and
[Hebrew](docs/wp-1a-1a/he.png). The development SBOM is generated locally
and not committed. See the implementation PR for exact audit results.

The narrow transitive advisory remediation and its one-time release-age
exception are recorded in the [WP-1A-1a dependency evidence](docs/wp-1a-1a/DEPENDENCY_EVIDENCE.md).

## Windows PowerShell setup

Prerequisites: Git, Python (bootstrap interpreter), Node.js 22+, pnpm 11.25.0,
and Docker Desktop for the optional two-stack check. The Python workspace uses
Python 3.12; the setup below installs a workspace-local interpreter and uv.

```powershell
cd C:\Users\Private\Documents\CalSw
python -m pip install --target .tooling uv==0.13.6
$env:UV_PYTHON_INSTALL_DIR = Join-Path (Get-Location) '.python-install'
$env:UV_CACHE_DIR = Join-Path (Get-Location) '.uv-cache'
.\.tooling\bin\uv.exe python install 3.12
.\.tooling\bin\uv.exe sync --all-packages --frozen
pnpm install --frozen-lockfile --store-dir .pnpm-store
.\.venv\Scripts\python.exe tools/check.py
.\.venv\Scripts\ruff.exe check apps packages/py tools tests
.\.venv\Scripts\ruff.exe format --check apps packages/py tools tests
.\.venv\Scripts\mypy.exe --strict packages/py/calos_domain/calos_domain packages/py/calos_metadata/calos_metadata packages/py/calos_security/calos_security apps/api/calos_api
.\.venv\Scripts\lint-imports.exe --no-cache
pnpm check:ts
pnpm lint:ts
pnpm format:ts:check
pnpm test:ts-boundary
pnpm build:web
```

Phase 0B security vectors can also be run separately:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests/security -v
```

On the initial Windows host, async ASGI tests require permission for local
event-loop sockets. CI runs the same suite on Windows and Linux.

The local API and station stub need an explicit Test deployment identity:

```powershell
$env:CALOS_DEPLOYMENT_ID = '00000000-0000-4000-8000-0000000000a1'
$env:CALOS_ENVIRONMENT_KIND = 'test'
.\.venv\Scripts\uvicorn.exe calos_api.main:app --host 127.0.0.1 --port 18090
# In another terminal: Invoke-RestMethod http://127.0.0.1:18090/healthz
```

For the station stub, use `calos_station_agent.main:app` on port `18091` and
read `http://127.0.0.1:18091/local/v1/status`. For the React shell, run
`pnpm --dir apps/web dev --host 127.0.0.1` and open the URL printed by Vite.

## Disposable Docker rehearsal stacks

The following commands provision separate local random passwords and placeholder
key seeds. Those seeds are **not** trusted signing keys; no operational trust
provisioning is implemented. Docker was unavailable on the initial development host; the
commands below are exercised by the CI Compose job, not claimed locally.

```powershell
python tools/setup_rehearsal_secrets.py
python tools/check_isolation.py --with-secrets
docker compose -f deploy/test/compose.yaml config --quiet
docker compose -f deploy/prod-rehearsal/compose.yaml config --quiet
docker compose -f deploy/test/compose.yaml up -d --build db
docker compose -f deploy/test/compose.yaml run --rm migrate
docker compose -f deploy/test/compose.yaml run --rm migrate python tools/check_postgres.py
docker compose -f deploy/test/compose.yaml up -d --build api station_stub web
docker compose -f deploy/prod-rehearsal/compose.yaml up -d --build db
docker compose -f deploy/prod-rehearsal/compose.yaml run --rm migrate
docker compose -f deploy/prod-rehearsal/compose.yaml run --rm migrate python tools/check_postgres.py
docker compose -f deploy/prod-rehearsal/compose.yaml up -d --build api station_stub web
```

Test: API `http://127.0.0.1:18080/healthz`, station
`http://127.0.0.1:18081/local/v1/status`, web `http://127.0.0.1:18082`.
Production rehearsal uses ports `28080`, `28081`, and `28082` respectively.
Stop each with `docker compose -f <compose-file> down`; the data volumes are
retained unless explicitly removed.

## Scope

- `apps/api`: typed health route and read-only, authenticated package verification
  route that is unavailable without injected trust; no instrument or authoring endpoint.
- `apps/station-agent`: status route only; no VISA, broker, commands, or run path.
- `apps/web`: bilingual static shell rendering a schema-typed synthetic fixture.
- `schemas/manufacturer`, `fixtures/manufacturer`, `catalog/kinds.json`: one
  metadata kind and valid/invalid corpus. The type generator supports this
  closed-object subset only and fails on unsupported schema constructs.
- `packages/py/calos_metadata`: strict schema subset, canonical digest and
  bounded package parser; lifecycle ports only, with no published-version writes.
- `packages/py/calos_security`: pinned EdDSA JWT and Ed25519 package verifier
  against injected public trust snapshots, for simulation tests only.
- `packages/py/calos_domain`: deployment identity used by both verification
  boundaries.
- `deploy`: separate Compose rehearsal stacks and an Alembic migration with
  a tenant RLS probe table. It is not an application database model.

# Phase 0A implementation file manifest

The 42 supplied specification files are unchanged in content. `AGENTS.md` received only the Phase 0A command-status addendum. This list records every file added or amended after the specification baseline; the lockfiles and generated types are intentionally tracked.

| File | Phase 0A change |
| --- | --- |
| `.dockerignore` | Exclude local credentials, caches and build artifacts from Docker contexts. |
| `.github/workflows/phase0a.yml` | Run Python, TypeScript and two-stack Compose checks in CI. |
| `.gitignore` | Ignore credentials, local tooling, caches and generated build output. |
| `.importlinter` | Enforce Python package import contracts. |
| `AGENTS.md` | Add verified Phase 0A commands while retaining target-only status for later commands. |
| `README.md` | Document exact Windows setup, local routes and Docker rehearsal commands. |
| `apps/api/alembic.ini` | Configure the central Alembic migration runner. |
| `apps/api/calos_api/__init__.py` | Mark the API composition root. |
| `apps/api/calos_api/main.py` | Expose a deployment-bound, non-operational health route. |
| `apps/api/migrations/env.py` | Load deployment-specific PostgreSQL migration settings. |
| `apps/api/migrations/versions/0001_phase0a_probe.py` | Create a deployment identity row and tenant RLS probe table. |
| `apps/api/pyproject.toml` | Package FastAPI API dependencies. |
| `apps/station-agent/calos_station_agent/__init__.py` | Mark the simulated station composition root. |
| `apps/station-agent/calos_station_agent/main.py` | Expose simulated local status with no transport or command path. |
| `apps/station-agent/pyproject.toml` | Package the station stub dependencies. |
| `apps/web/index.html` | Mount the React shell. |
| `apps/web/package.json` | Define web build and development scripts. |
| `apps/web/src/App.tsx` | Render a bilingual synthetic metadata example and simulation warning. |
| `apps/web/src/main.tsx` | Mount the React application. |
| `apps/web/src/style.css` | Style the static shell with logical CSS properties. |
| `apps/web/tsconfig.json` | Enable strict TypeScript checking for the web app. |
| `catalog/kinds.json` | Register the first metadata kind as authored data. |
| `deploy/Dockerfile.api` | Build the isolated API and migration image. |
| `deploy/Dockerfile.station` | Build the simulator-only station image. |
| `deploy/Dockerfile.web` | Build and serve the static web shell. |
| `deploy/prod-rehearsal/compose.yaml` | Define the non-operational Production rehearsal project. |
| `deploy/setup-secrets.ps1` | Provide a PowerShell wrapper for disposable secret generation. |
| `deploy/test/compose.yaml` | Define the isolated Test project. |
| `docs/PHASE0A_STATUS.md` | Record acceptance evidence, unresolved decisions and explicit gaps. |
| `docs/PHASE0A_MANIFEST.md` | List each Phase 0A file and its purpose for review. |
| `eslint.config.mjs` | Enforce TypeScript rules and package boundaries. |
| `fixtures/manufacturer/invalid-missing-translation.json` | Reject missing bilingual authored content. |
| `fixtures/manufacturer/invalid-unknown-property.json` | Reject unknown schema properties. |
| `fixtures/manufacturer/valid.json` | Provide a conspicuously labeled synthetic demo metadata item. |
| `package.json` | Define root TypeScript checks and workspace scripts. |
| `packages/py/calos_domain/calos_domain/__init__.py` | Export deployment identity primitives. |
| `packages/py/calos_domain/calos_domain/deployment.py` | Compare deployment identities and reject mismatches. |
| `packages/py/calos_domain/pyproject.toml` | Package the dependency-free domain layer. |
| `packages/py/calos_metadata/calos_metadata/__init__.py` | Export metadata validation and canonicalization functions. |
| `packages/py/calos_metadata/calos_metadata/canonical.py` | Canonicalize metadata and compute a stable digest without floats. |
| `packages/py/calos_metadata/calos_metadata/generated/manufacturer.py` | Generated Python type for the manufacturer schema. |
| `packages/py/calos_metadata/calos_metadata/schema.py` | Validate the supported closed-object schema subset. |
| `packages/py/calos_metadata/pyproject.toml` | Package the metadata layer. |
| `packages/ts/domain-types/package.json` | Package generated TypeScript domain types. |
| `packages/ts/domain-types/src/index.ts` | Export generated types. |
| `packages/ts/domain-types/src/manufacturer.ts` | Generated TypeScript type for the manufacturer schema. |
| `packages/ts/domain-types/tsconfig.json` | Enable strict typing for generated domain types. |
| `pnpm-lock.yaml` | Pin TypeScript dependencies. |
| `pnpm-workspace.yaml` | Declare TypeScript workspace packages. |
| `pyproject.toml` | Declare Python workspace, tooling and unit-test configuration. |
| `schemas/manufacturer/v1.schema.json` | Define the first closed metadata JSON Schema. |
| `tests/unit/test_apps.py` | Check API and station stubs remain non-operational. |
| `tests/unit/test_boundaries.py` | Test import boundaries and forbidden model/vendor branches. |
| `tests/unit/test_deployment.py` | Test cross-deployment identity rejection. |
| `tests/unit/test_isolation.py` | Test static Compose resource separation. |
| `tests/unit/test_schema_contract.py` | Test fixtures, generated types, canonicalization and digest. |
| `tools/check.py` | Run the local schema, boundary, isolation, secret and unit checks. |
| `tools/check_boundaries.py` | Reject prohibited imports, eval, raw transport and model/vendor branches. |
| `tools/check_isolation.py` | Compare project names, databases, credentials, keys, ports and resources. |
| `tools/check_postgres.py` | Probe migrated PostgreSQL deployment identity and tenant RLS. |
| `tools/check_ts_boundary.mjs` | Run negative TypeScript boundary probes. |
| `tools/codegen.py` | Generate Python and TypeScript schema types and detect drift. |
| `tools/scan_secrets.py` | Run limited tracked-source secret pattern checks. |
| `tools/setup_rehearsal_secrets.py` | Create distinct ignored disposable credentials and placeholder seeds. |
| `uv.lock` | Pin Python dependencies. |

The original `CalOS-specs.zip` remains local and ignored because its extracted specification files are tracked. The handoff archive in Downloads was read, not copied into the repository. No generated secret directory or credential is tracked.


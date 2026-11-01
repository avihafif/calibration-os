# API_CONTRACT.md

| | |
|---|---|
| Status | Draft 0.2 — includes metadata-engine/builder APIs |
| Source of truth | FastAPI-generated **OpenAPI 3.1** committed at `apps/api/openapi.json`; this document defines conventions, resource semantics and invariants |
| Related | [ARCHITECTURE](ARCHITECTURE.md) · [NO_CODE_ARCHITECTURE](NO_CODE_ARCHITECTURE.md) · [SECURITY_MODEL](SECURITY_MODEL.md) |

There are four API surfaces:

| Surface | Base path | Consumers | Notes |
|---|---|---|---|
| **Central API** | `/api/v1` | Web shells (Admin, Builder), integrations | OIDC/local JWT |
| **Sync API** | `/api/v1/sync` | Station Agents only | Station token (client assertion) |
| **Station Local API** | `http://127.0.0.1:<port>/local/v1` | Operator shell on the station | Loopback + session token |
| **Plugin IPC** | local, see PLUGIN_SDK_SPEC §6 | Class B plugins ↔ agent | Not public |

> No endpoint of the Central API sends instrument commands to a station. The only central→station flows are *data* (signed manifests, config blobs, revocations) pulled by the station.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Media types | `application/json` (UTF-8); errors `application/problem+json` (RFC 9457); downloads as appropriate |
| Auth | `Authorization: Bearer <JWT>`; user tokens (OIDC or local), station tokens (client assertion exchange). Scopes derived from RBAC; **authorization is evaluated server-side per request** |
| Deployment & tenancy | Each installation is a **single deployment** (`GET /version` returns `deployment{id, environment_kind}`); tokens and signed metadata carry it and mismatches are rejected (`DEPLOYMENT_MISMATCH`). Tenant and lab come from token claims; clients may *narrow* via `X-CalOS-Lab`, never widen. RLS applies |
| IDs | UUIDv7 for entities; slugs for config `key`s; digests as `sha256:<hex>` |
| Time | RFC 3339 UTC; station events carry `wall_utc` + `monotonic_ns` |
| Decimals | **Strings** for all metrological values (`{"value":"1.0000","unit":"V"}`) |
| Pagination | Cursor-based: `?limit=50&cursor=<opaque>` → `{ "items":[…], "next_cursor":"…" }` |
| Filtering/sorting | `?filter[field]=…&sort=-created_at` documented per resource |
| Concurrency | Mutable resources return `ETag`; updates require `If-Match`; mismatch → `412` (or `409` for drafts with revision conflict body) |
| Idempotency | `Idempotency-Key` header on non-idempotent POSTs (publish, approve, assign, create run, generate report). Server stores `(key, request hash) → response` for ≥24h; same key + different body → `422 idempotency_key_reuse` |
| Long operations | `202 Accepted` + `Location: /api/v1/jobs/{id}`; job states `queued|running|succeeded|failed|cancelled` |
| Versioning | URL major. Additive changes only within major. Deprecations signaled with `Deprecation` and `Sunset` headers (RFC 8594); N-1 supported for the documented window |
| Rate limits | Per principal; `429` with `Retry-After`; station sync has separate budget |
| Correlation | `traceparent` accepted/propagated; `X-Request-Id` echoed |
| Localization | `Accept-Language` selects message language for `title/detail`; error `code` is stable and locale-independent |
| Simulation flags | Any resource derived from a simulation run includes `"simulated": true`; list endpoints support `filter[simulated]`. Production listings exclude simulated by default. |

### 1.1 Error model

```json
{
  "type": "https://docs.calos.example/errors/draft-revision-conflict",
  "title": "Draft was modified by someone else",
  "status": 409,
  "code": "DRAFT_REVISION_CONFLICT",
  "detail": "Base revision 14, current revision 16.",
  "instance": "/api/v1/config/drafts/…",
  "correlation_id": "…",
  "errors": [ { "pointer": "/content/lifecycle/phases/0", "code": "PR-003", "message": "…" } ],
  "extensions": { "current_revision": 16 }
}
```

Stable error codes (non-exhaustive): `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `DRAFT_REVISION_CONFLICT`, `DRAFT_LEASE_HELD`, `VERSION_IMMUTABLE`, `SEPARATION_OF_DUTIES`, `APPROVAL_DIGEST_MISMATCH`, `DEPENDENCY_UNPUBLISHED`, `DEPENDENCY_CYCLE`, `INCOMPATIBLE_TARGET`, `SAFETY_PROFILE_REQUIRED`, `HAZARD_PERMISSION_REQUIRED`, `SIMULATION_NOT_APPROVABLE`, `PRODUCTION_CONTENT_NOT_APPROVED`, `ENVIRONMENT_MISMATCH`, `SYNC_GAP`, `SYNC_DUPLICATE`, `SYNC_INTEGRITY_CONFLICT`, `LEASE_CONFLICT`, `STATION_REVOKED`, `IDEMPOTENCY_KEY_REUSE`, `RATE_LIMITED`, `PRODUCTION_CHANGE_CONTROL`, `DEPLOYMENT_MISMATCH`, `RELEASE_ISSUER_UNTRUSTED`, `RELEASE_VALIDATION_FAILED`, `ROLE_CONFLICT`, `HARDWARE_LIMIT_EXCEEDED`, `HARDWARE_LIMITS_MISSING`, `HARDWARE_LIMITS_INVALID`.

---

## 2. Central API

### 2.1 Identity, tenancy, administration

| Method & path | Purpose | Permission |
|---|---|---|
| `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` | Local auth | public / session |
| `GET /auth/oidc/authorize` · `GET /auth/oidc/callback` | OIDC code+PKCE | public |
| `GET /me` | Principal, roles, scopes, effective permissions | any |
| `GET/POST /labs` · `GET/PATCH /labs/{id}` | Laboratories | `lab.admin` |
| `GET/POST /users` · `GET/PATCH /users/{id}` · `POST /users/{id}/deactivate` | Users | `user.admin` |
| `GET/POST /roles` · `GET/PATCH /roles/{id}` | Custom roles from permission set | `role.admin` |
| `GET/PUT /users/{id}/authorizations` | Competence matrix | `lab.manager` |
| `GET/PUT /policies/{key}` | Lab policies (also available as `Policy` config items; see §2.3) | `policy.edit` |
| `GET/POST /stations` · `GET/PATCH /stations/{id}` | Stations | `station.admin` |
| `POST /stations/enrolment-tokens` | One-time enrolment token | `station.admin` |
| `POST /stations/{id}/revoke` | Revoke | `station.admin` |
| `GET /stations/{id}/capability-report` | Last reported capabilities | `station.view` |
| `GET /audit` | Query audit (filters: actor, entity, action, time) | `audit.view` |
| `GET /audit/verify?from=&to=` | Chain verification result | `audit.view` |
| `POST /audit/export` | Job → JSON/CSV with chain proof | `audit.export` |

### 2.2 Equipment, standards, customers, jobs

| Method & path | Purpose |
|---|---|
| `GET/POST /assets` · `GET/PATCH /assets/{id}` | Instrument assets (unique mfr+model+serial per tenant); simulated identities rejected (`422`) |
| `GET/POST /standards` · `GET/PATCH /standards/{id}` | Reference standards; status transitions audited |
| `GET/POST /standards/{id}/certificates` | Certificate records (immutable once referenced by an approved snapshot) |
| `GET /standards/validity?role=&at=` | Validity evaluation (overdue/withdrawn/capability) |
| `GET/POST /customers` · `GET/PATCH /customers/{id}` | Customers |
| `GET/POST /jobs` · `GET/PATCH /jobs/{id}` | Calibration jobs |

### 2.3 Configuration (metadata engine)

| Method & path | Purpose | Permission (see GOVERNANCE §2) |
|---|---|---|
| `GET /config/kinds` · `GET /config/kinds/{kind}` | Kind registry (schema URLs, editor hints, approval policy) | `config.view` |
| `GET /config/kinds/{kind}/schema?v=` | JSON Schema for a kind/version | `config.view` |
| `GET /config/catalog` | Building-block catalog (with origin, version, schemas) | `config.view` |
| `GET /config/items?kind=&q=&status=&label=` | Items (latest versions summary) | `config.view` |
| `POST /config/items` | Create item + initial draft `{kind,key,scope,content?}` | `config.draft.<kind-group>` |
| `GET /config/items/{id}` | Item + version list | `config.view` |
| `GET /config/items/{id}/versions` · `GET /config/versions/{vid}` | Immutable versions (content, digest, deps, approvals) | `config.view` |
| `GET /config/versions/{vid}/diff?against=` | Kind-aware structural diff | `config.view` |
| `GET /config/versions/{vid}/dependencies` · `/dependents` | Forward / reverse deps | `config.view` |
| `GET /config/versions/{vid}/impact` | Impact analysis: dependents, packages, assignments, stations, in-flight runs, approved results | `config.view` |
| `GET /config/items/{id}/draft` | Current draft (content, revision, lease, validation) | `config.draft.*` |
| `POST /config/items/{id}/draft/lease` · `DELETE …/lease` · `POST …/lease/takeover` | Edit lease | `config.draft.*` / `config.lease.takeover` |
| `PATCH /config/drafts/{id}` | Apply **JSON Patch** operations with `base_revision` (body `{base_revision, ops[], label?}`) → new `revision` | lease holder |
| `POST /config/drafts/{id}/fork` | New draft from this draft/version | `config.draft.*` |
| `POST /config/drafts/{id}/merge` | Three-way structural merge result application | lease holder |
| `POST /config/drafts/{id}/validate` | Run publish pipeline stages without publishing → `Validation` result (findings with codes, pointers) | `config.draft.*` |
| `POST /config/drafts/{id}/changesets` | Atomic multi-item edits | lease holders |
| `POST /config/drafts/{id}/submit` | Freeze `ReviewSnapshot`, state → in_review; returns `snapshot_digest` | `config.submit` |
| `POST /config/review/{snapshot}/approve` · `/reject` | Body `{digest, reason}`; digest must equal snapshot (`APPROVAL_DIGEST_MISMATCH`); SoD enforced | `config.approve.<kind-group>` |
| `POST /config/review/{snapshot}/publish` | Pins deps, assigns SemVer ≥ computed minimum, creates immutable `ConfigVersion` (**Idempotency-Key**) | `config.publish` |
| `POST /config/versions/{vid}/deprecate` · `/withdraw` | Lifecycle forward transitions with reason | `config.deprecate` / `config.withdraw` |
| `POST /config/versions/{vid}/migrate` | Create new draft migrated to latest `schema_version` | `config.draft.*` |
| `POST /config/packages` | Build package from `ApplicationManifest` version → `AppPackage` (signed) | `package.build` |
| `GET /config/packages/{id}` · `/download` | Package metadata / `.calapp` | `package.export` |
| `POST /config/packages/import` | Upload `.calapp`; verifies signature, digests, schemas, compat; **Test deployments only** (Production accepts packages solely via `/releases/import`); creates versions as `imported` drafts-free items pending approvals | `package.import` |
| `GET /config/compat?package=&target=` | Compatibility matrix | `deploy.view` |
| `GET/POST /deployments` | Assignments: `{package_id, target:{lab|group|station}, channel, activation}` (**Idempotency-Key**) | `deploy.assign` |
| `POST /deployments/{id}/rollback` | Re-point target to an earlier approved version (new assignment event) | `deploy.rollback` |
| `GET /deployments/{id}/status` | Per-station state: pending / staged / active / failed | `deploy.view` |
| `POST /releases` | **Test:** create Release Candidate from a published package version + evidence | `release.create` |
| `POST /releases/{id}/approve` · `/reject` | **Test and Production (independent):** approve/reject on digest; SoD | `release.approve.test` / `release.approve.prod` |
| `POST /releases/{id}/export` | **Test:** build signed Release Package (download) | `release.export` |
| `POST /releases/import` | **Production:** upload Release Package → verify issuer/signature/digests/schemas/compat → state `imported` (**Idempotency-Key**) | `release.import` |
| `GET /releases` · `GET /releases/{id}` | Release records, validation findings, approvals, resulting versions | `deploy.view` |
| `POST /releases/{id}/validate` | **Production:** (re)run production-mode validation | `release.import` |
| `POST /releases/{id}/release` | **Production:** after independent approvals, create versions (`origin=release`) | `release.import` |
| `POST /config/backups` · `GET /config/backups` · `POST /config/backups/{id}/restore` | Config snapshot backups (signed export) | `backup.manage` |

> **Production deployments** return `403 PRODUCTION_CHANGE_CONTROL` for every authoring route in this section (`/config/items` POST, `/config/*/draft*`, `/config/drafts/*`, `/config/packages` build, `/builder/*`). Allowed in Production: reads, `/releases/*`, `/deployments*`, version withdraw/deprecate, change requests, access administration.

**Draft patch example**
```http
PATCH /api/v1/config/drafts/0191…  
If-Match: "rev-14"
{ "base_revision": 14,
  "label": "Add settle delay",
  "ops": [ {"op":"add","path":"/content/lifecycle/phases/0/body/2","value":{"id":"settle","type":"flow.delay","duration":{"value":"1","unit":"s"}}} ] }
```
→ `200 { "revision": 15, "validation": {"state":"errors","findings":[…]} }`

**Publish response (excerpt)**
```json
{ "version_id":"…","key":"dmm-dcv-verification","version":"1.1.0","change_class":"functional",
  "content_digest":"sha256:…","deps":[{"kind":"DriverDefinition","key":"…","version":"1.2.0","digest":"sha256:…"}],
  "approvals":[{"role":"metrology.approve","by":"…","at":"…"}] }
```

### 2.4 Builder services

| Method & path | Purpose |
|---|---|
| `POST /builder/expr/check` | Type/dimension check an expression with a declared scope → `{ok, type, ast, errors[]}` (debounced from UI) |
| `POST /builder/expr/eval` | Evaluate in a *preview* context (simulation/what-if only; marks `preview:true`; no production data) |
| `POST /builder/simulations` | Start a Simulation Lab run of a draft/version (`{target, scenario, faults[], breakpoints[], overrides}`) → job; engine+simulator on workers, **no instrument I/O** |
| `GET /builder/simulations/{id}` · `/events` (SSE) | State, journal events, variables |
| `POST /builder/simulations/{id}/control` | `{cmd: step|continue|pause|abort|set_breakpoint|inject_fault}` |
| `POST /builder/app-tests/run` | Run `ApplicationTest`s for a draft/package → results |
| `POST /builder/report-preview` | Render a draft template with sample or scenario dataset (always watermark-injected) → PDF/PNG |
| `POST /builder/ui-preview-context` | Provide sample data context for UI preview |
| `POST /builder/test-bundles` | Create signed **test bundle** (draft driver/app) bound to **one station** for local-only communication testing; delivered via the normal outbound pull; test execution happens in the station's local UI (central never sends instrument commands) |
| `POST /builder/translations/check` | Completeness / glossary check for locales |
| `GET /builder/lint-catalog` | Lint/validation code catalog |

### 2.5 Runs, results, reports

| Method & path | Purpose |
|---|---|
| `GET /runs?filter[station]=&filter[state]=&filter[mode]=&filter[simulated]=` | Synced runs (read-only) |
| `GET /runs/{id}` | Run, binding, projections |
| `GET /runs/{id}/events?after_seq=` | Journal events (verified chain) |
| `GET /runs/{id}/readings` · `/evidence` · `/evaluations` | Data |
| `GET /runs/{id}/verify` | Chain verification result |
| `POST /runs/{id}/result-revisions` | Create revision (submit) — rejects simulation as calibration with `SIMULATION_NOT_APPROVABLE` for approval transitions |
| `GET /result-revisions/{id}` · `/snapshot` | Revision + sealed snapshot |
| `POST /result-revisions/{id}/review` · `/approve` · `/reject` · `/withdraw` | Review workflow (SoD) (**Idempotency-Key** on approve) |
| `POST /result-revisions/{id}/supersede` | Create correction revision (reason required) |
| `POST /reports` | `{result_revision_id|run_id, kind:"draft"|"issued", locale}` → job; issued only from approved, non-simulation revisions |
| `GET /reports/{id}` · `/download` | Report instance + PDF |
| `GET /reports/{id}/provenance` | Template/dataset/renderer digests |

### 2.6 Plugin (Class B) registry

| Method & path | Purpose |
|---|---|
| `GET /plugins` · `GET /plugins/{id}/versions` | Registry |
| `POST /plugins/{id}/versions` | Upload `.calplug` for review (verifies signature chain) |
| `POST /plugins/versions/{vid}/review` | Security review result (approve/reject) |
| `POST /plugins/versions/{vid}/enable` | Lab enablement (capability review recorded) |
| `POST /plugins/versions/{vid}/revoke` | Revocation → feed |

### 2.7 Safety, change control and privileged grants

| Method & path | Purpose | Permission |
|---|---|---|
| `GET /safety/hardware-limits` · `GET /safety/hardware-limits/{digest}` | Installed Hardware Limits Pack(s): entries, expiry, signatures, status (**read-only**) | `config.view` |
| `GET /safety/effective-limits?model=&command=` | Effective limit = AHL ∩ Safety Profile ∩ bounds (inspection) | `config.view` |
| `POST /safety/hardware-limits/candidates` · `GET …/candidates/{id}/export` | **Test:** author/export an unsigned pack candidate for offline threshold signing | `hardware_limits.candidate` |
| `POST /safety/hardware-limits/import` | Import a signed pack (verifies `hardware-limits` role, threshold, expiry, monotonic version); **no edit endpoints exist** | `deploy.assign` + signature validity |
| Safety Profiles | Managed through generic `/config/*` endpoints for kind `SafetyProfile`; create/edit require `safety.manage`, approve `safety.approve` (+ `safety.approve.compliance` when classified), withdraw `safety.withdraw` | see GOVERNANCE |
| `POST /change-requests` · `GET /change-requests` · `POST /change-requests/{id}/approve|reject|apply` | Production Change Requests for non-content settings | `change.request` / `change.approve` |
| `GET/PUT /deployment/trusted-issuers` (PUT creates a proposal) · `POST …/{id}/approve` | Trusted Release Issuers under dual control | `trust.issuer.propose` / `trust.issuer.approve` |
| `POST /users/{id}/role-grants` · `POST /role-grants/{id}/approve|reject` | Privileged grants with dual control and toxic-combination validation (`ROLE_CONFLICT`) | `grant.propose` / `grant.approve` |

### 2.8 Operations
`GET /healthz` · `GET /readyz` · `GET /metrics` (internal network only) · `GET /jobs/{id}` · `GET /version` (platform, schema versions, catalog versions).

---

## 3. Sync API (stations only)

All requests: station token; `X-Station-Id`; `traceparent`. Station may only act within its pinned deployment, tenant and lab; any other deployment identity yields `DEPLOYMENT_MISMATCH`.

| Method & path | Purpose |
|---|---|
| `POST /sync/hello` | Station → capability report, agent version, `sync_protocol`; server → negotiated protocol, server time (skew), policy snapshot, feed cursor hint |
| `GET /sync/changes?cursor=&limit=` | **Downstream change feed**: signed assignment manifests, master data changes (standards status, policies, users/offline grants), revocations, tombstones. Response includes `next_cursor`, TUF-style metadata refs |
| `GET /sync/blobs/{digest}` | Content-addressed config/blob download (Range supported) |
| `POST /sync/runs/{run_id}/claim` | Request lease for a run created offline → `{epoch}` or `409 LEASE_CONFLICT` |
| `POST /sync/runs/{run_id}/events` | Upload ordered events `[ {event…} ]` (≤ batch limit) → `{acked_seq}`; errors `SYNC_GAP{expected_seq}`, `SYNC_INTEGRITY_CONFLICT` |
| `PUT /sync/uploads/{upload_id}/chunks/{n}` · `POST /sync/uploads` · `POST /sync/uploads/{id}/complete` | Chunked evidence upload with per-chunk and final digest |
| `POST /sync/activations` | Report staged/active/failed for assignments (idempotent by `(assignment_id, station_id, state)`) |
| `POST /sync/diagnostics` | Upload diagnostics bundle on request |
| `GET /sync/conflicts` | Conflicts concerning this station (read-only) |

**Event upload example**
```json
POST /api/v1/sync/runs/0191…/events
{ "events": [
  { "event_id":"0191…a1","seq":128,"type":"reading.recorded","event_schema":1,
    "occurred":{"wall_utc":"2026-11-01T10:15:30.123Z","monotonic_ns":123456789,"boot_id":"…"},
    "pins":{"procedure":"sha256:…","config_manifest":"sha256:…"},
    "payload":{"node_id":"read","reading_id":"…","raw":"…","value":{"value":"…","unit":"V"},"flags":{"simulated":true}},
    "prev_hash":"sha256:…","hash":"sha256:…" } ] }
```
→ `200 {"acked_seq":128}`

**Server verification on upload:** station scope → lease epoch → `seq == acked+1` → `prev_hash` continuity → recomputed `hash` → schema validation of payload per `event_schema` → pins reference known/allowed digests (else `stale_basis`/`unknown_config` conflict, still stored in quarantine) → append → project.

---

## 4. Station Local API (`/local/v1`)

Auth: per-session token (header `X-Local-Session`), bound to an OS-user-initiated sign-in (online-verified or offline grant); `Host`/`Origin` allow-list enforced.

| Method & path | Purpose |
|---|---|
| `GET /status` | Agent version, **deployment identity**, mode (online/offline), hardware-limits pack status, sync state, active config manifest, staleness gate state, disk, clock skew |
| `POST /auth/login` · `POST /auth/logout` | Operator sign-in (online or offline grant) |
| `POST /instruments/discover` | Start discovery `{scope:{transports[],resources?[]}}` → job |
| `GET /instruments` | Discovered/known instruments with identity result and **simulated** flag |
| `POST /instruments/{id}/verify` | Verify identity against a model/procedure → `exact|partial|mismatch|unreachable` |
| `GET /applications` | Installed active applications (from active manifest) with compatibility state |
| `GET /procedures?model=` | Runnable procedure versions for a model |
| `POST /runs` | Create run `{procedure_ref, instrument_id, standards_binding, job_id?, mode}` → preflight |
| `GET /runs` · `GET /runs/{id}` | Local runs (incl. interrupted) |
| `POST /runs/{id}/start` · `/pause` · `/resume` · `/abort` | Control; resume returns reconcile plan and any required decisions |
| `POST /runs/{id}/decisions/{decision_id}` | Operator decision for non-repeatable nodes after interruption |
| `GET /runs/{id}/events` (SSE) | Live events (UI updates, prompts) |
| `POST /runs/{id}/prompts/{prompt_id}/respond` | Respond to operator prompt |
| `POST /runs/{id}/evidence` | Attach evidence (file/photo/value) |
| `GET /runs/{id}/ui-model` | Resolved UI model for the current node (renders from UI config + data context, evaluated on host) |
| `POST /runs/{id}/draft-report` | Generate draft report (local renderer) → PDF |
| `GET /runs/{id}/verify` | Local chain verification |
| `POST /sync/trigger` · `GET /sync/status` | Manual sync trigger / status |
| `GET /config/active` | Active/staged manifests and versions |
| `POST /diagnostics/bundle` | Produce diagnostics bundle |
| `POST /driver-diagnostics/session` | **Engineer-only** driver communication test session (H0 default) using test bundles; audited; refused while a production run holds the resource |

Preflight response includes each gate: `{id, status: pass|warn|block, message, source_ref}` — standards validity, config status (`synthetic_demo`/`unapproved` vs mode), safety profile **and Absolute Hardware Limits** coverage, deployment identity/run-mode permitted, compatibility, operator authorization, staleness gate, resource availability.

---

## 5. Contract governance

| Item | Rule |
|---|---|
| Spec generation | OpenAPI generated from code (Pydantic models derived from `schemas/`), committed, reviewed in PRs |
| Breaking-change detection | `oasdiff` in CI blocks removals/renames/type narrowing within `/v1` |
| Fuzz/contract tests | Schemathesis against a seeded instance; stateful flows for draft→publish and sync |
| Client generation | `packages/ts/api-client` generated; hand edits fail drift check |
| Deprecation | Announce ≥ policy window; `Deprecation`/`Sunset` headers; UI warnings |
| Sync protocol | Separate integer version; negotiated in `hello` |

## 6. API acceptance criteria

| ID | Criterion |
|---|---|
| AC-API-01 | Every mutating endpoint declares required permission; a generated test calls each with an unprivileged principal and asserts `403`. |
| AC-API-02 | Cross-tenant and cross-lab calls (by id guessing) return `404`/`403` without information leakage for every resource type. |
| AC-API-03 | Publishing the same draft twice with the same `Idempotency-Key` creates exactly one version; with a different key returns `VERSION_IMMUTABLE` or conflict. |
| AC-API-04 | Approval with a stale `digest` fails with `APPROVAL_DIGEST_MISMATCH`. |
| AC-API-05 | Event upload replay produces identical `acked_seq` and no duplicates; gap, duplicate-different-hash and lease-conflict paths return the specified codes. |
| AC-API-06 | No Central API operation can cause bytes to be written to an instrument transport (verified by architecture test AC-ARCH-04 and network policy test). |
| AC-API-08 | In a Production deployment every authoring route returns `PRODUCTION_CHANGE_CONTROL`; Release import with an untrusted issuer, bad signature, or `synthetic_demo` content is rejected with the specified code. |
| AC-API-09 | No endpoint creates, updates or deletes Hardware Limits Pack entries; only signed-pack import exists, and invalid/expired/downgraded packs are rejected. |
| AC-API-10 | Role-grant APIs reject toxic combinations and require a distinct approver for privileged roles. |
| AC-API-07 | Simulation-derived resources always return `simulated:true`, and `/reports` with `kind=issued` for them returns `SIMULATION_NOT_APPROVABLE`. |

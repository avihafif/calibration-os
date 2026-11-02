# 08 — API requirements for Phase 1

| | |
|---|---|
| Status | Proposal. Source of truth remains the FastAPI-generated OpenAPI (`apps/api/openapi.json`); `API_CONTRACT.md` defines conventions and semantics. This document (a) maps screens to existing endpoints, (b) proposes additions the UX needs (F-19), (c) lists error codes and permissions. |
| Rules reused | `API_CONTRACT §1` conventions apply to every addition: problem+json, ETag/`If-Match`, `Idempotency-Key` on non-idempotent POSTs, cursor pagination, UTC RFC 3339, decimals as strings, `simulated:true` propagation, `traceparent`. **No endpoint sends instrument commands from central** (AC-API-06). In Production all authoring routes return `PRODUCTION_CHANGE_CONTROL`. |

## 1. Contract-first workflow for Phase 1

1. Add/change the endpoint in the OpenAPI source (Pydantic models derived from `schemas/` where applicable).
2. `oasdiff` blocks breaking changes inside `/v1`; `codegen` regenerates `packages/ts/api-client` (hand edits fail drift check).
3. Each mutating endpoint declares its permission; the generated test asserts `403` for an unprivileged principal (AC-API-01) and cross-tenant `404/403` (AC-API-02).
4. Schemathesis stateful flows: draft → validate → submit → approve → publish; release flow; grant flow.

## 2. Screen → endpoint map (existing contract)

| Screen | Reads | Writes / actions |
|---|---|---|
| SCR-01 Builder Home | `GET /me`, `GET /config/items`, `GET /releases`, `GET /audit`, `GET /version` + **`GET /me/work-queue`** (new) | — |
| SCR-02 Library | `GET /config/items`, `GET /config/packages/{id}`, `GET /config/versions/{vid}/impact` + **`GET /library/entries`** (new) | `POST /config/packages/import` (Test), `POST /config/drafts/{id}/fork`, `POST /config/packages` (export build) |
| SCR-03 App Builder | `GET /config/items/{id}`, `/draft`, `/versions`, `GET /config/compat`, `GET …/impact`, `GET …/dependencies` | `PATCH /config/drafts/{id}`, `POST …/validate`, `POST …/submit`, `POST /config/review/{snapshot}/publish`, `POST /builder/app-tests/run` |
| SCR-04 Procedure Designer | `GET /config/catalog`, `GET /config/kinds/{kind}/schema` | `PATCH /config/drafts/{id}`, `POST /builder/expr/check|eval`, `POST /builder/simulations`, `…/control`, `GET …/events` (SSE) |
| SCR-05 Instrument Mgr (Builder) | `GET /config/items?kind=…` | `PATCH /config/drafts/{id}`; **`POST /builder/driver/format-preview`, `/parse-preview`** (new); `POST /builder/simulations` (conversation mode) |
| SCR-05c Discovery (Station) | Local `GET /instruments` | Local `POST /instruments/discover`, `/{id}/verify` |
| SCR-06 Stations | `GET /stations`, `GET /stations/{id}/capability-report` | `POST /stations/enrolment-tokens`, `POST /stations/{id}/revoke` |
| SCR-07 Runner (Station) | Local `GET /applications`, `/procedures`, `/runs/{id}`, SSE events, `/ui-model` | Local `POST /runs`, `/start|pause|resume|abort`, `/decisions/{id}`, `/prompts/{id}/respond`, `/evidence` |
| SCR-08 Results | Local `GET /runs/{id}`, `/verify`; central `GET /runs/{id}/readings|evaluations|evidence` | Local `POST /runs/{id}/draft-report` |
| SCR-09 Report Designer | `GET /config/kinds/report-template…`, dataset contract via `/config/items` | `PATCH /config/drafts/{id}`, `POST /builder/report-preview`, `POST /builder/translations/check` |
| SCR-10 Admin | `GET /users`, `/roles`, `/audit`, `/audit/verify`, `GET/PUT /policies/{key}`, `GET/PUT /deployment/trusted-issuers` | `POST /users`, `POST /users/{id}/role-grants`, `POST /role-grants/{id}/approve|reject`, `POST /change-requests`… |
| SCR-11 Safety Console | `GET /safety/hardware-limits`, `/effective-limits`, `GET /config/…SafetyProfile` | `/config/*` for `SafetyProfile` with `safety.*` permissions; `POST /safety/hardware-limits/candidates` (Test, stub in P1) |
| SCR-12 Release console | `GET /releases`, `/releases/{id}` + **`GET /releases/{id}/findings`, `GET /deployment/drift`** (new) | `POST /releases`, `/approve|reject`, `/export`, `/import` (Prod), `/validate`, `/release`, `POST /deployments`, `/deployments/{id}/rollback` |
| SCR-13 Simulation Lab | `GET /builder/simulations/{id}`, `/events` | `POST /builder/simulations`, `/control` |
| SCR-14 Review queue | **`GET /me/work-queue`**, `GET /config/versions/{vid}/diff`, `…/impact` | `POST /config/review/{snapshot}/approve|reject` |

## 3. Proposed additions

Permissions follow GOVERNANCE §2.1; "any" = authenticated principal with tenant/lab scope. All are additive within `/api/v1`.

| # | Method & path | Purpose | Permission | Notes |
|---|---|---|---|---|
| A1 | `GET /me/work-queue` | One aggregate for Home/Review: my drafts (with revision, validation state, lease), leases expiring, snapshots awaiting *my* approval (with required roles and SoD flag), my recent validation failures, readiness blocker counts (Input required / `synthetic_demo` / `pending_review` / unverified commands), release counts | any | RLS-scoped; one request per page load |
| A2 | `GET /search?q=&types=item,version,mi,screen&limit=` | Universal search / command palette: key, title, label, MI-id, screen names | any (filtered by permission) | Never leaks cross-tenant existence |
| A3 | `GET /metrology/inputs` · `GET /metrology/inputs/{id}` | Read-only Unknown-Inputs register view (id, title, status, owner role, gate) to resolve *Input required · MI-nn* badges | `config.view` | Data is **human-maintained platform content** derived from `METROLOGY §12`; the API invents nothing |
| A4 | `POST /config/media` · `GET /config/media/{id}` | Upload logos/images/fonts with allow-listed MIME + size limits; async scan job; content-addressed; returns `media_id`/digest | `config.draft.<group>` | Named `media` to avoid collision with equipment `/assets` (F-15) |
| A5 | `POST /config/items/{id}/draft/lease/heartbeat` · `GET /config/items/{id}/draft/presence` | Lease renewal; presence list (display name + role only) | lease holder / `config.view` | Defaults in 06 §5.4 |
| A6 | `POST /config/drafts/{id}/validate` → `202 Location: /jobs/{id}`; `GET /config/drafts/{id}/validation` | Run pipeline as a job; fetch last result (findings: stage, code, severity, pointer, fix) | `config.draft.*` | SSE `…/validation/stream` optional; polling fallback |
| A7 | `GET /config/versions/{vid}/validation-report` | Archived report bound to `validation_report_digest` | `config.view` | Shown in review/release |
| A8 | `GET /config/versions/{vid}/hazard-path` | Ordered H2+ operations with Safety Profile / AHL coverage state | `config.view` | Review screen |
| A9 | `POST /builder/driver/format-preview` | Pure: `{driver_ref|inline, command, args}` → wire text or rejection reasons (injection, bounds, dimension). **No transport, no I/O** | `driver.test` | Uses production formatter |
| A10 | `POST /builder/driver/parse-preview` | Pure: `{parser, sample}` → typed result or error | `driver.test` | Stores nothing; vectors saved via draft patch |
| A11 | `POST /builder/simulations` with `mode: "conversation"` | Interactive terminal against `SimulationProfile` | `driver.test` | Simulator transport only (NFR-20) |
| A12 | `POST /builder/ui/generate` | Generate default `UiPage` base from a procedure (same generator as runtime) | `config.draft.ui` | Deterministic |
| A13 | `GET /ui/layers/resolve?target=` | "Why is this shown?" — layer resolution chain | `config.view` | |
| A14 | `GET /library/entries` | View over applications, shared components, imported releases with trust tier, intended modes, requirements, counts of provenance statuses | `config.view` | Deployment-local only |
| A15 | `POST /config/packages/inspect` | Upload `.calapp` → verification + closure report **without importing** | `package.import` | Test only; Production uses `/releases/import` |
| A16 | `GET /config/compat/stations?package=` | Compatible/incompatible-with-reason list per enrolled station | `deploy.view` | Complements `GET /config/compat` |
| A17 | `GET /stations/{id}/activation-history` | Staged/active/failed with reasons | `station.view` | |
| A18 | `GET /releases/{id}/findings` · `GET /deployment/drift` | Verification/validation findings by stage; Test-vs-Production digest drift | `deploy.view` | Drift compares digests supplied via release records only (no cross-deployment link) |
| A19 | `POST /auth/step-up` | Re-authenticate for a specific action; returns short-lived token bound to `{action, digest, user}` | session | Required for approve/publish/rollback/safety/release (SECURITY_MODEL §4) |
| A20 | `GET /permissions` · `GET /roles/matrix` · `POST /users/{id}/role-assignments/validate` | Permission catalog, role×permission matrix, dry-run toxic-combination check for live UX | `role.admin` / `grant.propose` | Dry run writes nothing; authoritative check repeats on apply |
| A21 | `GET /me/inbox` · `POST /me/inbox/{id}/read` | In-app notifications (review requests, lease takeover, conflicts) | any | |
| A22 | `POST /telemetry/ux` | Batch UX events (task completion, validation-error classes); schema-validated; **no content values** | any | Opt-in/opt-out per D-17; off by default in Production |
| A23 | `GET /config/items/{id}/blame?pointer=` | "Who changed this field and when" | `config.view` | Backs History/blame panel |
| A24 | `GET /config/catalog?availability=` | Catalog entries with availability flags (`available|deferred`) for the palette | `config.view` | Palette "Not yet available" group |

Station Local API deltas: none required beyond `API_CONTRACT §4`; the Runner needs `GET /runs/{id}/resume-plan` (explicit read of the engine-computed reconcile plan so AC-UX-07 can be contract-tested) — **A25**: `GET /runs/{id}/resume-plan` (Local, operator authorization).

## 4. Error codes

Existing codes in `API_CONTRACT §1.1` are unchanged except as noted. Proposed changes:

| Code | HTTP | Meaning | Status |
|---|---|---|---|
| `ENVIRONMENT_MISMATCH` | 403 | Duplicate of `DEPLOYMENT_MISMATCH` | **Deprecate** (F-20) |
| `VERIFIER_UNAVAILABLE` | 503 | No trust material provisioned (Phase 0B) | Add |
| `STEP_UP_REQUIRED` | 401 | Governed action needs step-up token | Add |
| `STEP_UP_INVALID` | 403 | Token expired, wrong action/digest, or different user | Add |
| `LEASE_EXPIRED` | 409 | Save after lease expiry (client must reacquire / rebase) | Add |
| `MEDIA_REJECTED` | 422 | Type/size/scan failure | Add |
| `FEATURE_NOT_AVAILABLE` | 403 | Capability disabled in this phase/deployment (e.g., issued reports in P1) | Add |
| `APP_TEST_REQUIRED` | 422 | Publish blocked: no passing `ApplicationTest` | Add (maps to `APP-003`) |
| `PUBLISH_BLOCKED` | 422 | Aggregate for production-readiness failures with child findings | Add (maps to `APP-004`) |

Problem+json `errors[]` entries carry `pointer`, `code`, `message` and optional `fix`; titles/details localised by `Accept-Language`; `code` stable.

## 5. Permission and SoD matrix for Phase 1 UI actions

| Action (UI) | Required permission(s) | Server-enforced rules |
|---|---|---|
| Create/edit draft | `config.draft.<group>` (+ `driver.author[.hazardous]`, `safety.manage`) | Lease holder; Production → `PRODUCTION_CHANGE_CONTROL` |
| Submit | `config.submit` | Draft must pass blocking validation; freezes digest |
| Review comment | `config.review` | |
| Approve / reject | `config.approve.<group>`, `metrology.approve`, `safety.approve`, `safety.approve.compliance` per class | Approver ≠ author/contributor (`SEPARATION_OF_DUTIES`); digest must match (`APPROVAL_DIGEST_MISMATCH`); step-up |
| Publish | `config.publish` | All required approvals on the same digest; Idempotency-Key; SemVer ≥ computed minimum |
| Deprecate / withdraw | `config.deprecate` / `config.withdraw`, `safety.withdraw` | Withdraw with in-flight runs → break-glass only; audited |
| Build/export package | `package.build` / `package.export` | Test only |
| Import `.calapp` | `package.import` | Test only; signature/digest/schema/compat verified; unsigned blocked in P1 |
| Release candidate / export | `release.create` / `release.export` | Test only |
| Release approve | `release.approve.test` / `release.approve.prod` | Independent per deployment; importer ≠ approver |
| Release import / validate / release | `release.import` | Production only; issuer ∈ Trusted Release Issuers |
| Assign / rollback | `deploy.assign` / `deploy.rollback` | Rollback target must be approved & non-withdrawn; `stable` needs canary sign-off |
| Role grant | `grant.propose` / `grant.approve` | Toxic-combination validator (`ROLE_CONFLICT`); approver ≠ grantor, grantee; step-up |
| Trusted issuer | `trust.issuer.propose` / `.approve` | Quality Manager **and** Safety Officer |
| Change request | `change.request` / `change.approve` | Non-content settings only |
| Lease takeover | `config.lease.takeover` | Reason; holder notified |
| Run simulation | `config.draft.*` or `driver.test` | Simulator transport only; `simulated`+`debug` flags |
| Station enrol/revoke | `station.admin` | Deployment-pinned; revoke needs reason + step-up |

## 6. Streaming and jobs

* **SSE** for simulation events, run events (station), validation stream (optional). Event IDs enable `Last-Event-ID` resume; server sends heartbeats; clients back off with jitter.
* **Jobs** (`202` + `Location`) for validation, simulation start, package build/inspect, report preview, translation check. Job states `queued|running|succeeded|failed|cancelled`; result URLs are authorization-checked.
* **Back-pressure**: per-principal rate limits with `Retry-After`; the UI shows a polite message and retries idempotent reads only.

## 7. Contract acceptance additions

| ID | Criterion |
|---|---|
| P1-AC-API-01 | Every new endpoint appears in OpenAPI with declared permission; unprivileged-principal test returns `403`. |
| P1-AC-API-02 | `GET /me/work-queue`, `/search`, `/library/entries` return only the caller's tenant/lab data (cross-tenant probe returns `404/403` with no leakage). |
| P1-AC-API-03 | `POST /builder/driver/format-preview` and `parse-preview` perform no transport I/O (architecture test: handler cannot import transport packages) and reject control characters/out-of-bounds/dimension errors with stable codes. |
| P1-AC-API-04 | `POST /auth/step-up` tokens are single-use, bound to `{action, digest, user}`, expire, and a mismatch returns `STEP_UP_INVALID`; approve/publish/rollback/safety/release endpoints reject calls without them. |
| P1-AC-API-05 | `POST /telemetry/ux` rejects payloads containing fields not in the event catalogue (no content values). |
| P1-AC-API-06 | `POST /config/media` rejects disallowed types, oversize files and files failing scan with `MEDIA_REJECTED`; stored media is content-addressed. |
| P1-AC-API-07 | In a Production deployment, A4/A5/A6/A9/A10/A11/A12/A15 return `PRODUCTION_CHANGE_CONTROL`. |

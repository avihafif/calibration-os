# ADR-0008: Multi-tenancy via shared schema + Row-Level Security

Status: Proposed

## Context
Commercial deployment with multiple tenants (organizations), each with one or more laboratories, with strict isolation. Test and Production are **separate deployments** (ADR-0024), so environment is *not* a partition dimension; RLS isolates tenants and labs *within* a deployment.

## Decision
Single PostgreSQL database, shared schema; every tenant-owned table has `tenant_id` (and `lab_id` where lab-scoped). **RLS policies** keyed on session settings set per transaction (`SET LOCAL app.tenant_id, app.lab_ids`) by the API's request context. The application DB role is not table owner and cannot bypass RLS. A CI test enumerates all tables and fails if a table has `tenant_id` without an RLS policy or lacks an explicit "global" allowlist entry. Lab scoping is enforced by RBAC + RLS secondary policy. Station tokens are scoped to a tenant+lab.

## Options
Schema-per-tenant (migration fan-out, many objects), DB-per-tenant (strongest isolation, highest ops cost; offered as a deployment option for large customers, same code), **shared schema + RLS** (chosen default).

## Consequences
+ Operational simplicity; defense in depth beyond app-layer checks.
− Noisy-neighbor risk; mitigations via quotas/indices. − RLS misconfiguration risk addressed by generated tests (AC-GA-04).

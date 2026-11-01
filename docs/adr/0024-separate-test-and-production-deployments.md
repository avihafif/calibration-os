# ADR-0024: Separate Test and Production deployments

Status: **Accepted** (product owner decision, 2026-11-01; resolves Q-14) · Supersedes the "logical partition" option in ADR-0008 and the environment model in ADR-0021

## Context
Test (authoring, simulation, validation) and Production (real calibrations, regulated records) need hard separation. Logical partitions in a shared database share credentials, operators, failure modes and blast radius. The product owner has chosen **separate deployments**.

## Decision

### 1. Deployment model
- A **deployment** is a complete, independent CalOS installation with a generated immutable identity `{deployment_id, environment_kind ∈ {test, production}}` embedded in signed metadata, tokens, journals, audit records, and station enrolment.
- Test and Production share **nothing**: separate PostgreSQL databases, object stores, credentials, secrets/KMS, JWT and signing keys, trust roots, job queues, networks, execution agents (stations), audit chains, backups, observability backends and OIDC client registrations.
- There is **no standing connection** between deployments. The only cross-deployment flow is a **Release Package** transferred as a file (or via a one-way, authenticated import endpoint that the Production side pulls from an operator-supplied location).
- `environment_id` is **not** a partition column. Environment identity is a deployment constant recorded in provenance.

### 2. Purposes and permitted content
| | Test deployment | Production deployment |
|---|---|---|
| Purpose | Simulations, draft applications, Safety Profile authoring, validation workflows, training of builders | Real calibrations and regulated records |
| Run modes | `simulation`; `validation` (only on explicitly allow-listed **test instruments**; results never approvable/issuable; watermarked "VALIDATION — NOT A CALIBRATION") | `production` only |
| Content | Drafts, pre-release, `synthetic_demo`, simulated profiles | **Only approved, signed, validated** versions imported by Release workflow; no `synthetic_demo`, no unresolved `$input`, no `simulated` profiles |
| Authoring | Full Builder | **No draft/authoring.** Config draft/edit APIs and UI are disabled (`PRODUCTION_CHANGE_CONTROL`). Allowed: release import/approval, assignment/deploy/rollback, withdrawal, change requests |
| Data | Test data only | Production data only; **never copied to Test** |
| Stations | Enrolled to Test only | Enrolled to Production only |

### 3. Station pinning (test agents cannot reach production instruments or data)
- A station's enrolment records the deployment identity; the agent **refuses** manifests, tokens, config, or plugin metadata whose `deployment_id`/`environment_kind` differ from its pinned value. Changing a station's deployment requires wipe and re-enrolment (audited).
- Test agents may use the simulator and an explicit local **test-instrument allow-list** (resource + expected identity); any other resource is not opened. Production instrument identities/serials are never present in the Test deployment's database.
- Network guidance (deployment guide, verified in acceptance): Test stations and instruments sit on a network segment with no route to Production central services or Production benches.
- Production stations additionally reject `mode=simulation|validation` (lab policy may allow a training simulation mode using production-released apps; default off).

### 4. Release workflow (explicit approval and promotion)
```mermaid
stateDiagram-v2
  [*] --> Candidate: Test: create Release Candidate from published package version + validation evidence
  Candidate --> TestApproved: Test approvals (QM; metrology approver; Safety Officer if safety-class; SoD)
  Candidate --> Rejected
  TestApproved --> Exported: signed Release Package (release-signing key of Test)
  Exported --> Imported: Production: verify issuer trust, signatures, digests, schemas, compatibility
  Imported --> ProdValidated: Production-mode validation (PR-013/014/016, safety coverage, AHL present, no simulated content)
  ProdValidated --> ProdApproved: Production approvals (QM; metrology; Safety Officer if safety-class) — importer ≠ approver
  ProdApproved --> Released: versions created (origin = release, digest identical)
  Released --> Assigned: canary → stable (deployments)
  Imported --> Rejected
  ProdValidated --> Rejected
```
- **Release Package** = `.calapp` + `release_manifest.json` (application/version/digests, change class, impact analysis, validation report, application-test results, approval records, Test deployment identity) + signature by the Test deployment's **release-signing key**.
- Production holds a **Trusted Release Issuers** list (public keys of Test deployments). Changing it is a trust-root change requiring dual control (Platform Admin proposes; Quality Manager and Safety Officer approve) — graphical, audited.
- Digests are preserved end-to-end (proof of identical content); signature chain is re-attested by Production on release.
- Production approvals are mandatory and independent of Test approvals.
- **Hot fixes** follow the same workflow (expedited approvals allowed by policy, never skipped). **Emergency actions** in Production are limited to *withdrawal* and *rollback by re-assignment* (fail-safe direction).
- **Change requests** (CR): production settings that are not content (lab policies, trusted issuers, staleness thresholds) change only through a CR workflow with approvals and audit; no direct edits.
- Hardware Limits Packs (ADR-0023) are imported to each deployment through the safety-limits channel, never bundled in an application package.

### 5. No-Code requirement
Release candidates, approvals, exports/imports, issuer trust, change requests, deployment role display, assignments and rollbacks are managed in graphical Release Management and Admin screens. Infrastructure provisioning (databases, secrets, networks) is operations work outside the product's no-code scope and is documented in the deployment guide.

### 6. Phase 0 / MVP topology and production gate
- Phase 0/MVP: **two isolated Docker Compose projects** (`calos-test`, `calos-prod`) on development infrastructure — distinct compose project names, networks, volumes, secrets, ports, hostnames, signing keys, and station enrolments. A CI **isolation test** asserts no shared volume/network/secret and that cross-deployment tokens/manifests/packages are rejected.
- The MVP's Production stack is a **rehearsal** deployment (no real calibrations). **Operational use requires separately secured production infrastructure** (hardened hosts/network, managed secrets/KMS, backups, monitoring) — a gate in Phase 5 (and before any real-instrument production use in Phase 4).

## Options considered
1. Logical partitions in one deployment (shared DB) — rejected by owner: shared credentials/blast radius/audit.
2. Both options — adds complexity; rejected.
3. **Separate deployments with explicit promotion** — chosen.

## Consequences
+ Strong isolation; simpler compliance narrative; production cannot be edited casually.
− Duplicate operations cost; promotion tooling and process must be excellent; configuration drift between deployments is monitored by digest comparison.
− Per-deployment user/role administration (same IdP, separate client registrations).
− Validation-mode support for test instruments adds a run mode and allow-list management.

## Revisit triggers
Customers with many labs needing hierarchical promotion (Test → Staging → Production), air-gapped transfers at scale (add offline media workflow), regulatory requirement for a third validation environment.

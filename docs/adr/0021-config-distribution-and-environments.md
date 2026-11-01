# ADR-0021: Configuration distribution, assignments, and environments

Status: Proposed

## Decision
- **Versions are content; assignments are pointers.** Deployment = creating/updating an `Assignment` of an `AppPackage` version to a target (lab, station group, station) and channel (`canary`, `stable`). **Rollback = re-assignment** to an earlier approved version; content is never mutated or deleted.
- Central signs an **AssignmentManifest** (TUF-style roles, ADR-0004). Stations poll the feed, verify, fetch blobs by digest (resumable), run local compatibility checks, **stage**, and **activate** when idle/at a window; in-flight runs remain pinned to their original versions; previous bundle retained for local rollback.
- **Environments are separate deployments** (**ADR-0024, which supersedes the partition model originally proposed here**): Test and Production share no infrastructure. **Promotion** is the Release workflow: signed Release Package exported from Test, imported and independently approved in Production, digests preserved. Deployment-specific bindings live only in assignments, never in versions (so digests match across deployments). Manifests carry `deployment_id`/`environment_kind`; stations reject mismatches.
- **Canary**: assign to one station first; promotion to `stable` requires a recorded sign-off.
- Revocation/withdrawal in the same signed feed.

## Consequences
+ Offline-friendly, auditable, rollback is trivial and safe. − Operational process (promotion, canary) must be taught; UI must make state obvious.

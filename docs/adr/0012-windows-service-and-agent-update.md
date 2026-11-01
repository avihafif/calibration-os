# ADR-0012: Windows service hosting and agent update

Status: Proposed

## Decision
- Agent runs as a **Windows service** (pywin32 service wrapper or a service host such as WinSW — selected in Phase 0 spike) under a dedicated low-privilege virtual/service account with access to instrument interfaces only. Recovery: restart on failure with back-off; watchdog supervisor inside.
- Distribution: signed **MSI** (Authenticode) bundling an embedded Python runtime, dependencies and the web build; SBOM attached.
- **Updates**: agent downloads signed update metadata (ADR-0004), verifies, stages to `versions/<n>/`, switches a `current` pointer at idle, runs health check, **auto-rolls back** on failure; previous version retained. Never updates during an active run. Database migrations forward-only with pre-migration backup; agent refuses to start on newer-than-known DB schema.
- Plugins and configuration update independently of the agent through the same channel (ADR-0021).

## Consequences
+ Predictable ops. − Embedded Python increases installer size and requires patch cadence; Windows signing certificate management required.

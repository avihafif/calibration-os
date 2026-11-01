# ADR-0004: Package signing and trust model (Class A and Class B)

Status: Proposed

## Context
Both application packages (`.calapp`, pure config) and technical plugins (`.calplug`, code) are installed on stations, some offline. Integrity, authenticity, rollback protection and revocation are required (brief items 4, 8).

## Decision
1. **Ed25519** detached signatures over a canonical manifest that lists SHA-256 digests of every file; verification happens at import, at install/stage, and again at load.
2. **Separate trust roots and key roles** (TUF-inspired): `root` (offline, rarely used) → `targets` (what is authorized to deploy), `snapshot`, `timestamp` (freshness). Class A packages are signed by the **tenant/platform config-signing key** after governance approval; Class B plugins require a **publisher signature chained to a platform-approved publisher key**, plus the platform's countersignature after security review.
3. **Rollback/freeze protection**: monotonic metadata versions and expiry; stations reject older metadata.
4. **Revocation** list (keys, packages, plugin versions) in signed metadata; stations honor it subject to the lab's staleness policy.
5. Keys are held via `SecretProvider`/KMS (central) and never on stations (stations hold only public trust roots, and their own enrolment key).
6. Manifest schema, capability declarations and compatibility fields: PLUGIN_SDK_SPEC §3.

## Options
1. Authenticode/code signing only — doesn't cover config packages, offline metadata or revocation semantics. Complement, not substitute (installers are Authenticode-signed).
2. Sigstore/cosign — attractive but assumes online transparency logs; offline stations complicate. Possible future for publisher-side build provenance.
3. **TUF-style metadata + Ed25519** — chosen.

## Consequences
+ Offline-verifiable; role separation limits blast radius.
− Operational burden: key ceremonies, rotation, expiry management. A runbook and tooling are Phase 3 work.
− Customers with their own PKI may want to supply roots → supported as tenant trust root configuration (CFG).

## Revisit triggers
Adoption of in-toto/SLSA provenance requirements by customers; HSM mandates.

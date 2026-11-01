# ADR-0023: Safety Profile ownership, separation of duties, and immutable hardware limits

Status: **Accepted** (product owner decision, 2026-11-01; resolves Q-13) · Amends ADR-0018

## Context
ADR-0018 introduced hazard classes and Safety Profiles enforced by the Instrument Broker, with a provisional "two distinct safety approvers" rule and an unresolved owner (Q-13). The product owner has decided ownership, separation of duties, and that **absolute hardware safety limits must stay enforced by trusted execution components and cannot be overridden through No-Code configuration**, while Safety Profiles, approval workflows and release management remain manageable through graphical interfaces.

## Decision

### 1. Roles (canonical names)
| Role | Key | Responsibilities | Safety-relevant permissions |
|---|---|---|---|
| **Lab Safety / Metrology Administrator** (LSMA) | `lab_safety_metrology_admin` | **Owns creation and maintenance** of Safety Profiles through the No-Code admin interface (Safety Console) | `safety.manage` (draft/edit/submit), `config.view` |
| **Safety Officer / Technical Authority** | `safety_officer` | **Approves safety-critical changes**; may withdraw (fail-safe direction) | `safety.approve`, `safety.withdraw`, `driver.test.hazardous` (authorizes) |
| **Quality Manager** | `quality_manager` | **Additionally approves** changes affecting metrological or compliance requirements | `safety.approve.compliance`, `config.approve.{policy,report,i18n}` |
| **Calibration Engineer** | `calibration_engineer` | **Executes approved profiles**; cannot modify profiles; during calibration nothing editable. (In a Test deployment this role also holds Builder permissions for non-safety kinds.) | `run.execute`; **no** `safety.*` |
| **Platform Administrator** | `platform_admin` | Infrastructure, users, access, stations | **No** `safety.*`, no `config.approve.*`, no `result.approve`; cannot bypass mandatory approvals |

### 2. Approval rules for a Safety Profile version
1. Author = holder of `safety.manage` (LSMA). Author cannot approve (nor anyone who contributed edits to the draft).
2. **Required:** approval by a Safety Officer (`safety.approve`) on the frozen snapshot digest.
3. **Additionally required** when the change is classified **metrological/compliance-affecting**: approval by the Quality Manager (`safety.approve.compliance`).
   - Classification is computed by the diff engine and the approval matrix (MI-30, default rules): affects a quantity/range/function referenced by a metrologically approved procedure or spec table; touches an element tagged `compliance`; changes interlock or required-state wording tagged `compliance`; or is raised manually by any reviewer (never lowered).
4. Lab policy may **tighten** (e.g., require a second Safety Officer); it cannot loosen.
5. Applies **independently in each deployment** (ADR-0024): a profile approved in Test must be re-approved in Production on release.
6. All Safety Profile versions: SemVer, immutable once published, hash-chained audit, impact analysis (which procedures/applications/assignments/stations/in-flight runs depend on it), controlled deployment (canary → stable) and rollback by re-assignment — as for all configuration (GOVERNANCE).

### 3. Separation constraints (enforced by the platform, not policy alone)
- **Toxic role combinations** are rejected by the role-assignment validator: `platform_admin` cannot co-exist in one account with `safety.*`, `config.approve.*`, `result.approve`; `lab_safety_metrology_admin` cannot co-exist with `safety_officer` for the same lab (the author and the approver are different people).
- **Privileged grants use dual control:** granting a role containing `safety.*` requires approval by a Safety Officer (or by the Quality Manager for compliance roles) who is not the grantor and not the grantee; platform administrators can *propose* but not complete such grants.
- **Calibration Engineers (execution)** have no write path to Safety Profiles in any deployment; the Production deployment exposes no draft/edit endpoints at all (ADR-0024).
- **No mid-calibration change:** a run pins `{safety_profile versions, hardware_limits_pack digest}` in its `RunBinding`. Published versions are immutable; new assignments affect only new runs. If a pinned Safety Profile is **withdrawn** while a run is in flight, the engine halts at the next node boundary, executes `safe_state`, and the run cannot resume under that profile (a replacement requires a new run, or Safety-Officer-authorized resume decision recorded in the journal).
- Platform Administrators have **no** database or API path to alter approvals; break-glass for *withdrawal* (fail-safe direction) is available to the Safety Officer or Quality Manager only and is flagged for post-review. There is no break-glass for *loosening* limits.

### 4. Two-tier safety architecture (immutable boundary + governed profiles)
| Tier | Artifact | Who defines / changes | How enforced | Editable via No-Code? |
|---|---|---|---|---|
| **Tier 1 — Absolute Hardware Limits (AHL)** | **Hardware Limits Pack**: signed data file keyed by instrument/standard identity or capability class, giving absolute limits per command parameter, output quantity, and forbidden operations | Authored as a *candidate* in the Safety Limits Console (graphical, Test deployment only), then **threshold-signed offline** with the `hardware-limits` signing role (Safety Officer mandatory; Quality Manager additionally when compliance-impacting; policy encoded in pack metadata). Distributed via the secure update channel as a separate TUF-style role. | Trusted loader verifies signature, expiry, rollback-protection; stores read-only; **Instrument Broker** evaluates every command and output operation against it | **No.** The pack cannot be edited, overridden, or narrowed/widened by any configuration kind, procedure, application, UI, API, or administrator. Changes are *releases*, not configuration. |
| **Tier 2 — Safety Profiles** | `SafetyProfile` configuration items (operational envelopes, forbidden combos, required states, interlocks, safe-state) | LSMA authors; Safety Officer (+ QM) approves (above) | Broker computes **effective limit = AHL ∩ Safety Profile ∩ procedure bounds**; the narrowest wins | Yes (governed) — may only **narrow** within AHL; validator rejects any envelope not contained in AHL |

Rules:
- **Fail closed:** any H2+ operation (output enable, stimulus, switching, adjustment, system) for a *real transport* is refused unless (a) an AHL entry covers the target, (b) an approved Safety Profile covers it, and (c) every typed argument lies within the effective limits.
- No Tier-1 entry exists for a model ⇒ H0/H1 operations work (read/configure), H2+ are blocked. Obtaining an AHL entry for a new hazardous instrument is a **controlled release** (Safety Limits Console → offline threshold signing → pack import), not a code change and not a no-code configuration edit. It is classified `REL` in the Capability Matrix.
- AHL **values are inputs** (MI-26) supplied by the Safety Officer from manufacturer documentation and risk assessment. Engineering supplies none.
- Simulated transports need no AHL; simulated Safety Profiles are marked `simulated` and can never be assigned to real transports.
- The runtime contains no model-specific logic; model-specific safety knowledge lives only in the signed pack (data), preserving boundary rule B-3.

### 5. No-Code requirement
Safety Profile authoring, review, approval, impact analysis, deployment/rollback, AHL candidate authoring, privileged-grant approvals and effective-limit inspection are all graphical (Safety Console, Review & Releases, Admin). No source or database edits. Only the *signing ceremony* uses offline keys (hardware token / key ceremony tool), which is key custody, not configuration.

## Options considered
1. Single tier (Safety Profiles are the ultimate limits, editable via no-code with approval) — a compromised/mistaken approval chain could widen physical limits; rejected given the owner's requirement for immutable technical boundaries.
2. Hardcode limits in runtime code per model — violates No-Code and B-3; rejected.
3. **Two tiers with signed data pack** — chosen.

## Consequences
+ Clear ownership and accountability; physical boundary independent of configuration channel; consistent with fail-closed.
− A new hazardous instrument needs a pack release before H2+ operations (acceptable; deliberate).
− Key-custody process and role availability (Safety Officer deputies) must be defined (MI-33, MI-34).
− Slightly larger broker logic (intersection), covered by property tests.

## Revisit triggers
Customers needing faster AHL turnaround (e.g., delegated signing), HSM mandates, regulatory guidance on safety interlock design.

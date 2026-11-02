# Phase 0B decision and approval matrix

Status: review request, 2026-11-02. This matrix does not ratify any ADR or
authorize a production trust root. Phase 0B remains simulation-only.

The user approved ephemeral Ed25519 keys **in test memory only**. No person
authorized to ratify ADR-0004/0014 and no approved expiry, revocation or user
authentication policy was identified. Their status remains Proposed. See the
[Phase 0C proposal](PHASE0C_PROPOSAL.md) for decisions and safe independent work.

| Decision | Current status | Phase 0B consequence | Human review needed |
| --- | --- | --- | --- |
| ADR-0022 E6, Ed25519 and TUF-style metadata | Accepted | Permits a verifier with injected public trust material and no private production key | No new ratification; select and review the implementation library |
| ADR-0023, AHL and safety ownership | Accepted | A metadata verifier cannot authorize safety content or bypass the separate AHL channel | MI-34 role holders and deputies remain open |
| ADR-0024, separate deployments | Accepted | Verify deployment, environment, tenant and issuer scope; Production rehearsal has no authoring or release activation | Real deployment trust and promotion remain separate reviewed work |
| ADR-0001, module boundaries | Proposed | Keep verification in `calos_metadata` and authentication policy in `calos_security`; preserve architecture gates | Architecture owner ratification before broader engine implementation |
| ADR-0004, package signing and trust | Proposed | Signature format, root/target roles, revocation and freshness are not approved in detail | Product/security owner ratification; define key custody, signed trust metadata, expiry and revocation authority |
| ADR-0008, tenant RLS | Proposed | Existing RLS probe remains; package verifier checks tenant equality as defense in depth | Security/data owner ratification before tenant package persistence |
| ADR-0014, authentication and station enrolment | Proposed | No live login, JWT issuer or station enrolment may be inferred from the specification alone | Product/security owner ratification of token format, account/IdP policy, enrolment and operational key lifecycle |
| ADR-0016, metadata lifecycle | Proposed, mandate-driven | Define typed lifecycle ports only; do not create drafts, approvals, published versions or release records | Product/governance owner ratification before writes or activation |
| ADR-0021, distribution and assignments | Proposed, amended by ADR-0024 | Do not implement assignment feeds, activation or cross-deployment promotion | Product/security owner ratification of distribution freshness and revocation rules |
| Q-15 | Open | No decision about English/Hebrew authored-content review | Named content owner and quality review decision |
| MI-34 | Open | No signatories or role holders may be invented | Name LSMA, Safety Officer, Quality Manager, Release Manager and deputies |

## Phase 0B execution boundary

1. Preserve the Phase 0A API, station stub, web shell and tests.
2. Define a closed metadata verification envelope and machine-readable negative
   corpus. Canonical content digest and schema validation run before any result
   is returned.
3. Verify Ed25519 signatures only against an immutable, caller-provisioned
   public trust snapshot. Production keys, trust-root changes, private-key
   storage and issuer approval workflows are out of scope. Test keys are
   generated in memory by tests and never shipped as trusted material.
4. Require a verified principal from an authentication port before applying
   `package.import` permission and tenant/deployment scope. Until ADR-0014 is
   ratified and a real token issuer is provisioned, no public authenticated
   package endpoint or credential bootstrap is exposed.
5. Keep lifecycle interfaces read-only or unimplemented. Verification creates
   no draft, approval, publication, release or assignment.
6. Run positive and tamper, signer, expiry, revocation, compatibility,
   authorization, tenant and deployment negative tests; retain all Phase 0A
   gates. Open a feature-branch PR with actual CI evidence and explicit gaps.

## Decisions required before production-facing use

- Ratify or revise ADR-0004: canonical manifest/signature envelope, trust-role
  delegation, monotonic metadata versions, expiry and offline revocation policy.
- Ratify or revise ADR-0014: user token validation, principal provisioning,
  refresh/revocation and station enrolment. No test assertion is an operational
  identity system.
- Ratify ADR-0016 and ADR-0021 before persistence, publishing, release import,
  assignment or activation. ADR-0024 still requires independent Production
  approval and dual-controlled Trusted Release Issuers.
- Appoint MI-34 role holders and decide Q-15. These decisions are not inferred
  from code review or CI success.

**Review finding:** the Phase 0B verifier checks the caller principal against
the verifier's deployment even if an authenticator is miswired, freezes
injected trust snapshots, and rejects using the same public key for JWT and
package-signing roles. Those checks implement accepted deployment/key
separation; they do not establish an approved trust-root provisioning process.

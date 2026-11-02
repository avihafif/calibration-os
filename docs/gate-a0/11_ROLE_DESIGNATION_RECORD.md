# 11 — Role designation record (Architecture owner, Security reviewer, Legal approver)

| | |
|---|---|
| Date | 2026-11-02 |
| Record type | **User-stated, assistant-entered designation.** In the active conversation the product owner answered the question "who holds the architecture, security and legal roles?" by choosing: *the product owner holds all three; prepare approvals for my signature*. This file records that statement. It is **not** a signature, **not** a decision on any item, and **not** independent review. |
| Designated holder | **Avi Hafif** (GitHub [@avihafif](https://github.com/avihafif)) — product owner, and designated for the three roles below |

| Role | Designated holder | Scope of the designation | What it does **not** do |
|---|---|---|---|
| Architecture owner | Avi Hafif | May accept, amend or reject ADR-0001, ADR-0015, ADR-0026, record GA0-02 (architecture half), GA0-05 rows and the H-2 deferral disposition for PR #6 | Does not accept anything by itself; each decision needs its own recorded outcome |
| Security reviewer | Avi Hafif | May record the supply-chain policy and the CI-egress conditions for Playwright (rows R1, R2, D6 of [09](09_D12_DEPENDENCY_APPROVAL_MATRIX.md)) | Does not substitute an independent security review of operational trust, identity or signing (SR-H1/H2/H3 gates stay open) |
| Legal approver | Avi Hafif | May record acceptance of MPL-2.0 for unmodified, dev-only `axe-core` / `@axe-core/playwright` | Not a qualified legal opinion; **does not cover font licences (GA0-06b) or any vendor/trademark question (Q-08, MI-01)** |

## Consequences the owner should know before signing
1. **Concentration of roles.** One person holding product, architecture, security and legal roles removes the independence the governance model otherwise relies on for these items. Recording each decision under the correct role heading, with its own evidence link, keeps the trail auditable; it does not restore independence. If an independent reviewer becomes available for any item (especially security and legal), prefer them.
2. **Scope is limited to the frontend-foundation decisions.** The designation does not extend to metrology, safety (AHL, Safety Profiles), quality, trust/identity provisioning (ADR-0004, ADR-0014), signing keys, Release Package issuers, Production, or Hebrew terminology review — those authorities remain unnamed (MI-34, Q-15, MI-31).
3. **Separation of duties still applies elsewhere.** Nothing here permits the same person to author and approve safety content or to bypass any rule in `AGENTS.md §2`.
4. **Not retroactive and not automatic.** No pending form is approved by this designation. Signature-ready forms: [12](12_SIGNATURE_READY_PACKETS.md).

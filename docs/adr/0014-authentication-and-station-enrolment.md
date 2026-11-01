# ADR-0014: Authentication — local accounts, optional OIDC, station enrolment

Status: Proposed

## Decision
- **Users**: local accounts (Argon2id, optional TOTP) and **optional OIDC** (Authorization Code + PKCE; group→role mapping; JIT provisioning optional; break-glass local admin). Access tokens short-lived (JWT, asymmetric, `kid` rotation via JWKS); refresh rotation with reuse detection.
- **Stations**: one-time enrolment token issued by an admin → station generates an asymmetric keypair (private key protected via Windows CNG/DPAPI, TPM-backed when available) → registers public key → authenticates with **`private_key_jwt`-style client assertion** (RFC 7523) for short-lived station tokens; mTLS optional. Revocation immediate server-side.
- **Offline operators**: after a successful online login, central issues a signed, time-limited **offline grant** (user, roles, lab, expiry); the station verifies a locally set credential (PIN/password hashed Argon2id) — scope and TTL by lab policy (Q-07). No grant ⇒ no production run.
- Every operator action is attributed to a user; shared station logins are prohibited (A-06).

## Consequences
+ Works with enterprise SSO and air-gapped benches. − Offline credential policy needs customer sign-off.

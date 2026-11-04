# SP-3 — Local API negative security test matrix

**Status:** Proposed acceptance vectors only; **none are implemented or passing**. This matrix accompanies [the SP-3 design](SP-3_LOCAL_API_SECURITY_DESIGN.md). Run against a future fake-action Local API first, then against the reviewed service; never use instruments, production credentials, or operational grants in the prototype. Windows/Edge/Chrome tests require the supported-version policy and SP3-D2/D3 decisions.

Each test must assert the response **and absence of an effect** (no action dispatch, journal append, new session, leaked credential, or cross-deployment read). Use generated in-memory test identities only. A rejection code below is a proposed stable code, not an existing API guarantee; reconcile it with `API_CONTRACT` before implementation.

| ID | Scenario / adversarial input | Expected proof | Layer |
|---|---|---|---|
| P01 | Bind service with port `0`; restart it. | Listener is only `127.0.0.1`, port and boot ID rotate; old origin/session fails. | Windows integration |
| P02 | Attempt connection to LAN address, `0.0.0.0`, `::1` when unsupported, or configured proxy. | No listener or forwarding; fail closed. | Windows/network |
| B01 | Launch IPC from a different Windows user. | Explicit pipe ACL/client-token check denies; no origin/ticket returned. | Windows integration |
| B02 | Same user SID but different logon LUID/WTS session (second RDP logon). | Ticket and browser proof cannot cross sessions. | Windows/RDP |
| B03 | Named-pipe anonymous, remote, low impersonation, or substituted client token. | Denied; no ticket. | Windows integration |
| B04 | Browser bootstrap with no pending ticket, used ticket, expired ticket, or wrong boot ID. | `401/403`, no cookie; atomic consume under concurrent requests. | API + browser |
| B05 | Browser SSPI proof absent, wrong SID/LUID/WTS, or browser policy refuses Negotiate. | Denied; no cookie or header-token fallback. | Edge/Chrome + Windows |
| B06 | Malicious tab tries simple cross-origin form or `fetch` to bootstrap. | Origin/CSRF/OS proof denial; no session. | Browser |
| B07 | Same-user local process races legitimate browser for pending ticket. | Document observed race and mitigation; do not claim prevention unless proven. | Windows threat drill |
| H01 | Host is attacker domain rebinding to `127.0.0.1`, `localhost`, alternate numeric IP, case/encoding variant, wrong port, or userinfo. | Reject before route/auth; no redirect to attacker host. | API + browser |
| H02 | Duplicate, missing, malformed, or conflicting Host/forwarded-host headers. | Reject; ignore untrusted proxy forwarding headers. | Raw HTTP/API |
| H03 | Unsafe method with absent, `null`, cross-origin, wrong scheme or wrong-port Origin. | Reject even with valid cookie and CSRF. | API + browser |
| H04 | CORS preflight from another origin, including credentials request. | No `Access-Control-Allow-*`; no side effect. | Browser |
| H05 | Cross-site GET/SSE with valid stolen cookie but no continuing OS proof. | Reject; no protected data. | API/Windows |
| S01 | Session cookie absent, malformed, forged, copied to another Windows user/session, or from another deployment. | `401/403` or deployment mismatch; no protected data/action. | API/Windows |
| S02 | Cookie replay after logout, lock, logoff, RDP disconnect, fast switch, service restart or agent update. | Revoked; no action. Unlock does not restore authority. | Windows + API |
| S03 | Idle/absolute expiry at exact boundary; clock rollback within a boot. | Deny at boundary using monotonic age; no extension from wall rollback. | Time/fake clock |
| S04 | Browser shares profile across two tabs; separate profile and separate Windows user open concurrently. | Same-profile sharing is documented; separate sessions are isolated; no controller lease bypass. | Browser/RDP |
| S05 | Valid Windows identity but no CalOS grant, wrong role, wrong tenant/lab or expired grant. | No operational authorization; no action. | AuthZ/fake grant |
| C01 | Mutating request lacks CSRF header, has wrong token, or token from another session. | Reject without effect. | API + browser |
| C02 | CSRF token reused after rotation/logout/restart; token placed in URL or log canary. | Reject; canary absent from URL/history/log/diagnostics. | API + browser |
| C03 | Cross-origin POST with SameSite cookie suppressed or deliberately attached by raw client. | Origin and CSRF checks still reject; SameSite is not sole defense. | Browser/raw HTTP |
| R01 | Unsupported content type, malformed JSON, duplicate keys, invalid Unicode, deep nesting, oversize body/header/path/query. | Bounded parse rejection before action; no raw input in error/log. | API fuzz/limits |
| R02 | Credential guessing or bootstrap flood by one user, then a different legitimate user. | Per-identity/station rate controls and audit; one user cannot lock out the whole bench. | Load/Windows |
| R03 | Idempotency key replay with same request digest, changed body, different session or after restart. | Same committed result only for same scoped request; changed body conflicts; no repeated effect. | Journal fault test |
| R04 | Two controllers send conflicting run commands concurrently. | One lease winner; loser gets conflict; no optimistic UI success. | Contract/fault test |
| E01 | SSE with no/wrong cookie, wrong OS proof, wrong run scope, forged `Last-Event-ID`, lock/expiry during stream. | No events leak; stream closes; reconnect cannot skip scope/chain checks. | Browser/API |
| D01 | HTML/script, inline handler, external script/style/font, frame embedding, remote fetch or CSP bypass. | Enforced CSP header blocks; zero unexpected browser violations in en/he and no-JS fallback. | Edge/Chrome |
| D02 | Auth failure, CSP report, diagnostic bundle and exception with token/cookie/CSRF/Negotiate canaries. | No canary in logs, audit, headers, body or bundle; only opaque IDs/codes. | Logging/security |
| O01 | Disconnect central network, then restart service and change wall clock. | Local UI remains reachable; old session dies; no grant/time-policy bypass. | Offline/Windows |
| O02 | Test station presented with Production session/artifact and vice versa; `production_rehearsal` ambiguity. | Deployment identity mismatch, no shared resource; D-25 resolved before signed enrolment. | Isolation |
| O03 | Installer/update starts during active run, fails health check, or rolls back. | No active-run update; no revived session; UI/API version check; no credential in MSI logs/args. | SP-4/5 follow-up |

## Required test harness and evidence

1. **Unit/contract:** fake monotonic clock, fake WTS state and OS-auth proof, fake operator/grant, fake journal/action port, exact Host/Origin parser, atomic ticket/idempotency store. Assert denied cases do not call the fake action port.
2. **Browser:** supported Edge and Chrome on Windows, normal/private profiles, Hebrew/English, cross-origin tab, CSP header, cookie attributes, CSRF and SSE. Inspect actual response headers and browser cookie behavior; a static bundle scan is insufficient.
3. **Windows:** two OS accounts, same SID in two distinct RDP logon sessions, lock/unlock, fast switching, service restart and update. Record the actual SID/LUID/WTS observations from SSPI and the named pipe, without logging identifiers in product diagnostics.
4. **Fault/load:** simultaneous ticket redemption, rate-limit contention, restart between action receipt and journal commit, duplicate idempotency key after restart, corrupted `Last-Event-ID` and clock rollback. No real instrument or production data.
5. **Security review:** verify the previously draft `X-Local-Session` contract and proposed cookie contract are reconciled by approval; record exact browser/Windows versions, policy settings, failures and remaining same-user-malware limits. No matrix row is marked passed until its test has actually run.

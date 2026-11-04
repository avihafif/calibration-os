# SP-3 — Local API negative security test matrix

**Status of every row:** **Proposed; not implemented; not run.** No row below is passed or failed. This matrix accompanies the [SP-3 design](SP-3_LOCAL_API_SECURITY_DESIGN.md), and describes synthetic/fake-action tests for later reviewed PRs. No instrument, real credential, production grant or operational endpoint may be used. Candidate HTTP codes are **test design proposals**, not an approved API contract; an owner must reconcile them with [API_CONTRACT](../API_CONTRACT.md) before implementation.

**Evidence layers:** L0 = pure unit/fakes (CI candidate); L1 = raw-socket/ASGI HTTP (CI candidate); L2 = Playwright Chromium/Edge (CI candidate where browser available); L3 = Windows integration on a hosted runner (admin, but no genuine separate interactive WTS sessions); L4 = Windows VM/physical bench (manual evidence pack, **not CI-proven**). Each future result must state `proposed | implemented-not-run | pass | fail`, commit, OS build/channel, browser versions, policy values and environment. A hosted runner cannot stand in for client/RDS multi-session, kiosk or lock/fast-switch evidence.

**Common no-effect oracle N:** denied request calls fake `ActionPort` zero times, creates no privileged session/ticket grant or run-journal event, and sends no session `Set-Cookie`. A **redacted denial security-audit event may be appended**: demanding an unchanged security-log row count would contradict the audit requirement. Tests should verify the allowed event's code/redaction and absence of credentials. Positive tests name their expected state change separately. All auth-failure variants should return indistinguishable response body and timing within an approved test bound; a precise timing threshold remains open.

| ID | Treatment and adversarial scenario | Candidate expected result | Effect oracle | Layer / venue | Status |
|---|---|---|---|---|---|
| P01 | Reworded: service binds port 0 on only `127.0.0.1`; restart. | TCP table: one IPv4 loopback listener; new `boot_id`. **No assertion that numeric port differs.** | Old session rejected; N. | L3 hosted Windows; L4 bench corroboration | Proposed; not implemented; not run |
| P02a | Split: connect to machine non-loopback address. | TCP connection refused. | N. | L3 hosted Windows | Proposed; not implemented; not run |
| P02b | Split: connect to `::1` when only IPv4 bind approved. | TCP connection refused. | N. | L3 hosted Windows | Proposed; not implemented; not run |
| B01 | Different Windows account invokes launch pipe. | OS access denied; no ticket. | N. | L3 local account/`LogonUser`; L4 two-account check | Proposed; not implemented; not run |
| B02a | Reframed: `runas` token differs from allowed interactive session. | Candidate pipe denial; no ticket. | N. | L3 token test; L4 bench | Proposed; not implemented; not run |
| B02b | **Measurement, not acceptance:** UAC-elevated legitimate launch may have different LUID. | Record SID/logon SID/LUID/WTS and whether policy would false-deny; expected authorization **pending owner decision**. | No operational action. | L3 measurement; L4 bench | Proposed; not implemented; not run |
| B02c | Genuine concurrent interactive sessions on Windows Server/RDS. | Candidate cross-session denial; no ticket. | N. | **L4 VM/RDS evidence, not CI** | Proposed; not implemented; not run |
| B03a | Anonymous or insufficient identification-level pipe peer. | OS denial; no ticket. Identification-level query behavior must be measured before the exact rule is set. | N. | L3 hosted Windows | Proposed; not implemented; not run |
| B03b | Remote pipe client via SMB path, pre-created/squatted name, or wrong server process. | Connection or launch refusal; no ticket. | N. | L3 hosted Windows; L4 restart drill | Proposed; not implemented; not run |
| B04a | No ticket, expired/used ticket, or wrong boot ID at bootstrap. | `401 LOCAL_AUTH_REJECTED` (candidate generic auth code). | N; failed guess does not consume another ticket. | L0 fake clock + L1 HTTP | Proposed; not implemented; not run |
| B04b | 100 simultaneous valid redemptions synchronized by barrier. | Exactly one `200` session; 99 `401 LOCAL_AUTH_REJECTED`. | Exactly one session; no duplicate privilege. | L0/L1 CI | Proposed; not implemented; not run |
| B05 | **Conditional B only:** SSPI missing/mismatched or policy refuses; no ticket fallback. | `401 LOCAL_AUTH_REJECTED`. | N. | L3 hosted + **L4 Edge/Chrome policy evidence** | Proposed; not implemented; not run |
| B06a | Cross-origin form POST, `fetch(no-cors)`, image/script load and EventSource against bootstrap. | Server: `403 LOCAL_ORIGIN_REJECTED`; browser may conceal the response. | N. | L1 raw HTTP + L2 browser | Proposed; not implemented; not run |
| B06b | Cross-origin WebSocket upgrade against bootstrap. | `403 LOCAL_ORIGIN_REJECTED`; no upgrade. | N. | L1 raw HTTP + L2 browser | Proposed; not implemented; not run |
| B07 | **Measured residual, not pass/fail acceptance:** same-user process races ticket. | Record winner, exposure window and TTL; no security claim until owner decides. | No operational action. | **L4 manual evidence, not CI** | Proposed; not implemented; not run |
| H01a | Reworded raw Host table: attacker domain, `localhost`, alternate numeric IP, wrong port, trailing dot, userinfo or absolute-form target. | `400 LOCAL_BAD_HOST`. | N; no redirect. | L1 raw-socket CI | Proposed; not implemented; not run |
| H01b | Deterministic browser rebinding via Chromium host-resolver rule mapping attacker name to `127.0.0.1`. | `400 LOCAL_BAD_HOST`. | N. | L2 browser CI | Proposed; not implemented; not run |
| H01c | Real TTL-flip DNS rebinding drill. | `400 LOCAL_BAD_HOST`. | N. | **L4 periodic manual evidence, not CI** | Proposed; not implemented; not run |
| H02 | Missing/duplicate/obs-fold Host, `Forwarded`/`X-Forwarded-*`, conflicting CL/TE and `Expect: 100-continue`. | `400 LOCAL_BAD_REQUEST` before routing. | N. | L1 raw-socket CI | Proposed; not implemented; not run |
| H03 | Unsafe method with absent/null/other-scheme Origin, sibling loopback port or `localhost` Origin. | `403 LOCAL_ORIGIN_REJECTED`. | N even with an otherwise valid session. | L1 + L2 CI | Proposed; not implemented; not run |
| H04 | Credentialed cross-origin CORS preflight. | `403 LOCAL_ORIGIN_REJECTED`; no `Access-Control-Allow-*`. | N. | L2 browser CI | Proposed; not implemented; not run |
| H05 | Protected GET/SSE lacks an approved session credential. | `401 LOCAL_AUTH_REJECTED`; no data. | N; no protected response bytes. | L1 CI | Proposed; not implemented; not run |
| S01a | Missing, malformed or forged session secret. | `401 LOCAL_AUTH_REJECTED`. | N. | L0/L1 CI | Proposed; not implemented; not run |
| S01d | Authenticated session secret belongs to another deployment. | `403 DEPLOYMENT_MISMATCH`. | N. | L0/L1 CI | Proposed; not implemented; not run |
| S01b | **Conditional B only:** bearer copied to another OS session while continuing SSPI proof is required. | `401 LOCAL_AUTH_REJECTED`; no data. | N. | L3 + **L4 multi-session evidence** | Proposed; not implemented; not run |
| S01c | **Residual drill for header-only candidate:** same-user process steals bearer. | Record actual replay capability; do **not** falsely assert OS-bound rejection without proof. | No operational action in drill. | L4 manual evidence | Proposed; not implemented; not run |
| S02a | Logout, service restart or update invalidates secret/ticket. | `401 LOCAL_AUTH_REJECTED`. | N. | L0/L1 CI | Proposed; not implemented; not run |
| S02b | Lock, logoff, RDP disconnect or fast switch during fake active run. | `401 LOCAL_AUTH_REJECTED` for further control; fake engine reaches safe state. | N for API action; safe-state event recorded. | **L4 VM/bench evidence, not CI**; L0 fake event | Proposed; not implemented; not run |
| S03a | Idle/absolute expiry at boundary, forward/backward wall jump and fake suspend/resume. | `401 LOCAL_AUTH_REJECTED` at/after expiry; no backward extension. | N. | L0 fake clock CI; L4 sleep corroboration | Proposed; not implemented; not run |
| S03b | SSE heartbeat and unauthenticated traffic attempt to refresh idle timer. | Subsequent expired request: `401 LOCAL_AUTH_REJECTED`. | N. | L0/L1 CI | Proposed; not implemented; not run |
| S04a | Same browser profile shares two tabs; separate profiles. | **Measurement:** document observed sharing; no assumed per-tab identity. | No operational action. | L2 browser CI; L4 profile evidence | Proposed; not implemented; not run |
| S04b | Two fake controllers attempt the same run lease. | One candidate `200`, other `409 LOCAL_CONFLICT`. | At most one controller action. | L0 CI; L4 multi-session evidence | Proposed; not implemented; not run |
| S05 | Valid Windows context but missing/wrong role, tenant/lab or expired CalOS grant. | `403 LOCAL_FORBIDDEN`. | N. | L0 fake grant CI | Proposed; not implemented; not run |
| C01 | Missing/wrong/other-session CSRF token in a **cookie** design. | `403 LOCAL_CSRF_REJECTED`. | N. | L0/L1/L2 CI | Proposed; not implemented; not run |
| C02 | CSRF token replay after rotation within an otherwise valid session; canary in URL/history/log/crash report. | `403 LOCAL_CSRF_REJECTED`; canary absent from outputs. | N; redaction asserted. | L1/L2; L4 WER evidence | Proposed; not implemented; not run |
| C03 | Cross-origin POST with cookie suppressed or deliberately attached by raw client. | `403 LOCAL_ORIGIN_REJECTED`. | N. | L1/L2 CI | Proposed; not implemented; not run |
| R01a | Unsupported type, malformed/duplicate-key JSON, invalid Unicode, excessive depth/body/header/path/query. | `400 LOCAL_BAD_REQUEST`; configured limit−1 and limit accepted, limit+1 rejected. | N on rejection; no input echoed. | L0/L1 CI | Proposed; not implemented; not run |
| R01b | Double-encoded/`//` paths, NUL, TRACE/OPTIONS and CL/TE smuggling. | `400 LOCAL_BAD_REQUEST`. | N. | L1 raw-socket CI | Proposed; not implemented; not run |
| R01c | Slow/incomplete request headers exceed configured read timeout. | Connection closed before dispatch. | N. | L1 raw-socket CI | Proposed; not implemented; not run |
| R02 | Unauthenticated connection/slow-request flood while a legitimate launch and fake run proceed. | Attacker `429 LOCAL_RATE_LIMITED`; legitimate launch remains available. | Engine safe-state path unaffected; no ticket burnt. | L0/L1 + L3 hosted load | Proposed; not implemented; not run |
| R03a | Same idempotency key with changed body/session/scope. | `409 LOCAL_CONFLICT`. | No repeated effect. | L0 fake journal CI | Proposed; not implemented; not run |
| R03b | Same scoped key and digest after retry/restart. | Candidate `200` with the original committed result. | Exactly one fake effect. | L0 fault CI | Proposed; not implemented; not run |
| R04 | Conflicting controllers under future lease. | Loser: `409 LOCAL_CONFLICT`. | At most one fake effect. | L0 future contract | Proposed; not implemented; not run |
| E01a | SSE connect lacks a valid session. | `401 LOCAL_AUTH_REJECTED`; no stream. | No protected events; idle timer unchanged. | L0/L1/L2 CI | Proposed; not implemented; not run |
| E01b | SSE stream cap exceeded or slow consumer exceeds budget. | `429 LOCAL_RATE_LIMITED` at connect, or established stream closed on budget exhaustion. | No protected event leak; idle timer unchanged. | L0/L1/L2 CI | Proposed; not implemented; not run |
| E01c | Lock/expiry during stream or forged/wrong-scope `Last-Event-ID`. | Established stream closes; bad reconnect `400 LOCAL_BAD_REQUEST`. | No protected events; idle timer unchanged. | L0/L1/L2 CI | Proposed; not implemented; not run |
| D01 | Inline script/style, external asset, frame, remote fetch under **enforced** CSP. | Browser blocks; zero unexpected `securitypolicyviolation` events. | No remote request or credential leak. | L2 Edge/Chrome CI | Proposed; not implemented; not run |
| D02 | Secret canaries in auth error, 422, exception, CSP report, logs/diagnostics/WER dump. | Error response has generic code; no canary in any output. | N; redaction asserted. | L1/L3; L4 WER drill | Proposed; not implemented; not run |
| O01a | Central network disconnected; fake clock jumps and service restart. | Local static UI reachable; old session `401 LOCAL_AUTH_REJECTED`. | N; no grant/time-policy bypass. | L0 fake clock + L1 CI | Proposed; not implemented; not run |
| O01b | Real sleep/clock change and local service restart. | Session ends or expires conservatively; no silent run resume. | Fake engine safe-state evidence. | **L4 VM/bench, not CI** | Proposed; not implemented; not run |
| O02 | Test station receives Production session/artifact or reverse. | `403 DEPLOYMENT_MISMATCH`. | N; no shared resource. | L0 isolation; signed enrolment waits for D-25 | Proposed; not implemented; not run |
| O03 | Installer/update during active run or rollback. | **Deferred to SP-4/5:** no implementation result defined in SP-3. | No operational effect. | L4 future evidence | Proposed; not implemented; not run |

## New attack drills from independent review

| ID | Scenario | Candidate expected result | Effect oracle | Layer / venue | Status |
|---|---|---|---|---|---|
| MS-01 | Rogue listener binds old port after service crash; old window attempts reconnect. | After detection, UI enters terminal relaunch state; no credential form or retry. Measure any in-flight exposure or false state before detection. | No post-detection credentialed request; old secret has no authority on new boot; fake run safe-state path independent. | L2 browser + **L4 restart drill** | Proposed; not implemented; not run |
| MS-02 | Sibling loopback port receives/plants `__Host-` cookie, then bootstrap. | Candidate `401 LOCAL_AUTH_REJECTED` for planted value; fresh bootstrap rotates it if cookie design chosen. | N for planted value; measure cookie leak. | L2 browser CI | Proposed; not implemented; not run |
| MS-03 | Rogue pipe server/first-instance squatting, wrong server PID/identity. | Launcher refuses connection; no ticket. | N. | L3 Windows + L4 restart drill | Proposed; not implemented; not run |
| MS-04 | Authority lost during fake active run, then same-session step-up. | Control denied until step-up; safe state reached; guarded abort available; no auto-resume. | Fake engine transition and audit, no unauthorized effect. | L0 CI + **L4 bench evidence** | Proposed; not implemented; not run |
| MS-05a | Ticket replay, after successful atomic use. | `401 LOCAL_AUTH_REJECTED`. | N for replay. | L0/L1 CI | Proposed; not implemented; not run |
| MS-05b | Cookie/header after logout or restart. | `401 LOCAL_AUTH_REJECTED`. | N. | L0/L1 CI | Proposed; not implemented; not run |
| MS-05e | Stale CSRF token in an otherwise valid cookie session. | `403 LOCAL_CSRF_REJECTED`. | N. | L0/L1 CI | Proposed; not implemented; not run |
| MS-05c | Forged SSE `Last-Event-ID`. | `400 LOCAL_BAD_REQUEST`; no events. | N. | L1 CI | Proposed; not implemented; not run |
| MS-05d | **Conditional B only:** captured Negotiate/NTLM message on new connection. | Candidate `401 LOCAL_AUTH_REJECTED`; no OS proof reuse. | N; credential material not logged. | L3/L4 experiment | Proposed; not implemented; not run |
| MS-06 | Pre-auth flood while fake run active; forged redeems try to burn ticket. | Attacker `429 LOCAL_RATE_LIMITED`; legitimate ticket still redeemable. | Engine continues or reaches safe state; no ticket burning. | L0/L1 + L3 load | Proposed; not implemented; not run |
| MS-07a | FastAPI `/docs`, `/openapi.json` and `/redoc`. | `404` for each path. | No schema content; N. | L1 CI | Proposed; not implemented; not run |
| MS-07b | Validation 422 with canary input. | `422 LOCAL_BAD_REQUEST` with no input echo. | N. | L1 CI | Proposed; not implemented; not run |
| MS-08 | Back/forward navigation after logout or cached API/HTML. | No privileged page/data restored; `Cache-Control: no-store` observed. | N. | L2 browser CI | Proposed; not implemented; not run |
| MS-09 | Dedicated profile: extension/DevTools/debugging, PIN autofill, crash restore. | Candidate profile policy blocks each; stale origin cannot regain session. | No credential release. | **L4 Windows browser policy evidence** | Proposed; not implemented; not run |
| MS-10 | Compare wrong tickets/credentials with timing and response oracle. | `401 LOCAL_AUTH_REJECTED` for all variants, indistinguishable body; constant-time comparison verified. | N. | L0/L1 CI + review | Proposed; not implemented; not run |
| MS-11 | UAC-elevated and `runas` launches. | **Measurement only:** record identity tuple and false-deny/false-accept; owner sets expected authorization. | No operational action. | L3/L4 Windows evidence | Proposed; not implemented; not run |
| MS-12 | Ordinary browser profile opens Local API without launch ticket. | `401 LOCAL_AUTH_REJECTED`; no session (or approved read-only status only). | N. | L2 browser; L4 profile evidence | Proposed; not implemented; not run |
| MS-13 | Station security log tamper or UPDATE/DELETE attempt. | Chain verification fails closed; write path has no mutation operation. | No privileged action; redacted event only. | L0 model + L3 ACL | Proposed; not implemented; not run |
| MS-14a | Cross-origin logout/login CSRF attempt. | `403 LOCAL_ORIGIN_REJECTED`. | N. | L1/L2 CI | Proposed; not implemented; not run |
| MS-14b | Attacker pre-plants a session secret before valid bootstrap. | `401 LOCAL_AUTH_REJECTED` for planted value; valid bootstrap issues a fresh secret. | N for planted value. | L1/L2 CI | Proposed; not implemented; not run |

## Harness, evidence and unresolved contracts

1. Inject `OsIdentityPort`, `SessionStateProvider`, `Clock`, `TicketStore`, `Csprng` (seeded **only in tests**) and `ActionPort`. Use barriers and fake clocks rather than sleeps or runner wall-clock changes. Assert the common no-effect oracle and redacted audit behavior for every denial.
2. Parameterize endpoint budgets once an owner approves them; test each at limit−1, limit and limit+1. Never invent a metrological or safety limit in this matrix.
3. Capture raw HTTP and browser response headers. Edge/Chrome CSP proof needs actual `securitypolicyviolation` and console checks, not a static bundle scan. A generic `401/403` assertion is insufficient; candidate codes above need one approved mapping.
4. L4 results require an evidence pack with OS SKU/build, browser version/channel, policy, user/session topology, commit, observed failure and residual. They remain **manual evidence**, never a CI pass. No row becomes `pass` merely because the existing repository CI is green.
5. SP-3a/SP-3b/SP-3c are sequenced in [the design](SP-3_LOCAL_API_SECURITY_DESIGN.md#6-decisions-and-non-operational-roadmap). All candidate operational tests wait for the named-owner decisions there. This matrix neither ratifies an ADR nor authorizes an API, authentication or run implementation.
